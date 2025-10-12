package handler

import (
	"t-cubed/internal/service"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	gameService *service.GameService
}

func NewHandler(db *pgxpool.Pool) *Handler {
	return &Handler{
		gameService: service.NewGameService(db),
	}
}
