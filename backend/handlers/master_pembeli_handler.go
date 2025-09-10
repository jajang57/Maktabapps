package handlers

import (
	"net/http"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /api/master-pembeli
func GetMasterPembeli(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pembeli []models.MasterPembeli
		db.Find(&pembeli)
		c.JSON(http.StatusOK, pembeli)
	}
}

// GET /api/master-pembeli/:id
func GetMasterPembeliByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pembeli models.MasterPembeli
		id := c.Param("id")
		if err := db.First(&pembeli, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pembeli tidak ditemukan"})
			return
		}
		c.JSON(http.StatusOK, pembeli)
	}
}

// POST /api/master-pembeli
func CreateMasterPembeli(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input models.MasterPembeli
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusCreated, input)
	}
}

// PUT /api/master-pembeli/:id
func UpdateMasterPembeli(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pembeli models.MasterPembeli
		id := c.Param("id")
		if err := db.First(&pembeli, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pembeli tidak ditemukan"})
			return
		}
		var input models.MasterPembeli
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Model(&pembeli).Updates(input).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Ambil data terbaru setelah update
		db.First(&pembeli, id)
		c.JSON(http.StatusOK, pembeli)
	}
}

// DELETE /api/master-pembeli/:id
func DeleteMasterPembeli(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pembeli models.MasterPembeli
		id := c.Param("id")
		if err := db.First(&pembeli, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pembeli tidak ditemukan"})
			return
		}
		db.Unscoped().Delete(&pembeli)
		c.JSON(http.StatusOK, gin.H{"message": "Pembeli berhasil dihapus"})
	}
}
