package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetMasterBarangJasa - Mengambil semua data barang/jasa
func GetMasterBarangJasa(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var barangJasa []models.MasterBarangJasa

		// Karena menggunakan hard delete, tidak perlu filter deleted_at
		if err := db.Order("kode ASC").Find(&barangJasa).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data barang/jasa"})
			return
		}

		c.JSON(http.StatusOK, barangJasa)
	}
}

// CreateMasterBarangJasa - Membuat barang/jasa baru
func CreateMasterBarangJasa(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var barangJasa models.MasterBarangJasa

		if err := c.ShouldBindJSON(&barangJasa); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}

		// Validasi field wajib
		if barangJasa.Kode == "" || barangJasa.Nama == "" || barangJasa.Jenis == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode, Nama, dan Jenis wajib diisi"})
			return
		}

		// Validasi jenis
		if barangJasa.Jenis != "BARANG" && barangJasa.Jenis != "JASA" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Jenis harus BARANG atau JASA"})
			return
		}

		// Cek duplikat kode
		var count int64
		db.Model(&models.MasterBarangJasa{}).Where("kode = ?", barangJasa.Kode).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		// Set default values jika tidak diset
		if !barangJasa.Aktif {
			barangJasa.Aktif = true
		}
		if !barangJasa.DiJual {
			barangJasa.DiJual = true
		}
		if !barangJasa.DiBeli {
			barangJasa.DiBeli = true
		}

		if err := db.Create(&barangJasa).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan barang/jasa"})
			return
		}

		c.JSON(http.StatusCreated, barangJasa)
	}
}

// UpdateMasterBarangJasa - Mengupdate barang/jasa
func UpdateMasterBarangJasa(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var barangJasa models.MasterBarangJasa
		if err := db.First(&barangJasa, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Barang/jasa tidak ditemukan"})
			return
		}

		var updateData models.MasterBarangJasa
		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}

		// Validasi field wajib
		if updateData.Kode == "" || updateData.Nama == "" || updateData.Jenis == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode, Nama, dan Jenis wajib diisi"})
			return
		}

		// Validasi jenis
		if updateData.Jenis != "BARANG" && updateData.Jenis != "JASA" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Jenis harus BARANG atau JASA"})
			return
		}

		// Cek duplikat kode (kecuali untuk record yang sedang diupdate)
		var count int64
		db.Model(&models.MasterBarangJasa{}).Where("kode = ? AND id != ?", updateData.Kode, id).Count(&count)
		if count > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		// Update data
		barangJasa.Kode = updateData.Kode
		barangJasa.Nama = updateData.Nama
		barangJasa.Jenis = updateData.Jenis
		barangJasa.KelompokItem = updateData.KelompokItem
		barangJasa.Kategori = updateData.Kategori
		barangJasa.Satuan = updateData.Satuan
		barangJasa.HargaBeli = updateData.HargaBeli
		barangJasa.HargaJual = updateData.HargaJual
		barangJasa.StokMinimal = updateData.StokMinimal
		barangJasa.Deskripsi = updateData.Deskripsi
		barangJasa.DiJual = updateData.DiJual
		barangJasa.DiBeli = updateData.DiBeli
		barangJasa.Image = updateData.Image
		barangJasa.Aktif = updateData.Aktif

		if err := db.Save(&barangJasa).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate barang/jasa"})
			return
		}

		c.JSON(http.StatusOK, barangJasa)
	}
}

// DeleteMasterBarangJasa - Menghapus barang/jasa
func DeleteMasterBarangJasa(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var barangJasa models.MasterBarangJasa
		if err := db.First(&barangJasa, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Barang/jasa tidak ditemukan"})
			return
		}

		// TODO: Cek apakah barang/jasa sedang digunakan di tabel lain
		// Contoh: cek di transaksi, purchase order, sales order, dll
		// var count int64
		// db.Model(&models.InputTransaksi{}).Where("barang_jasa_id = ?", id).Count(&count)
		// if count > 0 {
		//     c.JSON(http.StatusBadRequest, gin.H{"error": "Barang/jasa masih digunakan dan tidak dapat dihapus"})
		//     return
		// }

		// Hard delete - benar-benar menghapus dari database
		if err := db.Unscoped().Delete(&barangJasa).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus barang/jasa"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Barang/jasa berhasil dihapus"})
	}
}

// GetMasterBarangJasaByJenis - Mengambil data barang/jasa berdasarkan jenis (BARANG/JASA)
func GetMasterBarangJasaByJenis(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		jenis := c.Query("jenis")
		if jenis == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter jenis wajib diisi"})
			return
		}

		if jenis != "BARANG" && jenis != "JASA" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Jenis harus BARANG atau JASA"})
			return
		}

		var barangJasa []models.MasterBarangJasa
		if err := db.Where("jenis = ? AND aktif = ?", jenis, true).Order("kode ASC").Find(&barangJasa).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data barang/jasa"})
			return
		}

		c.JSON(http.StatusOK, barangJasa)
	}
}

// GetMasterBarangJasaForSale - Mengambil data barang/jasa yang bisa dijual
func GetMasterBarangJasaForSale(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var barangJasa []models.MasterBarangJasa

		if err := db.Where("di_jual = ? AND aktif = ?", true, true).Order("kode ASC").Find(&barangJasa).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data barang/jasa"})
			return
		}

		c.JSON(http.StatusOK, barangJasa)
	}
}

// GetMasterBarangJasaForPurchase - Mengambil data barang/jasa yang bisa dibeli
func GetMasterBarangJasaForPurchase(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var barangJasa []models.MasterBarangJasa

		if err := db.Where("di_beli = ? AND aktif = ?", true, true).Order("kode ASC").Find(&barangJasa).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data barang/jasa"})
			return
		}

		c.JSON(http.StatusOK, barangJasa)
	}
}
