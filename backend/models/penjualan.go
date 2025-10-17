package models

import (
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"
)

type Penjualan struct {
	ID            uint   `json:"id" gorm:"primaryKey"`
	NomorInvoice  string `json:"nomorInvoice" gorm:"uniqueIndex;not null"`
	TanggalStr    string `json:"tanggal"` // frontend kirim sebagai string
	DueDateStr    string `json:"dueDate"` // frontend kirim sebagai string
	Tanggal       time.Time
	DueDate       time.Time         // untuk binding dari frontend
	CustomerID    uint              `json:"customerId"`
	GudangID      uint              `json:"gudangId"`
	DepartementID uint              `json:"departementId"`
	NomorEfaktur  string            `json:"nomorEfaktur"`
	Notes         string            `json:"notes" gorm:"type:text"`
	Subtotal      float64           `json:"subtotal"`
	PPN           float64           `json:"ppn"`
	Freight       float64           `json:"freight"`
	Stamp         float64           `json:"stamp"`
	Total         float64           `json:"total"`
	Status        string            `json:"status"`
	TaxAmount1    float64           `json:"taxamount1"`
	TaxAmount2    float64           `json:"taxamount2"`
	TaxAmount3    float64           `json:"taxamount3"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
	DeletedAt     gorm.DeletedAt    `json:"deleted_at" gorm:"index"`
	Details       []PenjualanDetail `json:"details" gorm:"foreignKey:PenjualanID"`
}

func (Penjualan) TableName() string {
	return "penjualan"
}

type PenjualanDetail struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	PenjualanID    uint           `json:"penjualanId"`
	KodeItem       string         `json:"kodeItem"`
	NamaItem       string         `json:"namaItem"`
	Qty            float64        `json:"qty"`
	Unit           string         `json:"unit"`
	Price          float64        `json:"price"`
	DiscPercent    float64        `json:"discPercent"`
	DiscAmountItem float64        `json:"discAmountItem"`
	DiscAmount     float64        `json:"discAmount"`
	Tax            pq.StringArray `json:"tax" gorm:"type:text[]"` // array kode pajak, dukung PostgreSQL
	GudangID       uint           `json:"gudangId"`               // field gudang di detail barang/jasa
	TaxAmount1     float64        `json:"taxamount1"`
	TaxAmount2     float64        `json:"taxamount2"`
	TaxAmount3     float64        `json:"taxamount3"`
	Dpp            float64        `json:"dpp"`
	Amount         float64        `json:"amount"`
}

func (PenjualanDetail) TableName() string {
	return "penjualan_detail"
}
