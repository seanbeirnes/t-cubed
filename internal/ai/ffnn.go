package ai

import (
	"encoding/json"
	"errors"
	"math"
	"math/rand"
	"os"
	"path/filepath"
)

type layer struct {
	Input   int         `json:"input"`
	Output  int         `json:"output"`
	Weights [][]float64 `json:"weights"`
	Biases  []float64   `json:"biases"`
}

type network struct {
	Layers []*layer `json:"layers"`
}

// Creates a new feed-forward neural network where x1, x2, ..., xn are the neuron counts for each layer.
// The first layer is the input layer, and the last layer is the output layer.
func NewNetwork(neurons ...int) (*network, error) {
	if len(neurons) < 2 {
		return nil, errors.New("At least 2 neurons required")
	}
	layers := make([]*layer, len(neurons)-1)

	for i := 0; i < len(neurons)-1; i++ {
		in, out := neurons[i], neurons[i+1]
		if in == 0 || out == 0 {
			return nil, errors.New("Neurons cannot be 0")
		}
		layers[i] = newLayer(in, out)

	}

	n := &network{Layers: layers}
	n.randomizeWeights()

	return n, nil
}

// Randomizes the weights of the network.
func (n *network) randomizeWeights() {
	for _, layer := range n.Layers {
		for i := 0; i < layer.Input; i++ {
			for j := 0; j < layer.Output; j++ {
				layer.Weights[i][j] = rand.Float64()
			}
		}
	}
}

// Loads a FFNN config from a JSON file
func LoadNetwork(fpath string) (*network, error) {
	fpath = filepath.Clean(fpath)
	data, err := os.ReadFile(fpath)
	if err != nil {
		return nil, err
	}
	var network network
	if err := json.Unmarshal(data, &network); err != nil {
		return nil, err
	}
	return &network, nil
}

// Saves a FFNN config to a JSON file
func SaveNetwork(fpath string, n *network) error {
	fpath = filepath.Clean(fpath)
	data, err := json.Marshal(n)
	if err != nil {
		return err
	}
	return os.WriteFile(fpath, data, 0644)
}

// Forward propagates the input through the network and returns the output.
func (n *network) Forward(x []float64) ([]float64, error) {
	var err error
	out := x
	for i, l := range n.Layers {
		act := reLU
		if i == len(n.Layers)-1 {
			act = identity // last layer emits logits
		}
		out, err = l.feedForward(out, act)
		if err != nil {
			return nil, err
		}
	}
	return softmax(out), nil
}

func newLayer(input, output int) *layer {
	l := &layer{
		Input:   input,
		Output:  output,
		Weights: make([][]float64, input),
		Biases:  make([]float64, output),
	}
	for i := range l.Weights {
		l.Weights[i] = make([]float64, output)
	}
	return l
}

// Feed forwards the input through the network and returns the output.
func (l *layer) feedForward(input []float64, activationFunc func(float64) float64) ([]float64, error) {
	if len(input) != l.Input {
		return nil, errors.New("Input length does not match layer input length")
	}

	output := make([]float64, l.Output)
	for j := 0; j < l.Output; j++ {
		sum := l.Biases[j]
		for i := 0; i < l.Input; i++ {
			sum += l.Weights[i][j] * input[i]
		}
		output[j] = activationFunc(sum)
	}

	return output, nil
}

// Activation function for the network.
func reLU(x float64) float64 {
	if x > 0 {
		return x
	}
	return 0
}

func identity(x float64) float64 { return x }

// Normalizes the input to probability distribution
func softmax(input []float64) []float64 {
	// Subtract max value to prevent overflow
	max := input[0]
	for _, value := range input {
		if value > max {
			max = value
		}
	}

	// New slice to avoid overwriting input
	values := make([]float64, len(input))
	for i := range values {
		// Exponentiate all values once for reuse
		values[i] = math.Exp(input[i] - max)
	}

	// Compute denominator once for reuse
	denominator := 0.0
	for j := range values {
		denominator += values[j]
	}

	for i := range values {
		numerator := values[i]
		values[i] = numerator / denominator
	}
	return values
}
