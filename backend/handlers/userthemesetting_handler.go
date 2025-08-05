package handlers

import (
	"net/http"

	"project-akuntansi-backend/models" // ganti dengan path module Anda

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetUserThemeSetting(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("user_id") // pastikan user_id diambil dari JWT/session
		var setting models.UserThemeSetting
		if err := db.Where("user_id = ?", userID).First(&setting).Error; err != nil {
			c.JSON(http.StatusOK, gin.H{"theme": nil})
			return
		}
		c.JSON(http.StatusOK, gin.H{"theme": setting})
	}
}

func SaveUserThemeSetting(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetUint("user_id") // harus dari session/JWT, bukan dari frontend!
		var input models.UserThemeSetting
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		input.UserID = userID
		var setting models.UserThemeSetting
		if err := db.Where("user_id = ?", userID).First(&setting).Error; err == nil {
			// Update
			db.Model(&setting).Updates(input)
		} else {
			// Insert
			db.Create(&input)
		}
		c.JSON(http.StatusOK, gin.H{"success": true})
	}
}
