package model

import (
	"time"
)

type Game struct {
	UUID         string    
	CreatedAt    time.Time 
	UpdatedAt    time.Time 
	Name         string    
	GameType     string    
	BoardState   []byte    
	NextPlayerID int       
	AIPlayerID   int
	Player1Piece string    
	Player2Piece string    
}
