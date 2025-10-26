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

func getNextPlayerID(moveEvent *service.MoveEvent) int16 {
	if moveEvent.PlayerID == 1 {
		return 2
	}
	return 1
}

func (h *Handler) GetGame(c *gin.Context) {
	uuidParam := c.Param("uuid")
	uuid, err := uuid.Parse(uuidParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}

	game, moveEvent, err := h.gameService.GetGame(c.Request.Context(), uuid)
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
		BoardState:    hex.EncodeToString(moveEvent.PostMoveState),
		NextPlayerID:  getNextPlayerID(moveEvent),
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

	game, moveEvent, err := h.gameService.CreateGame(c.Request.Context(), req.Name, req.GameType, req.Player1Piece, req.Player2Piece)
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
		BoardState:    hex.EncodeToString(moveEvent.PostMoveState),
		NextPlayerID:  getNextPlayerID(moveEvent),
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

	result, moveEvent, err := h.gameService.PlayNNMove(c.Request.Context(), uuid, playerID, position)
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
			BoardState:    hex.EncodeToString(moveEvent.PostMoveState),
			NextPlayerID:  getNextPlayerID(moveEvent),
			Player1Piece:  result.Game.Player1Piece,
			Player2Piece:  result.Game.Player2Piece,
			TerminalState: result.Game.TerminalState,
		},
		Trace:       nil,
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

	result, moveEvent, err := h.gameService.PlayMMMove(c.Request.Context(), uuid, playerID, position)
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
			BoardState:    hex.EncodeToString(moveEvent.PostMoveState),
			NextPlayerID:  getNextPlayerID(moveEvent),
			Player1Piece:  result.Player1Piece,
			Player2Piece:  result.Player2Piece,
			TerminalState: result.TerminalState,
		},
	}

	c.JSON(http.StatusOK, response)
}

type ResMoveEvent struct {
	MoveSequence  int16  `json:"move_sequence"`
	PlayerID      int16  `json:"player_id"`
	PostMoveState string `json:"post_move_state"`
}

type ResMoveEventWithTrace struct {
	MoveEvent *ResMoveEvent        `json:"move_event"`
	Trace     *service.NNMoveTrace `json:"trace"`
}

func (h *Handler) GetMoveHistory(c *gin.Context) {
	uuidParam := c.Param("uuid")
	uuid, err := uuid.Parse(uuidParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{})
		return
	}

	moveEvents, err := h.gameService.GetMoveHistory(c.Request.Context(), uuid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}
	var resMoveEvents []ResMoveEventWithTrace
	for _, moveEvent := range moveEvents {
		resMoveEvents = append(resMoveEvents, ResMoveEventWithTrace{
			MoveEvent: &ResMoveEvent{
				MoveSequence:  moveEvent.MoveEvent.MoveSequence,
				PlayerID:      moveEvent.MoveEvent.PlayerID,
				PostMoveState: hex.EncodeToString(moveEvent.MoveEvent.PostMoveState),
			},
			Trace: moveEvent.Trace,
		})
	}
	c.JSON(http.StatusOK, resMoveEvents)
}
