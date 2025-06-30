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
	db.AutoMigrate(&models.Jurnal{}, &models.JurnalDetail{}, &models.MasterCOA{}, &models.MasterCategoryCOA{}, &models.InputTransaksi{}, &models.User{})

	r := gin.Default()

	// Konfigurasi CORS yang lebih detail
	config := cors.DefaultConfig()
	config.AllowOrigins = []string{
		"http://localhost:3000",
		"http://localhost:3001",
		"http://localhost:5173",
		"http://127.0.0.1:3000",
		"http://127.0.0.1:3001",
		"http://127.0.0.1:5173",
	}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"}
	config.ExposeHeaders = []string{"Content-Length"}
	config.AllowCredentials = true

	r.Use(cors.New(config))

	// Middleware untuk menambahkan database ke context
	r.Use(func(c *gin.Context) {
		c.Set("db", db)
		c.Next()
	})

	// Public routes (tidak perlu authentication)
	r.POST("/api/register", handlers.Register(db))
	r.POST("/api/login", handlers.Login(db))

	// Protected routes (perlu authentication)
	api := r.Group("/api")
	api.Use(handlers.AuthMiddleware())
	{
		api.POST("/logout", handlers.Logout(db))
		api.GET("/jurnal", handlers.GetJurnal(db))
		api.POST("/jurnal", handlers.PostJurnal(db))
		api.POST("/jurnal-detail", handlers.PostJurnalDetail(db))
		api.PUT("/jurnal-detail", handlers.PostJurnalDetail(db))
		api.GET("/jurnal-detail", handlers.GetJurnalDetails(db))
		api.GET("/master-coa", handlers.GetMasterCOA(db))
		api.POST("/master-coa", handlers.PostMasterCOA(db))
		api.PUT("/master-coa/:id", handlers.UpdateMasterCOA(db))
		api.DELETE("/master-coa/:id", handlers.DeleteMasterCOA(db))
		api.GET("/master-category-coa", handlers.GetMasterCategoryCOA(db))
		api.POST("/master-category-coa", handlers.PostMasterCategoryCOA(db))
		api.PUT("/master-category-coa/:id", handlers.UpdateMasterCategoryCOA(db))
		api.DELETE("/master-category-coa/:id", handlers.DeleteMasterCategoryCOA(db))
		api.GET("/coa-kas-bank", handlers.GetCOAKasBank(db))
		api.DELETE("/jurnal-detail", handlers.DeleteJurnalDetailByNoBukti(db))
		api.GET("/generate-no-bukti", handlers.GenerateNoBukti(db))
		api.GET("/input-transaksi", handlers.GetInputTransaksi(db))
		api.POST("/input-transaksi", handlers.PostInputTransaksi(db))
		api.PUT("/input-transaksi/:id", handlers.UpdateInputTransaksi(db))
		api.DELETE("/input-transaksi/:id", handlers.DeleteInputTransaksi(db))
		api.GET("/generate-no-transaksi", handlers.GetGenerateNoTransaksi(db))
	}

	r.Run("0.0.0.0:8080")
	// filepath: d:\project-akuntansi\backend\main.go
}
