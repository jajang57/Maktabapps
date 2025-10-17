package models

import (
	"time"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// Pembelian represents AP Invoice (Account Payable Invoice) header
type Pembelian struct {
	ID              uint      `json:"id" gorm:"primaryKey;autoIncrement"`
	NomorAPInvoice  string    `json:"nomorapinvoice" gorm:"column:nomor_ap_invoice;uniqueIndex;not null"`
	Tanggal         time.Time `json:"tanggal" gorm:"not null"`
	TanggalStr      string    `json:"tanggalStr" gorm:"-"` // For JSON parsing, not stored in DB
	DeliveryDate    time.Time `json:"deliveryDate" gorm:"column:delivery_date"`
	DeliveryDateStr string    `json:"deliveryDateStr" gorm:"-"` // For JSON parsing, not stored in DB

	// Supplier Info
	SupplierID uint           `json:"supplierId" gorm:"column:supplier_id;not null"`
	Supplier   *MasterPemasok `json:"supplier,omitempty" gorm:"foreignKey:SupplierID;references:ID"`

	// Warehouse & Department
	GudangID      uint               `json:"gudangId" gorm:"column:gudang_id"`
	Gudang        *MasterGudang      `json:"gudang,omitempty" gorm:"foreignKey:GudangID;references:ID"`
	DepartementID uint               `json:"departementId" gorm:"column:departement_id"`
	Departement   *MasterDepartement `json:"departement,omitempty" gorm:"foreignKey:DepartementID;references:ID"`

	// Reference Info
	NomorRefSupplier string `json:"nomorRefSupplier" gorm:"column:nomor_ref_supplier"`
	Notes            string `json:"notes" gorm:"type:text"`

	// Financial Totals
	Subtotal   float64 `json:"subtotal" gorm:"type:decimal(15,2);default:0"`
	PPNMasukan float64 `json:"ppnMasukan" gorm:"column:ppn_masukan;type:decimal(15,2);default:0"` // Input VAT
	Freight    float64 `json:"freight" gorm:"type:decimal(15,2);default:0"`
	Stamp      float64 `json:"stamp" gorm:"type:decimal(15,2);default:0"`
	Total      float64 `json:"total" gorm:"type:decimal(15,2);default:0"`

	// Tax Amounts (Multi-tax support)
	TaxAmount1 float64 `json:"taxamount1" gorm:"column:tax_amount_1;type:decimal(15,2);default:0"`
	TaxAmount2 float64 `json:"taxamount2" gorm:"column:tax_amount_2;type:decimal(15,2);default:0"`
	TaxAmount3 float64 `json:"taxamount3" gorm:"column:tax_amount_3;type:decimal(15,2);default:0"`

	// Status & Audit - ✅ Ubah dari enum ke varchar
	Status    string         `json:"status" gorm:"type:varchar(20);default:'draft';check:status IN ('draft','approved','received','paid')"`
	CreatedAt time.Time      `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updatedAt" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Details []PembelianDetail `json:"details" gorm:"foreignKey:PembelianID;constraint:OnDelete:CASCADE"`
}

// TableName sets the table name for Pembelian model
func (Pembelian) TableName() string {
	return "pembelians"
}

// PembelianDetail represents AP Invoice detail/line items
type PembelianDetail struct {
	ID          uint `json:"ID" gorm:"primaryKey;autoIncrement"` // Capital ID for frontend compatibility
	PembelianID uint `json:"pembelianId" gorm:"column:pembelian_id;not null"`

	// Item Info
	KodeItem string `json:"KodeItem" gorm:"column:kode_item;not null"` // Capital K for frontend compatibility
	NamaItem string `json:"NamaItem" gorm:"column:nama_item;not null"` // Capital N for frontend compatibility

	// Quantity & Price
	Qty   float64 `json:"qty" gorm:"type:decimal(15,4);not null"`
	Unit  string  `json:"unit" gorm:"size:50"`
	Price float64 `json:"price" gorm:"type:decimal(15,2);not null"` // Purchase price (hargaBeli)

	// Discount Info
	DiscPercent    float64 `json:"discPercent" gorm:"column:disc_percent;type:decimal(5,2);default:0"`
	DiscAmountItem float64 `json:"discAmountItem" gorm:"column:disc_amount_item;type:decimal(15,2);default:0"`
	DiscAmount     float64 `json:"discAmount" gorm:"column:disc_amount;type:decimal(15,2);default:0"`

	// Tax Info (Multi-tax support)
	// Stored as JSON in the database to support multiple tax codes per line
	Tax        datatypes.JSON `json:"tax" gorm:"type:jsonb"`
	TaxAmount1 float64        `json:"taxamount1" gorm:"column:tax_amount_1;type:decimal(15,2);default:0"`
	TaxAmount2 float64        `json:"taxamount2" gorm:"column:tax_amount_2;type:decimal(15,2);default:0"`
	TaxAmount3 float64        `json:"taxamount3" gorm:"column:tax_amount_3;type:decimal(15,2);default:0"`

	// Financial Calculations
	Dpp    float64 `json:"dpp" gorm:"type:decimal(15,2);default:0"`    // Dasar Pengenaan Pajak
	Amount float64 `json:"amount" gorm:"type:decimal(15,2);default:0"` // Total line amount

	// Warehouse assignment for this item
	GudangId uint          `json:"gudangId" gorm:"column:gudang_id"`
	Gudang   *MasterGudang `json:"gudang,omitempty" gorm:"foreignKey:GudangId;references:ID"`

	// Audit
	CreatedAt time.Time      `json:"createdAt" gorm:"autoCreateTime"`
	UpdatedAt time.Time      `json:"updatedAt" gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	// Relations
	Pembelian *Pembelian `json:"-" gorm:"foreignKey:PembelianID;references:ID"`
}

// TableName sets the table name for PembelianDetail model
func (PembelianDetail) TableName() string {
	return "pembelian_details"
}

// BeforeCreate hook untuk validasi sebelum create
func (p *Pembelian) BeforeCreate(tx *gorm.DB) error {
	// Validate required fields
	if p.NomorAPInvoice == "" {
		return gorm.ErrInvalidField
	}
	if p.SupplierID == 0 {
		return gorm.ErrInvalidField
	}

	// Set default status if empty
	if p.Status == "" {
		p.Status = "draft"
	}

	return nil
}

// BeforeCreate hook untuk PembelianDetail
func (pd *PembelianDetail) BeforeCreate(tx *gorm.DB) error {
	// Validate required fields
	if pd.KodeItem == "" {
		return gorm.ErrInvalidField
	}
	if pd.Qty <= 0 {
		return gorm.ErrInvalidField
	}
	if pd.Price <= 0 {
		return gorm.ErrInvalidField
	}

	return nil
}

// CalculateAmounts method untuk recalculate amounts
func (pd *PembelianDetail) CalculateAmounts() {
	// Calculate gross amount
	grossAmount := pd.Qty * pd.Price

	// Calculate discount amount if percentage given
	if pd.DiscPercent > 0 && pd.DiscAmountItem == 0 {
		pd.DiscAmountItem = grossAmount * pd.DiscPercent / 100
	}

	// Total discount (item level + additional)
	totalDiscount := pd.DiscAmountItem + pd.DiscAmount

	// DPP (after discount)
	pd.Dpp = grossAmount - totalDiscount

	// Final amount (DPP + taxes)
	pd.Amount = pd.Dpp + pd.TaxAmount1 + pd.TaxAmount2 + pd.TaxAmount3
}

// CalculateTotals method untuk recalculate header totals from details
func (p *Pembelian) CalculateTotals() {
	var subtotal, tax1, tax2, tax3 float64

	for _, detail := range p.Details {
		subtotal += detail.Dpp
		tax1 += detail.TaxAmount1
		tax2 += detail.TaxAmount2
		tax3 += detail.TaxAmount3
	}

	p.Subtotal = subtotal
	p.TaxAmount1 = tax1
	p.TaxAmount2 = tax2
	p.TaxAmount3 = tax3
	p.PPNMasukan = tax1 // Assume tax1 is PPN Masukan
	p.Total = subtotal + tax1 + tax2 + tax3 + p.Freight + p.Stamp
}

// GetStatusOptions returns available status options
func GetPembelianStatusOptions() []string {
	return []string{"draft", "approved", "received", "paid"}
}

// IsEditable checks if pembelian can be edited based on status
func (p *Pembelian) IsEditable() bool {
	return p.Status == "draft"
}

// IsDeletable checks if pembelian can be deleted based on status
func (p *Pembelian) IsDeletable() bool {
	return p.Status == "draft"
}

// GetTotalItemCount returns total count of items in details
func (p *Pembelian) GetTotalItemCount() int {
	return len(p.Details)
}

// GetTotalQuantity returns total quantity across all items
func (p *Pembelian) GetTotalQuantity() float64 {
	var totalQty float64
	for _, detail := range p.Details {
		totalQty += detail.Qty
	}
	return totalQty
}

// GetTotalDiscount returns total discount amount across all items
func (p *Pembelian) GetTotalDiscount() float64 {
	var totalDiscount float64
	for _, detail := range p.Details {
		totalDiscount += detail.DiscAmountItem + detail.DiscAmount
	}
	return totalDiscount
}

// Validation struct untuk request validation
type PembelianRequest struct {
	NomorAPInvoice   string                   `json:"nomorapinvoice" binding:"required"`
	TanggalStr       string                   `json:"tanggalStr"`
	DeliveryDateStr  string                   `json:"deliveryDateStr"`
	SupplierID       uint                     `json:"supplierId" binding:"required,min=1"`
	GudangID         uint                     `json:"gudangId"`
	DepartementID    uint                     `json:"departementId"`
	NomorRefSupplier string                   `json:"nomorRefSupplier"`
	Notes            string                   `json:"notes"`
	Freight          float64                  `json:"freight" binding:"min=0"`
	Stamp            float64                  `json:"stamp" binding:"min=0"`
	Status           string                   `json:"status"`
	Details          []PembelianDetailRequest `json:"details" binding:"required,min=1"`
}

type PembelianDetailRequest struct {
	KodeItem       string   `json:"KodeItem" binding:"required"`
	NamaItem       string   `json:"NamaItem" binding:"required"`
	Qty            float64  `json:"qty" binding:"required,gt=0"`
	Unit           string   `json:"unit"`
	Price          float64  `json:"price" binding:"required,gt=0"`
	DiscPercent    float64  `json:"discPercent" binding:"min=0,max=100"`
	DiscAmountItem float64  `json:"discAmountItem" binding:"min=0"`
	DiscAmount     float64  `json:"discAmount" binding:"min=0"`
	Tax            []string `json:"tax"`
	GudangId       uint     `json:"gudangId"`
}

// Response struct untuk API response
type PembelianResponse struct {
	ID             uint                      `json:"id"`
	NomorAPInvoice string                    `json:"nomorapinvoice"`
	Tanggal        string                    `json:"tanggal"`
	DeliveryDate   string                    `json:"deliveryDate"`
	SupplierID     uint                      `json:"supplierId"`
	SupplierNama   string                    `json:"supplierNama"`
	Total          float64                   `json:"total"`
	Status         string                    `json:"status"`
	Details        []PembelianDetailResponse `json:"details,omitempty"`
}

type PembelianDetailResponse struct {
	ID       uint    `json:"ID"`
	KodeItem string  `json:"KodeItem"`
	NamaItem string  `json:"NamaItem"`
	Qty      float64 `json:"qty"`
	Unit     string  `json:"unit"`
	Price    float64 `json:"price"`
	Amount   float64 `json:"amount"`
}
