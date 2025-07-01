package handlers

import (
	"net/http"
	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /api/master-category-coa
func GetMasterCategoryCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var list []models.MasterCategoryCOA
		if err := db.Find(&list).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, list)
	}
}

// POST /api/master-category-coa
func PostMasterCategoryCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var cat models.MasterCategoryCOA
		if err := c.ShouldBindJSON(&cat); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validasi kode tidak boleh kosong
		if cat.Kode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode tidak boleh kosong"})
			return
		}

		// Cek duplikasi kode
		var existing models.MasterCategoryCOA
		if err := db.Where("kode = ?", cat.Kode).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		if err := db.Create(&cat).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, cat)
	}
}

// DELETE /api/master-category-coa/:id
func DeleteMasterCategoryCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		// Validasi ID
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
			return
		}

		// Cek apakah record ada
		var cat models.MasterCategoryCOA
		if err := db.First(&cat, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			}
			return
		}
		// Cek apakah kategori sudah digunakan di master COA
		var coaCount int64
		if err := db.Model(&models.MasterCOA{}).Where("master_category_coa_id = ?", id).Count(&coaCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			return
		}

		if coaCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tidak dapat dihapus karena sudah digunakan di Master COA"})
			return
		}

		if err := db.Delete(&models.MasterCategoryCOA{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
	}
}

// PUT /api/master-category-coa/:id
func UpdateMasterCategoryCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")

		// Validasi ID
		if id == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
			return
		}

		var input models.MasterCategoryCOA
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		var cat models.MasterCategoryCOA
		if err := db.First(&cat, id).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
			} else {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			}
			return
		}

		// Cek apakah kategori sudah digunakan di master COA
		var coaCount int64
		if err := db.Model(&models.MasterCOA{}).Where("master_category_coa_id = ?", id).Count(&coaCount).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error: " + err.Error()})
			return
		}

		if coaCount > 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kategori tidak dapat diubah karena sudah digunakan di Master COA"})
			return
		}

		// Validasi kode tidak boleh kosong
		if input.Kode == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode tidak boleh kosong"})
			return
		}

		// Cek duplikasi kode (kecuali untuk record yang sedang diupdate)
		var existing models.MasterCategoryCOA
		if err := db.Where("kode = ? AND id != ?", input.Kode, id).First(&existing).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Kode sudah digunakan"})
			return
		}

		cat.Kode = input.Kode
		cat.Nama = input.Nama
		cat.TipeAkun = input.TipeAkun
		cat.IsKasBank = input.IsKasBank
		if err := db.Save(&cat).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, cat)
	}
}
