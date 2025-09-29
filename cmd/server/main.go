package main

import (
	"io"
	"log/slog"
	"os"

	"t-cubed/internal/db"
	"t-cubed/internal/handler"
	"t-cubed/internal/repo"
	"t-cubed/internal/router"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Set up logging
	os.Mkdir("logs", 0700)

	file, err := os.OpenFile("logs/server.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		slog.Error("Could not open log file", "error", err)
		return
	}
	defer file.Close()

	mw := io.MultiWriter(os.Stdout, file)
	logHandler := slog.NewJSONHandler(mw, nil)
	logger := slog.New(logHandler)
	slog.SetDefault(logger)

	// Load environment variables
	err = godotenv.Load()
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
		return
	}

	// Connect to database
	db := db.NewPostgresDB(DATABASE_URL)
	err = db.Connect()
	if err != nil {
		slog.Error("Could not connect to database", "error", err)
		return
	}
	defer db.Close()
	
	// Create handlers and repositories
	gameHandler := handler.NewGameHandler(repo.NewGameRepoPostgres(db))

	// Set up server and routes
	gin.SetMode(GIN_MODE)
	file, err = os.OpenFile("logs/requests.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		slog.Error("Could not open gin log file", "error", err)
		return
	}
	defer file.Close()
	gin.DefaultWriter = io.MultiWriter(os.Stdout, file)

	engine := gin.Default()
	engine.SetTrustedProxies(nil)
	engine.TrustedPlatform = gin.PlatformFlyIO

	router := router.NewRouter(engine, gameHandler)
	router.Route()

	// Start server
	engine.Run(":" + PORT)
}
