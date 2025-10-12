package handler

import (
	"encoding/hex"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ResGame struct {
	UUID         string `json:"uuid"`
	Name         string `json:"name"`
	GameType     string `json:"game_type"`
	BoardState   string `json:"board_state"`
	NextPlayerID int16    `json:"next_player_id"`
	Player1Piece string `json:"player_1_piece"`
	Player2Piece string `json:"player_2_piece"`
}

type ReqCreateGame struct {
	Name         string `json:"name"`
	GameType     string `json:"game_type"`
	Player1Piece string `json:"player_1_piece"`
	Player2Piece string `json:"player_2_piece"`
	NextPlayerID string `json:"next_player_id"`
	AIPlayerID   string `json:"ai_player_id"`
}

func (h *Handler) CreateGame(c *gin.Context) {
	req := ReqCreateGame{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": err.Error(),
		})
		return
	}

	game, err := h.gameService.CreateGame(c.Request.Context(), req.Name, req.GameType, req.Player1Piece, req.Player2Piece)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, ResGame{
		UUID:         game.Uuid.String(),
		Name:         game.Name,
		GameType:     h.gameService.GetGameTypeLabel(game.GameTypeID),
		BoardState:   hex.EncodeToString(game.BoardState),
		NextPlayerID: game.NextPlayerID,
		Player1Piece: game.Player1Piece,
		Player2Piece: game.Player2Piece,
	})
}

	
