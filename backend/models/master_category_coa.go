package models

type MasterCategoryCOA struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	Kode      string `json:"kode" gorm:"unique;not null"`
	Nama      string `json:"nama"`
	TipeAkun  string `json:"tipeAkun"`
	IsKasBank bool   `json:"isKasBank"`
}

func (MasterCategoryCOA) TableName() string {
	return "master_category_coa"
}
