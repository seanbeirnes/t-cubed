package engine

// Acts as a public interface for the package.

import (
	"encoding/binary"
	"fmt"
	"t-cubed/internal/util"
)

type GameState struct {
	Board *Board
	Player1 *Player
	Player2 *Player
	TurnId uint8
	TerminalState uint8
}

type GameStateOptions struct {
	Player1Piece byte
	Player2Piece byte
	FirstPlayerId uint8
}

func NewGameState(gameStateOptions *GameStateOptions) (*GameState, error) {
	if gameStateOptions.Player1Piece != PIECE_X && gameStateOptions.Player2Piece != PIECE_X {
		return nil, fmt.Errorf("Invalid player pieces")
	}
	if gameStateOptions.Player1Piece != PIECE_O && gameStateOptions.Player2Piece != PIECE_O {
		return nil, fmt.Errorf("Invalid player pieces")
	}
	if gameStateOptions.Player1Piece == gameStateOptions.Player2Piece {
		return nil, fmt.Errorf("Player 1 and player 2 cannot be the same piece")
	}
	if gameStateOptions.FirstPlayerId > 2 || gameStateOptions.FirstPlayerId < 1 {
		return nil, fmt.Errorf("Invalid first player ID")
	}

	gameState := &GameState{
		Board: newBoard(),
		Player1: newPlayer(1, gameStateOptions.Player1Piece),
		Player2: newPlayer(2, gameStateOptions.Player2Piece),
		TurnId: gameStateOptions.FirstPlayerId,
		TerminalState: TERM_NOT,
	}

	return gameState, nil
}

func NewGameStateFromBytes(gameStateOptions *GameStateOptions, boardState []byte) (*GameState, error) {
	if len(boardState) != 4 {
		return nil, fmt.Errorf("Invalid board state length")
	}
	gameState, err := NewGameState(gameStateOptions)
	if err != nil {
		return nil, err
	}
	p1Board, p2Board := unpackBoardBigEndian(boardState)
	gameState.Board.P1Board = p1Board
	gameState.Board.P2Board = p2Board
	return gameState, nil
}

// Returns the board as a 4-byte array for storage in a database
func (g *GameState) GetBoardAsByteArray() []byte {
	board := g.Board
	p1Board := board.P1Board
	p2Board := board.P2Board
	return packBoardBigEndian(p1Board, p2Board)
}

func (g *GameState) GetBoardAsBytes() []byte {
	board := g.Board
	p1Board := board.P1Board
	p2Board := board.P2Board

	var boardAsBytes []byte
	for i := 0; i < 3; i++ {
		for j := 0; j < 3; j++ {
			if p1Board&(1<<uint8(i*3+j)) != 0 {
				boardAsBytes = append(boardAsBytes, g.Player1.Piece)
			} else if p2Board&(1<<uint8(i*3+j)) != 0 {
				boardAsBytes = append(boardAsBytes, g.Player2.Piece)
			} else {
				boardAsBytes = append(boardAsBytes, '_')
			}
		}
	}

	return boardAsBytes
}

// Returns the board as an array of floats for use in neural networks
// The first 9 elements are 1 for Player 1's pieces or 0, the next 9 are 1 for Player 2's pieces or 0
func (g *GameState) GetBoardAsNetworkInput() []float64 {
	boardAsBytes := g.GetBoardAsBytes()
	input := make([]float64, 18)
	for i, b := range boardAsBytes {
		switch b {
			case g.Player1.Piece:
				input[i] = 1
			case g.Player2.Piece:
				input[i+9] = 1
			default:
				input[i] = 0
		}
	}
	return input
}

func (g *GameState) GetBoardAsString() string {
	return string(g.GetBoardAsBytes())
}

func (g *GameState) GetCurrentPlayerId() uint8 {
	return g.TurnId
}

func (g *GameState) IsTerminal() bool {
	return g.TerminalState != TERM_NOT
}

func (g *GameState) Move(position uint8) (bool, error) {
	if g.IsTerminal() {
		return false, nil
	}

	ok, err := g.Board.Move(g.TurnId, position)
	if err != nil {
		return false, err
	}
	if !ok {
		util.Assert(false, "[ERROR] Move failed but no error was returned")
	}

	if g.TurnId == g.Player1.Id {
		g.TurnId = g.Player2.Id
	} else {
		g.TurnId = g.Player1.Id
	}

	g.TerminalState = IsTerminal(g.Board)

	return true, nil
}

// Encodes two uint16 bitboards into 4 bytes (big-endian).
// Order: [P1 hi, P1 lo, P2 hi, P2 lo]
func packBoardBigEndian(p1Board, p2Board uint16) []byte {
    out := make([]byte, 4)
    binary.BigEndian.PutUint16(out[0:2], p1Board)
    binary.BigEndian.PutUint16(out[2:4], p2Board)
    return out
}

// Decodes a 4-byte big-endian payload into two uint16 bitboards.
// Expects len(b) == 4.
// Order: p1 hi, p1 lo, p2 hi, p2 lo
func unpackBoardBigEndian(b []byte) (uint16, uint16) {
    p1 := binary.BigEndian.Uint16(b[0:2])
    p2 := binary.BigEndian.Uint16(b[2:4])
    return p1, p2
}

