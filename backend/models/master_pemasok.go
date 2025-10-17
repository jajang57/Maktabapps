package models

import "gorm.io/gorm"

type MasterPemasok struct {
	gorm.Model
	Kode           string `gorm:"unique;not null" json:"kode"`
	Nama           string `gorm:"not null" json:"nama"`
	JenisUsaha     string `json:"jenisUsaha"`
	Alamat         string `json:"alamat"`
	Kota           string `json:"kota"`
	Provinsi       string `json:"provinsi"`
	KodePos        string `json:"kodePos"`
	Negara         string `json:"negara"`
	Telepon        string `json:"telepon"`
	Fax            string `json:"fax"`
	Email          string `json:"email"`
	Website        string `json:"website"`
	NPWP           string `json:"npwp"`
	ContactPerson  string `json:"contactPerson"`
	JabatanContact string `json:"jabatanContact"`
	TeleponContact string `json:"teleponContact"`
	EmailContact   string `json:"emailContact"`
	Bank           string `json:"bank"`
	NoRekening     string `json:"noRekening"`
	NamaRekening   string `json:"namaRekening"`
	TermPembayaran string `json:"termPembayaran"`
	LimitKredit    int64  `json:"limitKredit"`
	MataUang       string `json:"mata_uang"`
	Status         string `json:"status"`
	Keterangan     string `json:"keterangan"`
}
