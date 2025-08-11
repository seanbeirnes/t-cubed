package ai

import (
	"math"

	"t-cubed/internal/engine"
	"t-cubed/internal/util"
)

/*
Returns the best move for the AI player.
Assumes that the AI player is Player 2 and the human player is Player 1.
*/
func BestMove(gameBoard *engine.Board) uint8 {
	if engine.IsTerminal(gameBoard) != engine.TERM_NOT {
		return 0
	}

	bestValue := math.MinInt
	bestPos := uint8(0)
	// Run minimax on all available moves for Player 2 (AI)
	nextMoves := getNextMoves(gameBoard, uint8(2))
	for pos, nextBoard := range nextMoves {
		value := abminimax(nextBoard, math.MinInt, math.MaxInt, false)
		if value > bestValue {
			bestValue = value
			bestPos = pos
		}
	}

	return bestPos
}

// Takes a board state and returns all possible next boards for the given player
func getNextMoves(gameBoard *engine.Board, playerId uint8) map[uint8]*engine.Board {
	moves := gameBoard.AvailableMoves()
	nextMoves := make(map[uint8]*engine.Board) // [position]board
	for bitpos := uint8(0); bitpos < 9; bitpos++ {
		bit := uint16(1 << bitpos)
		// If the bit is 0, then move on, no move available
		if moves&bit == 0 {
			continue
		}
		
		nextBoard := new(engine.Board)
		*nextBoard = *gameBoard
		ok, err := nextBoard.Move(playerId, bitpos+1)
		if err != nil || !ok {
			panic(err)
		}
		nextMoves[bitpos+1] = nextBoard
	}

	return nextMoves
}

// Expects Player 1 to be human (min) and Player 2 to be AI (max)
func abminimax(gameBoard *engine.Board, alpha int, beta int, isMax bool) int {
	if engine.IsTerminal(gameBoard) != engine.TERM_NOT {
		value := heuristic(gameBoard)
		util.Assert(value < 2 && value > -2, "Invalid heuristic value")
		return value
	}

	if isMax {
		value := math.MinInt
		nextMoves := getNextMoves(gameBoard, 2) // Get AI's moves
		for _, nextBoard := range nextMoves {
			value = max(value, abminimax(nextBoard, alpha, beta, false))
			if value >= beta {
				break
			}
			alpha = max(alpha, value)
		}
		return value
	} else {
		value := math.MaxInt
		nextMoves := getNextMoves(gameBoard, 1) // Get Human's moves
		for _, nextBoard := range nextMoves {
			value = min(value, abminimax(nextBoard, alpha, beta, true))
			if value <= alpha {
				break
			}
			beta = min(beta, value)
		}
		return value
	}
} 

// Returns the heuristic value for the board, assuming that Player 1 is human and Player 2 is AI
func heuristic(gameBoard *engine.Board) int {	
	terminalState := engine.IsTerminal(gameBoard)
	switch terminalState {
	case engine.TERM_WIN_1:
		return -1
	case engine.TERM_WIN_2:
		return 1
	case engine.TERM_DRAW:
		return 0
	default:
		panic("Invalid terminal state")
	}
}
