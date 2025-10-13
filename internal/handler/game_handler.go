package handler

import (
	"encoding/hex"
	"net/http"
	"strconv"
	"t-cubed/internal/service"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type ReqCreateGame struct {
	Name         string `json:"name"`
	GameType     string `json:"game_type"`
	Player1Piece string `json:"player_1_piece"`
	Player2Piece string `json:"player_2_piece"`
	NextPlayerID string `json:"next_player_id"`
	AIPlayerID   string `json:"ai_player_id"`
}

type ResGame struct {
	UUID         string `json:"uuid"`
	Name         string `json:"name"`
	GameType     string `json:"game_type"`
	BoardState   string `json:"board_state"`
	NextPlayerID int16    `json:"next_player_id"`
	Player1Piece string `json:"player_1_piece"`
	Player2Piece string `json:"player_2_piece"`
	TerminalState int16 `json:"terminal_state"`
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
		TerminalState: game.TerminalState,
	})
}

type ReqNNMove struct {
	PlayerID     string `json:"player_id"`
	Position     string `json:"position"`
}

type ResNNMove struct {
	Game  *ResGame `json:"game"`
	Trace *service.NNMoveTrace `json:"trace"`
}

func (h *Handler) PlayNNMove(c *gin.Context) {
	req := ReqNNMove{}

	uuidParam := c.Param("uuid")
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
		})
		return
	}

	uuid, err := uuid.Parse(uuidParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
		})
		return
	}
	parsedPlayerID, err := strconv.ParseInt(req.PlayerID, 10, 16)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
		})
		return
	}
	playerID := int16(parsedPlayerID)
	if playerID != 1 {
		c.JSON(http.StatusBadRequest, gin.H{
		})
		return
	}

	parsedPosition, err := strconv.ParseInt(req.Position, 10, 16)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
		})
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
		Game:  &ResGame{
			UUID:         result.Game.Uuid.String(),
			Name:         result.Game.Name,
			GameType:     h.gameService.GetGameTypeLabel(result.Game.GameTypeID),
			BoardState:   hex.EncodeToString(result.Game.BoardState),
			NextPlayerID: result.Game.NextPlayerID,
			Player1Piece: result.Game.Player1Piece,
			Player2Piece: result.Game.Player2Piece,
			TerminalState: result.Game.TerminalState,
		},
		Trace: nil,
	}

	if result.Trace != nil {
		response.Trace = result.Trace
	}

	c.JSON(http.StatusOK, response)
}
