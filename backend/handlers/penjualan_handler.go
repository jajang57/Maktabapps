package handlers

import (
	"fmt"
	"log"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PenjualanHandler struct {
	DB *gorm.DB
}

func NewPenjualanHandler(db *gorm.DB) *PenjualanHandler {
	return &PenjualanHandler{DB: db}
}

// Create Penjualan (header + detail)
func (h *PenjualanHandler) CreatePenjualan(c *gin.Context) {
	var req models.Penjualan
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse tanggal dari string
	if req.TanggalStr != "" {
		tgl, err := time.Parse("2006-01-02", req.TanggalStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal salah"})
			return
		}
		req.Tanggal = tgl
	}
	if req.DueDateStr != "" {
		due, err := time.Parse("2006-01-02", req.DueDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format due date salah"})
			return
		}
		req.DueDate = due
	}

	// Hitung subtotal & totals
	var subtotal float64
	for i := range req.Details {
		disc := (req.Details[i].Qty * req.Details[i].Price * req.Details[i].DiscPercent / 100) + req.Details[i].DiscAmountItem
		afterDisc := (req.Details[i].Qty * req.Details[i].Price) - disc
		subtotal += afterDisc
	}
	req.Subtotal = subtotal
	req.PPN = 0
	req.Total = subtotal + req.Freight + req.Stamp

	// Pastikan GudangID di detail ikut tersimpan
	for i := range req.Details {
		if req.Details[i].GudangID == 0 {
			req.Details[i].GudangID = req.GudangID
		}
	}

	// Simpan header+detail + GL dalam satu transaksi
	tx := h.DB.Begin()
	if err := tx.Create(&req).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan penjualan", "details": err.Error()})
		return
	}

	// Generate GL lines and insert
	gls, err := GenerateSalesGLLines(tx, req)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate GL", "details": err.Error()})
		return
	}
	if len(gls) > 0 {
		if err := tx.Create(&gls).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan GL", "details": err.Error()})
			return
		}
	}

	tx.Commit()
	c.JSON(http.StatusCreated, gin.H{"success": true, "reset": true})
}

// Get All Penjualan (beserta detail)
func (h *PenjualanHandler) GetAllPenjualan(c *gin.Context) {
	var penjualan []models.Penjualan
	if err := h.DB.Preload("Details").Find(&penjualan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal ambil data"})
		return
	}
	c.JSON(http.StatusOK, penjualan)
}

// Get Penjualan by ID
func (h *PenjualanHandler) GetPenjualanByID(c *gin.Context) {
	id := c.Param("id")
	var penjualan models.Penjualan
	if err := h.DB.Preload("Details").First(&penjualan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
		return
	}
	c.JSON(http.StatusOK, penjualan)
}

// Update Penjualan - Delete All Then Recreate
func (h *PenjualanHandler) UpdatePenjualan(c *gin.Context) {
	id := c.Param("id")
	var req models.Penjualan
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	log.Printf("[penjualan] UpdatePenjualan request for ID=%s", id)
	log.Printf("[penjualan] incoming payload: customer_id=%d, gudang_id=%d, details_count=%d",
		req.CustomerID, req.GudangID, len(req.Details))

	// Get existing penjualan for reference
	var existingPenjualan models.Penjualan
	if err := h.DB.First(&existingPenjualan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
		return
	}

	// Validation: ensure required fields
	if len(req.Details) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Detail items required"})
		return
	}

	// Parse tanggal dari string jika ada
	if req.TanggalStr != "" {
		tgl, err := time.Parse("2006-01-02", req.TanggalStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal salah"})
			return
		}
		req.Tanggal = tgl
	}
	if req.DueDateStr != "" {
		due, err := time.Parse("2006-01-02", req.DueDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format due date salah"})
			return
		}
		req.DueDate = due
	}

	// ✅ START TRANSACTION - DELETE ALL THEN RECREATE
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("[penjualan] panic during transaction: %v", r)
		}
	}()

	log.Printf("[penjualan] STEP 1: Deleting existing GL entries...")
	// 1. Delete existing GL entries
	res1 := tx.Unscoped().Where("nomor_transaksi = ?", existingPenjualan.NomorInvoice).Delete(&models.GL{})
	if res1.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus GL lama", "details": res1.Error.Error()})
		return
	}
	log.Printf("[penjualan] deleted %d GL entries", res1.RowsAffected)

	log.Printf("[penjualan] STEP 2: Deleting existing detail entries...")
	// 2. Delete existing details
	res2 := tx.Unscoped().Where("penjualan_id = ?", existingPenjualan.ID).Delete(&models.PenjualanDetail{})
	if res2.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus detail lama", "details": res2.Error.Error()})
		return
	}
	log.Printf("[penjualan] deleted %d detail entries", res2.RowsAffected)

	log.Printf("[penjualan] STEP 3: Deleting existing header...")
	// 3. Delete existing header
	res3 := tx.Unscoped().Where("id = ?", existingPenjualan.ID).Delete(&models.Penjualan{})
	if res3.Error != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus header lama", "details": res3.Error.Error()})
		return
	}
	log.Printf("[penjualan] deleted header with ID=%d", existingPenjualan.ID)

	log.Printf("[penjualan] STEP 4: Recreating with new data...")
	// 4. Set ID untuk recreate dengan ID yang sama
	req.ID = existingPenjualan.ID

	// Hitung subtotal & totals dari details baru
	var subtotal float64
	for i := range req.Details {
		// Reset ID detail untuk insert baru
		req.Details[i].ID = 0
		req.Details[i].PenjualanID = req.ID

		// Set GudangID di detail jika kosong
		if req.Details[i].GudangID == 0 {
			req.Details[i].GudangID = req.GudangID
		}

		// Hitung subtotal
		disc := (req.Details[i].Qty * req.Details[i].Price * req.Details[i].DiscPercent / 100) + req.Details[i].DiscAmountItem
		afterDisc := (req.Details[i].Qty * req.Details[i].Price) - disc
		subtotal += afterDisc
	}
	req.Subtotal = subtotal
	req.PPN = 0
	req.Total = subtotal + req.Freight + req.Stamp

	log.Printf("[penjualan] STEP 5: Inserting new header...")
	// 5. Insert header baru dengan ID yang sama
	if err := tx.Create(&req).Error; err != nil {
		tx.Rollback()
		log.Printf("[penjualan] failed to create new header: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan header baru", "details": err.Error()})
		return
	}
	log.Printf("[penjualan] created new header with ID=%d, details_count=%d", req.ID, len(req.Details))

	log.Printf("[penjualan] STEP 6: Generating and inserting GL entries...")
	// 6. Generate dan insert GL entries baru
	gls, err := GenerateSalesGLLines(tx, req)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate GL baru", "details": err.Error()})
		return
	}
	if len(gls) > 0 {
		if err := tx.Create(&gls).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan GL baru", "details": err.Error()})
			return
		}
		log.Printf("[penjualan] created %d new GL entries", len(gls))
	}

	log.Printf("[penjualan] STEP 7: Committing transaction...")
	// 7. Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal commit transaksi", "details": err.Error()})
		return
	}

	log.Printf("[penjualan] UpdatePenjualan completed successfully for ID=%s", id)

	// 8. Return fresh data untuk frontend sync
	var finalPenjualan models.Penjualan
	if err := h.DB.Preload("Details").First(&finalPenjualan, req.ID).Error; err != nil {
		log.Printf("[penjualan] failed to reload for response: %v", err)
		c.JSON(http.StatusOK, gin.H{"success": true, "message": "Update berhasil"})
		return
	}

	log.Printf("[penjualan] sending response with %d details to frontend", len(finalPenjualan.Details))
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Update berhasil",
		"data":    finalPenjualan,
	})
}

// Delete Penjualan
func (h *PenjualanHandler) DeletePenjualan(c *gin.Context) {
	id := c.Param("id")
	var penjualan models.Penjualan
	if err := h.DB.First(&penjualan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
		return
	}
	tx := h.DB.Begin()
	// delete GL entries for this invoice (hard delete)
	if err := tx.Unscoped().Where("nomor_transaksi = ?", penjualan.NomorInvoice).Delete(&models.GL{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus GL terkait"})
		return
	}
	if err := tx.Unscoped().Where("penjualan_id = ?", penjualan.ID).Delete(&models.PenjualanDetail{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus detail"})
		return
	}
	if err := tx.Unscoped().Delete(&penjualan).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus header"})
		return
	}
	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Penjualan berhasil dihapus"})
}

// GetPenjualanByNomor retrieves penjualan by nomor invoice
func (h *PenjualanHandler) GetPenjualanByNomor(c *gin.Context) {
	nomor := c.Param("nomor")
	var penjualan models.Penjualan

	if err := h.DB.Preload("Details").Where("nomor_invoice = ?", nomor).First(&penjualan).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Penjualan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch penjualan"})
		return
	}

	c.JSON(http.StatusOK, penjualan)
}

// UpdatePenjualanStatus updates only the status of penjualan
func (h *PenjualanHandler) UpdatePenjualanStatus(c *gin.Context) {
	id := c.Param("id")
	var statusData struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&statusData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON data", "details": err.Error()})
		return
	}

	var penjualan models.Penjualan
	if err := h.DB.First(&penjualan, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Penjualan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch penjualan"})
		return
	}

	// Update status
	if err := h.DB.Model(&penjualan).Update("status", statusData.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	// Fetch updated data
	h.DB.Preload("Details").First(&penjualan, penjualan.ID)

	c.JSON(http.StatusOK, penjualan)
}

// GetPenjualanReport generates report data for penjualan
func (h *PenjualanHandler) GetPenjualanReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	status := c.Query("status")

	query := h.DB.Preload("Details")

	if startDate != "" && endDate != "" {
		query = query.Where("tanggal BETWEEN ? AND ?", startDate, endDate)
	}

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var penjualan []models.Penjualan
	if err := query.Find(&penjualan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate report"})
		return
	}

	// Calculate summary
	var totalAmount float64
	for _, p := range penjualan {
		totalAmount += p.Total
	}

	response := gin.H{
		"data": penjualan,
		"summary": gin.H{
			"total_records": len(penjualan),
			"total_amount":  totalAmount,
		},
	}

	c.JSON(http.StatusOK, response)
}

// GetNextInvoiceNumber generates next invoice number
func (h *PenjualanHandler) GetNextInvoiceNumber(c *gin.Context) {
	today := time.Now()
	year := today.Year()
	month := int(today.Month())
	day := today.Day()

	prefix := fmt.Sprintf("INV-%04d%02d%02d-", year, month, day)

	var count int64
	h.DB.Model(&models.Penjualan{}).Where("nomor_invoice LIKE ?", prefix+"%").Count(&count)

	nextNumber := fmt.Sprintf("%s%03d", prefix, count+1)

	c.JSON(http.StatusOK, gin.H{
		"next_invoice_number": nextNumber,
	})
}

type CurrencyAccounts struct {
	ReceivableAccount string
	DiscountAccount   string
	FreightAccount    string
	StampAccount      string
}

func getAccountsForCustomer(db *gorm.DB, customerID uint) (CurrencyAccounts, error) {
	var resp CurrencyAccounts

	var pembeli models.MasterPembeli
	if err := db.First(&pembeli, customerID).Error; err != nil {
		return resp, fmt.Errorf("customer not found: %w", err)
	}

	if pembeli.MataUang == "" {
		return resp, fmt.Errorf("customer has no mata_uang set")
	}

	var mu models.MasterMataUang
	if err := db.Where("kode = ?", pembeli.MataUang).First(&mu).Error; err != nil {
		return resp, fmt.Errorf("mata_uang lookup failed for code %s: %w", pembeli.MataUang, err)
	}

	// map fields from master_mata_uang
	resp.ReceivableAccount = mu.PiutangUsaha
	resp.DiscountAccount = mu.DiskonJual   // akun untuk potongan/discount
	resp.FreightAccount = mu.BiayaLainLain // akun freight / biaya lain
	resp.StampAccount = mu.BiayaMaterai    // akun materai / stamp

	return resp, nil
}

// getSalesAccountByItem: lookup MasterBarangJasa by kode dan kembalikan akun penjualan
func getSalesAccountByItem(db *gorm.DB, kodeItem string) (string, error) {
	var mb models.MasterBarangJasa
	if err := db.Where("kode = ?", kodeItem).First(&mb).Error; err != nil {
		return "", fmt.Errorf("item not found: %w", err)
	}
	if mb.AkunPenjualan == "" {
		return "", fmt.Errorf("akun penjualan belum diset untuk item %s", kodeItem)
	}
	return mb.AkunPenjualan, nil
}

// parse simple dpp formula: "11/12" -> 11/12, "inclusive" -> 100/(100+rate)
func parseDppFormulaBackend(s string, rate float64) float64 {
	s = strings.TrimSpace(s)
	if s == "" {
		return 1.0
	}
	if strings.Contains(s, "/") {
		parts := strings.SplitN(s, "/", 2)
		if len(parts) == 2 {
			num, err1 := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
			den, err2 := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
			if err1 == nil && err2 == nil && den != 0 {
				return num / den
			}
		}
	}
	if strings.ToLower(s) == "inclusive" && rate > 0 {
		return 100.0 / (100.0 + rate)
	}
	// try parse single number
	if v, err := strconv.ParseFloat(s, 64); err == nil && v != 0 {
		return v
	}
	return 1.0
}

// GenerateSalesGLLines builds GL lines for a penjualan (does NOT persist).
// Rules used:
// - AR (debit) sourced from totals (see balancing below)
// - Discount (debit) from details.discAmount
// - PPH (debit) per tax account (if tax_type contains 'pph')
// - Sales (credit) aggregated by item.AkunPenjualan using detail.dpp
// - Tax (credit) per sales_tax_account for non-pph taxes
// - Freight, Stamp (credit) from currency accounts
// Balancing: AR = Sales + TaxCredit + Freight + Stamp - Discount - TotalPPH
func GenerateSalesGLLines(db *gorm.DB, penjualan models.Penjualan) ([]models.GL, error) {
	var gls []models.GL

	// 1) aggregate totals and maps
	var totalDpp float64
	var totalDiscount float64
	for _, d := range penjualan.Details {
		totalDpp += d.Dpp
		totalDiscount += d.DiscAmount
	}

	// freight / stamp from penjualan fields (ensure floats)
	totalFreight := penjualan.Freight
	totalStamp := penjualan.Stamp

	// 2) aggregate sales by sales account (per item)
	salesByAccount := map[string]float64{}
	for _, d := range penjualan.Details {
		account := ""
		var mb models.MasterBarangJasa
		if err := db.Where("kode = ?", d.KodeItem).First(&mb).Error; err == nil {
			account = mb.AkunPenjualan
		}
		if account == "" {
			account = "SALES_DEFAULT" // fallback - ganti sesuai kebijakan
		}
		salesByAccount[account] += d.Dpp
	}

	// 3) aggregate taxes per account + classify PPH
	// map: order -> account -> amount (for logging if needed)
	type taxLine struct {
		Order   int
		Account string
		Amount  float64
		IsPph   bool
	}
	var taxLines []taxLine
	var totalTaxCredit float64 // non PPH
	var totalPph float64

	for _, d := range penjualan.Details {
		baseDpp := d.Dpp
		if math.Abs(baseDpp) < 0.000001 {
			continue
		}
		for _, code := range d.Tax {
			var mp models.MasterPajak
			if err := db.Where("code = ?", code).First(&mp).Error; err != nil {
				log.Printf("[penjualan] master_pajak not found for code=%s", code)
				continue
			}
			rate := mp.RatePercent
			factor := parseDppFormulaBackend(mp.DPPFormula, rate)
			baseForTax := factor * baseDpp
			amt := (baseForTax * rate) / 100.0
			account := mp.SalesTaxAccount
			if account == "" {
				account = "TAX_DEFAULT"
			}
			isPph := strings.Contains(strings.ToLower(mp.TaxType), "pph")
			taxLines = append(taxLines, taxLine{Order: mp.Order, Account: account, Amount: amt, IsPph: isPph})
			if isPph {
				totalPph += amt
			} else {
				totalTaxCredit += amt
			}
		}
	}

	// 4) compute AR debit to balance entries:
	// Credits = Sales + totalTaxCredit + freight + stamp
	creditsSum := 0.0
	for _, v := range salesByAccount {
		creditsSum += v
	}
	creditsSum += totalTaxCredit + totalFreight + totalStamp

	arDebit := creditsSum - totalDiscount - totalPph

	// 5) determine receivable & other accounts from customer's currency
	accounts, err := getAccountsForCustomer(db, penjualan.CustomerID)
	if err != nil {
		// log and fallback
		log.Printf("[penjualan] cannot determine currency accounts: %v", err)
		accounts = CurrencyAccounts{
			ReceivableAccount: "AR_DEFAULT",
			DiscountAccount:   "DISC_DEFAULT",
			FreightAccount:    "FREIGHT_DEFAULT",
			StampAccount:      "STAMP_DEFAULT",
		}
	}

	now := time.Now()
	// Build GL lines (debits)
	gls = append(gls, models.GL{
		Tanggal:        now,
		AkunTransaksi:  accounts.ReceivableAccount,
		Deskripsi:      "Piutang - " + penjualan.NomorInvoice,
		Debit:          arDebit,
		Kredit:         0,
		NomorTransaksi: penjualan.NomorInvoice,
	})

	if totalDiscount > 0 {
		gls = append(gls, models.GL{
			Tanggal:        now,
			AkunTransaksi:  accounts.DiscountAccount,
			Deskripsi:      "Potongan / Discount - " + penjualan.NomorInvoice,
			Debit:          totalDiscount,
			Kredit:         0,
			NomorTransaksi: penjualan.NomorInvoice,
		})
	}

	// PPH debits (aggregate by account)
	pphByAccount := map[string]float64{}
	for _, tl := range taxLines {
		if tl.IsPph {
			pphByAccount[tl.Account] += tl.Amount
		}
	}
	for acct, amt := range pphByAccount {
		if amt == 0 {
			continue
		}
		gls = append(gls, models.GL{
			Tanggal:        now,
			AkunTransaksi:  acct,
			Deskripsi:      "Withholding / PPH - " + penjualan.NomorInvoice,
			Debit:          amt,
			Kredit:         0,
			NomorTransaksi: penjualan.NomorInvoice,
		})
	}

	// Credits: Sales aggregated per account
	for acct, amt := range salesByAccount {
		if amt == 0 {
			continue
		}
		gls = append(gls, models.GL{
			Tanggal:        now,
			AkunTransaksi:  acct,
			Deskripsi:      "Penjualan - " + penjualan.NomorInvoice,
			Debit:          0,
			Kredit:         amt,
			NomorTransaksi: penjualan.NomorInvoice,
		})
	}

	// Taxes (non-PPH) credits aggregated by account
	taxByAccount := map[string]float64{}
	for _, tl := range taxLines {
		if !tl.IsPph {
			taxByAccount[tl.Account] += tl.Amount
		}
	}
	for acct, amt := range taxByAccount {
		if amt == 0 {
			continue
		}
		gls = append(gls, models.GL{
			Tanggal:        now,
			AkunTransaksi:  acct,
			Deskripsi:      "Pajak (non-withholding) - " + penjualan.NomorInvoice,
			Debit:          0,
			Kredit:         amt,
			NomorTransaksi: penjualan.NomorInvoice,
		})
	}

	// Freight credit
	if totalFreight > 0 {
		gls = append(gls, models.GL{
			Tanggal:        now,
			AkunTransaksi:  accounts.FreightAccount,
			Deskripsi:      "Freight - " + penjualan.NomorInvoice,
			Debit:          0,
			Kredit:         totalFreight,
			NomorTransaksi: penjualan.NomorInvoice,
		})
	}

	// Stamp credit
	if totalStamp > 0 {
		gls = append(gls, models.GL{
			Tanggal:        now,
			AkunTransaksi:  accounts.StampAccount,
			Deskripsi:      "Stamp - " + penjualan.NomorInvoice,
			Debit:          0,
			Kredit:         totalStamp,
			NomorTransaksi: penjualan.NomorInvoice,
		})
	}

	// final quick balance check (optional)
	var sumDebit, sumCredit float64
	for _, l := range gls {
		sumDebit += l.Debit
		sumCredit += l.Kredit
	}
	if math.Round(sumDebit*100)/100 != math.Round(sumCredit*100)/100 {
		log.Printf("[penjualan] generated GL not balanced: debit=%.2f credit=%.2f (invoice=%s)", sumDebit, sumCredit, penjualan.NomorInvoice)
		// still return lines so caller can inspect; caller may choose to abort save
	}

	return gls, nil
}
