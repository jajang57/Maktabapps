package models

import (
	"time"

	"gorm.io/gorm"
)

type MasterKategori struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Kode      string         `json:"kode" gorm:"uniqueIndex;not null"`
	Nama      string         `json:"nama" gorm:"not null"`
	Aktif     bool           `json:"aktif" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

func (MasterKategori) TableName() string {
	return "master_kategori"
}
