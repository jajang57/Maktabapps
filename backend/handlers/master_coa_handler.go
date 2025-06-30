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
		if err := db.Delete(&models.MasterCOA{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "deleted"})
	}
}

// PUT /api/master-coa/:id
func UpdateMasterCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var input models.MasterCOA
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var coa models.MasterCOA
		if err := db.First(&coa, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
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
