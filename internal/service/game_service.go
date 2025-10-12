package service

import (
	"context"
	"errors"
	"log/slog"

	"t-cubed/internal/repository"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	GAME_TYPE_NN      = "neural_network"
	GAME_TYPE_MINIMAX = "minimax"
	GAME_TYPE_HUMANS  = "humans"
)

type GameService struct {
	repo               *repository.Queries
	cachedGameTypesMap map[string]int32 // Label -> ID
}
type Game = repository.Game
type GameType = repository.GameType

func NewGameService(db *pgxpool.Pool) *GameService {
	repo := repository.New(db)

	ctx := context.Background()
	gameTypes, err := repo.GetGameTypes(ctx)
	cachedGameTypesMap := gameTypesFromRepo(&gameTypes)
	if err != nil {
		slog.Error("Could not get game types", "error", err)
		panic(1)
	}
	slog.Info("Games types cached", "game_types", cachedGameTypesMap)

	return &GameService{
		repo:               repo,
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

func (s *GameService) CreateGame(ctx context.Context, name string, gameTypeLabel string, player1Piece string, player2Piece string) (*Game, error) {
	gameTypeID, ok := s.cachedGameTypesMap[gameTypeLabel]
	if !ok {
		return nil, errors.New("invalid game type")
	}

	params := repository.CreateGameParams{
		Name:         name,
		GameTypeID:   gameTypeID,
		NextPlayerID: 1,
		AiPlayerID:   2,
		Player1Piece: player1Piece,
		Player2Piece: player2Piece,
	}

	game, err := s.repo.CreateGame(ctx, params)
	if err != nil {
		slog.Error("Could not create game", "error", err)
		return nil, err
	}

	return &game, nil
}
