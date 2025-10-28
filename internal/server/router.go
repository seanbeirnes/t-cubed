package server

import (
	"io"
	"net/http"
	"os"
	"t-cubed/internal/handler"
	"t-cubed/internal/middleware"

	"github.com/gin-gonic/gin"
)

const (
	INDEX_HTML = "./static/index.html"
)

func newRouter(config *Config) *gin.Engine {
	// Set up server and routes
	gin.SetMode(config.GIN_MODE)
	gin.DefaultWriter = io.MultiWriter(os.Stdout, config.routerLogFile)

	engine := gin.Default()
	engine.SetTrustedProxies(nil)
	engine.TrustedPlatform = gin.PlatformFlyIO

	handler := handler.NewHandler(config.DB)
	applyRoutes(config, engine, handler)

	return engine
}

func applyRoutes(config *Config, engine *gin.Engine, handler *handler.Handler) {
	// Middleware for all routes
	engine.Use(
		middleware.NewRequestID(),
		middleware.NewSecure(config.DEV_MODE), // Must go before CORS
		middleware.NewCors(config.CORS_ORIGINS),
		middleware.NewRateLimiter(),
		middleware.NewGzip(),
	)

	// Static files for container deployment
	if !config.DEV_MODE {
		engine.Use(middleware.NewStatic())
	}

	// Health check
	engine.GET("/healthz", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
		})
	})

	// Game client
	{
		gameClient := engine.Group("/game")
		gameClient.GET("/newgame", func(c *gin.Context) {
			c.File(INDEX_HTML)
		})
		gameClient.GET("/:uuid/nn", func(c *gin.Context) {
			c.File(INDEX_HTML)
		})
		gameClient.GET("/:uuid/minimax", func(c *gin.Context) {
			c.File(INDEX_HTML)
		})
	}

	// API
	{
		apiV1 := engine.Group("/api/v1")
		apiV1.GET("/data/nn/weights", handler.GetWeights)
		apiV1.POST("/game", handler.CreateGame)
		apiV1.GET("/game/:uuid", handler.GetGame)
		apiV1.POST("/game/:uuid/nn", handler.PlayNNMove)
		apiV1.POST("/game/:uuid/mm", handler.PlayMMMove)
		apiV1.GET("/game/:uuid/history", handler.GetMoveHistory)
	}
}
