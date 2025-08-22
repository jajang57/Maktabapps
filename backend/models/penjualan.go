package models

import (
	"time"

	"gorm.io/gorm"
)

type Penjualan struct {
	ID             uint            `json:"id" gorm:"primaryKey"`
	NomorInvoice   string          `json:"nomorInvoice" gorm:"type:varchar(50);uniqueIndex;not null"`
	Tanggal        time.Time       `json:"tanggal" gorm:"not null"`
	Customer       string          `json:"customer" gorm:"type:varchar(255);not null"`
	Alamat         string          `json:"alamat" gorm:"type:text"`
	NoTelp         string          `json:"noTelp" gorm:"type:varchar(20)"`
	TermPembayaran string          `json:"termPembayaran" gorm:"type:varchar(50)"`
	JatuhTempo     *time.Time      `json:"jatuhTempo"`
	Keterangan     string          `json:"keterangan" gorm:"type:text"`
	Total          float64         `json:"total" gorm:"type:decimal(15,2);default:0"`
	Status         string          `json:"status" gorm:"type:varchar(20);default:'draft'"`
	Items          []PenjualanItem `json:"items" gorm:"foreignKey:PenjualanID;constraint:OnDelete:CASCADE"`
	CreatedAt      time.Time       `json:"createdAt"`
	UpdatedAt      time.Time       `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt  `json:"deletedAt" gorm:"index"`
}

type PenjualanItem struct {
	ID             uint           `json:"id" gorm:"primaryKey"`
	PenjualanID    uint           `json:"penjualanId" gorm:"not null"`
	ItemNo         string         `json:"itemNo" gorm:"type:varchar(50)"`
	Description    string         `json:"description" gorm:"type:varchar(255);not null"`
	Qty            float64        `json:"qty" gorm:"type:decimal(10,2);not null"`
	Unit           string         `json:"unit" gorm:"type:varchar(20)"`
	UnitPrice      float64        `json:"unitPrice" gorm:"type:decimal(15,2);not null"`
	DiscPercent    float64        `json:"discPercent" gorm:"type:decimal(5,2);default:0"`
	DiscAmountItem float64        `json:"discAmountItem" gorm:"type:decimal(15,2);default:0"`
	DiscAmount     float64        `json:"discAmount" gorm:"type:decimal(15,2);default:0"`
	Tax            float64        `json:"tax" gorm:"type:decimal(5,2);default:0"`
	Amount         float64        `json:"amount" gorm:"type:decimal(15,2);not null"`
	CreatedAt      time.Time      `json:"createdAt"`
	UpdatedAt      time.Time      `json:"updatedAt"`
	DeletedAt      gorm.DeletedAt `json:"deletedAt" gorm:"index"`
}

// TableName sets the table name for Penjualan model
func (Penjualan) TableName() string {
	return "penjualan"
}

// TableName sets the table name for PenjualanItem model
func (PenjualanItem) TableName() string {
	return "penjualan_items"
}
