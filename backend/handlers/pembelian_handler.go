package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"project-akuntansi-backend/models"

	"github.com/gin-gonic/gin"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type PembelianHandler struct {
	DB *gorm.DB
}

func NewPembelianHandler(db *gorm.DB) *PembelianHandler {
	return &PembelianHandler{DB: db}
}

// CurrencyAccountsap struct untuk mapping account pemasok
type CurrencyAccountsap struct {
	PayableAccount  string // Hutang Usaha
	DiscountAccount string // Diskon Beli
	FreightAccount  string // Biaya Lain-lain
	StampAccount    string // Biaya Materai
}

// CreatePembelian - Create AP Invoice (header + detail + GL)
func (h *PembelianHandler) CreatePembelian(c *gin.Context) {
	var reqReq models.PembelianRequest
	// Use manual JSON unmarshal to avoid automatic validator 'required' enforcement
	// which previously caused TanggalStr to be required.
	bodyBytes, err := c.GetRawData()
	if err != nil {
		log.Printf("[pembelian] failed to read request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	if err := json.Unmarshal(bodyBytes, &reqReq); err != nil {
		log.Printf("[pembelian] JSON unmarshal error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
		return
	}

	// Convert request DTO to model (marshal Tax []string to JSON)
	var req models.Pembelian
	req.NomorAPInvoice = reqReq.NomorAPInvoice
	req.TanggalStr = reqReq.TanggalStr
	req.DeliveryDateStr = reqReq.DeliveryDateStr
	req.SupplierID = reqReq.SupplierID
	req.GudangID = reqReq.GudangID
	req.DepartementID = reqReq.DepartementID
	req.NomorRefSupplier = reqReq.NomorRefSupplier
	req.Notes = reqReq.Notes
	req.Freight = reqReq.Freight
	req.Stamp = reqReq.Stamp
	req.Status = reqReq.Status
	// convert details
	for _, d := range reqReq.Details {
		// marshal tax array to JSON
		taxBytes, _ := json.Marshal(d.Tax)
		pd := models.PembelianDetail{
			KodeItem:       d.KodeItem,
			NamaItem:       d.NamaItem,
			Qty:            d.Qty,
			Unit:           d.Unit,
			Price:          d.Price,
			DiscPercent:    d.DiscPercent,
			DiscAmountItem: d.DiscAmountItem,
			DiscAmount:     d.DiscAmount,
			Tax:            datatypes.JSON(taxBytes),
			GudangId:       d.GudangId,
		}
		req.Details = append(req.Details, pd)
	}

	log.Printf("[pembelian] CreatePembelian request: %+v", reqReq)

	// Parse tanggal dari string jika ada
	if req.TanggalStr != "" {
		tgl, err := time.Parse("2006-01-02", req.TanggalStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format tanggal salah"})
			return
		}
		req.Tanggal = tgl
	}

	if req.DeliveryDateStr != "" {
		delivery, err := time.Parse("2006-01-02", req.DeliveryDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format delivery date salah"})
			return
		}
		req.DeliveryDate = delivery
	}

	// Validation: ensure required fields
	if req.NomorAPInvoice == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor AP Invoice harus diisi"})
		return
	}
	if req.SupplierID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pemasok harus dipilih"})
		return
	}
	if len(req.Details) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Detail barang harus diisi"})
		return
	}

	// Validate pemasok exists
	var pemasok models.MasterPemasok
	if err := h.DB.First(&pemasok, req.SupplierID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pemasok tidak ditemukan"})
		return
	}

	// Check duplicate nomor AP Invoice
	var existing models.Pembelian
	if err := h.DB.Where("nomor_ap_invoice = ?", req.NomorAPInvoice).First(&existing).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor AP Invoice sudah ada"})
		return
	}

	// START TRANSACTION
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("[pembelian] panic during transaction: %v", r)
		}
	}()

	// Hitung subtotal & totals dari details
	var subtotal float64
	var totalTaxAmount1, totalTaxAmount2, totalTaxAmount3 float64

	for i := range req.Details {
		detail := &req.Details[i]
		subtotal += detail.Qty * detail.Price
		totalTaxAmount1 += detail.TaxAmount1
		totalTaxAmount2 += detail.TaxAmount2
		totalTaxAmount3 += detail.TaxAmount3
	}

	req.Subtotal = subtotal
	req.TaxAmount1 = totalTaxAmount1
	req.TaxAmount2 = totalTaxAmount2
	req.TaxAmount3 = totalTaxAmount3
	req.PPNMasukan = totalTaxAmount1 // Assume tax1 is PPN Masukan
	req.Total = subtotal + totalTaxAmount1 + totalTaxAmount2 + totalTaxAmount3 + req.Freight + req.Stamp

	// Insert header
	if err := tx.Create(&req).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to create header: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan AP Invoice"})
		return
	}

	log.Printf("[pembelian] AP Invoice header created with ID: %d", req.ID)

	// Generate dan insert GL entries
	glLines, err := GenerateAPInvoiceGLLines(tx, req)
	if err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to generate GL lines: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal generate GL: %v", err)})
		return
	}

	if len(glLines) > 0 {
		if err := tx.Create(&glLines).Error; err != nil {
			tx.Rollback()
			log.Printf("[pembelian] failed to create GL lines: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan GL entries"})
			return
		}
		log.Printf("[pembelian] Created %d GL entries", len(glLines))
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("[pembelian] failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan transaksi"})
		return
	}

	log.Printf("[pembelian] AP Invoice successfully created: %s", req.NomorAPInvoice)

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "AP Invoice berhasil disimpan",
		"data":    req,
	})
}

// GetAllPembelian - Get All AP Invoices (beserta detail)
func (h *PembelianHandler) GetAllPembelian(c *gin.Context) {
	var pembelians []models.Pembelian

	if err := h.DB.Preload("Details").Find(&pembelians).Error; err != nil {
		log.Printf("[pembelian] failed to fetch AP invoices: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data AP Invoice"})
		return
	}

	// Format response untuk frontend
	var response []gin.H
	for _, p := range pembelians {
		// Get pemasok name dari MasterPemasok
		var pemasok models.MasterPemasok
		pemasokName := ""
		if err := h.DB.First(&pemasok, p.SupplierID).Error; err == nil {
			pemasokName = pemasok.Nama
		}

		response = append(response, gin.H{
			"id":             p.ID,
			"nomorapinvoice": p.NomorAPInvoice,
			"tanggal":        p.Tanggal.Format("2006-01-02"),
			"supplierId":     p.SupplierID,
			"supplierNama":   pemasokName, // Dari MasterPemasok.Nama
			"total":          p.Total,
			"status":         p.Status,
			"details":        p.Details,
		})
	}

	c.JSON(http.StatusOK, response)
}

// GetPembelianByID - Get AP Invoice by ID
func (h *PembelianHandler) GetPembelianByID(c *gin.Context) {
	id := c.Param("id")
	var pembelian models.Pembelian

	if err := h.DB.Preload("Details").First(&pembelian, id).Error; err != nil {
		log.Printf("[pembelian] AP Invoice not found: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "AP Invoice tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pembelian,
	})
}

// UpdatePembelian - Delete All Then Recreate
func (h *PembelianHandler) UpdatePembelian(c *gin.Context) {
	id := c.Param("id")
	log.Printf("[pembelian] UpdatePembelian request for ID=%s", id)

	// For update, bind to request DTO and convert
	var reqReqUpd models.PembelianRequest
	// Read raw body and unmarshal manually for update as well
	bodyBytesUpd, err := c.GetRawData()
	if err != nil {
		log.Printf("[pembelian] failed to read request body for update: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	if err := json.Unmarshal(bodyBytesUpd, &reqReqUpd); err != nil {
		log.Printf("[pembelian] JSON unmarshal error for update: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format"})
		return
	}

	// convert to model
	var req models.Pembelian
	req.NomorAPInvoice = reqReqUpd.NomorAPInvoice
	req.TanggalStr = reqReqUpd.TanggalStr
	req.DeliveryDateStr = reqReqUpd.DeliveryDateStr
	req.SupplierID = reqReqUpd.SupplierID
	req.GudangID = reqReqUpd.GudangID
	req.DepartementID = reqReqUpd.DepartementID
	req.NomorRefSupplier = reqReqUpd.NomorRefSupplier
	req.Notes = reqReqUpd.Notes
	req.Freight = reqReqUpd.Freight
	req.Stamp = reqReqUpd.Stamp
	req.Status = reqReqUpd.Status
	for _, d := range reqReqUpd.Details {
		taxBytes, _ := json.Marshal(d.Tax)
		pd := models.PembelianDetail{
			KodeItem:       d.KodeItem,
			NamaItem:       d.NamaItem,
			Qty:            d.Qty,
			Unit:           d.Unit,
			Price:          d.Price,
			DiscPercent:    d.DiscPercent,
			DiscAmountItem: d.DiscAmountItem,
			DiscAmount:     d.DiscAmount,
			Tax:            datatypes.JSON(taxBytes),
			GudangId:       d.GudangId,
		}
		req.Details = append(req.Details, pd)
	}

	// Get existing pembelian for reference
	var existing models.Pembelian
	if err := h.DB.First(&existing, id).Error; err != nil {
		log.Printf("[pembelian] AP Invoice not found for update: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "AP Invoice tidak ditemukan"})
		return
	}

	// Validate pemasok exists
	var pemasok models.MasterPemasok
	if err := h.DB.First(&pemasok, req.SupplierID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Pemasok tidak ditemukan"})
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

	if req.DeliveryDateStr != "" {
		delivery, err := time.Parse("2006-01-02", req.DeliveryDateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Format delivery date salah"})
			return
		}
		req.DeliveryDate = delivery
	}

	// Validation: ensure required fields
	if len(req.Details) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Detail barang harus diisi"})
		return
	}

	// ✅ START TRANSACTION - DELETE ALL THEN RECREATE
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("[pembelian] panic during transaction: %v", r)
		}
	}()

	log.Printf("[pembelian] STEP 1: Deleting existing GL entries...")
	// 1. Delete existing GL entries
	if err := tx.Where("nomor_bukti = ?", existing.NomorAPInvoice).Delete(&models.GL{}).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete GL entries: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus GL entries"})
		return
	}

	log.Printf("[pembelian] STEP 2: Deleting existing details...")
	// 2. Delete existing details
	if err := tx.Where("pembelian_id = ?", id).Delete(&models.PembelianDetail{}).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete details: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus detail"})
		return
	}

	log.Printf("[pembelian] STEP 3: Deleting existing header...")
	// 3. Delete existing header
	if err := tx.Delete(&existing).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete header: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus header"})
		return
	}

	// 4. Set ID untuk recreate dengan ID yang sama
	idUint, _ := strconv.ParseUint(id, 10, 32)
	req.ID = uint(idUint)

	// Hitung subtotal & totals dari details baru
	var subtotal float64
	var totalTaxAmount1, totalTaxAmount2, totalTaxAmount3 float64

	for i := range req.Details {
		detail := &req.Details[i]
		detail.PembelianID = req.ID // Set foreign key
		subtotal += detail.Qty * detail.Price
		totalTaxAmount1 += detail.TaxAmount1
		totalTaxAmount2 += detail.TaxAmount2
		totalTaxAmount3 += detail.TaxAmount3
	}

	req.Subtotal = subtotal
	req.TaxAmount1 = totalTaxAmount1
	req.TaxAmount2 = totalTaxAmount2
	req.TaxAmount3 = totalTaxAmount3
	req.PPNMasukan = totalTaxAmount1
	req.Total = subtotal + totalTaxAmount1 + totalTaxAmount2 + totalTaxAmount3 + req.Freight + req.Stamp

	log.Printf("[pembelian] STEP 5: Insert header baru dengan ID yang sama...")
	// 5. Insert header baru dengan ID yang sama
	if err := tx.Create(&req).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to recreate header: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan ulang header"})
		return
	}

	log.Printf("[pembelian] STEP 6: Generate dan insert GL entries baru...")
	// 6. Generate dan insert GL entries baru
	glLines, err := GenerateAPInvoiceGLLines(tx, req)
	if err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to generate GL lines: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Gagal generate GL: %v", err)})
		return
	}

	if len(glLines) > 0 {
		if err := tx.Create(&glLines).Error; err != nil {
			tx.Rollback()
			log.Printf("[pembelian] failed to create GL lines: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan GL entries"})
			return
		}
		log.Printf("[pembelian] Created %d GL entries", len(glLines))
	}

	log.Printf("[pembelian] STEP 7: Commit transaction...")
	// 7. Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("[pembelian] failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menyimpan transaksi"})
		return
	}

	log.Printf("[pembelian] STEP 8: Return fresh data untuk frontend sync...")
	// 8. Return fresh data untuk frontend sync
	var freshData models.Pembelian
	if err := h.DB.Preload("Details").First(&freshData, req.ID).Error; err != nil {
		log.Printf("[pembelian] failed to fetch fresh data: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengambil data terbaru"})
		return
	}

	log.Printf("[pembelian] AP Invoice successfully updated: %s", req.NomorAPInvoice)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AP Invoice berhasil diupdate",
		"data":    freshData,
	})
}

// DeletePembelian - Delete AP Invoice
func (h *PembelianHandler) DeletePembelian(c *gin.Context) {
	id := c.Param("id")

	// Get existing pembelian for GL cleanup
	var existing models.Pembelian
	if err := h.DB.First(&existing, id).Error; err != nil {
		log.Printf("[pembelian] AP Invoice not found for delete: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "AP Invoice tidak ditemukan"})
		return
	}

	// START TRANSACTION
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			log.Printf("[pembelian] panic during delete transaction: %v", r)
		}
	}()

	// Delete GL entries
	if err := tx.Where("nomor_bukti = ?", existing.NomorAPInvoice).Delete(&models.GL{}).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete GL entries: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus GL entries"})
		return
	}

	// Delete details
	if err := tx.Where("pembelian_id = ?", id).Delete(&models.PembelianDetail{}).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete details: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus detail"})
		return
	}

	// Delete header
	if err := tx.Delete(&existing).Error; err != nil {
		tx.Rollback()
		log.Printf("[pembelian] failed to delete header: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus header"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		log.Printf("[pembelian] failed to commit delete transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal menghapus transaksi"})
		return
	}

	log.Printf("[pembelian] AP Invoice successfully deleted: %s", existing.NomorAPInvoice)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "AP Invoice berhasil dihapus",
	})
}

// GetPembelianByNomor - Get AP Invoice by nomor
func (h *PembelianHandler) GetPembelianByNomor(c *gin.Context) {
	nomor := c.Param("nomor")
	var pembelian models.Pembelian

	if err := h.DB.Preload("Details").Where("nomor_ap_invoice = ?", nomor).First(&pembelian).Error; err != nil {
		log.Printf("[pembelian] AP Invoice not found by nomor: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "AP Invoice tidak ditemukan"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pembelian,
	})
}

// UpdatePembelianStatus - Update only status
func (h *PembelianHandler) UpdatePembelianStatus(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Status string `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Model(&models.Pembelian{}).Where("id = ?", id).Update("status", req.Status).Error; err != nil {
		log.Printf("[pembelian] failed to update status: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Status berhasil diupdate",
	})
}

// GetPembelianReport - Generate report data
func (h *PembelianHandler) GetPembelianReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	supplierID := c.Query("supplier_id")

	query := h.DB.Preload("Details")

	if startDate != "" && endDate != "" {
		query = query.Where("tanggal BETWEEN ? AND ?", startDate, endDate)
	}

	if supplierID != "" {
		query = query.Where("supplier_id = ?", supplierID)
	}

	var pembelians []models.Pembelian
	if err := query.Find(&pembelians).Error; err != nil {
		log.Printf("[pembelian] failed to generate report: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal generate report"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    pembelians,
	})
}

// GetNextAPInvoiceNumber - Generate next AP Invoice number
func (h *PembelianHandler) GetNextAPInvoiceNumber(c *gin.Context) {
	today := time.Now()
	year := today.Format("2006")
	month := today.Format("01")
	day := today.Format("02")

	prefix := fmt.Sprintf("APINV-%s%s%s-", year, month, day)

	var lastPembelian models.Pembelian
	if err := h.DB.Where("nomor_ap_invoice LIKE ?", prefix+"%").
		Order("nomor_ap_invoice DESC").
		First(&lastPembelian).Error; err != nil {
		// No previous invoice, start with 001
		nextNumber := prefix + "001"
		c.JSON(http.StatusOK, gin.H{"next_number": nextNumber})
		return
	}

	// Extract sequence number and increment
	parts := strings.Split(lastPembelian.NomorAPInvoice, "-")
	if len(parts) != 3 {
		nextNumber := prefix + "001"
		c.JSON(http.StatusOK, gin.H{"next_number": nextNumber})
		return
	}

	lastSeq, err := strconv.Atoi(parts[2])
	if err != nil {
		nextNumber := prefix + "001"
		c.JSON(http.StatusOK, gin.H{"next_number": nextNumber})
		return
	}

	nextSeq := lastSeq + 1
	nextNumber := fmt.Sprintf("%s%03d", prefix, nextSeq)

	c.JSON(http.StatusOK, gin.H{"next_number": nextNumber})
}

// getAccountsForSupplier - Get currency accounts for pemasok
func getAccountsForSupplier(db *gorm.DB, supplierID uint) (CurrencyAccountsap, error) {
	var resp CurrencyAccountsap

	var pemasok models.MasterPemasok
	if err := db.First(&pemasok, supplierID).Error; err != nil {
		return resp, fmt.Errorf("pemasok not found: %w", err)
	}

	if pemasok.MataUang == "" {
		return resp, fmt.Errorf("pemasok has no mata_uang set")
	}

	var mu models.MasterMataUang
	if err := db.Where("id = ?", pemasok.MataUang).First(&mu).Error; err != nil {
		return resp, fmt.Errorf("mata_uang lookup failed for code %s: %w", pemasok.MataUang, err)
	}

	// Map fields from master_mata_uang untuk AP
	resp.PayableAccount = mu.HutangUsaha   // Hutang Usaha (AP)
	resp.DiscountAccount = mu.DiskonBeli   // Akun discount pembelian
	resp.FreightAccount = mu.BiayaLainLain // Freight/biaya lain
	resp.StampAccount = mu.BiayaMaterai    // Materai/stamp

	return resp, nil
}

// getPurchaseAccountByItem - Get purchase account by item code
func getPurchaseAccountByItem(db *gorm.DB, kodeItem string) (string, error) {
	var mb models.MasterBarangJasa
	if err := db.Where("kode = ?", kodeItem).First(&mb).Error; err != nil {
		return "", fmt.Errorf("item not found: %w", err)
	}
	if mb.AkunPembelian == "" {
		return "", fmt.Errorf("akun pembelian belum diset untuk item %s", kodeItem)
	}
	return mb.AkunPembelian, nil
}

// parseDppFormula - Parse DPP formula
func parseDppFormula(s string) float64 {
	if s == "" {
		return 1.0
	}
	s = strings.TrimSpace(s)

	if strings.Contains(s, "/") {
		parts := strings.Split(s, "/")
		if len(parts) == 2 {
			num, err1 := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
			den, err2 := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
			if err1 == nil && err2 == nil && den != 0 {
				return num / den
			}
		}
	}

	if strings.ToLower(s) == "inclusive" {
		return 1.0 // Will be calculated as 100/(100+rate) in calling code
	}

	// Try to parse as simple number
	if val, err := strconv.ParseFloat(s, 64); err == nil {
		return val
	}

	return 1.0
}

// GenerateAPInvoiceGLLines - Generate GL lines for AP Invoice
func GenerateAPInvoiceGLLines(db *gorm.DB, pembelian models.Pembelian) ([]models.GL, error) {
	var glLines []models.GL

	log.Printf("[pembelian] GenerateAPInvoiceGLLines for %s", pembelian.NomorAPInvoice)

	// Get pemasok currency accounts
	currAccounts, err := getAccountsForSupplier(db, pembelian.SupplierID)
	if err != nil {
		return nil, fmt.Errorf("gagal mendapatkan akun mata uang pemasok: %w", err)
	}

	// Aggregate purchases by account (DEBIT)
	purchasesByAccount := make(map[string]float64)
	var totalDiscount float64

	for _, detail := range pembelian.Details {
		if detail.KodeItem == "" {
			continue
		}

		purchaseAccount, err := getPurchaseAccountByItem(db, detail.KodeItem)
		if err != nil {
			log.Printf("[pembelian] Warning: %v", err)
			continue
		}

		// Add to purchases (DEBIT)
		purchasesByAccount[purchaseAccount] += detail.Dpp
		totalDiscount += detail.DiscAmount
	}
	now := time.Now()
	// 1. DEBIT: Purchases/Inventory (per account)
	for account, amount := range purchasesByAccount {
		if amount > 0 {
			glLines = append(glLines, models.GL{
				Tanggal:        now,
				AkunTransaksi:  pembelian.NomorAPInvoice,
				Debit:          amount,
				Kredit:         0,
				Deskripsi:      fmt.Sprintf("Pembelian - %s", pembelian.NomorAPInvoice),
				NomorTransaksi: account,
				//Referensi:  fmt.Sprintf("AP-INV-%d", pembelian.ID),
			})
		}
	}

	// 2. DEBIT: Tax Input (PPN Masukan & other non-PPH taxes)
	taxByAccount := make(map[string]float64)
	var totalPPH float64

	for _, detail := range pembelian.Details {
		// detail.Tax is stored as datatypes.JSON; unmarshal to []string
		if len(detail.Tax) == 0 {
			continue
		}
		var taxCodes []string
		if err := json.Unmarshal(detail.Tax, &taxCodes); err != nil {
			log.Printf("[pembelian] Warning: failed to unmarshal tax JSON: %v", err)
			continue
		}

		for _, taxCode := range taxCodes {
			var pajak models.MasterPajak
			if err := db.Where("code = ?", taxCode).First(&pajak).Error; err != nil {
				log.Printf("[pembelian] Warning: pajak %s tidak ditemukan", taxCode)
				continue
			}

			dppFactor := parseDppFormula(pajak.DPPFormula)
			baseForTax := dppFactor * (detail.Qty*detail.Price - detail.DiscAmount)
			taxAmount := baseForTax * pajak.RatePercent / 100

			if strings.Contains(strings.ToLower(pajak.TaxType), "pph") {
				// PPH adalah CREDIT (pemasok yang bayar)
				totalPPH += taxAmount
			} else {
				// Non-PPH tax (PPN Masukan) adalah DEBIT
				account := pajak.PurchaseTaxAccount
				if account == "" {
					log.Printf("[pembelian] Warning: purchase_tax_account kosong untuk pajak %s", taxCode)
					continue
				}
				taxByAccount[account] += taxAmount
			}
		}
	}

	// Add tax DEBIT entries (PPN Masukan)
	for account, amount := range taxByAccount {
		if amount > 0 {
			glLines = append(glLines, models.GL{
				Tanggal:        pembelian.Tanggal,
				AkunTransaksi:  account,
				Deskripsi:      fmt.Sprintf("PPN Masukan - %s", pembelian.NomorAPInvoice),
				Debit:          amount,
				Kredit:         0,
				NomorTransaksi: pembelian.NomorAPInvoice,
				//Referensi:      fmt.Sprintf("AP-INV-%d", pembelian.ID),
			})
		}
	}

	// 3. DEBIT: Freight
	if pembelian.Freight > 0 && currAccounts.FreightAccount != "" {
		glLines = append(glLines, models.GL{
			Tanggal:        pembelian.Tanggal,
			AkunTransaksi:  currAccounts.FreightAccount,
			Deskripsi:      fmt.Sprintf("Freight - %s", pembelian.NomorAPInvoice),
			Debit:          pembelian.Freight,
			Kredit:         0,
			NomorTransaksi: pembelian.NomorAPInvoice,
			//Referensi:  fmt.Sprintf("AP-INV-%d", pembelian.ID),
		})
	}

	// 4. DEBIT: Stamp
	if pembelian.Stamp > 0 && currAccounts.StampAccount != "" {
		glLines = append(glLines, models.GL{
			Tanggal:        pembelian.Tanggal,
			AkunTransaksi:  currAccounts.StampAccount,
			Deskripsi:      fmt.Sprintf("Materai - %s", pembelian.NomorAPInvoice),
			Debit:          pembelian.Stamp,
			Kredit:         0,
			NomorTransaksi: pembelian.NomorAPInvoice,
			//Referensi:  fmt.Sprintf("AP-INV-%d", pembelian.ID),
		})
	}

	// 5. CREDIT: Discount
	if totalDiscount > 0 && currAccounts.DiscountAccount != "" {
		glLines = append(glLines, models.GL{
			Tanggal:        pembelian.Tanggal,
			AkunTransaksi:  currAccounts.DiscountAccount,
			Deskripsi:      fmt.Sprintf("Diskon Pembelian - %s", pembelian.NomorAPInvoice),
			Debit:          0,
			Kredit:         totalDiscount,
			NomorTransaksi: pembelian.NomorAPInvoice,
			//Referensi:  fmt.Sprintf("AP-INV-%d", pembelian.ID),
		})
	}

	// 6. CREDIT: PPH (pemasok yang bayar)
	if totalPPH > 0 {
		// Get PPH account from first PPH tax found
		var pphAccount string
		for _, detail := range pembelian.Details {
			var taxCodes []string
			if err := json.Unmarshal(detail.Tax, &taxCodes); err != nil {
				continue
			}
			for _, taxCode := range taxCodes {
				var pajak models.MasterPajak
				if err := db.Where("code = ?", taxCode).First(&pajak).Error; err == nil {
					if strings.Contains(strings.ToLower(pajak.TaxType), "pph") {
						pphAccount = pajak.PurchaseTaxAccount
						break
					}
				}
			}
			if pphAccount != "" {
				break
			}
		}

		if pphAccount != "" {
			glLines = append(glLines, models.GL{
				Tanggal:        pembelian.Tanggal,
				AkunTransaksi:  pphAccount,
				Deskripsi:      fmt.Sprintf("PPH - %s", pembelian.NomorAPInvoice),
				Debit:          0,
				Kredit:         totalPPH,
				NomorTransaksi: pembelian.NomorAPInvoice,
				//Referensi:  fmt.Sprintf("AP-INV-%d", pembelian.ID),
			})
		}
	}

	// 7. CREDIT: AP/Hutang Usaha (balancing)
	// AP = Purchases + TaxInputDebit + Freight + Stamp - Discount - PPH
	totalPurchases := 0.0
	for _, amount := range purchasesByAccount {
		totalPurchases += amount
	}

	totalTaxInput := 0.0
	for _, amount := range taxByAccount {
		totalTaxInput += amount
	}

	apAmount := totalPurchases + totalTaxInput + pembelian.Freight + pembelian.Stamp - totalDiscount - totalPPH

	if apAmount > 0 && currAccounts.PayableAccount != "" {
		glLines = append(glLines, models.GL{
			Tanggal:        pembelian.Tanggal,
			AkunTransaksi:  currAccounts.PayableAccount,
			NomorTransaksi: pembelian.NomorAPInvoice,
			Debit:          0,
			Kredit:         apAmount,
			Deskripsi:      fmt.Sprintf("Hutang Usaha - %s", pembelian.NomorAPInvoice),
			//Referensi:  fmt.Sprintf("AP-INV-%d", pembelian.ID),
		})
	}

	log.Printf("[pembelian] Generated %d GL lines for %s", len(glLines), pembelian.NomorAPInvoice)

	return glLines, nil
}
