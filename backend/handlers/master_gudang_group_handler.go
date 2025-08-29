package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Get all Gudang Group
func GetMasterGudangGroup(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var groups []models.MasterGudangGroup
		if err := db.Where("aktif = ?", true).Order("kode ASC").Find(&groups).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data gudang group"})
			return
		}
		c.JSON(http.StatusOK, groups)
	}
}

// Create Gudang Group
func CreateMasterGudangGroup(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var group models.MasterGudangGroup
		if err := c.ShouldBindJSON(&group); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}
		if group.Kode == "" || group.Nama == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode dan Nama wajib diisi"})
			return
		}
		var count int64
		db.Model(&models.MasterGudangGroup{}).Where("kode = ?", group.Kode).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}
		if !group.Aktif {
			group.Aktif = true
		}
		if err := db.Create(&group).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan gudang group"})
			return
		}
		c.JSON(http.StatusCreated, group)
	}
}

// Update Gudang Group
func UpdateMasterGudangGroup(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}
		var group models.MasterGudangGroup
		if err := db.First(&group, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gudang group tidak ditemukan"})
			return
		}
		var updateData models.MasterGudangGroup
		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}
		if updateData.Kode == "" || updateData.Nama == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode dan Nama wajib diisi"})
			return
		}
		var count int64
		db.Model(&models.MasterGudangGroup{}).Where("kode = ? AND id != ?", updateData.Kode, id).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}
		group.Kode = updateData.Kode
		group.Nama = updateData.Nama
		group.Aktif = updateData.Aktif
		if err := db.Save(&group).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate gudang group"})
			return
		}
		c.JSON(http.StatusOK, group)
	}
}

// Delete Gudang Group
func DeleteMasterGudangGroup(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}
		var group models.MasterGudangGroup
		if err := db.First(&group, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gudang group tidak ditemukan"})
			return
		}
		// Pakai Unscoped agar hard delete
		if err := db.Unscoped().Delete(&group).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus gudang group"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Gudang group berhasil dihapus"})
	}
}
