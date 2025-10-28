package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (h *Handler) GetWeights(c *gin.Context) {
	c.JSON(http.StatusOK, h.gameService.GetWeights())
}
