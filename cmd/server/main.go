package main

import (
	"io"
	"log/slog"
	"net/http"
	"context"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
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
	conn, err := pgx.Connect(context.Background(), DATABASE_URL)
	if err != nil {
		slog.Error("Could not connect to database", "error", err)
		return
	}
	defer conn.Close(context.Background())
	slog.Info("Database connection successful.")


	// Set up gin
	gin.SetMode(GIN_MODE)
	file, err = os.OpenFile("logs/requests.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		slog.Error("Could not open gin log file", "error", err)
		return
	}
	defer file.Close()
	gin.DefaultWriter = io.MultiWriter(os.Stdout, file)

	router := gin.Default()
	router.SetTrustedProxies(nil)
	router.TrustedPlatform = gin.PlatformFlyIO

	router.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "index",
		})
	})

	{
		apiV1 := router.Group("/api/v1")
		apiV1.POST("/game", func(c *gin.Context) {
			id := uuid.New()
			c.JSON(http.StatusOK, gin.H{
				"message":"this is the endpoint for creating a game",
				"id":id,
			})
		})
		apiV1.GET("/game/:id", func(c *gin.Context) {
			id := c.Param("id")
			c.JSON(http.StatusOK, gin.H{
				"message":"this is the endpoint for getting a game state",
				"id":id,
			})
		})
		apiV1.POST("/game/:id", func(c *gin.Context) {
			id := c.Param("id")
			c.JSON(http.StatusOK, gin.H{
				"message":"this is the endpoint for updating a game state",
				"id":id,
			})
		})

	}

	// Start server
	router.Run(":" + PORT)
}
