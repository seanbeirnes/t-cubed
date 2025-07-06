package engine

const (
    BOARD_FULL = 0x01FF
    ROW_PATTERN = 0x0007
    COL_PATTERN = 0x0049
    DIAG1_PATTERN = 0x0111
    DIAG2_PATTERN = 0x0054
)

func GetAvailableMoves(p1board uint16, p2board uint16) uint16 {
	occupied := p1board | p2board
	return ^occupied & BOARD_FULL
}

// Checks player's board to see if the player won
func isWinner(board uint16) bool {
	// 0000 0000 0000 0111 = 0x0007 (1st row)
	rowPattern := uint16(ROW_PATTERN)
	if board & rowPattern == rowPattern {
		return true
	}
	// 0000 0000 0111 0000 = 0x0070 (2nd row) Checked with bit shift
	if board & rowPattern<<4 == rowPattern<<4 {
		return true
	}
	// 0000 0111 0000 0000 = 0x0700 (3rd row) Checked with bit shift
	if board & rowPattern<<8 == rowPattern<<8 {
		return true
	}

	// 0000 0000 0100 1001 = 0x0049 (1st col)
	colPattern := uint16(COL_PATTERN)
	if board & colPattern == colPattern {
		return true
	}
	// 0000 0000 1001 0010 = 0x0092 (2nd col) Checked with bit shift
	if board & colPattern<<1 == colPattern<<1 {
		return true
	}
	// 0000 0001 0010 0100 = 0x0124 (3rd col) Checked with bit shift
	if board & colPattern<<2 == colPattern<<2 {
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

// Returns 1 if player 1 wins, 2 if player 2 wins, 3 if tie, 0 if not terminal
func IsTerminal(p1board uint16, p2board uint16) uint8 {
	if isWinner(p1board) {
		return 1
	}
	if isWinner(p2board) {
		return 2
	}
	if p1board | p2board == BOARD_FULL {
		return 3
	}

	return 0
}
