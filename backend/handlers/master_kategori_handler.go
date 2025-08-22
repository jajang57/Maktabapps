package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetMasterKategori - Mengambil semua data kategori
func GetMasterKategori(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var kategoris []models.MasterKategori

		if err := db.Where("aktif = ?", true).Order("kode ASC").Find(&kategoris).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data kategori"})
			return
		}

		c.JSON(http.StatusOK, kategoris)
	}
}

// CreateMasterKategori - Membuat kategori baru
func CreateMasterKategori(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var kategori models.MasterKategori

		if err := c.ShouldBindJSON(&kategori); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}

		// Validasi field wajib
		if kategori.Kode == "" || kategori.Nama == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode dan Nama wajib diisi"})
			return
		}

		// Cek duplikat kode
		var count int64
		db.Model(&models.MasterKategori{}).Where("kode = ?", kategori.Kode).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		// Set default aktif jika tidak diset
		if !kategori.Aktif {
			kategori.Aktif = true
		}

		if err := db.Create(&kategori).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan kategori"})
			return
		}

		c.JSON(http.StatusCreated, kategori)
	}
}

// UpdateMasterKategori - Mengupdate kategori
func UpdateMasterKategori(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var kategori models.MasterKategori
		if err := db.First(&kategori, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
			return
		}

		var updateData models.MasterKategori
		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}

		// Validasi field wajib
		if updateData.Kode == "" || updateData.Nama == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode dan Nama wajib diisi"})
			return
		}

		// Cek duplikat kode (kecuali untuk record yang sedang diupdate)
		var count int64
		db.Model(&models.MasterKategori{}).Where("kode = ? AND id != ?", updateData.Kode, id).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		// Update data
		kategori.Kode = updateData.Kode
		kategori.Nama = updateData.Nama
		kategori.Aktif = updateData.Aktif

		if err := db.Save(&kategori).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate kategori"})
			return
		}

		c.JSON(http.StatusOK, kategori)
	}
}

// DeleteMasterKategori - Menghapus kategori
func DeleteMasterKategori(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var kategori models.MasterKategori
		if err := db.First(&kategori, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Kategori tidak ditemukan"})
			return
		}

		// TODO: Cek apakah kategori sedang digunakan di tabel lain
		// Contoh: cek di master_barang_jasa
		// var count int64
		// db.Model(&models.MasterBarangJasa{}).Where("kategori = ?", kategori.Nama).Count(&count)
		// if count > 0 {
		//     c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori masih digunakan dan tidak dapat dihapus"})
		//     return
		// }

		if err := db.Delete(&kategori).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kategori"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Kategori berhasil dihapus"})
	}
}
