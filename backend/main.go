package main

import (
	"project-akuntansi-backend/config"
	"project-akuntansi-backend/handlers"
	"project-akuntansi-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	db, err := config.ConnectDB()
	if err != nil {
		panic("failed to connect database")
	}
	db.AutoMigrate(&models.Jurnal{}, &models.JurnalDetail{}, &models.MasterCOA{}, &models.MasterCategoryCOA{}, &models.InputTransaksi{})

	r := gin.Default()
	r.Use(cors.Default())

	r.GET("/api/jurnal", handlers.GetJurnal(db))
	r.POST("/api/jurnal", handlers.PostJurnal(db))
	r.POST("/api/jurnal-detail", handlers.PostJurnalDetail(db))
	r.PUT("/api/jurnal-detail", handlers.PostJurnalDetail(db)) // <--- tambahkan ini!
	r.GET("/api/jurnal-detail", handlers.GetJurnalDetails(db))
	r.GET("/api/master-coa", handlers.GetMasterCOA(db))
	r.POST("/api/master-coa", handlers.PostMasterCOA(db))
	r.PUT("/api/master-coa/:id", handlers.UpdateMasterCOA(db))
	r.DELETE("/api/master-coa/:id", handlers.DeleteMasterCOA(db))

	// Tambahkan endpoint baru untuk master category coa
	r.GET("/api/master-category-coa", handlers.GetMasterCategoryCOA(db))
	r.POST("/api/master-category-coa", handlers.PostMasterCategoryCOA(db))
	r.PUT("/api/master-category-coa/:id", handlers.UpdateMasterCategoryCOA(db))
	r.DELETE("/api/master-category-coa/:id", handlers.DeleteMasterCategoryCOA(db))
	r.GET("/api/coa-kas-bank", handlers.GetCOAKasBank(db))
	r.DELETE("/api/jurnal-detail", handlers.DeleteJurnalDetailByNoBukti(db))
	r.GET("/api/generate-no-bukti", handlers.GenerateNoBukti(db))
	r.GET("/api/input-transaksi", handlers.GetInputTransaksi(db))
	r.POST("/api/input-transaksi", handlers.PostInputTransaksi(db))
	r.PUT("/api/input-transaksi/:id", handlers.UpdateInputTransaksi(db))
	r.DELETE("/api/input-transaksi/:id", handlers.DeleteInputTransaksi(db))

	r.Run("0.0.0.0:8080")
	// filepath: d:\project-akuntansi\backend\main.go
}
