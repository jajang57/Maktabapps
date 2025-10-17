package models

import "gorm.io/gorm"

type MasterPembeli struct {
	gorm.Model
	Kode           string  `gorm:"unique;not null" json:"kode"`
	Nama           string  `gorm:"not null" json:"nama"`
	JenisCustomer  string  `json:"jenisCustomer"`
	AlamatLengkap  string  `json:"alamatLengkap"`
	Kota           string  `json:"kota"`
	KodePos        string  `json:"kodePos"`
	Telepon        string  `json:"telepon"`
	Email          string  `json:"email"`
	NamaBank       string  `json:"namaBank"`
	NomorRekening  string  `json:"nomorRekening"`
	AtasNama       string  `json:"atasNama"`
	NPWP           string  `json:"npwp"`
	ContactPerson  string  `json:"contactPerson"`
	TeleponCP      string  `json:"teleponCP"`
	TermPembayaran int     `json:"termPembayaran"`
	LimitKredit    int64   `json:"limitKredit"`
	Diskon         float32 `json:"diskon"`
	KategoriHarga  string  `json:"kategoriHarga"`
	Status         string  `json:"status"`
	Keterangan     string  `json:"keterangan"`
	MataUang       string  `json:"mata_uang"`
}

func (MasterPembeli) TableName() string {
	return "master_pembeli"
}
