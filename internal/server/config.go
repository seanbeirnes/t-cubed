package server

import (
	"context"
	"log/slog"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Config struct {
	DB *pgxpool.Pool
	routerLogFile *os.File
	PORT string
	GIN_MODE string
}

// Loads environment variables and establishes a db connection
// Use config.Cleanup() to close the db connection
func newConfig() *Config {
	// Load environment variables
	err := godotenv.Load()
	if err != nil {
		slog.Error("Could not load .env file", "error", err)
	}
	PORT := os.Getenv("PORT")
	if PORT == "" {
		PORT = "8080"
		slog.Warn("No PORT environment variable found.", "default", PORT)
	} else {
		slog.Info("Found PORT environment variable.", "value", PORT)
	}
	GIN_MODE := os.Getenv("GIN_MODE")
	if GIN_MODE == "" {
		GIN_MODE = gin.ReleaseMode
		slog.Warn("No GIN_MODE environment variable found.", "default", GIN_MODE)
	} else {
		slog.Info("Found GIN_MODE environment variable.", "value", GIN_MODE)
	}
	DATABASE_URL := os.Getenv("DATABASE_URL")
	if DATABASE_URL == "" {
		slog.Error("No DATABASE_URL environment variable found. Exiting...")
		panic(1)
	}

	// Create log file pointers
	routerLogFile, err := os.OpenFile("logs/requests.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		slog.Error("Could not open gin log file", "error", err)
		panic(1)
	}

	// Connect to database
	config, err := pgxpool.ParseConfig(DATABASE_URL)
	if err != nil {
		slog.Error("Could not parse database URL", "error", err)
		panic(1)
	}
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		slog.Error("Could not connect to database", "error", err)
		panic(1)
	}

	return &Config{
		DB: pool,
		routerLogFile: routerLogFile,
		PORT: PORT,
		GIN_MODE: GIN_MODE,
	}
}

func (a *Config) Cleanup() {
	a.DB.Close()
}
