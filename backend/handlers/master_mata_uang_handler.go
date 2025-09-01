package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetMasterMataUang - Mengambil semua data mata uang
func GetMasterMataUang(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var mataUang []models.MasterMataUang

		if err := db.Order("kode ASC").Find(&mataUang).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data mata uang"})
			return
		}

		c.JSON(http.StatusOK, mataUang)
	}
}

// CreateMasterMataUang - Membuat mata uang baru
func CreateMasterMataUang(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var mataUang models.MasterMataUang

		if err := c.ShouldBindJSON(&mataUang); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}

		// Validasi field wajib
		if mataUang.Kode == "" || mataUang.Nama == "" || mataUang.Simbol == "" || mataUang.Kurs <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode, Nama, Simbol, dan Kurs wajib diisi"})
			return
		}

		// Simpan data
		if err := db.Create(&mataUang).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan mata uang"})
			return
		}

		// Response sukses
		c.JSON(http.StatusCreated, gin.H{
			"message": "Data berhasil disimpan",
			"data":    mataUang,
		})
	}
}

// UpdateMasterMataUang - Mengupdate mata uang
func UpdateMasterMataUang(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var mataUang models.MasterMataUang
		if err := db.First(&mataUang, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Mata uang tidak ditemukan"})
			return
		}

		var updateData models.MasterMataUang
		if err := c.ShouldBindJSON(&updateData); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Data tidak valid: " + err.Error()})
			return
		}

		// Update data
		mataUang.Kode = updateData.Kode
		mataUang.Nama = updateData.Nama
		mataUang.Simbol = updateData.Simbol
		mataUang.Kurs = updateData.Kurs
		mataUang.Aktif = updateData.Aktif
		mataUang.HutangUsaha = updateData.HutangUsaha
		mataUang.PiutangUsaha = updateData.PiutangUsaha
		mataUang.UangMukaBeli = updateData.UangMukaBeli
		mataUang.UangMukaJual = updateData.UangMukaJual
		mataUang.DiskonJual = updateData.DiskonJual
		mataUang.DiskonBeli = updateData.DiskonBeli
		mataUang.Pembulatan = updateData.Pembulatan
		mataUang.KeuntunganDirealisasi = updateData.KeuntunganDirealisasi
		mataUang.KeuntunganBelumDirealisasi = updateData.KeuntunganBelumDirealisasi
		mataUang.HutangJatuhTempo = updateData.HutangJatuhTempo
		mataUang.PiutangJatuhTempo = updateData.PiutangJatuhTempo
		mataUang.BiayaLainLain = updateData.BiayaLainLain
		mataUang.BiayaMaterai = updateData.BiayaMaterai

		if err := db.Save(&mataUang).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengupdate mata uang"})
			return
		}

		// Response sukses
		c.JSON(http.StatusOK, gin.H{
			"message": "Data berhasil diperbarui",
			"data":    mataUang,
		})
	}
}

// DeleteMasterMataUang - Menghapus mata uang
func DeleteMasterMataUang(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var mataUang models.MasterMataUang
		if err := db.First(&mataUang, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Mata uang tidak ditemukan"})
			return
		}

		// Hapus data secara permanen menggunakan Unscoped
		if err := db.Unscoped().Delete(&mataUang).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus mata uang"})
			return
		}

		// Response sukses
		c.JSON(http.StatusOK, gin.H{
			"message": "Data berhasil dihapus secara permanen",
		})
	}
}

// GetMasterMataUangByKode - Mengambil data mata uang berdasarkan kode
func GetMasterMataUangByKode(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		kode := c.Query("kode")
		if kode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parameter kode wajib diisi"})
			return
		}

		var mataUang models.MasterMataUang
		if err := db.Where("kode = ?", kode).First(&mataUang).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Mata uang tidak ditemukan"})
			return
		}

		c.JSON(http.StatusOK, mataUang)
	}
}

// GetMasterMataUangByID - Mengambil data mata uang berdasarkan ID
func GetMasterMataUangByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var mataUang models.MasterMataUang
		if err := db.First(&mataUang, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
			return
		}

		c.JSON(http.StatusOK, mataUang)
	}
}
