package models

import (
	"time"

	"gorm.io/gorm"
)

type MasterMataUang struct {
	ID                         uint           `json:"id" gorm:"primaryKey"`
	Kode                       string         `json:"kode" gorm:"uniqueIndex;not null"`
	Nama                       string         `json:"nama" gorm:"not null"`
	Simbol                     string         `json:"simbol" gorm:"not null"`
	Kurs                       float64        `json:"kurs" gorm:"not null"`
	Aktif                      bool           `json:"aktif" gorm:"default:true"`
	HutangUsaha                string         `json:"HutangUsaha"`
	PiutangUsaha               string         `json:"PiutangUsaha"`
	UangMukaBeli               string         `json:"UangMukaBeli"`
	UangMukaJual               string         `json:"UangMukaJual"`
	DiskonJual                 string         `json:"DiskonJual"`
	DiskonBeli                 string         `json:"DiskonBeli"`
	Pembulatan                 string         `json:"Pembulatan"`
	KeuntunganDirealisasi      string         `json:"KeuntunganDirealisasi"`
	KeuntunganBelumDirealisasi string         `json:"KeuntunganBelumDirealisasi"`
	HutangJatuhTempo           string         `json:"HutangJatuhTempo"`
	PiutangJatuhTempo          string         `json:"PiutangJatuhTempo"`
	BiayaLainLain              string         `json:"BiayaLainLain"`
	BiayaMaterai               string         `json:"BiayaMaterai"`
	CreatedAt                  time.Time      `json:"created_at"`
	UpdatedAt                  time.Time      `json:"updated_at"`
	DeletedAt                  gorm.DeletedAt `json:"deleted_at" gorm:"index"` // Soft delete
}

func (MasterMataUang) TableName() string {
	return "master_mata_uang"
}
