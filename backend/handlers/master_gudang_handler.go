package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateGudang - Membuat gudang baru
func CreateGudang(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input models.MasterGudang
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if input.Kode == "" || input.Nama == "" || input.Group == "" || input.Departement == "" || input.Alamat == "" || input.PenanggungJawab == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Semua field wajib diisi kecuali deskripsi"})
			return
		}
		// Cek duplikat kode
		var exist models.MasterGudang
		if err := db.Where("kode = ?", input.Kode).First(&exist).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode gudang sudah digunakan"})
			return
		}
		if err := db.Create(&input).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, input)
	}
}

// GetGudangList - Mengambil semua data gudang
func GetGudangList(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var gudangs []models.MasterGudang
		db.Find(&gudangs)
		c.JSON(http.StatusOK, gudangs)
	}
}

// UpdateGudang - Mengupdate gudang
func UpdateGudang(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input models.MasterGudang
		idStr := c.Param("id")
		id, err := strconv.Atoi(idStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var gudang models.MasterGudang
		if err := db.First(&gudang, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gudang tidak ditemukan"})
			return
		}
		// Cek duplikat kode jika diupdate
		if input.Kode != "" && input.Kode != gudang.Kode {
			var exist models.MasterGudang
			if err := db.Where("kode = ?", input.Kode).First(&exist).Error; err == nil && exist.ID != uint(id) {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Kode gudang sudah digunakan"})
				return
			}
		}
		db.Model(&gudang).Updates(input)
		c.JSON(http.StatusOK, gudang)
	}
}

// DeleteGudang - Menghapus gudang
func DeleteGudang(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}
		var gudang models.MasterGudang
		if err := db.First(&gudang, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Gudang tidak ditemukan"})
			return
		}
		// Pakai Unscoped agar hard delete
		if err := db.Unscoped().Delete(&gudang).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus gudang"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Gudang berhasil dihapus"})
	}
}
