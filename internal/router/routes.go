package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (r *Router) Route() {

	// Index
	r.engine.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "index",
		})
	})

	// API
	{
		apiV1 := r.engine.Group("/api/v1")
		apiV1.POST("/game", r.gameHandler.CreateGame)

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
