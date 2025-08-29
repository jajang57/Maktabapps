package handlers

import (
	"fmt"
	"net/http"
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

	// Hitung total dari detail
	var subtotal, ppn float64
	for i := range req.Details {
		subtotal += req.Details[i].Qty * req.Details[i].Price
		disc := (req.Details[i].Qty * req.Details[i].Price * req.Details[i].DiscPercent / 100) + req.Details[i].DiscAmountItem
		afterDisc := (req.Details[i].Qty * req.Details[i].Price) - disc
		ppn += afterDisc * req.Details[i].Tax / 100
	}
	req.Subtotal = subtotal
	req.PPN = ppn
	req.Total = subtotal + ppn + req.Freight + req.Stamp

	// Simpan header + detail (relasi)
	if err := h.DB.Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan penjualan", "details": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, req)
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

// Update Penjualan
func (h *PenjualanHandler) UpdatePenjualan(c *gin.Context) {
	id := c.Param("id")
	var req models.Penjualan
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var penjualan models.Penjualan
	if err := h.DB.Preload("Details").First(&penjualan, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Data tidak ditemukan"})
		return
	}

	// Update header
	penjualan.NomorInvoice = req.NomorInvoice
	penjualan.Tanggal = req.Tanggal
	penjualan.DueDate = req.DueDate
	penjualan.CustomerID = req.CustomerID
	penjualan.GudangID = req.GudangID
	penjualan.DepartementID = req.DepartementID
	penjualan.NomorEfaktur = req.NomorEfaktur
	penjualan.Notes = req.Notes
	penjualan.Freight = req.Freight
	penjualan.Stamp = req.Stamp
	penjualan.Status = req.Status

	// Hitung ulang total
	var subtotal, ppn float64
	for i := range req.Details {
		subtotal += req.Details[i].Qty * req.Details[i].Price
		disc := (req.Details[i].Qty * req.Details[i].Price * req.Details[i].DiscPercent / 100) + req.Details[i].DiscAmountItem
		afterDisc := (req.Details[i].Qty * req.Details[i].Price) - disc
		ppn += afterDisc * req.Details[i].Tax / 100
	}
	penjualan.Subtotal = subtotal
	penjualan.PPN = ppn
	penjualan.Total = subtotal + ppn + req.Freight + req.Stamp

	// Transaction: update header, hapus detail lama, insert detail baru
	tx := h.DB.Begin()
	if err := tx.Save(&penjualan).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal update header"})
		return
	}
	if err := tx.Where("penjualan_id = ?", penjualan.ID).Delete(&models.PenjualanDetail{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus detail lama"})
		return
	}
	for i := range req.Details {
		req.Details[i].PenjualanID = penjualan.ID
	}
	if err := tx.Create(&req.Details).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal simpan detail baru"})
		return
	}
	tx.Commit()

	c.JSON(http.StatusOK, penjualan)
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
	if err := tx.Where("penjualan_id = ?", penjualan.ID).Delete(&models.PenjualanDetail{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal hapus detail"})
		return
	}
	if err := tx.Delete(&penjualan).Error; err != nil {
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
