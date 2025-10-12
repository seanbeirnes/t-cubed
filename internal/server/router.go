package server

import (
	"io"
	"net/http"
	"os"
	"t-cubed/internal/handler"

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
	applyRoutes(engine, handler)

	return engine	
}

func applyRoutes(engine *gin.Engine, handler *handler.Handler) {
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
