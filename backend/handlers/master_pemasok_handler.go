package handlers

import (
	"net/http"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetMasterPemasok(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pemasok []models.MasterPemasok
		db.Find(&pemasok)
		c.JSON(http.StatusOK, pemasok)
	}
}

func CreateMasterPemasok(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input models.MasterPemasok
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

func UpdateMasterPemasok(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pemasok models.MasterPemasok
		id := c.Param("id")
		if err := db.First(&pemasok, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pemasok tidak ditemukan"})
			return
		}
		var input models.MasterPemasok
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		db.Model(&pemasok).Updates(input)
		c.JSON(http.StatusOK, pemasok)
	}
}

func DeleteMasterPemasok(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pemasok models.MasterPemasok
		id := c.Param("id")
		if err := db.First(&pemasok, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Pemasok tidak ditemukan"})
			return
		}
		db.Unscoped().Delete(&pemasok)
		c.JSON(http.StatusOK, gin.H{"message": "Pemasok berhasil dihapus"})
	}
}
