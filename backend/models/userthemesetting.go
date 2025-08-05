package models

type UserThemeSetting struct {
	ID               uint   `gorm:"primaryKey"`
	UserID           uint   `gorm:"uniqueIndex"`
	ButtonSimpan     string `json:"buttonSimpan"`
	ButtonHapus      string `json:"buttonHapus"`
	ButtonUpdate     string `json:"buttonUpdate"`
	ButtonRefresh    string `json:"buttonRefresh"`
	CardColor        string `json:"cardColor"`
	DropdownColor    string `json:"dropdownColor"`
	BackgroundColor  string `json:"backgroundColor"`
	MenuPosition     string `json:"menuPosition"`
	TableHeaderColor string `json:"tableHeaderColor"`
	ButtonShape      string `json:"buttonShape"` // tambahkan ini
	FontFamily       string `json:"fontFamily"`
	FontColor        string `json:"fontColor"`
	FormColor        string `json:"formColor"`
}
