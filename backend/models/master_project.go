package models

import (
	"time"
)

type MasterProject struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	KodeProject string    `json:"kode_project" gorm:"column:kode_project;unique;not null"`
	NamaProject string    `json:"nama_project" gorm:"column:nama_project;not null"`
	CreatedAt   time.Time `json:"created_at"` // ✅ Pastikan ada json tag!
	UpdatedAt   time.Time `json:"updated_at"` // ✅ Pastikan ada json tag!
}
