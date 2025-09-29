package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
		apiV1.POST("/game", func(c *gin.Context) {
			id := uuid.New()
			c.JSON(http.StatusOK, gin.H{
				"message": "this is the endpoint for creating a game",
				"id":      id,
			})
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
