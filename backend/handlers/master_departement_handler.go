package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Get all Departement
func GetMasterDepartement(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var departements []models.MasterDepartement
		if err := db.Where("aktif = ?", true).Order("kode ASC").Find(&departements).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data departement"})
			return
		}
		c.JSON(http.StatusOK, departements)
	}
}

// Create Departement
func CreateMasterDepartement(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var departement models.MasterDepartement
		if err := c.ShouldBindJSON(&departement); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}
		if departement.Kode == "" || departement.Nama == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode dan Nama wajib diisi"})
			return
		}
		var count int64
		db.Model(&models.MasterDepartement{}).Where("kode = ?", departement.Kode).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}
		if !departement.Aktif {
			departement.Aktif = true
		}
		if err := db.Create(&departement).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan departement"})
			return
		}
		c.JSON(http.StatusCreated, departement)
	}
}

// Update Departement
func UpdateMasterDepartement(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}
		var departement models.MasterDepartement
		if err := db.First(&departement, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Departement tidak ditemukan"})
			return
		}
		var updateData models.MasterDepartement
		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}
		if updateData.Kode == "" || updateData.Nama == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode dan Nama wajib diisi"})
			return
		}
		var count int64
		db.Model(&models.MasterDepartement{}).Where("kode = ? AND id != ?", updateData.Kode, id).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}
		departement.Kode = updateData.Kode
		departement.Nama = updateData.Nama
		departement.Aktif = updateData.Aktif
		if err := db.Save(&departement).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate departement"})
			return
		}
		c.JSON(http.StatusOK, departement)
	}
}

// Delete Departement
func DeleteMasterDepartement(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}
		var departement models.MasterDepartement
		if err := db.First(&departement, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Departement tidak ditemukan"})
			return
		}
		// Pakai Unscoped agar hard delete
		if err := db.Unscoped().Delete(&departement).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus departement"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Departement berhasil dihapus"})
	}
}
