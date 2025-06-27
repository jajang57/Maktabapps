package config

import (
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDB() (*gorm.DB, error) {
	dsn := "host=localhost user=postgres password=12Maktab! dbname=akuntan port=5432 sslmode=disable"
	if os.Getenv("DATABASE_URL") != "" {
		dsn = os.Getenv("DATABASE_URL")
	}
	return gorm.Open(postgres.Open(dsn), &gorm.Config{})
}
