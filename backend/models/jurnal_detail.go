package models

type JurnalDetail struct {
	ID         uint    `json:"id" gorm:"primaryKey"`
	NoBukti    string  `json:"noBukti" gorm:"index"`
	Seq        uint    `json:"seq"`
	Tanggal    string  `json:"tanggal"`
	Deskripsi  string  `json:"deskripsi"`
	Keterangan string  `json:"keterangan"`
	Akun       string  `json:"coa"`
	AkunKas    string  `json:"akunKas" gorm:"column:akun_kas"`
	Nama       string  `json:"nama"`
	Debit      float64 `json:"debit"`
	Kredit     float64 `json:"kredit"`
	IsPiutang  bool    `json:"isPiutang"`
	Saved      bool    `json:"saved" gorm:"-"`
	Posted     bool    `json:"posted" gorm:"-"`
	Locked     bool    `json:"locked"` // Huruf besar di awal!
}
