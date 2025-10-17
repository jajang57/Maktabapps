package models

type MasterDepartement struct {
	ID    uint   `gorm:"primaryKey" json:"id"`
	Kode  string `gorm:"unique;not null" json:"kode"`
	Nama  string `gorm:"not null" json:"nama"`
	Aktif bool   `gorm:"default:true" json:"aktif"`
}
