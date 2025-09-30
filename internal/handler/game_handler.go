package handler

import (
	"encoding/hex"
	"errors"
	"log/slog"
	"net/http"
	"strconv"
	"t-cubed/internal/ai"
	"t-cubed/internal/engine"
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
		c.JSON(http.StatusBadRequest, gin.H{
			MSG: MSG_INVALID_REQUEST,
		})
		return
	}
	validNextPlayerId, err := validatePlayerId(newGameRequest.NextPlayerID)
	validAIPlayerId, err := validateAIPlayerId(newGameRequest.AIPlayerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			MSG: MSG_INVALID_REQUEST,
		})
		return
	}

	game, err := h.repo.CreateGame(newGameRequest.Name, newGameRequest.GameType, newGameRequest.Player1Piece, newGameRequest.Player2Piece, validNextPlayerId, validAIPlayerId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
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

	c.JSON(http.StatusOK, gameResponse)
}

type MoveRequest struct {
	PlayerID string `json:"player_id"`
	Position string `json:"position"`
}

type NNMoveResponse struct {
	BoardState    []byte          `json:"board_state"`
	NextPlayerID  int             `json:"next_player_id"`
	TerminalState int             `json:"terminal_state"`
	Trace         ai.ForwardTrace `json:"trace"`
}

// Handles a move request for a neural network game type
func (h *GameHandler) PlayNNMove(c *gin.Context) {
	uuid := c.Param("id")
	moveRequest := MoveRequest{}
	err := c.ShouldBindBodyWithJSON(&moveRequest)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			MSG: MSG_INVALID_REQUEST,
		})
		return
	}
	validPlayerId, err := validatePlayerId(moveRequest.PlayerID)
	validPosition, err := validatePosition(moveRequest.Position)
	if err != nil {
		c.JSON(http.StatusBadRequest, nil)
		return
	}
	game, err := h.repo.GetGame(uuid)
	if err != nil {
		c.JSON(http.StatusNotFound, nil)
		return
	}

	// If the game is over, return the current state
	if game.TerminalState > 0 {
		c.JSON(http.StatusConflict, NNMoveResponse{
			BoardState:    game.BoardState,
			NextPlayerID:  game.NextPlayerID,
			TerminalState: game.TerminalState,
		})
		return
	}

	// The next player must be the player making the move
	if game.NextPlayerID != validPlayerId {
		c.JSON(http.StatusBadRequest, gin.H{
			MSG: "Invalid player id sequence",
		})
		return
	}

	// The game type must be neural network
	if game.GameType != "neural_network" {
		c.JSON(http.StatusBadRequest, gin.H{
			MSG: "This endpoint only works for neural network games",
		})
		return
	}
	gameStateOptions := &engine.GameStateOptions{
		Player1Piece:  pieceToByte(game.Player1Piece),
		Player2Piece:  pieceToByte(game.Player2Piece),
		FirstPlayerId: uint8(game.NextPlayerID),
	}

	gameState, err := engine.NewGameStateFromBytes(gameStateOptions, game.BoardState)
	if err != nil {
		slog.Warn("Could not create game state", "uuid", uuid, "error", err)
		c.JSON(http.StatusInternalServerError, nil)
		return
	}

	// Play the move, update the game state, and respond if the game is over
	ok, _ := gameState.Move(uint8(validPosition))
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			MSG: "Position is occupied or invalid",
		})
		return
	}
	newBoardState := gameState.GetBoardAsByteArray()
	_, err = h.repo.UpdateGame(uuid, game.Name, int(gameState.GetCurrentPlayerId()), newBoardState, int(gameState.TerminalState))
	if err != nil {
		slog.Warn("Could not update game", "uuid", uuid, "error", err)
		c.JSON(http.StatusInternalServerError, nil)
		return
	}
	if gameState.IsTerminal() {
		terminalState := gameState.TerminalState
		c.JSON(http.StatusOK, NNMoveResponse{
			BoardState:    newBoardState,
			NextPlayerID:  int(gameState.GetCurrentPlayerId()),
			TerminalState: int(terminalState),
		})
		return
	}
	// Otherwise, play the AI move and respond
	input := gameState.GetBoardAsNetworkInput()
	trace := new(ai.ForwardTrace)
	output, err := h.neuralNet.Forward(input, trace)
	if err != nil {
		panic(err)
	}
	positions := []int{1, 2, 3, 4, 5, 6, 7, 8, 9}

	// Bubble sort the position and the output, by the output values
	for i := range positions {
		for j := i + 1; j < len(positions); j++ {
			if output[j-1] > output[j] {
				output[j-1], output[j] = output[j], output[j-1]
				positions[j-1], positions[j] = positions[j], positions[j-1]
			}
		}
	}

	// Try the positions in the sorted order until one works
	moveSuccess := false
	for _, position := range positions {
		ok, _ := gameState.Move(uint8(position))
		if ok {
			moveSuccess = true
			break
		}
	}
	if !moveSuccess {
		panic("No valid move found")
	}
	newBoardState = gameState.GetBoardAsByteArray()
	_, err = h.repo.UpdateGame(uuid, game.Name, int(gameState.GetCurrentPlayerId()), newBoardState, int(gameState.TerminalState))
	if err != nil {
		c.JSON(http.StatusInternalServerError, nil)
		slog.Warn("Could not update game", "uuid", uuid, "error", err)
		return
	}

	nnMoveResponse := NNMoveResponse{
		BoardState:    newBoardState,
		NextPlayerID:  int(gameState.GetCurrentPlayerId()),
		TerminalState: int(gameState.TerminalState),
		Trace:         *trace,
	}

	c.JSON(http.StatusOK, nnMoveResponse)
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

func validatePosition(position string) (int, error) {
	validPosition, err := strconv.Atoi(position)
	if err != nil {
		return 0, err
	}
	if validPosition < 1 || validPosition > 9 {
		return 0, errors.New("invalid position")
	}
	return validPosition, nil
}

func pieceToByte(piece string) byte {
	switch piece {
	case "X":
		return engine.PIECE_X
	case "O":
		return engine.PIECE_O
	default:
		panic("Invalid piece type passed to pieceToByte")
	}
}
