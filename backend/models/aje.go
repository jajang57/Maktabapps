package models

type AJE struct {
	ID          uint    `json:"id" gorm:"primaryKey"`
	Tanggal     string  `json:"tanggal"`
	NoBukti     string  `json:"noBukti" gorm:"index"`
	KodeAkun    string  `json:"kodeAkun"`
	NamaAkun    string  `json:"namaAkun"`
	Debit       float64 `json:"debit"`
	Kredit      float64 `json:"kredit"`
	Deskripsi   string  `json:"deskripsi"`
	Posted      bool    `json:"posted" gorm:"default:false"`
	ProjectNo   string  `json:"projectNo"` // <-- harus ada
	ProjectName string  `json:"projectName"`
}
