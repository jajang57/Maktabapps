package models

import "gorm.io/gorm"

type MasterGudang struct {
	gorm.Model
	ID              uint   `gorm:"primaryKey" json:"id"`
	Kode            string `json:"kode" gorm:"unique;not null"`
	Nama            string `json:"nama" gorm:"not null"`
	Group           string `json:"group" gorm:"not null"`
	Departement     string `json:"departement" gorm:"not null"`
	Deskripsi       string `json:"deskripsi"`
	Alamat          string `json:"alamat" gorm:"not null"`
	PenanggungJawab string `json:"penanggungJawab" gorm:"not null"`
}

func (MasterGudang) TableName() string {
	return "master_gudang"
}
