package models

type MasterCOA struct {
	ID                  uint              `json:"id" gorm:"primaryKey"`
	Kode                string            `json:"kode" gorm:"uniqueIndex"`
	Nama                string            `json:"nama"`
	MasterCategoryCOAID uint              `json:"masterCategoryCOAId"` // foreign key
	MasterCategoryCOA   MasterCategoryCOA `json:"masterCategoryCOA" gorm:"foreignKey:MasterCategoryCOAID"`
	SaldoAwal           float64           `json:"saldoAwal"` // Tambahkan ini
}

// TableName override
func (MasterCOA) TableName() string {
	return "master_coa"
}
