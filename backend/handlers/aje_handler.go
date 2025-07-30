package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// Handler untuk generate nomor bukti otomatis AJE
func GenerateNoBuktiAJE(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tanggal := c.Query("tanggal") // format yyyy-mm-dd
		userID := c.Query("user")
		if tanggal == "" || userID == "" {
			c.JSON(400, gin.H{"error": "tanggal dan user wajib diisi"})
			return
		}
		t, err := time.Parse("2006-01-02", tanggal)
		if err != nil {
			c.JSON(400, gin.H{"error": "format tanggal salah"})
			return
		}
		// Pastikan userID numerik 2 digit (misal: 4 jadi 04, 12 tetap 12)
		userIDInt, err := strconv.Atoi(userID)
		if err != nil {
			c.JSON(400, gin.H{"error": "user id harus numerik"})
			return
		}
		userIDStr := fmt.Sprintf("%02d", userIDInt)
		prefix := fmt.Sprintf("AJE/%s/%s-", t.Format("02012006"), userIDStr)

		// Hitung awal dan akhir bulan
		firstOfMonth := time.Date(t.Year(), t.Month(), 1, 0, 0, 0, 0, t.Location())
		lastOfMonth := firstOfMonth.AddDate(0, 1, -1)

		// Cari nomor urut max untuk bulan dan user yang sama
		var last models.AJE
		query := db.Where("no_bukti LIKE ?", prefix+"%")
		query = query.Where("tanggal >= ? AND tanggal <= ?", firstOfMonth.Format("2006-01-02"), lastOfMonth.Format("2006-01-02"))
		err = query.Order("no_bukti DESC").First(&last).Error

		fmt.Printf("[AJE] GenerateNoBuktiAJE: prefix=%s, firstOfMonth=%s, lastOfMonth=%s, last.NoBukti=%s, err=%v\n", prefix, firstOfMonth.Format("2006-01-02"), lastOfMonth.Format("2006-01-02"), last.NoBukti, err)

		nomorUrut := 1
		if err == nil && last.NoBukti != "" {
			parts := strings.Split(last.NoBukti, "-")
			if len(parts) == 2 {
				n, err := strconv.Atoi(parts[1])
				if err == nil {
					nomorUrut = n + 1
				}
			}
		}
		noBukti := fmt.Sprintf("%s%03d", prefix, nomorUrut)
		c.JSON(200, gin.H{"noBukti": noBukti})
	}
}

// Handler untuk posting AJE (set posted = true)
func PostingAJE(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ID uint `json:"id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Ambil no_bukti dari ID
		var aje models.AJE
		if err := db.First(&aje, req.ID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "AJE not found"})
			return
		}
		noBukti := aje.NoBukti
		// Ambil semua AJE dengan no_bukti yang sama
		var ajes []models.AJE
		if err := db.Where("no_bukti = ?", noBukti).Find(&ajes).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		// Insert ke GL (tanpa double entry, plus simpan tipe akun)
		for _, a := range ajes {
			var t time.Time
			if ts, err := time.Parse("2006-01-02", a.Tanggal); err == nil {
				t = ts
			} else {
				t = time.Now() // fallback jika gagal parse
			}

			gl := models.GL{
				Tanggal:        t,
				AkunTransaksi:  a.KodeAkun,
				Deskripsi:      a.Deskripsi,
				Debit:          a.Debit,
				Kredit:         a.Kredit,
				NomorTransaksi: a.NoBukti,
				ProjectNo:      a.ProjectNo,
				ProjectName:    a.ProjectName,
			}
			db.Create(&gl)
		}
		// Update posted semua AJE dengan no_bukti tsb
		if err := db.Model(&models.AJE{}).Where("no_bukti = ?", noBukti).Update("posted", true).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "posted"})
	}
}

// Handler untuk unposting AJE (set posted = false)
func UnpostingAJE(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			ID uint `json:"id"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Ambil no_bukti dari ID
		var aje models.AJE
		if err := db.First(&aje, req.ID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "AJE not found"})
			return
		}
		noBukti := aje.NoBukti
		// Hapus semua GL dengan nomor_transaksi = no_bukti (hard delete)
		if err := db.Unscoped().Where("nomor_transaksi = ?", noBukti).Delete(&models.GL{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		// Update posted semua AJE dengan no_bukti tsb
		if err := db.Model(&models.AJE{}).Where("no_bukti = ?", noBukti).Update("posted", false).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"status": "unposted"})
	}
}

// Handler untuk mengambil semua AJE
func GetAJE(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var data []models.AJE
		if err := db.Find(&data).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, data)
	}
}

// Handler untuk menambah/memperbarui AJE
func PostAJE(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var ajes []models.AJE
		if err := c.ShouldBindJSON(&ajes); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		// Kumpulkan semua id yang ada (edit)
		var idsToDelete []uint
		for _, a := range ajes {
			if a.ID != 0 {
				idsToDelete = append(idsToDelete, a.ID)
			}
		}
		// === Tambahkan log ini untuk cek isi idsToDelete ===
		fmt.Println("[DEBUG] idsToDelete:", idsToDelete)
		// Hapus dulu data lama jika ada id
		if len(idsToDelete) > 0 {
			if err := db.Where("id IN ?", idsToDelete).Delete(&models.AJE{}).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
		// Insert ulang data baru (pastikan id kosong)
		for i := range ajes {
			ajes[i].ID = 0
		}
		if err := db.Create(&ajes).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, ajes)
	}
}

type DeleteRequest struct {
	IDs []uint `json:"ids"`
}

// Handler untuk menghapus AJE berdasarkan ID
func DeleteAJE(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req DeleteRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		if len(req.IDs) == 0 {
			c.JSON(400, gin.H{"error": "ids kosong"})
			return
		}
		if err := db.Where("id IN ?", req.IDs).Delete(&models.AJE{}).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"success": true})
	}
}

// Handler untuk mengambil list COA yang is_kas_bank = false (untuk AJE)
func GetCOAAkunAJE(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var coas []models.MasterCOA
		if err := db.Preload("MasterCategoryCOA").
			Joins("JOIN master_category_coa ON master_category_coa.id = master_coa.master_category_coa_id").
			Where("master_category_coa.is_kas_bank = ?", false).
			Find(&coas).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, coas)
	}
}

// Handler untuk cek apakah no_bukti sudah ada di tabel AJE
func CekNoBuktiAJE(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		noBukti := c.Query("noBukti")
		if noBukti == "" {
			c.JSON(400, gin.H{"error": "noBukti wajib diisi"})
			return
		}
		var ajes []models.AJE
		if err := db.Model(&models.AJE{}).Where("no_bukti = ?", noBukti).Find(&ajes).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		ids := []uint{}
		for _, a := range ajes {
			ids = append(ids, a.ID)
		}
		c.JSON(200, gin.H{
			"exists": len(ajes) > 0,
			"ids":    ids,
		})
	}
}

// Handler untuk cek apakah no_bukti sudah ada di tabel GL
func CekNoBuktiGL(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		noBukti := c.Query("noBukti")
		if noBukti == "" {
			c.JSON(400, gin.H{"error": "noBukti wajib diisi"})
			return
		}
		var count int64
		if err := db.Model(&models.GL{}).Where("nomor_transaksi = ?", noBukti).Count(&count).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"exists": count > 0})
	}
}
