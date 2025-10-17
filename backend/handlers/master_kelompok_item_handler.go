package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetMasterKelompokItem - Mengambil semua data kelompok item
func GetMasterKelompokItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var kelompokItems []models.MasterKelompokItem

		if err := db.Where("aktif = ?", true).Order("kode ASC").Find(&kelompokItems).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data kelompok item"})
			return
		}

		c.JSON(http.StatusOK, kelompokItems)
	}
}

// CreateMasterKelompokItem - Membuat kelompok item baru
func CreateMasterKelompokItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var kelompokItem models.MasterKelompokItem

		if err := c.ShouldBindJSON(&kelompokItem); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}

		// Validasi field wajib
		if kelompokItem.Kode == "" || kelompokItem.Nama == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode dan Nama wajib diisi"})
			return
		}

		// Cek duplikat kode
		var count int64
		db.Model(&models.MasterKelompokItem{}).Where("kode = ?", kelompokItem.Kode).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		// Set default aktif jika tidak diset
		if !kelompokItem.Aktif {
			kelompokItem.Aktif = true
		}

		if err := db.Create(&kelompokItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan kelompok item"})
			return
		}

		c.JSON(http.StatusCreated, kelompokItem)
	}
}

// UpdateMasterKelompokItem - Mengupdate kelompok item
func UpdateMasterKelompokItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var kelompokItem models.MasterKelompokItem
		if err := db.First(&kelompokItem, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Kelompok item tidak ditemukan"})
			return
		}

		var updateData models.MasterKelompokItem
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
		db.Model(&models.MasterKelompokItem{}).Where("kode = ? AND id != ?", updateData.Kode, id).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		// Update data
		kelompokItem.Kode = updateData.Kode
		kelompokItem.Nama = updateData.Nama
		kelompokItem.Aktif = updateData.Aktif

		if err := db.Save(&kelompokItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate kelompok item"})
			return
		}

		c.JSON(http.StatusOK, kelompokItem)
	}
}

// DeleteMasterKelompokItem - Menghapus kelompok item
func DeleteMasterKelompokItem(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var kelompokItem models.MasterKelompokItem
		if err := db.First(&kelompokItem, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Kelompok item tidak ditemukan"})
			return
		}

		// TODO: Cek apakah kelompok item sedang digunakan di tabel lain
		// Contoh: cek di master_barang_jasa
		// var count int64
		// db.Model(&models.MasterBarangJasa{}).Where("kelompok_item = ?", kelompokItem.Nama).Count(&count)
		// if count > 0 {
		//     c.JSON(http.StatusBadRequest, gin.H{"error": "Kelompok item masih digunakan dan tidak dapat dihapus"})
		//     return
		// }

		if err := db.Delete(&kelompokItem).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus kelompok item"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Kelompok item berhasil dihapus"})
	}
}
