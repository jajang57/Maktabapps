package models

import (
	"time"
)

type InputTransaksi struct {
	ID            uint      `json:"id"`
	NoTransaksi   string    `json:"noTransaksi"`
	CoaAkunBank   string    `json:"coaAkunBank"`
	Tanggal       time.Time `json:"tanggal"`
	AkunTransaksi string    `json:"akunTransaksi"`
	Deskripsi     string    `json:"deskripsi"`
	ProjectNo     string    `json:"projectNo"`
	ProjectName   string    `json:"projectName"`
	Debit         float64   `json:"debit"`
	Kredit        float64   `json:"kredit"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}
