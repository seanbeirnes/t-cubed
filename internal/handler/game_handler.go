package handler

import (
	"encoding/hex"
	"strconv"
	"t-cubed/internal/repo"

	"github.com/gin-gonic/gin"
)

type GameHandler struct {
	repo repo.GameRepo
}

func NewGameHandler(repo repo.GameRepo) *GameHandler {
	return &GameHandler{
		repo,
	}
}

type NewGameRequest struct {
	Name         string `json:"name"`
	GameType     string `json:"game_type"`
	Player1Piece string `json:"player_1_piece"`
	Player2Piece string `json:"player_2_piece"`
	NextPlayerID string `json:"next_player_id"`
}

type GameResponse struct {
	UUID         string `json:"uuid"`
	Name         string `json:"name"`
	GameType     string `json:"game_type"`
	BoardState   string `json:"board_state"`
	NextPlayerID int    `json:"next_player_id"`
	Player1Piece string `json:"player_1_piece"`
	Player2Piece string `json:"player_2_piece"`
}

func (h *GameHandler) CreateGame(c *gin.Context) {
	newGameRequest := NewGameRequest{}
	err := c.ShouldBindBodyWithJSON(&newGameRequest)
	if err != nil {
		c.JSON(400, gin.H{
			"message": "invalid request",
		})
		return
	}
	validNextPlayerId, err := strconv.Atoi(newGameRequest.NextPlayerID)
	if err != nil {
		c.JSON(400, gin.H{
			"message": "invalid next player id",
		})
		return
	}
	if validNextPlayerId < 1 || validNextPlayerId > 2 {
		c.JSON(400, gin.H{
			"message": "invalid next player id",
		})
		return
	}
	game, err := h.repo.CreateGame(newGameRequest.Name, newGameRequest.GameType, newGameRequest.Player1Piece, newGameRequest.Player2Piece, validNextPlayerId)
	if err != nil {
		c.JSON(500, gin.H{
			"message": "internal server error",
		})
		return
	}

	gameResponse := GameResponse{
		UUID:         game.UUID,
		Name:         game.Name,
		GameType:     game.GameType,
		BoardState:   hex.EncodeToString(game.BoardState),
		NextPlayerID: game.NextPlayerID,
		Player1Piece: game.Player1Piece,
		Player2Piece: game.Player2Piece,
	}

	c.JSON(200, gameResponse)
}
