package models

type Jurnal struct {
	ID        uint   `json:"id" gorm:"primaryKey"`
	NoBukti   string `json:"noBukti"`
	Tanggal   string `json:"tanggal"`
	Deskripsi string `json:"deskripsi"`
}
