package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET all input transaksi
func GetInputTransaksi(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var list []models.InputTransaksi
		if err := db.Order("id desc").Find(&list).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, list)
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
