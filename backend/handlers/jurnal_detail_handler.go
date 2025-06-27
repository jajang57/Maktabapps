package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func PostJurnalDetail(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var details []models.JurnalDetail
		if err := c.ShouldBindJSON(&details); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Penomoran sequence per noBukti
		noBuktiMap := map[string]uint{}
		for i := range details {
			noBukti := details[i].NoBukti
			noBuktiMap[noBukti]++
			details[i].Seq = noBuktiMap[noBukti]
			// Tandai piutang otomatis jika perlu
			if details[i].Keterangan == "Posting otomatis" {
				details[i].IsPiutang = true
			}
		}

		for _, detail := range details {
			if detail.ID != 0 {
				// Update by ID (untuk baris yang sudah ada)
				if err := db.Model(&models.JurnalDetail{}).
					Where("id = ?", detail.ID).
					Updates(detail).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
					return
				}
			} else {
				// Update by noBukti + seq jika ada, jika tidak insert baru
				var existing models.JurnalDetail
				err := db.Where("no_bukti = ? AND seq = ?", detail.NoBukti, detail.Seq).First(&existing).Error
				if err == nil {
					// Sudah ada, update
					if err := db.Model(&existing).Updates(detail).Error; err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
						return
					}
				} else {
					// Belum ada, insert baru
					if err := db.Create(&detail).Error; err != nil {
						c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
						return
					}
				}
			}
		}

		// Log ke server saja, bukan ke client
		fmt.Printf("%+v\n", details)

		// Selalu kirim JSON ke client
		c.JSON(http.StatusOK, gin.H{"status": "success"})
	}
}

func GetJurnalDetails(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var details []models.JurnalDetail
		if err := db.Find(&details).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, details)
	}
}

func DeleteJurnalDetailByNoBukti(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req struct {
			NoBukti string `json:"noBukti"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		if err := db.Where("no_bukti = ?", req.NoBukti).Delete(&models.JurnalDetail{}).Error; err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "deleted"})
	}
}

func GenerateNoBukti(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		akunKas := c.Query("akunKas")
		tanggal := c.Query("tanggal") // format: yyyy-mm-dd

		if akunKas == "" || tanggal == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "akunKas dan tanggal wajib diisi"})
			return
		}

		// Format tanggal untuk pencarian
		t, _ := time.Parse("2006-01-02", tanggal)
		day := t.Format("02")
		month := t.Format("01")
		year := t.Format("06")
		user := "01"

		// Cari nomor bukti terakhir untuk akunKas & tanggal yang sama
		var last models.JurnalDetail
		prefix := akunKas + "/" + day + month + year + "/" + user + "-"
		err := db.Model(&models.JurnalDetail{}).
			Where("akun_kas = ? AND tanggal = ? AND no_bukti LIKE ?", akunKas, tanggal, prefix+"%").
			Order("no_bukti DESC").
			First(&last).Error

		urut := "000001"
		if err == nil && last.NoBukti != "" {
			// Ambil 6 digit terakhir dari no_bukti terakhir
			nb := last.NoBukti
			if len(nb) >= 6 {
				last6 := nb[len(nb)-6:]
				if n, err := strconv.Atoi(last6); err == nil {
					urut = leftPad(strconv.Itoa(n+1), "0", 6)
				}
			}
		}

		noBukti := prefix + urut

		c.JSON(http.StatusOK, gin.H{"noBukti": noBukti})
	}
}

// Helper untuk padding kiri
func leftPad(s, pad string, length int) string {
	for len(s) < length {
		s = pad + s
	}
	return s
}
