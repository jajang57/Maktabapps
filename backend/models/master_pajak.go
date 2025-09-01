package models

import (
	"time"

	"gorm.io/gorm"
)

type MasterPajak struct {
	ID                 uint           `json:"id" gorm:"primaryKey"`
	TaxName            string         `json:"tax_name" gorm:"not null"`
	RatePercent        float64        `json:"rate_percent" gorm:"not null"`
	Code               string         `json:"code" gorm:"not null"`
	Description        string         `json:"description"`
	SalesTaxAccount    string         `json:"sales_tax_account"`
	PurchaseTaxAccount string         `json:"purchase_tax_account"`
	Order              int            `json:"order" gorm:"column:order"`
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	DeletedAt          gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

func (MasterPajak) TableName() string {
	return "master_pajak"
}
