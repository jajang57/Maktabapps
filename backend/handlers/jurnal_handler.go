package handlers

import (
	"net/http"
	"project-akuntansi-backend/models" // Ganti dengan nama module Anda

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetJurnal(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var data []models.Jurnal
		if err := db.Find(&data).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, data)
	}
}

func PostJurnal(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var jurnalList []models.Jurnal
		if err := c.ShouldBindJSON(&jurnalList); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		if err := db.Create(&jurnalList).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, jurnalList)
	}
}
