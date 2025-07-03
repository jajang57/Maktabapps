package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"
)

var jwtSecret = []byte("your-secret-key-here") // Ganti dengan secret key yang aman

type Claims struct {
	UserID    uint   `json:"user_id"`
	Username  string `json:"username"`
	SessionID string `json:"session_id"` // Tambah session ID untuk validasi device
	jwt.RegisteredClaims
}

// LoginRequest - Structure untuk request login
type LoginRequest struct {
	Username   string `json:"username" binding:"required"`
	Password   string `json:"password" binding:"required"`
	DeviceInfo string `json:"deviceInfo"` // Info device/browser
}

// RegisterRequest - Structure untuk request register
type RegisterRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	FullName string `json:"fullName" binding:"required"`
}

// LoginResponse - Structure untuk response login
type LoginResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// POST /api/register
func Register(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req RegisterRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validasi panjang username dan password
		if len(req.Username) < 3 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username minimal 3 karakter"})
			return
		}

		if len(req.Password) < 6 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Password minimal 6 karakter"})
			return
		}

		// Cek apakah username sudah ada
		var existingUser models.User
		if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username sudah terdaftar"})
			return
		}

		// Buat user baru
		user := models.User{
			Username: req.Username,
			Password: req.Password,
			FullName: req.FullName,
		}

		// Hash password
		if err := user.HashPassword(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengenkripsi password"})
			return
		}

		// Simpan ke database
		if err := db.Create(&user).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan user"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Registrasi berhasil"})
	}
}

// POST /api/login
func Login(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req LoginRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Cari user berdasarkan username
		var user models.User
		if err := db.Where("username = ?", req.Username).First(&user).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau password salah"})
			return
		}

		// Cek password
		if !user.CheckPassword(req.Password) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Username atau password salah"})
			return
		}

		// Generate session ID untuk device tracking
		sessionID, err := generateSessionID()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat session"})
			return
		}

		// Generate JWT token dengan session ID
		token, err := generateToken(user.ID, user.Username, sessionID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat token"})
			return
		}

		// Get device info from request
		deviceInfo := req.DeviceInfo
		if deviceInfo == "" {
			deviceInfo = c.GetHeader("User-Agent")
		}

		// Update user dengan token dan device info terbaru
		now := time.Now()
		updateData := map[string]interface{}{
			"active_token":  token,
			"device_info":   deviceInfo,
			"last_login_at": &now,
		}

		if err := db.Model(&user).Updates(updateData).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update session"})
			return
		}

		// Refresh user data
		if err := db.First(&user, user.ID).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data user"})
			return
		}

		// Response dengan token dan user data
		response := LoginResponse{
			Token: token,
			User:  user,
		}

		c.JSON(http.StatusOK, response)
	}
}

// POST /api/logout
func Logout(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user ID from context (set by AuthMiddleware)
		userID, exists := c.Get("userID")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak terautentikasi"})
			return
		}

		// Clear active token untuk logout
		if err := db.Model(&models.User{}).Where("id = ?", userID).Updates(map[string]interface{}{
			"active_token": "",
			"device_info":  "",
		}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal melakukan logout"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Logout berhasil"})
	}
}

// generateSessionID - Generate unique session ID
func generateSessionID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// generateToken - Generate JWT token with session ID
func generateToken(userID uint, username string, sessionID string) (string, error) {
	claims := Claims{
		UserID:    userID,
		Username:  username,
		SessionID: sessionID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Token berlaku 24 jam
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

// AuthMiddleware - Middleware untuk melindungi route yang butuh authentication dengan single device validation
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		fmt.Printf("[DEBUG AUTH] Raw Authorization header: %s\n", tokenString)

		// Hapus "Bearer " prefix jika ada
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		if tokenString == "" {
			fmt.Printf("[DEBUG AUTH] No token found\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak ditemukan"})
			c.Abort()
			return
		}

		fmt.Printf("[DEBUG AUTH] Token: %s\n", tokenString)

		// Parse token
		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			fmt.Printf("[DEBUG AUTH] Token parse error: %v, valid: %v\n", err, token.Valid)
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
			c.Abort()
			return
		}

		// Validasi claims dan single device login
		if claims, ok := token.Claims.(*Claims); ok {
			fmt.Printf("[DEBUG AUTH] Claims: UserID=%d, Username=%s\n", claims.UserID, claims.Username)
			
			// Get database connection from context atau setup
			db := c.MustGet("db").(*gorm.DB)

			// Cek apakah token masih aktif di database
			var user models.User
			if err := db.First(&user, claims.UserID).Error; err != nil {
				fmt.Printf("[DEBUG AUTH] User not found in DB: %v\n", err)
				c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak ditemukan"})
				c.Abort()
				return
			}

			// Validasi apakah token yang digunakan masih sama dengan yang tersimpan (single device)
			if strings.TrimSpace(user.ActiveToken) != strings.TrimSpace(tokenString) {
				fmt.Printf("[DEBUG AUTH] Token mismatch. DB token: %s, Request token: %s\n", user.ActiveToken, tokenString)
				c.JSON(http.StatusUnauthorized, gin.H{
					"error": "Session telah berakhir. Akun Anda sedang digunakan di device lain.",
					"code":  "SINGLE_DEVICE_VIOLATION",
				})
				c.Abort()
				return
			}

			fmt.Printf("[DEBUG AUTH] Authentication successful for user: %s\n", claims.Username)

			// Simpan data user ke context
			c.Set("userID", claims.UserID)
			c.Set("username", claims.Username)
			c.Set("sessionID", claims.SessionID)
			c.Set("user", user)
		} else {
			fmt.Printf("[DEBUG AUTH] Invalid token claims\n")
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token claims tidak valid"})
			c.Abort()
			return
		}

		c.Next()
	}
}
