package main

import (
	"bufio"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"math/rand"
	"os"
	"path/filepath"
	"strconv"

	"t-cubed/internal/ai"
	"t-cubed/internal/engine"
)

const (
	DIVIDER = "========================================"
)

func main() {
	fmt.Println(DIVIDER)
	fmt.Println(" 🎲  t³ Trainer — Tic-Tac-Toe Neural Net")
	fmt.Println(DIVIDER)

	fmt.Println("Choose an option:")
	fmt.Println("\t1. ✨ Generate training data")
	fmt.Println("\t2. 🧠 Train a neural network")
	fmt.Println("\t3. 🧪 Test a neural network")
	fmt.Println("\t4. 🚪 Exit")

	scnr := bufio.NewScanner(os.Stdin)
	for {
		fmt.Print("Enter your choice: ")
		scnr.Scan()
		choice, err := strconv.Atoi(scnr.Text())
		if err != nil {
			fmt.Println("Invalid input")
			continue
		}
		switch choice {
		case 1:
			generateTrainingData()
		case 2:
			trainNeuralNetwork()
		case 3:
			testNeuralNetwork()
		case 4:
			fmt.Println("Exiting...")
			return
		default:
			fmt.Println("Invalid choice")
		}
	}
}

func generateTrainingData() {
	var err error
	var outDir string
	var numExamples int

	scnr := bufio.NewScanner(os.Stdin)

	fmt.Print("Enter output directory: ")
	scnr.Scan()
	outDir = filepath.Clean(scnr.Text())
	if _, err := os.Stat(outDir); os.IsNotExist(err) {
		err = os.MkdirAll(outDir, 0755)
		if err != nil {
			fmt.Println("Failed to create directory:", err)
			return
		}
	}

	for {
		fmt.Print("Enter number of examples to generate: ")
		scnr.Scan()
		numExamples, err = strconv.Atoi(scnr.Text())
		if err != nil {
			fmt.Println("Invalid number")
			continue
		}
		if numExamples < 1 || numExamples > 1_000_000 {
			fmt.Println("Number must be between 1 and 1,000,000")
			continue
		}
		fmt.Printf("%d examples will be generated\n", numExamples)
		break
	}

	fmt.Printf("%d examples will be saved to %s\n", numExamples, outDir)

	exampleHashes := make(map[string]bool)
	breakThreshold := 90.0
	breakThresholdDecay := 0.0001

	for i := 1; i <= numExamples; i++ {
		fname := fmt.Sprintf("t3_%06d.json", i)
		fullPath := outDir + string(os.PathSeparator) + fname
		file, err := os.Create(fullPath)
		if err != nil {
			fmt.Println("Failed to create file:", fullPath, err)
			return
		}

		// Decay break threshold faster as examples are generated
		if breakThreshold > 0.1 {
			breakThreshold -= breakThresholdDecay * (float64(i) / float64(numExamples))
		}

		example, movesPlayed, err := createExample(int(math.Round(breakThreshold)), 0)
		if err != nil {
			fmt.Println("Failed to generate example:", err)
			break
		}
		data, err := json.Marshal(example)
		exampleHash := fmt.Sprintf("%x", sha256.Sum256(data))
		if _, ok := exampleHashes[exampleHash]; ok {
			i--
			continue
		} else {
			exampleHashes[exampleHash] = true
			msg := fmt.Sprintf("Generated example #%06d", i)
			slog.Info(msg, "break_threshold", breakThreshold, "moves_played", movesPlayed, "hash", exampleHash)
		}

		if err != nil {
			fmt.Println("Failed to marshal example:", err)
			return
		}
		_, err = file.Write(data)
		if err != nil {
			fmt.Println("Failed to write example:", err)
			return
		}

		file.Close()
	}
	fmt.Println("Done generating training data.")
}

// Plays randomly chosen moves for a randomly chosen number of turns.
// Player 1 is the faux human player and player 2 is the AI.
// Note: the AI package expects Player 2 to be the AI player.
// 	breakThresdhold: Requires range [0, 100], where a higher value means a higher chance of breaking early in the game.
// 	iterations: Used to prevent stack overflow. If maxIterations is reached, an error is returned.
func createExample(breakThreshold int, iterations int) (ai.TrainingExample, int, error) {
	maxIterations := 100
	maxRandNum := 100
	outputLen := 9

	AIPlayerId := uint8(2)
	firstPlayerId := uint8(rand.Intn(2) + 1)

	movesPlayed := 0

	gameStateOptions := &engine.GameStateOptions{
		Player1Piece:  engine.PIECE_X,
		Player2Piece:  engine.PIECE_O,
		FirstPlayerId: firstPlayerId,
	}

	gameState, err := engine.NewGameState(gameStateOptions)
	if err != nil {
		fmt.Println(err)
	}

	for {
		// Probabilistically break to generate different depths of game states
		if movesPlayed > 0 && gameState.GetCurrentPlayerId() == AIPlayerId {
			randNum := rand.Intn(maxRandNum)
			// If below threshold, return game state with AI's best move
			if randNum < breakThreshold {
				input := gameState.GetBoardAsNetworkInput()
				// Output vector is a vector of zeros except for 1 at the best move index
				bestMove := ai.BestMove(gameState.Board)
				output := make([]float64, outputLen)
				output[bestMove-1] = 1

				return ai.TrainingExample{
					Input:  input,
					Target: output,
				}, movesPlayed, nil
			}
		}

		// Try to play a random move until it works
		for {
			nextMove := uint8(rand.Intn(9) + 1)
			ok, _ := gameState.Move(nextMove)
			if ok {
				break
			}
		}

		// If the game is terminal, try again until a non-terminal game is generated
		if gameState.IsTerminal() {
			// Prevent stack overflow
			if iterations > maxIterations {
				return ai.TrainingExample{}, 0, fmt.Errorf("Failed to generate example after %d iterations", maxIterations)
			}
			// Increase threshold to increase chance of generating a non-terminal game
			if breakThreshold < maxRandNum - 1 {
				breakThreshold += 1
			}
			return createExample(breakThreshold, iterations+1)
		}
		movesPlayed++
	}
}

func trainNeuralNetwork() {
	savedName := "weights.json"
	scnr := bufio.NewScanner(os.Stdin)

	fmt.Print("Enter input directory: ")
	scnr.Scan()
	outDir := filepath.Clean(scnr.Text())

	fmt.Println("Creating neural network...")

	network, err := ai.NewNetwork(18, 32, 32, 32, 9)
	if err != nil {
		fmt.Println("Failed to create network:", err)
		return
	}

	fmt.Println("Training neural network...")

	trainingConfig := ai.TrainingConfig{
		LearningRate:  0.001,
		CostThreshold: 0.1,
		Epochs:        10_000,
		BatchSize:     10,
		ExamplesDir:   outDir,
	}

	err = network.Train(&trainingConfig)
	if err != nil {
		fmt.Println("Failed to train network:", err)
		return
	}

	ai.SaveNetwork(filepath.Join(savedName), network)

	fmt.Printf("\n🎉 All done! Weights written to %s", savedName)
	fmt.Println("   Go forth and let the AI play Tic-Tac-Toe 🧠🤖")
}

func testNeuralNetwork() {
	savedName := "weights.json"
	network, err := ai.LoadNetwork(savedName)
	if err != nil {
		fmt.Println("Failed to load network:", err)
		return
	}
	fmt.Println("Loaded neural network")

	fmt.Println("Welcome to T-Cubed, the game of Tic-Tac-Toe!")
	gameStateOptions := &engine.GameStateOptions{
		Player1Piece:  engine.PIECE_X,
		Player2Piece:  engine.PIECE_O,
		FirstPlayerId: 1,
	}
	gameState, err := engine.NewGameState(gameStateOptions)
	if err != nil {
		fmt.Println(err)
		return
	}
	scnr := bufio.NewScanner(os.Stdin)

	for {
		if gameState.GetCurrentPlayerId() == 2 {
			input := gameState.GetBoardAsNetworkInput()
			trace := new(ai.ForwardTrace)
			output, err := network.Forward(input, trace)
			if err != nil {
				panic(err)
			}
			fmt.Println(output)
			fmt.Println(trace)
			bestValue := output[0]
			bestMove := uint8(1)
			for i := range output {
				if output[i] > bestValue {
					bestValue = output[i]
					bestMove = uint8(i + 1)
				}
			}
			ok, err := gameState.Move(bestMove)
			if err != nil {
				panic(err)
			}
			if !ok {
				panic("Invalid move")
			}
		} else {
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
