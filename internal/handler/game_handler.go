package handler

import (
	"encoding/hex"
	"errors"
	"log/slog"
	"strconv"
	"t-cubed/internal/ai"
	"t-cubed/internal/repo"

	"github.com/gin-gonic/gin"
)

const (
	MSG                 = "message"
	MSG_INVALID_REQUEST = "invalid request"
	MSG_INTERNAL_ERROR  = "internal server error"
)

type GameHandler struct {
	repo      repo.GameRepo
	neuralNet *ai.Network
}

func NewGameHandler(repo repo.GameRepo) *GameHandler {
	savedName := "data/weights.json"
	network, err := ai.LoadNetwork(savedName)
	if err != nil {
		slog.Error("Could not load neural network", "error", err)
		panic(err)
	}

	return &GameHandler{
		repo,
		network,
	}
}

type NewGameRequest struct {
	Name         string `json:"name"`
	GameType     string `json:"game_type"`
	Player1Piece string `json:"player_1_piece"`
	Player2Piece string `json:"player_2_piece"`
	NextPlayerID string `json:"next_player_id"`
	AIPlayerID   string `json:"ai_player_id"`
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
			MSG: MSG_INVALID_REQUEST,
		})
		return
	}
	validNextPlayerId, err := validatePlayerId(newGameRequest.NextPlayerID)
	validAIPlayerId, err := validateAIPlayerId(newGameRequest.AIPlayerID)
	if err != nil {
		c.JSON(400, gin.H{
			MSG: MSG_INVALID_REQUEST,
		})
		return
	}

	game, err := h.repo.CreateGame(newGameRequest.Name, newGameRequest.GameType, newGameRequest.Player1Piece, newGameRequest.Player2Piece, validNextPlayerId, validAIPlayerId)
	if err != nil {
		c.JSON(500, gin.H{
			MSG: MSG_INTERNAL_ERROR,
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

type MoveRequest struct {
	PlayerID string `json:"player_id"`
	Position string `json:"position"`
}

// Handles a move request for a neural network game type
func (h *GameHandler) PlayNNMove(c *gin.Context) {
	uuid := c.Param("id")
	moveRequest := MoveRequest{}
	err := c.ShouldBindBodyWithJSON(&moveRequest)
	if err != nil {
		c.JSON(400, gin.H{
			MSG: MSG_INVALID_REQUEST,
		})
		return
	}
	validPlayerId, err := validatePlayerId(moveRequest.PlayerID)
	if err != nil {
		c.JSON(400, gin.H{
			MSG: MSG_INVALID_REQUEST,
		})
		return
	}
	game, err := h.repo.GetGame(uuid)
	if err != nil {
		c.JSON(500, gin.H{
			MSG: MSG_INTERNAL_ERROR,
		})
		return
	}
	// The next player must be the player making the move
	if game.NextPlayerID != validPlayerId {
		c.JSON(400, gin.H{
			MSG: MSG_INVALID_REQUEST,
		})
		return
	}
	// The game type must be neural network
	if game.GameType != "neural_network" {
		c.JSON(400, gin.H{
			MSG: MSG_INVALID_REQUEST,
		})
		return
	}

	c.JSON(200, game)
}

func validatePlayerId(playerId string) (int, error) {
	validPlayerId, err := strconv.Atoi(playerId)
	if err != nil {
		return 0, err
	}
	if validPlayerId < 1 || validPlayerId > 2 {
		return 0, errors.New("invalid player id")
	}
	return validPlayerId, nil
}

func validateAIPlayerId(aiPlayerId string) (int, error) {
	validAIPlayerId, err := strconv.Atoi(aiPlayerId)
	if err != nil {
		return 0, err
	}
	if validAIPlayerId < 0 || validAIPlayerId > 2 {
		return 0, errors.New("invalid AI player id")
	}
	return validAIPlayerId, nil
}
