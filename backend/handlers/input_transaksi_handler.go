package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET generate nomor transaksi otomatis
func GetGenerateNoTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Ambil parameter dari query string
		kodeBankStr := c.Query("kodeBank")
		userIDStr := c.Query("userID")
		tanggalStr := c.Query("tanggal") // format YYYY-MM-DD

		if kodeBankStr == "" || userIDStr == "" || tanggalStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter kodeBank, userID, dan tanggal diperlukan"})
			return
		}

		// Parse tanggal
		tanggal, err := time.Parse("2006-01-02", tanggalStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal tidak valid (YYYY-MM-DD)"})
			return
		}

		// Format tanggal ke ddmmyy
		ddmmyy := tanggal.Format("020106")

		// Parse userID
		userID, err := strconv.Atoi(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "UserID harus berupa angka"})
			return
		}

		// Format userID menjadi 2 digit dengan leading zero
		userIDFormatted := fmt.Sprintf("%02d", userID)
		// Cari nomor urut terakhir untuk hari ini, user ini, dan bank ini
		var count int64
		pattern := fmt.Sprintf("%s/%s/%s-%%", kodeBankStr, ddmmyy, userIDFormatted)

		// Hitung transaksi yang sudah ada dengan pattern yang sama
		if err := db.Model(&models.InputTransaksi{}).
			Where("no_transaksi LIKE ?", pattern).
			Count(&count).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Nomor urut berikutnya
		nomorUrut := count + 1
		nomorUrutFormatted := fmt.Sprintf("%04d", nomorUrut)

		// Generate nomor transaksi final
		noTransaksi := fmt.Sprintf("%s/%s/%s-%s", kodeBankStr, ddmmyy, userIDFormatted, nomorUrutFormatted)

		c.JSON(http.StatusOK, gin.H{"noTransaksi": noTransaksi})
	}
}

// GET all input transaksi
func GetInputTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		coaAkunBank := c.Query("coaAkunBank")

		// ✅ ENHANCED: Debug logging
		fmt.Printf("========== DEBUG INPUT TRANSAKSI ==========\n")
		fmt.Printf("[DEBUG] Received parameter: '%s'\n", coaAkunBank)
		fmt.Printf("[DEBUG] Parameter length: %d\n", len(coaAkunBank))

		var transaksi []models.InputTransaksi

		query := db.Order("tanggal ASC, id ASC")
		if coaAkunBank != "" {
			// ✅ FIXED: Use correct field name (snake_case)
			fmt.Printf("[DEBUG] Adding WHERE clause: coa_akun_bank = '%s'\n", coaAkunBank)
			query = query.Where("coa_akun_bank = ?", coaAkunBank)
		} else {
			fmt.Printf("[DEBUG] No filter applied - returning all records\n")
		}

		if err := query.Find(&transaksi).Error; err != nil {
			fmt.Printf("[ERROR] Database query failed: %v\n", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transaksi"})
			return
		}

		fmt.Printf("[DEBUG] Found %d records after filtering\n", len(transaksi))

		// ✅ ENHANCED: Debug each record's coa_akun_bank field
		for i, t := range transaksi {
			if i < 5 { // Log first 5 records
				fmt.Printf("[DEBUG] Record %d: ID=%d, CoaAkunBank='%s', NoTransaksi='%s'\n",
					i+1, t.ID, t.CoaAkunBank, t.NoTransaksi)
			}
		}

		fmt.Printf("==========================================\n")

		c.JSON(http.StatusOK, transaksi)
	}
}

// POST input transaksi
func PostInputTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input models.InputTransaksi
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, input)
	}
}

// PUT (edit) input transaksi
func UpdateInputTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var input models.InputTransaksi
		if err := db.First(&input, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data not found"})
			return
		}
		var req models.InputTransaksi
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Model(&input).Updates(req).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, input)
	}
}

// DELETE input transaksi
func DeleteInputTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		if err := db.Delete(&models.InputTransaksi{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Deleted"})
	}
}
