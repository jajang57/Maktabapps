package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type BukuBesarRequest struct {
	COA          string `form:"coa"`
	TanggalAwal  string `form:"tanggal_awal"`
	TanggalAkhir string `form:"tanggal_akhir"`
}

type BukuBesarResponse struct {
	Tanggal        string  `json:"tanggal"`
	NomorTransaksi string  `json:"nomorTransaksi"`
	Deskripsi      string  `json:"deskripsi"`
	Debit          float64 `json:"debit"`
	Kredit         float64 `json:"kredit"`
	Saldo          float64 `json:"saldo"`
	SaldoAwal      float64 `json:"saldo_awal"`
}

// Handler Buku Besar

func GetBukuBesar(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req BukuBesarRequest
		if err := c.ShouldBindQuery(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid params"})
			return
		}

		// Debug: log parameter request
		fmt.Println("[BUKU BESAR] PARAMS:", req)

		// Query COA dari tabel GL
		var bukuBesar []models.GL
		query := db
		if req.COA != "" {
			query = query.Where("akun_transaksi = ?", req.COA)
		}
		query = query.Where("tanggal >= ? AND tanggal <= ?", req.TanggalAwal, req.TanggalAkhir).Order("tanggal, nomor_transaksi, id").Find(&bukuBesar)

		// Debug: log hasil query
		fmt.Printf("[BUKU BESAR] Jumlah transaksi: %d\n", len(bukuBesar))
		if len(bukuBesar) > 0 {
			fmt.Printf("[BUKU BESAR] Data pertama: %+v\n", bukuBesar[0])
		}

		// Hitung saldo awal dari tabel GL
		var saldoAwal float64
		querySaldo := db.Model(&models.GL{})
		if req.COA != "" {
			querySaldo = querySaldo.Where("akun_transaksi = ?", req.COA)
		}
		querySaldo = querySaldo.Where("tanggal < ?", req.TanggalAwal)
		querySaldo.Select("SUM(debit - kredit)").Row().Scan(&saldoAwal)

		// Debug: log saldo awal
		fmt.Printf("[BUKU BESAR] Saldo Awal: %f\n", saldoAwal)

		// Build response
		var result []BukuBesarResponse
		currSaldo := saldoAwal
		for _, row := range bukuBesar {
			currSaldo += row.Debit - row.Kredit
			result = append(result, BukuBesarResponse{
				Tanggal:        row.Tanggal.Format("2006-01-02"),
				NomorTransaksi: row.NomorTransaksi,
				Deskripsi:      row.Deskripsi,
				Debit:          row.Debit,
				Kredit:         row.Kredit,
				Saldo:          currSaldo,
				SaldoAwal:      saldoAwal,
			})
		}

		// Jika tidak ada transaksi, tetap kirim saldo awal
		if len(result) == 0 {
			result = append(result, BukuBesarResponse{
				Tanggal:   "",
				SaldoAwal: saldoAwal,
			})
		}

		c.JSON(http.StatusOK, result)
	}
}
