package engine

import (
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
	if gameStateOptions.Player1Piece != PIECE_X && gameStateOptions.Player1Piece != PIECE_O {
		return nil, fmt.Errorf("Invalid player 1 piece")
	}
	if gameStateOptions.Player2Piece != PIECE_X && gameStateOptions.Player2Piece != PIECE_O {
		return nil, fmt.Errorf("Invalid player 2 piece")
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

	ok, err := g.Board.move(g.TurnId, position)
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

	g.TerminalState = isTerminal(g.Board)

	return true, nil
}
