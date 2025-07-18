package models

type GLSummary struct {
	ID            uint    `gorm:"primaryKey" json:"id"`
	AkunTransaksi string  `gorm:"index" json:"akunTransaksi"`
	Tahun         int     `gorm:"index" json:"tahun"`
	Bulan         int     `gorm:"index" json:"bulan"`
	TotalDebit    float64 `json:"totalDebit"`
	TotalKredit   float64 `json:"totalKredit"`
}

func (GLSummary) TableName() string {
	return "gl_summary"
}
