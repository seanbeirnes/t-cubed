package repo

import (
	"context"
	"errors"
	"log/slog"

	"t-cubed/internal/db"
	"t-cubed/internal/model"

	"github.com/google/uuid"
)

type GameRepo interface {
	CreateGame(name string, gameType string, player1Piece string, player2Piece string, nextPlayerID int, aiPlayerID int) (*model.Game, error)
	GetGame(uuid string) (*model.Game, error)
	UpdateGame(uuid string, name string, nextPlayerID int, boardState []byte, terminalState int) (*model.Game, error)
}

type GameRepoPostgres struct {
	db *db.PostgresDB
}

func NewGameRepoPostgres(database *db.PostgresDB) GameRepo {
	return &GameRepoPostgres{db: database}
}

func (r *GameRepoPostgres) CreateGame(name string, gameType string, player1Piece string, player2Piece string, nextPlayerID int, aiPlayerID int) (*model.Game, error) {
	if player1Piece != "X" && player2Piece != "X" {
		return nil, errors.New("One player must be 'X'")
	}
	if player1Piece != "O" && player2Piece != "O" {
		return nil, errors.New("One player must be 'O'")
	}
	if player1Piece == player2Piece {
		return nil, errors.New("Player pieces must be different")
	}
	if nextPlayerID < 1 || nextPlayerID > 2 {
		return nil, errors.New("Invalid next player id")
	}
	if aiPlayerID < 0 || aiPlayerID > 2 {
		return nil, errors.New("Invalid AI player id. Must be 0 (no AI), 1 (player 1), or 2 (player 2)")
	}

	var game model.Game
	var err error

	uuid := uuid.NewString()

	query := `
		WITH gt AS (
			SELECT id FROM game_type WHERE label = $3
		)
		INSERT INTO game (uuid, name, game_type_id, next_player_id, ai_player_id, player_1_piece, player_2_piece)
		SELECT $1, $2, gt.id, $4, $5, $6, $7
		FROM gt
		RETURNING uuid, name, created_at, updated_at, 
			(SELECT label FROM game_type WHERE id = game_type_id) AS game_type, 
			board_state, next_player_id, ai_player_id, player_1_piece, player_2_piece, terminal_state
		`
	row := r.db.Connection.QueryRow(
		context.Background(),
		query,
		uuid,
		name,
		gameType,
		nextPlayerID,
		aiPlayerID,
		player1Piece,
		player2Piece,
	)

	err = row.Scan(
		&game.UUID,
		&game.Name,
		&game.CreatedAt,
		&game.UpdatedAt,
		&game.GameType,
		&game.BoardState,
		&game.NextPlayerID,
		&game.AIPlayerID,
		&game.Player1Piece,
		&game.Player2Piece,
		&game.TerminalState,
	)

	if err != nil {
		return nil, err
	}

	return &game, nil
}

func (r *GameRepoPostgres) GetGame(uuid string) (*model.Game, error) {
	var game model.Game

	query := `
		SELECT uuid, name, created_at, updated_at, 
			(SELECT label FROM game_type WHERE id = game_type_id) AS game_type, 
			board_state, next_player_id, ai_player_id, player_1_piece, player_2_piece, terminal_state
		FROM game
		WHERE uuid = $1
		`
	row := r.db.Connection.QueryRow(
		context.Background(),
		query,
		uuid,
	)

	err := row.Scan(
		&game.UUID,
		&game.Name,
		&game.CreatedAt,
		&game.UpdatedAt,
		&game.GameType,
		&game.BoardState,
		&game.NextPlayerID,
		&game.AIPlayerID,
		&game.Player1Piece,
		&game.Player2Piece,
		&game.TerminalState,
	)
	if err != nil {
		slog.Warn("Could not get game", "uuid", uuid, "error", err)
		return nil, err
	}

	return &game, nil
}

func (r *GameRepoPostgres) UpdateGame(uuid string, name string, nextPlayerID int, boardState []byte, terminalState int) (*model.Game, error) {
	if nextPlayerID < 1 || nextPlayerID > 2 {
		return nil, errors.New("Invalid next player id")
	}

	var game model.Game
	var err error

	query := `
		UPDATE game
		SET name = $1, next_player_id = $2, board_state = $3, terminal_state = $4
		WHERE uuid = $5
		RETURNING uuid, name, created_at, updated_at, 
			(SELECT label FROM game_type WHERE id = game_type_id) AS game_type, 
			board_state, next_player_id, ai_player_id, player_1_piece, player_2_piece, terminal_state
		`
	row := r.db.Connection.QueryRow(
		context.Background(),
		query,
		name,
		nextPlayerID,
		boardState,
		terminalState,
		uuid,
	)

	err = row.Scan(
		&game.UUID,
		&game.Name,
		&game.CreatedAt,
		&game.UpdatedAt,
		&game.GameType,
		&game.BoardState,
		&game.NextPlayerID,
		&game.AIPlayerID,
		&game.Player1Piece,
		&game.Player2Piece,
		&game.TerminalState,
	)
	if err != nil {
		slog.Warn("Could not update game", "uuid", uuid, "error", err)
		return nil, err
	}

	return &game, nil
}
