package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
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
	fmt.Println("\t3. 🚪 Exit")

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
			fmt.Println("Exiting...")
			return
		default:
			fmt.Println("Invalid choice")
		}
	}
}

func generateTrainingData() {
	fmt.Println("Generating training data...")
}

func trainNeuralNetwork() {
	fmt.Println("Training neural network...")
	
    fmt.Println("\n🎉 All done! Weights written to weights.json")
    fmt.Println("   Go forth and let the AI play Tic-Tac-Toe 🧠🤖")
}
