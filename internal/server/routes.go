package server

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (r *Router) Route() {
	gameController := NewGameController(r.dbConn)

	// Index
	r.engine.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "index",
		})
	})

	// API
	{
		apiV1 := r.engine.Group("/api/v1")
		apiV1.POST("/game", func(c *gin.Context) {
			newGameRequest := NewGameRequest{}
			err := c.ShouldBindBodyWithJSON(&newGameRequest)
			if err != nil {
				slog.Warn("Invalid request", "error", err)
				c.JSON(http.StatusBadRequest, gin.H{
					"message": "invalid request",
				})
				return
			}
			game, err := gameController.CreateGame(newGameRequest)
			if err != nil {
				slog.Warn("Internal server error", "error", err)
				c.JSON(http.StatusInternalServerError, gin.H{
					"message": "internal server error",
				})
				return
			}
			c.JSON(http.StatusOK, &game)
		})
		apiV1.GET("/game/:id", func(c *gin.Context) {
			id := c.Param("id")
			c.JSON(http.StatusOK, gin.H{
				"message": "this is the endpoint for getting a game state",
				"id":      id,
			})
		})
		apiV1.POST("/game/:id", func(c *gin.Context) {
			id := c.Param("id")
			c.JSON(http.StatusOK, gin.H{
				"message": "this is the endpoint for updating a game state",
				"id":      id,
			})
		})

	}
}
