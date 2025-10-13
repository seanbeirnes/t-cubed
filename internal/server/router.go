package server

import (
	"io"
	"net/http"
	"os"
	"t-cubed/internal/handler"
	"t-cubed/internal/middleware"

	"github.com/gin-gonic/gin"
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
		middleware.NewCors(config.CORS_ORIGINS),
		middleware.NewSecure(config.DEV_MODE),
		middleware.NewGzip(),
		middleware.NewRequestID(),
		middleware.NewRateLimiter(),
	)

	// Index
	engine.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "index",
		})
	})

	// API
	{
		apiV1 := engine.Group("/api/v1")
		apiV1.POST("/game", handler.CreateGame)

		apiV1.GET("/game/:id", func(c *gin.Context) {
			id := c.Param("id")
			c.JSON(http.StatusOK, gin.H{
				"message": "this is the endpoint for getting a game state",
				"id":      id,
			})
		})
		// apiV1.POST("/game/:id/nn", gameHandler.PlayNNMove)
	}
}
