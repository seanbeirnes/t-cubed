package engine

const (
	PIECE_X = 'X'
	PIECE_O = '0'
)

const (
	TERM_NOT = iota
	TERM_WIN_1
	TERM_WIN_2
	TERM_DRAW
)

const (
    BOARD_FULL = 0x01FF
    ROW_PATTERN = 0x0007
    COL_PATTERN = 0x0049
    DIAG1_PATTERN = 0x0111
    DIAG2_PATTERN = 0x0054
)

