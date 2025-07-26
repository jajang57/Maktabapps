package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /api/master-coa
func GetMasterCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var coas []models.MasterCOA
		// Gunakan Preload agar relasi masterCategoryCOA ikut diambil
		if err := db.Preload("MasterCategoryCOA").Find(&coas).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, coas)
	}
}

// POST /api/master-coa
func PostMasterCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var coa models.MasterCOA
		if err := c.ShouldBindJSON(&coa); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validasi kode tidak boleh kosong
		if coa.Kode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode tidak boleh kosong"})
			return
		}

		// Cek duplikasi kode
		var existing models.MasterCOA
		if err := db.Where("kode = ?", coa.Kode).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}
		if err := db.Where("nama = ?", coa.Nama).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Nama sudah digunakan"})
			return
		}

		if err := db.Create(&coa).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, coa)
	}
}

// DELETE /api/master-coa/:id
func DeleteMasterCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		// Validasi ID
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
			return
		}

		// Cek apakah record ada
		var coa models.MasterCOA
		if err := db.First(&coa, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "COA not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			}
			return
		}

		// Cek apakah COA sudah digunakan di input transaksi (berdasarkan kode COA)
		var transaksiCount int64
		if err := db.Model(&models.InputTransaksi{}).Where("coa_akun_bank = ? OR akun_transaksi = ?", coa.Kode, coa.Kode).Count(&transaksiCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			return
		}

		if transaksiCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "COA tidak dapat dihapus karena sudah digunakan di transaksi"})
			return
		}

		if err := db.Delete(&models.MasterCOA{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "COA deleted successfully"})
	}
}

// PUT /api/master-coa/:id
func UpdateMasterCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		// Validasi ID
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
			return
		}

		var input models.MasterCOA
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var coa models.MasterCOA
		if err := db.First(&coa, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "COA not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			}
			return
		}

		// Cek apakah COA sudah digunakan di input transaksi (berdasarkan kode COA)
		var transaksiCount int64
		if err := db.Model(&models.InputTransaksi{}).Where("coa_akun_bank = ? OR akun_transaksi = ?", coa.Kode, coa.Kode).Count(&transaksiCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			return
		}

		if transaksiCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "COA tidak dapat diubah karena sudah digunakan di transaksi"})
			return
		}

		// Validasi kode tidak boleh kosong
		if input.Kode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode tidak boleh kosong"})
			return
		}

		// Cek duplikasi kode (kecuali untuk record yang sedang diupdate)
		var existing models.MasterCOA
		if err := db.Where("kode = ? AND id != ?", input.Kode, id).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		coa.Kode = input.Kode
		coa.Nama = input.Nama
		coa.MasterCategoryCOAID = input.MasterCategoryCOAID
		coa.SaldoAwal = input.SaldoAwal
		if err := db.Save(&coa).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, coa)
	}
}

// GET /api/coa-kas-bank
func GetCOAKasBank(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var coas []models.MasterCOA
		// Preload relasi dan filter kategori yang isKasBank = true
		if err := db.Preload("MasterCategoryCOA").
			Joins("JOIN master_category_coa ON master_category_coa.id = master_coa.master_category_coa_id").
			Where("master_category_coa.is_kas_bank = ?", true).
			Find(&coas).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, coas)
	}
}
