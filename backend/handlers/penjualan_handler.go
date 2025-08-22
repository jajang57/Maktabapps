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
	db *gorm.DB
}

func NewPenjualanHandler(db *gorm.DB) *PenjualanHandler {
	return &PenjualanHandler{db: db}
}

// GetAllPenjualan retrieves all penjualan records
func (h *PenjualanHandler) GetAllPenjualan(c *gin.Context) {
	var penjualan []models.Penjualan

	// Preload items untuk mendapatkan detail items
	if err := h.db.Preload("Items").Find(&penjualan).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch penjualan data"})
		return
	}

	c.JSON(http.StatusOK, penjualan)
}

// GetPenjualanByID retrieves a single penjualan by ID
func (h *PenjualanHandler) GetPenjualanByID(c *gin.Context) {
	id := c.Param("id")
	var penjualan models.Penjualan

	if err := h.db.Preload("Items").First(&penjualan, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Penjualan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch penjualan"})
		return
	}

	c.JSON(http.StatusOK, penjualan)
}

// CreatePenjualan creates a new penjualan record
func (h *PenjualanHandler) CreatePenjualan(c *gin.Context) {
	var penjualan models.Penjualan

	if err := c.ShouldBindJSON(&penjualan); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON data", "details": err.Error()})
		return
	}

	// Validasi data required
	if penjualan.NomorInvoice == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Nomor invoice is required"})
		return
	}

	if penjualan.Customer == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer is required"})
		return
	}

	// Parse tanggal jika diberikan sebagai string
	if penjualan.Tanggal.IsZero() {
		penjualan.Tanggal = time.Now()
	}

	// Calculate total dari items
	var total float64
	for _, item := range penjualan.Items {
		total += item.Amount
	}
	penjualan.Total = total

	// Mulai transaction
	tx := h.db.Begin()

	// Buat penjualan record
	if err := tx.Create(&penjualan).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create penjualan", "details": err.Error()})
		return
	}

	tx.Commit()

	// Fetch data lengkap dengan items
	h.db.Preload("Items").First(&penjualan, penjualan.ID)

	c.JSON(http.StatusCreated, penjualan)
}

// UpdatePenjualan updates an existing penjualan record
func (h *PenjualanHandler) UpdatePenjualan(c *gin.Context) {
	id := c.Param("id")
	var penjualan models.Penjualan

	// Cek apakah penjualan exists
	if err := h.db.Preload("Items").First(&penjualan, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Penjualan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch penjualan"})
		return
	}

	var updateData models.Penjualan
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON data", "details": err.Error()})
		return
	}

	// Mulai transaction
	tx := h.db.Begin()

	// Hapus items lama
	if err := tx.Where("penjualan_id = ?", penjualan.ID).Delete(&models.PenjualanItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete old items"})
		return
	}

	// Update penjualan data
	penjualan.NomorInvoice = updateData.NomorInvoice
	penjualan.Tanggal = updateData.Tanggal
	penjualan.Customer = updateData.Customer
	penjualan.Alamat = updateData.Alamat
	penjualan.NoTelp = updateData.NoTelp
	penjualan.TermPembayaran = updateData.TermPembayaran
	penjualan.JatuhTempo = updateData.JatuhTempo
	penjualan.Keterangan = updateData.Keterangan
	penjualan.Status = updateData.Status

	// Calculate total dari items baru
	var total float64
	for i := range updateData.Items {
		updateData.Items[i].PenjualanID = penjualan.ID
		total += updateData.Items[i].Amount
	}
	penjualan.Total = total

	// Update penjualan
	if err := tx.Save(&penjualan).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update penjualan"})
		return
	}

	// Create items baru
	if len(updateData.Items) > 0 {
		if err := tx.Create(&updateData.Items).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create new items"})
			return
		}
	}

	tx.Commit()

	// Fetch data lengkap dengan items
	h.db.Preload("Items").First(&penjualan, penjualan.ID)

	c.JSON(http.StatusOK, penjualan)
}

// DeletePenjualan soft deletes a penjualan record
func (h *PenjualanHandler) DeletePenjualan(c *gin.Context) {
	id := c.Param("id")
	var penjualan models.Penjualan

	// Cek apakah penjualan exists
	if err := h.db.First(&penjualan, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Penjualan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch penjualan"})
		return
	}

	// Mulai transaction
	tx := h.db.Begin()

	// Soft delete items
	if err := tx.Where("penjualan_id = ?", penjualan.ID).Delete(&models.PenjualanItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete penjualan items"})
		return
	}

	// Soft delete penjualan
	if err := tx.Delete(&penjualan).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete penjualan"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Penjualan deleted successfully"})
}

// HardDeletePenjualan permanently deletes a penjualan record
func (h *PenjualanHandler) HardDeletePenjualan(c *gin.Context) {
	id := c.Param("id")
	var penjualan models.Penjualan

	// Cek apakah penjualan exists (termasuk yang soft deleted)
	if err := h.db.Unscoped().First(&penjualan, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Penjualan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch penjualan"})
		return
	}

	// Mulai transaction
	tx := h.db.Begin()

	// Hard delete items
	if err := tx.Unscoped().Where("penjualan_id = ?", penjualan.ID).Delete(&models.PenjualanItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to permanently delete penjualan items"})
		return
	}

	// Hard delete penjualan
	if err := tx.Unscoped().Delete(&penjualan).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to permanently delete penjualan"})
		return
	}

	tx.Commit()

	c.JSON(http.StatusOK, gin.H{"message": "Penjualan permanently deleted successfully"})
}

// GetPenjualanByNomor retrieves penjualan by nomor invoice
func (h *PenjualanHandler) GetPenjualanByNomor(c *gin.Context) {
	nomor := c.Param("nomor")
	var penjualan models.Penjualan

	if err := h.db.Preload("Items").Where("nomor_invoice = ?", nomor).First(&penjualan).Error; err != nil {
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
	if err := h.db.First(&penjualan, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Penjualan not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch penjualan"})
		return
	}

	// Update status
	if err := h.db.Model(&penjualan).Update("status", statusData.Status).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update status"})
		return
	}

	// Fetch updated data
	h.db.Preload("Items").First(&penjualan, penjualan.ID)

	c.JSON(http.StatusOK, penjualan)
}

// GetPenjualanReport generates report data for penjualan
func (h *PenjualanHandler) GetPenjualanReport(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	status := c.Query("status")

	query := h.db.Preload("Items")

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
	h.db.Model(&models.Penjualan{}).Where("nomor_invoice LIKE ?", prefix+"%").Count(&count)

	nextNumber := fmt.Sprintf("%s%03d", prefix, count+1)

	c.JSON(http.StatusOK, gin.H{
		"next_invoice_number": nextNumber,
	})
}
