package server

import (
	"context"
	"errors"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type GameController struct {
	dbConn *pgx.Conn
}

type Game struct {
	UUID         string    `json:"uuid"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
	Name         string    `json:"name"`
	GameType     string    `json:"game_type"`
	BoardState   []byte    `json:"board_state"`
	NextPlayerID int       `json:"next_player_id"`
	Player1Piece string    `json:"player_1_piece"`
	Player2Piece string    `json:"player_2_piece"`
}

type NewGameRequest struct {
	Name         string `json:"name"`
	GameType     string `json:"game_type"`
	Player1Piece string `json:"player_1_piece"`
	Player2Piece string `json:"player_2_piece"`
	NextPlayerID string `json:"next_player_id"`
}

func NewGameController(dbConn *pgx.Conn) *GameController {
	return &GameController{
		dbConn,
	}
}

func (gc *GameController) CreateGame(newGameRequest NewGameRequest) (*Game, error) {
	var game Game

	uuid := uuid.New().String()

	validNextPlayerID, err := strconv.Atoi(newGameRequest.NextPlayerID)
	if err != nil {
		return nil, err
	}
	if validNextPlayerID < 1 || validNextPlayerID > 2 {
		return nil, errors.New("invalid next player id")
	}

	query := `
		WITH gt AS (
			SELECT id FROM game_type WHERE label = $3
		)
		INSERT INTO game (uuid, name, game_type_id, next_player_id, player_1_piece, player_2_piece)
		SELECT $1, $2, gt.id, $4, $5, $6
		FROM gt
		RETURNING uuid, name, created_at, updated_at, 
		(SELECT label FROM game_type WHERE id = game_type_id) AS game_type, 
		board_state, next_player_id, player_1_piece, player_2_piece
		`
	row := gc.dbConn.QueryRow(
		context.Background(),
		query,
		uuid,
		newGameRequest.Name,
		newGameRequest.GameType,
		validNextPlayerID,
		newGameRequest.Player1Piece,
		newGameRequest.Player2Piece,
	)

	err = row.Scan(
		&game.UUID,
		&game.Name,
		&game.CreatedAt,
		&game.UpdatedAt,
		&game.GameType,
		&game.BoardState,
		&game.NextPlayerID,
		&game.Player1Piece,
		&game.Player2Piece,
	)

	if err != nil {
		return nil, err
	}

	return &game, nil
}
