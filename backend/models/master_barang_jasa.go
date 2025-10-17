package models

import (
	"time"

	"gorm.io/gorm"
)

type MasterBarangJasa struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Kode         string         `json:"kode" gorm:"uniqueIndex;not null"`
	Nama         string         `json:"nama" gorm:"not null"`
	Jenis        string         `json:"jenis" gorm:"not null"` // BARANG atau JASA
	KelompokItem string         `json:"kelompokItem"`
	Kategori     string         `json:"kategori"`
	Satuan       string         `json:"satuan"`
	HargaBeli    float64        `json:"hargaBeli" gorm:"default:0"`
	HargaJual    float64        `json:"hargaJual" gorm:"default:0"`
	StokMinimal  int            `json:"stokMinimal" gorm:"default:0"`
	Deskripsi    string         `json:"deskripsi" gorm:"type:text"`
	DiJual       bool           `json:"diJual" gorm:"default:true"`
	DiBeli       bool           `json:"diBeli" gorm:"default:true"`
	Image        string         `json:"image" gorm:"type:text"` // Base64 encoded image
	Aktif        bool           `json:"aktif" gorm:"default:true"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`
	// Akun GL
	AkunPersediaan      string `json:"akunPersediaan"`
	AkunPenjualan       string `json:"akunPenjualan"`
	AkunReturPenjualan  string `json:"akunReturPenjualan"`
	AkunDiskonPenjualan string `json:"akunDiskonPenjualan"`
	AkunHPP             string `json:"akunHPP"`
	AkunReturPembelian  string `json:"akunReturPembelian"`
	AkunDiskonKhusus    string `json:"akunDiskonKhusus"`
	AkunPembelian       string `json:"akunPembelian"`
}

func (MasterBarangJasa) TableName() string {
	return "master_barang_jasa"
}
