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
		if err := db.Delete(&models.MasterCategoryCOA{}, id).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "deleted"})
	}
}

// PUT /api/master-category-coa/:id
func UpdateMasterCategoryCOA(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		id := c.Param("id")
		var input models.MasterCategoryCOA
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		var cat models.MasterCategoryCOA
		if err := db.First(&cat, id).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
			return
		}
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
