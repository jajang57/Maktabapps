package handlers

import (
	"net/http"
	"strconv"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateMasterPajak - Menambahkan data pajak baru
func CreateMasterPajak(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pajak models.MasterPajak
		if err := c.ShouldBindJSON(&pajak); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validasi kode dan nama pajak harus unik
		var existingPajak models.MasterPajak
		if err := db.Where("code = ? OR tax_name = ?", pajak.Code, pajak.TaxName).First(&existingPajak).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode atau nama pajak sudah digunakan"})
			return
		}

		// Simpan data pajak
		if err := db.Create(&pajak).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan data pajak"})
			return
		}
		c.JSON(http.StatusCreated, pajak)
	}
}

// GetMasterPajakList - Mengambil semua data pajak
func GetMasterPajakList(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var pajaks []models.MasterPajak
		if err := db.Find(&pajaks).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data pajak"})
			return
		}
		c.JSON(http.StatusOK, pajaks)
	}
}

// GetMasterPajakByID - Mengambil data pajak berdasarkan ID
func GetMasterPajakByID(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}
		var pajak models.MasterPajak
		if err := db.First(&pajak, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data pajak tidak ditemukan"})
			return
		}
		c.JSON(http.StatusOK, pajak)
	}
}

// UpdateMasterPajak - Memperbarui data pajak berdasarkan ID
func UpdateMasterPajak(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}

		var pajak models.MasterPajak
		if err := db.First(&pajak, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data pajak tidak ditemukan"})
			return
		}

		var input models.MasterPajak
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validasi kode dan nama pajak harus unik (kecuali untuk data yang sedang diperbarui)
		var existingPajak models.MasterPajak
		if err := db.Where("(code = ? OR tax_name = ?) AND id != ?", input.Code, input.TaxName, id).First(&existingPajak).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode atau nama pajak sudah digunakan"})
			return
		}

		// Update data pajak
		pajak.TaxName = input.TaxName
		pajak.RatePercent = input.RatePercent
		pajak.Code = input.Code
		pajak.Description = input.Description
		pajak.SalesTaxAccount = input.SalesTaxAccount
		pajak.PurchaseTaxAccount = input.PurchaseTaxAccount
		pajak.Order = input.Order
		if err := db.Save(&pajak).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui data pajak"})
			return
		}
		c.JSON(http.StatusOK, pajak)
	}
}

// DeleteMasterPajak - Menghapus data pajak berdasarkan ID
func DeleteMasterPajak(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID tidak valid"})
			return
		}
		var pajak models.MasterPajak
		if err := db.First(&pajak, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Data pajak tidak ditemukan"})
			return
		}
		// Hapus data secara permanen menggunakan Unscoped
		if err := db.Unscoped().Delete(&pajak).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus data pajak"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Data pajak berhasil dihapus secara permanen"})
	}
}
