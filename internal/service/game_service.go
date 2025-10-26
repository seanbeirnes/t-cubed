package service

import (
	"bytes"
	"context"
	"errors"
	"log/slog"

	"t-cubed/internal/ai"
	"t-cubed/internal/engine"
	"t-cubed/internal/repository"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	GAME_TYPE_NN      = "neural_network"
	GAME_TYPE_MINIMAX = "minimax"
	GAME_TYPE_HUMANS  = "humans"
)

type GameService struct {
	repo               *repository.Queries
	neuralNet          *ai.Network
	cachedGameTypesMap map[string]int32 // Label -> ID
}

type Game = repository.Game
type MoveEvent = repository.MoveEvent
type GameType = repository.GameType
type NNMoveTrace = ai.ForwardTrace

func NewGameService(db *pgxpool.Pool) *GameService {
	neuralNetWeightsFile := "data/weights.json"
	repo := repository.New(db)

	ctx := context.Background()
	gameTypes, err := repo.GetGameTypes(ctx)
	cachedGameTypesMap := gameTypesFromRepo(&gameTypes)
	if err != nil {
		slog.Error("Could not get game types", "error", err)
		panic(1)
	}
	slog.Info("Games types cached", "game_types", cachedGameTypesMap)

	neuralNet, err := ai.LoadNetwork(neuralNetWeightsFile)
	if err != nil {
		slog.Error("Could not load neural network", "error", err)
		panic(1)
	}
	slog.Info("Loaded neural network", "weights_file", neuralNetWeightsFile)

	return &GameService{
		repo:               repo,
		neuralNet:          neuralNet,
		cachedGameTypesMap: cachedGameTypesMap,
	}
}

// Returns a map of the game type labels to their IDs for caching
func gameTypesFromRepo(gameTypes *[]repository.GameType) map[string]int32 {
	gameTypesMap := make(map[string]int32)
	for _, gameType := range *gameTypes {
		gameTypesMap[gameType.Label] = gameType.ID
	}
	return gameTypesMap
}

func (s *GameService) GetGameTypeLabel(gameTypeID int32) string {
	for label, id := range s.cachedGameTypesMap {
		if id == gameTypeID {
			return label
		}
	}
	slog.Warn("Could not find game type label for ID", "game_type_id", gameTypeID)
	return "unknown"
}

func (s *GameService) CreateGame(ctx context.Context, name string, gameTypeLabel string, player1Piece string, player2Piece string) (*Game, *MoveEvent, error) {
	if !isValidGamePice(player1Piece) {
		return nil, nil, errors.New("invalid player 1 piece")
	}
	if !isValidGamePice(player2Piece) {
		return nil, nil, errors.New("invalid player 2 piece")
	}
	if player1Piece == player2Piece {
		return nil, nil, errors.New("player 1 and player 2 cannot be the same piece")
	}
	gameTypeID, ok := s.cachedGameTypesMap[gameTypeLabel]
	if !ok {
		return nil, nil, errors.New("invalid game type")
	}

	createGameParams := repository.CreateGameParams{
		Name:         name,
		GameTypeID:   gameTypeID,
		AiPlayerID:   2,
		Player1Piece: player1Piece,
		Player2Piece: player2Piece,
	}

	game, err := s.repo.CreateGame(ctx, createGameParams)
	if err != nil {
		slog.Error("Could not create game", "error", err)
		return nil, nil, err
	}

	// Create a blank move event to prepare the game for the first move
	initialMoveEventparams := repository.CreateMoveEventParams{
		GameUuid:      game.Uuid,
		MoveSequence:  0,
		PlayerID:      2, // Must be opposite of the first player's ID so that first player will be next
		PostMoveState: bytes.Repeat([]byte{0}, 4),
	}

	move, err := s.repo.CreateMoveEvent(ctx, initialMoveEventparams)
	if err != nil {
		slog.Error("Could not create first move event", "error", err)
		return nil, nil, err
	}

	return &game, &move, nil
}

func isValidGamePice(piece string) bool {
	return piece == string(engine.PIECE_O) || piece == string(engine.PIECE_X)
}

func (s *GameService) GetGame(ctx context.Context, uuid uuid.UUID) (*Game, *MoveEvent, error) {
	gameData, err := s.repo.GetGameByUUID(ctx, uuid)
	if err != nil {
		slog.Error("Could not get game", "error", err)
		return nil, nil, err
	}
	game := &gameData.Game
	moveEvent := &gameData.MoveEvent
	 
	if game != nil && moveEvent == nil {
		return game, nil, nil
	}

	return game, moveEvent, nil
}

type NNMoveResult struct {
	Game        *Game            `json:"game"`
	Trace       *ai.ForwardTrace `json:"trace"`
	RankedMoves []int            `json:"ranked_moves"`
}

func getNextPlayerID(playerID int16) int16 {
	if playerID == 1 {
		return 2
	}
	return 1
}

// Plays a Neural Network move
func (s *GameService) PlayNNMove(ctx context.Context, uuid uuid.UUID, playerID int16, position uint8) (*NNMoveResult, *MoveEvent, error) {
	gameData, err := s.repo.GetGameByUUID(ctx, uuid)
	if err != nil {
		slog.Error("Could not get game from DB", "error", err)
		return nil, nil, err
	}
	game := &gameData.Game
	moveEvent := &gameData.MoveEvent
	nextPlayerID := getNextPlayerID(moveEvent.PlayerID)
	lastBoardState := moveEvent.PostMoveState

	if !isValidPlayerID(playerID) {
		return nil, nil, errors.New("invalid player ID")
	}
	if !isValidPosition(position) {
		return nil, nil, errors.New("invalid position")
	}

	if game.TerminalState != engine.TERM_NOT {
		return nil, nil, errors.New("cannot play move on a finished game")
	}
	if game.GameTypeID != s.cachedGameTypesMap[GAME_TYPE_NN] {
		return nil, nil, errors.New("game type must be neural network")
	}
	if playerID != 1 {
		return nil, nil, errors.New("human player ID must be 1")
	}
	if playerID != nextPlayerID {
		return nil, nil, errors.New("player ID does not match next player ID")
	}

	gameStateOptions := &engine.GameStateOptions{
		Player1Piece:  pieceToByte(game.Player1Piece),
		Player2Piece:  pieceToByte(game.Player2Piece),
		FirstPlayerId: uint8(nextPlayerID),
	}
	gameState, err := engine.NewGameState(gameStateOptions)
	if err != nil {
		slog.Error("Could not create game state", "uuid", game.Uuid, "error", err)
		return nil, nil, err
	}
	// Set the board state based on persisted data
	p1Board, p2Board := engine.UnpackBoard(lastBoardState)
	gameState.Board.P1Board = p1Board
	gameState.Board.P2Board = p2Board

	// Play the move, update the game state, and respond if the game is over
	ok, err := gameState.Move(position)
	if err != nil {
		slog.Error("Could not play move", "uuid", game.Uuid, "error", err)
		return nil, nil, err
	}
	if !ok {
		slog.Warn("Could not play move", "uuid", game.Uuid, "position", position)
		return nil, nil, errors.New("invalid move")
	}

	updateGameParams := repository.UpdateGameParams{
		Name:          game.Name,
		TerminalState: int16(gameState.TerminalState),
		Uuid:          game.Uuid,
	}

	*game, err = s.repo.UpdateGame(ctx, updateGameParams)
	if err != nil {
		slog.Warn("Failed to write updated game state to database", "uuid", uuid, "error", err)
		return nil, nil, err
	}

	createMoveEventParams := repository.CreateMoveEventParams{
		GameUuid:      game.Uuid,
		MoveSequence:  moveEvent.MoveSequence + 1,
		PlayerID:      nextPlayerID,
		PostMoveState: gameState.GetBoardAsByteArray(),
	}

	*moveEvent, err = s.repo.CreateMoveEvent(ctx, createMoveEventParams)
	if err != nil {
		slog.Error("Could not create move event", "uuid", game.Uuid, "error", err)
		return nil, nil, err
	}

	// If the game is over, return the game without a neural network trace
	if gameState.IsTerminal() {
		return &NNMoveResult{
			Game:  game,
			Trace: nil,
		}, 
		moveEvent, 
		nil
	}

	// Otherwise, play the AI (neural network) move and respond
	nextPlayerID = getNextPlayerID(moveEvent.PlayerID)
	input := gameState.GetBoardAsNetworkInput()
	trace := new(ai.ForwardTrace)
	output, err := s.neuralNet.Forward(input, trace)
	if err != nil {
		panic(err)
	}
	positions := []int{1, 2, 3, 4, 5, 6, 7, 8, 9}

	// Bubble sort the position and the output, by the output values
	for i := 0; i < len(positions)-1; i++ {
		for j := 0; j < len(positions)-i-1; j++ {
			if output[j] < output[j+1] {
				output[j], output[j+1] = output[j+1], output[j]
				positions[j], positions[j+1] = positions[j+1], positions[j]
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
		return nil, nil, errors.New("no valid move for AI found")
	}

	updateGameParams = repository.UpdateGameParams{
		Name:          game.Name,
		TerminalState: int16(gameState.TerminalState),
		Uuid:          game.Uuid,
	}
	*game, err = s.repo.UpdateGame(ctx, updateGameParams)
	if err != nil {
		slog.Warn("Failed to write updated game state to database", "uuid", uuid, "error", err)
		return nil, nil, err
	}

	createMoveEventParams = repository.CreateMoveEventParams{
		GameUuid:      game.Uuid,
		MoveSequence:  moveEvent.MoveSequence + 1,
		PlayerID:      nextPlayerID,
		PostMoveState: gameState.GetBoardAsByteArray(),
	}

	*moveEvent, err = s.repo.CreateMoveEvent(ctx, createMoveEventParams)
	if err != nil {
		slog.Error("Could not create move event", "uuid", game.Uuid, "error", err)
		return nil, nil, err
	}

	return &NNMoveResult{
		Game:        game,
		Trace:       trace,
		RankedMoves: positions,
	},
	moveEvent,
	nil
}

// Plays Minimax move
func (s *GameService) PlayMMMove(ctx context.Context, uuid uuid.UUID, playerID int16, position uint8) (*Game, *MoveEvent, error) {
	gameData, err := s.repo.GetGameByUUID(ctx, uuid)
	if err != nil {
		slog.Error("Could not get game from DB", "error", err)
		return nil, nil, err
	}
	game := &gameData.Game
	moveEvent := &gameData.MoveEvent
	nextPlayerID := getNextPlayerID(moveEvent.PlayerID)
	lastBoardState := moveEvent.PostMoveState

	if !isValidPlayerID(playerID) {
		return nil, nil, errors.New("invalid player ID")
	}
	if !isValidPosition(position) {
		return nil, nil, errors.New("invalid position")
	}

	if game.TerminalState != engine.TERM_NOT {
		return nil, nil, errors.New("cannot play move on a finished game")
	}
	if game.GameTypeID != s.cachedGameTypesMap[GAME_TYPE_MINIMAX] {
		return nil, nil, errors.New("game type must be minimax")
	}
	if playerID != 1 {
		return nil, nil, errors.New("human player ID must be 1")
	}
	if playerID != nextPlayerID {
		return nil, nil, errors.New("player ID does not match next player ID")
	}

	gameStateOptions := &engine.GameStateOptions{
		Player1Piece:  pieceToByte(game.Player1Piece),
		Player2Piece:  pieceToByte(game.Player2Piece),
		FirstPlayerId: uint8(nextPlayerID),
	}
	gameState, err := engine.NewGameState(gameStateOptions)
	if err != nil {
		slog.Error("Could not create game state", "uuid", game.Uuid, "error", err)
		return nil, nil, err
	}
	// Set the board state based on persisted data
	p1Board, p2Board := engine.UnpackBoard(lastBoardState)
	gameState.Board.P1Board = p1Board
	gameState.Board.P2Board = p2Board

	// Play the move, update the game state, and respond if the game is over
	ok, err := gameState.Move(position)
	if err != nil {
		slog.Error("Could not play move", "uuid", game.Uuid, "error", err)
		return nil, nil, err
	}
	if !ok {
		slog.Warn("Could not play move", "uuid", game.Uuid, "position", position)
		return nil, nil, errors.New("invalid move")
	}

	updateGameParams := repository.UpdateGameParams{
		Name:          game.Name,
		TerminalState: int16(gameState.TerminalState),
		Uuid:          game.Uuid,
	}
	*game, err = s.repo.UpdateGame(ctx, updateGameParams)
	if err != nil {
		slog.Warn("Failed to write updated game state to database", "uuid", uuid, "error", err)
		return nil, nil, err
	}

	createMoveEventParams := repository.CreateMoveEventParams{
		GameUuid:      game.Uuid,
		MoveSequence:  moveEvent.MoveSequence + 1,
		PlayerID:      nextPlayerID,
		PostMoveState: gameState.GetBoardAsByteArray(),
	}

	*moveEvent, err = s.repo.CreateMoveEvent(ctx, createMoveEventParams)
	if err != nil {
		slog.Error("Could not create move event", "uuid", game.Uuid, "error", err)
		return nil, nil, err
	}

	// If the game is over, return the game without a neural network trace
	if gameState.IsTerminal() {
		return game, moveEvent, nil
	}

	// Otherwise, play the AI (minimax) move and respond
	nextPlayerID = getNextPlayerID(moveEvent.PlayerID)
	bestMove := ai.BestMove(gameState.Board)
	ok, err = gameState.Move(bestMove)
	if err != nil {
		slog.Error("Could not play move", "uuid", game.Uuid, "error", err)
		return nil, nil, err
	}
	if !ok {
		slog.Warn("Could not play move", "uuid", game.Uuid, "position", position)
		return nil, nil, errors.New("invalid move")
	}

	updateGameParams = repository.UpdateGameParams{
		Name:          game.Name,
		TerminalState: int16(gameState.TerminalState),
		Uuid:          game.Uuid,
	}
	*game, err = s.repo.UpdateGame(ctx, updateGameParams)
	if err != nil {
		slog.Warn("Failed to write updated game state to database", "uuid", uuid, "error", err)
		return nil, nil, err
	}

	createMoveEventParams = repository.CreateMoveEventParams{
		GameUuid:      game.Uuid,
		MoveSequence:  moveEvent.MoveSequence + 1,
		PlayerID:      nextPlayerID,
		PostMoveState: gameState.GetBoardAsByteArray(),
	}

	*moveEvent, err = s.repo.CreateMoveEvent(ctx, createMoveEventParams)
	if err != nil {
		slog.Error("Could not create move event", "uuid", game.Uuid, "error", err)
		return nil, nil, err
	}

	return game, moveEvent, nil
}

// Utility function to convert a piece string to a byte
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

// Returns true if the playerID is in a valid range
func isValidPlayerID(playerID int16) bool {
	if playerID < 1 || playerID > 2 {
		return false
	}
	return true
}

// Returns true if the position is in a valid range
func isValidPosition(position uint8) bool {
	return position >= 1 && position <= 9
}
