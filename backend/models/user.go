package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type User struct {
	ID          uint       `json:"id" gorm:"primaryKey"`
	Username    string     `json:"username" gorm:"unique;not null"`
	Password    string     `json:"-" gorm:"not null"` // "-" agar password tidak muncul di JSON response
	FullName    string     `json:"fullName" gorm:"not null"`
	ActiveToken string     `json:"-" gorm:"type:text"` // Token aktif untuk device yang sedang login
	DeviceInfo  string     `json:"-" gorm:"type:text"` // Info device yang sedang login
	LastLoginAt *time.Time `json:"lastLoginAt"`        // Waktu login terakhir
	gorm.Model
}

// TableName override
func (User) TableName() string {
	return "users"
}

// HashPassword - Hash password sebelum disimpan
func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword - Cek apakah password cocok
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}
