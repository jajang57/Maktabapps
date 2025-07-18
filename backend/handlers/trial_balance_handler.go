package handlers

import (
	"fmt"
	"net/http"
	"project-akuntansi-backend/models"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func GetTrialBalance(db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tahunStr := c.Query("tahun")
		bulanAwalStr := c.Query("bulan_awal")
		bulanAkhirStr := c.Query("bulan_akhir")
		tahun, _ := strconv.Atoi(tahunStr)
		bulanAwal, _ := strconv.Atoi(bulanAwalStr)
		bulanAkhir, _ := strconv.Atoi(bulanAkhirStr)

		var coas []models.MasterCOA
		db.Preload("MasterCategoryCOA").Find(&coas)

		type TrialBalanceRow struct {
			Kode      string  `json:"kode"`
			Nama      string  `json:"nama"`
			SaldoAwal float64 `json:"saldoAwal"`
			Kategori  string  `json:"kategori"`
			TipeAkun  string  `json:"tipeAkun"`
			// Dynamic per bulan
			JanDebit  float64 `json:"jan_debit"`
			JanKredit float64 `json:"jan_kredit"`
			FebDebit  float64 `json:"feb_debit"`
			FebKredit float64 `json:"feb_kredit"`
			MarDebit  float64 `json:"mar_debit"`
			MarKredit float64 `json:"mar_kredit"`
			AprDebit  float64 `json:"apr_debit"`
			AprKredit float64 `json:"apr_kredit"`
			MeiDebit  float64 `json:"mei_debit"`
			MeiKredit float64 `json:"mei_kredit"`
			JunDebit  float64 `json:"jun_debit"`
			JunKredit float64 `json:"jun_kredit"`
			JulDebit  float64 `json:"jul_debit"`
			JulKredit float64 `json:"jul_kredit"`
			AgsDebit  float64 `json:"ags_debit"`
			AgsKredit float64 `json:"ags_kredit"`
			SepDebit  float64 `json:"sep_debit"`
			SepKredit float64 `json:"sep_kredit"`
			OktDebit  float64 `json:"okt_debit"`
			OktKredit float64 `json:"okt_kredit"`
			NovDebit  float64 `json:"nov_debit"`
			NovKredit float64 `json:"nov_kredit"`
			DesDebit  float64 `json:"des_debit"`
			DesKredit float64 `json:"des_kredit"`
		}

		monthMap := map[int]string{
			1: "jan", 2: "feb", 3: "mar", 4: "apr", 5: "mei", 6: "jun",
			7: "jul", 8: "ags", 9: "sep", 10: "okt", 11: "nov", 12: "des",
		}

		var result []TrialBalanceRow

		for _, coa := range coas {
			row := TrialBalanceRow{
				Kode:      coa.Kode,
				Nama:      coa.Nama,
				SaldoAwal: coa.SaldoAwal,
				Kategori:  coa.MasterCategoryCOA.Nama,     // jika ingin nama kategori
				TipeAkun:  coa.MasterCategoryCOA.TipeAkun, // ambil tipe akun dari relasi kategori
			}

			// Saldo awal: debit-kredit sebelum bulanAwal
			var totalDebit, totalKredit float64
			rawSaldoAwal := `
				SELECT COALESCE(SUM(debit),0) AS total_debit, COALESCE(SUM(kredit),0) AS total_kredit
				FROM gl
				WHERE akun_transaksi = ?
				AND (
					EXTRACT(YEAR FROM tanggal) < ?
					OR (EXTRACT(YEAR FROM tanggal) = ? AND EXTRACT(MONTH FROM tanggal) < ?)
				)
			`
			saldoAwalRow := struct {
				TotalDebit  float64
				TotalKredit float64
			}{}
			db.Raw(rawSaldoAwal, coa.Kode, tahun, tahun, bulanAwal).Scan(&saldoAwalRow)
			totalDebit = saldoAwalRow.TotalDebit
			totalKredit = saldoAwalRow.TotalKredit
			if coa.MasterCategoryCOA.TipeAkun == "2" || coa.MasterCategoryCOA.TipeAkun == "3" || coa.MasterCategoryCOA.TipeAkun == "4" {
				row.SaldoAwal += (totalKredit - totalDebit)
			} else {
				row.SaldoAwal += (totalDebit - totalKredit)
			}
			//row.SaldoAwal += (totalDebit - totalKredit)

			// Loop bulan sesuai filter
			for m := bulanAwal; m <= bulanAkhir; m++ {
				var debit, kredit float64
				raw := `
						SELECT COALESCE(SUM(debit),0) AS debit, COALESCE(SUM(kredit),0) AS kredit
						FROM gl
						WHERE akun_transaksi = ? AND EXTRACT(MONTH FROM tanggal) = ? AND EXTRACT(YEAR FROM tanggal) = ?
					`
				r := struct {
					Debit  float64
					Kredit float64
				}{}
				db.Raw(raw, coa.Kode, m, tahun).Scan(&r)
				debit = r.Debit
				kredit = r.Kredit

				fmt.Printf("RAW QUERY: akun_transaksi=%s, bulan=%d, tahun=%d, Debit=%.2f, Kredit=%.2f\n", coa.Kode, m, tahun, debit, kredit)

				switch monthMap[m] {
				case "jan":
					row.JanDebit = debit
					row.JanKredit = kredit
				case "feb":
					row.FebDebit = debit
					row.FebKredit = kredit
				case "mar":
					row.MarDebit = debit
					row.MarKredit = kredit
				case "apr":
					row.AprDebit = debit
					row.AprKredit = kredit
				case "mei":
					row.MeiDebit = debit
					row.MeiKredit = kredit
				case "jun":
					row.JunDebit = debit
					row.JunKredit = kredit
				case "jul":
					row.JulDebit = debit
					row.JulKredit = kredit
				case "ags":
					row.AgsDebit = debit
					row.AgsKredit = kredit
				case "sep":
					row.SepDebit = debit
					row.SepKredit = kredit
				case "okt":
					row.OktDebit = debit
					row.OktKredit = kredit
				case "nov":
					row.NovDebit = debit
					row.NovKredit = kredit
				case "des":
					row.DesDebit = debit
					row.DesKredit = kredit
				}
			}

			result = append(result, row)
		}

		c.JSON(http.StatusOK, result)
	}
}
