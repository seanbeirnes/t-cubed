package game

import (
	"fmt"
	"strconv"
	"os"
	"bufio"

	"t-cubed/internal/engine"
)

func Main() {
	fmt.Println("Welcome to T-Cubed, the game of Tic-Tac-Toe!")
	gameStateOptions := &engine.GameStateOptions{
		Player1Piece: engine.PIECE_X,
		Player2Piece: engine.PIECE_O,
		FirstPlayerId: 1,
	}
	gameState, err := engine.NewGameState(gameStateOptions)
	if err != nil {
		fmt.Println(err)
		return
	}
	scnr := bufio.NewScanner(os.Stdin)

	for {
		fmt.Printf("[PLAYER %d] Enter your move (1-9): \n", gameState.GetCurrentPlayerId())
		scnr.Scan()
		position, err := strconv.Atoi(scnr.Text())
		if err != nil {
			fmt.Println("Invalid input")
			continue
		}
		ok, err := gameState.Move(uint8(position))
		if err != nil {
			fmt.Println(err)
			continue
		}
		if !ok {
			fmt.Println("Invalid move")
			continue
		}

		boardString := gameState.GetBoardAsString()
		fmt.Println()
		for i, c := range boardString {
			fmt.Printf("%c", c)
			if i == 2 || i == 5 || i == 8 {
				fmt.Println()
			} 
		}
		fmt.Println()

		if gameState.IsTerminal() {
			fmt.Println("Game over!")
			if gameState.TerminalState == engine.TERM_WIN_1 {
				fmt.Println("Player 1 wins!")
			} else if gameState.TerminalState == engine.TERM_WIN_2 {
				fmt.Println("Player 2 wins!")
			} else if gameState.TerminalState == engine.TERM_DRAW {
				fmt.Println("Draw!")
			}
			break
		}
	}
}
