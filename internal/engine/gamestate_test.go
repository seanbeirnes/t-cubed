package engine

import (
	"testing"
)

// Test that the game state is created correctly.
func TestNewGameState(t *testing.T) {
	gameStateOptions := &GameStateOptions{
		Player1Piece: PIECE_X,
		Player2Piece: PIECE_O,
		FirstPlayerId: 1,
	}
	gameState, err := NewGameState(gameStateOptions)
	if err != nil {
		t.Errorf("Error creating game state: %s", err)
	}
	if gameState.Player1.Piece != PIECE_X {
		t.Errorf("Player 1 piece is not X")
	}
	if gameState.Player2.Piece != PIECE_O {
		t.Errorf("Player 2 piece is not O")
	}
	if gameState.TurnId != 1 {
		t.Errorf("Turn ID is not 1")
	}
	if gameState.TerminalState != TERM_NOT {
		t.Errorf("Terminal state is not TERM_NOT")
	}
}

