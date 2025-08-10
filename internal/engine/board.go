package engine

import (
	"fmt"
)

type Board struct {
	P1Board uint16
	P2Board uint16
}

func newBoard() *Board {
	board := &Board{
		P1Board: 0x0000,
		P2Board: 0x0000,
	}
	return board
}

func (b *Board) availableMoves() uint16 {
	return b.P1Board | b.P2Board
}

// Applies move to the board, takes in 1-9 as position
func (b *Board) move(playerId uint8, position uint8) (bool, error) {
	if playerId > 2 || playerId < 1 {
		return false, fmt.Errorf("Invalid player ID")
	}
	if position > 9 || position < 1 {
		return false, fmt.Errorf("Invalid position")
	}

	position -= 1

	board := &b.P1Board
	if playerId == 2 {
		board = &b.P2Board
	}

	emptyPositions := b.availableMoves()
	targetPosition := emptyPositions & (1 << position)
	if targetPosition != 0 {
		return false, fmt.Errorf("Space already taken")
	}

	*board |= uint16(1 << position)
	return true, nil
}

// Checks player's board to see if the player won
func isTerminal(board *Board) uint8 {
	p1board := board.P1Board
	p2board := board.P2Board

	if isWinner(p1board) {
		return TERM_WIN_1
	}
	if isWinner(p2board) {
		return TERM_WIN_2
	}
	if p1board | p2board == BOARD_FULL {
		return TERM_DRAW
	}

	return TERM_NOT
}

// Implements the bit-wise logic for checking if a player has won
func isWinner(board uint16) bool {
	// 0000 0000 0000 0111 = 0x0007 (1st row)
	rowPattern := uint16(ROW_PATTERN)
	if board & rowPattern == rowPattern {
		return true
	}
	// 0000 0000 0011 1000 = 0x0038 (2nd row) Checked with bit shift
	if (board & (rowPattern<<3)) == rowPattern<<3 {
		return true
	}
	// 0000 0001 1100 0000 = 0x01C0 (3rd row) Checked with bit shift
	if (board & (rowPattern<<6)) == rowPattern<<6 {
		return true
	}

	// 0000 0000 0100 1001 = 0x0049 (1st col)
	colPattern := uint16(COL_PATTERN)
	if board & colPattern == colPattern {
		return true
	}
	// 0000 0000 1001 0010 = 0x0092 (2nd col) Checked with bit shift
	if (board & (colPattern<<1)) == colPattern<<1 {
		return true
	}
	// 0000 0001 0010 0100 = 0x0124 (3rd col) Checked with bit shift
	if (board & (colPattern<<2)) == colPattern<<2 {
		return true
	}

	// 0000 0001 0001 0001 = 0x0111 (tl->br diag)
	diagPattern1 := uint16(DIAG1_PATTERN)
	if board & diagPattern1 == diagPattern1 {
		return true
	}
	// 0000 0000 0101 0100 = 0x0054 (tr->bl diag)
	diagPattern2 := uint16(DIAG2_PATTERN)
	if board & diagPattern2 == diagPattern2 {
		return true
	}

	return false
}
