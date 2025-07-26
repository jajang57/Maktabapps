package main

import (
	"fmt"
	"project-akuntansi-backend/config"
	"project-akuntansi-backend/handlers"
	"project-akuntansi-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func migrateKodeCategory(db *gorm.DB) {
	var categories []models.MasterCategoryCOA
	db.Where("kode = '' OR kode IS NULL").Find(&categories)

	if len(categories) > 0 {
		fmt.Printf("Migrating %d categories without kode\n", len(categories))

		for i, cat := range categories {
			var kode string
			switch cat.TipeAkun {
			case "Asset":
				kode = fmt.Sprintf("AST%03d", i+1)
			case "Kewajiban":
				kode = fmt.Sprintf("LIA%03d", i+1)
			case "Modal":
				kode = fmt.Sprintf("EQT%03d", i+1)
			case "Pendapatan":
				kode = fmt.Sprintf("REV%03d", i+1)
			case "Beban":
				kode = fmt.Sprintf("EXP%03d", i+1)
			default:
				kode = fmt.Sprintf("GEN%03d", i+1)
			}

			db.Model(&cat).Update("kode", kode)
			fmt.Printf("Updated category ID %d (%s) with kode %s\n", cat.ID, cat.Nama, kode)
		}
		fmt.Println("Migration completed!")
	}
}

func main() {
	db, err := config.ConnectDB()
	if err != nil {
		panic("failed to connect database")
	}
	err = db.AutoMigrate(&models.AJE{}, &models.MasterCOA{}, &models.MasterCategoryCOA{}, &models.InputTransaksi{}, &models.User{}, &models.MasterProject{}, &models.GL{}, &models.GLSummary{})

	if err != nil {
		panic(fmt.Sprintf("AutoMigrate error: %v", err))
	}
	// Data migration untuk kode category yang kosong
	migrateKodeCategory(db)

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

		api.GET("/master-coa", handlers.GetMasterCOA(db))
		api.POST("/master-coa", handlers.PostMasterCOA(db))
		api.PUT("/master-coa/:id", handlers.UpdateMasterCOA(db))
		api.DELETE("/master-coa/:id", handlers.DeleteMasterCOA(db))
		api.GET("/master-category-coa", handlers.GetMasterCategoryCOA(db))
		api.POST("/master-category-coa", handlers.PostMasterCategoryCOA(db))
		api.PUT("/master-category-coa/:id", handlers.UpdateMasterCategoryCOA(db))
		api.DELETE("/master-category-coa/:id", handlers.DeleteMasterCategoryCOA(db))
		api.GET("/coa-kas-bank", handlers.GetCOAKasBank(db))

		api.GET("/input-transaksi", handlers.GetInputTransaksi(db))
		api.POST("/input-transaksi", handlers.PostInputTransaksi(db))
		api.PUT("/input-transaksi/:id", handlers.UpdateInputTransaksi(db))
		api.DELETE("/input-transaksi/:id", handlers.DeleteInputTransaksi(db))
		api.GET("/generate-no-transaksi", handlers.GetGenerateNoTransaksi(db))
		api.GET("/trial-balance", handlers.GetTrialBalance(db))
		api.GET("/buku-besar", handlers.GetBukuBesar(db))

		// Master Project Routes
		masterProjectRoutes := api.Group("/master-project")
		{
			masterProjectRoutes.GET("", handlers.GetMasterProjects(db))
			masterProjectRoutes.POST("", handlers.CreateMasterProject(db))
			masterProjectRoutes.PUT(":id", handlers.UpdateMasterProject(db))
			masterProjectRoutes.DELETE(":id", handlers.DeleteMasterProject(db))
		}

		// GL Routes
		api.GET("/gl", handlers.GetGLs(db))
		api.POST("/gl", handlers.CreateGL(db))
		api.PUT("/gl/:id", handlers.UpdateGL(db))
		api.DELETE("/gl/:id", handlers.DeleteGL(db))

		// AJE Routes
		api.GET("/aje", handlers.GetAJE(db))
		api.GET("/aje/coa-akun-aje", handlers.GetCOAAkunAJE(db))
		api.POST("/aje", handlers.PostAJE(db))                             // save
		api.POST("/aje/posting", handlers.PostingAJE(db))                  // posting
		api.POST("/aje/unposting", handlers.UnpostingAJE(db))              // unposting
		api.GET("/aje/generate-no-bukti", handlers.GenerateNoBuktiAJE(db)) // generate nomor otomatis
		api.POST("/aje/delete", handlers.DeleteAJE(db))                    // delete
		api.GET("/aje/cek-no-bukti", handlers.CekNoBuktiAJE(db))           // cek no bukti di AJE
		api.GET("/gl/cek-no-bukti", handlers.CekNoBuktiGL(db))             // cek no bukti di GL
	}

	r.Run("0.0.0.0:8080")
	// filepath: d:\project-akuntansi\backend\main.go
}
