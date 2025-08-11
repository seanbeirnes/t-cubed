package engine

import (
	"testing"
)

// Test that isTerminal returns the correct terminal state.
func TestIsTerminal(t *testing.T) {
	board := newBoard()

	// Test horizontal wins
	board.P1Board = 0x0007
	board.P2Board = 0x0000
	terminalState := IsTerminal(board)
	if terminalState != TERM_WIN_1 {
		t.Errorf("Terminal state is not TERM_WIN_1")
	}

	board.P1Board = 0x0038
	terminalState = IsTerminal(board)
	if terminalState != TERM_WIN_1 {
		t.Errorf("Terminal state is not TERM_WIN_1")
	}

	board.P1Board = 0x01C0
	terminalState = IsTerminal(board)
	if terminalState != TERM_WIN_1 {
		t.Errorf("Terminal state is not TERM_WIN_1")
	}

	// Test vertical wins
	board.P1Board = 0x0049
	terminalState = IsTerminal(board)
	if terminalState != TERM_WIN_1 {
		t.Errorf("Terminal state is not TERM_WIN_1")
	}

	board.P1Board = 0x0092
	terminalState = IsTerminal(board)
	if terminalState != TERM_WIN_1 {
		t.Errorf("Terminal state is not TERM_WIN_1")
	}

	board.P1Board = 0x0124
	terminalState = IsTerminal(board)
	if terminalState != TERM_WIN_1 {
		t.Errorf("Terminal state is not TERM_WIN_1")
	}

	// Test diagonal wins
	board.P1Board = 0x0111
	terminalState = IsTerminal(board)
	if terminalState != TERM_WIN_1 {
		t.Errorf("Terminal state is not TERM_WIN_1")
	}

	board.P1Board = 0x0054
	terminalState = IsTerminal(board)
	if terminalState != TERM_WIN_1 {
		t.Errorf("Terminal state is not TERM_WIN_1")
	}

	// Test draw
	board.P1Board = 0x009D
	board.P2Board = 0x0162
	terminalState = IsTerminal(board)
	if terminalState != TERM_DRAW {
		t.Errorf("Terminal state is not TERM_DRAW")
	}

	// Test not terminal
	board.P1Board = 0x0000
	board.P2Board = 0x0000
	terminalState = IsTerminal(board)
	if terminalState != TERM_NOT {
		t.Errorf("Terminal state is not TERM_NOT")
	}
}
