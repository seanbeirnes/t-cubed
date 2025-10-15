package handler

import (
	"encoding/hex"
	"net/http"
	"strconv"
	"t-cubed/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ResGame struct {
	UUID          string `json:"uuid"`
	Name          string `json:"name"`
	GameType      string `json:"game_type"`
	BoardState    string `json:"board_state"`
	NextPlayerID  int16  `json:"next_player_id"`
	Player1Piece  string `json:"player_1_piece"`
	Player2Piece  string `json:"player_2_piece"`
	TerminalState int16  `json:"terminal_state"`
}

func (h *Handler) GetGame(c *gin.Context) {
	uuidParam := c.Param("uuid")
	uuid, err := uuid.Parse(uuidParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}

	game, err := h.gameService.GetGame(c.Request.Context(), uuid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, ResGame{
		UUID:          game.Uuid.String(),
		Name:          game.Name,
		GameType:      h.gameService.GetGameTypeLabel(game.GameTypeID),
		BoardState:    hex.EncodeToString(game.BoardState),
		NextPlayerID:  game.NextPlayerID,
		Player1Piece:  game.Player1Piece,
		Player2Piece:  game.Player2Piece,
		TerminalState: game.TerminalState,
	})
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
		UUID:          game.Uuid.String(),
		Name:          game.Name,
		GameType:      h.gameService.GetGameTypeLabel(game.GameTypeID),
		BoardState:    hex.EncodeToString(game.BoardState),
		NextPlayerID:  game.NextPlayerID,
		Player1Piece:  game.Player1Piece,
		Player2Piece:  game.Player2Piece,
		TerminalState: game.TerminalState,
	})
}

type ReqNNMove struct {
	PlayerID string `json:"player_id"`
	Position string `json:"position"`
}

type ResNNMove struct {
	Game        *ResGame             `json:"game"`
	Trace       *service.NNMoveTrace `json:"trace"`
	RankedMoves []int                `json:"ranked_moves"`
}

// Plays Neural Network move
func (h *Handler) PlayNNMove(c *gin.Context) {
	req := ReqNNMove{}

	uuidParam := c.Param("uuid")
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}

	uuid, err := uuid.Parse(uuidParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}
	parsedPlayerID, err := strconv.ParseInt(req.PlayerID, 10, 16)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}
	playerID := int16(parsedPlayerID)
	if playerID != 1 {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}

	parsedPosition, err := strconv.ParseInt(req.Position, 10, 16)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}
	position := uint8(parsedPosition)

	result, err := h.gameService.PlayNNMove(c.Request.Context(), uuid, playerID, position)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	response := ResNNMove{
		Game: &ResGame{
			UUID:          result.Game.Uuid.String(),
			Name:          result.Game.Name,
			GameType:      h.gameService.GetGameTypeLabel(result.Game.GameTypeID),
			BoardState:    hex.EncodeToString(result.Game.BoardState),
			NextPlayerID:  result.Game.NextPlayerID,
			Player1Piece:  result.Game.Player1Piece,
			Player2Piece:  result.Game.Player2Piece,
			TerminalState: result.Game.TerminalState,
		},
		Trace: nil,
		RankedMoves: result.RankedMoves,
	}

	if result.Trace != nil {
		response.Trace = result.Trace
	}

	c.JSON(http.StatusOK, response)
}

type ReqMMMove struct {
	PlayerID string `json:"player_id"`
	Position string `json:"position"`
}

type ResMMMove struct {
	Game *ResGame `json:"game"`
}

// Plays Minimax move
func (h *Handler) PlayMMMove(c *gin.Context) {
	req := ReqMMMove{}

	uuidParam := c.Param("uuid")
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}

	uuid, err := uuid.Parse(uuidParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}
	parsedPlayerID, err := strconv.ParseInt(req.PlayerID, 10, 16)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}
	playerID := int16(parsedPlayerID)
	if playerID != 1 {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}

	parsedPosition, err := strconv.ParseInt(req.Position, 10, 16)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}
	position := uint8(parsedPosition)

	result, err := h.gameService.PlayMMMove(c.Request.Context(), uuid, playerID, position)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	response := ResMMMove{
		Game: &ResGame{
			UUID:          result.Uuid.String(),
			Name:          result.Name,
			GameType:      h.gameService.GetGameTypeLabel(result.GameTypeID),
			BoardState:    hex.EncodeToString(result.BoardState),
			NextPlayerID:  result.NextPlayerID,
			Player1Piece:  result.Player1Piece,
			Player2Piece:  result.Player2Piece,
			TerminalState: result.TerminalState,
		},
	}

	c.JSON(http.StatusOK, response)
}
