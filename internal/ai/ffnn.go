package ai

import (
	"errors"
	"math"
	"math/rand"
)

type layer struct {
	input, output int
	weights       [][]float64
	biases        []float64
}

type network struct {
	layers []*layer
}

// Creates a new feed-forward neural network where x1, x2, ..., xn are the neuron counts for each layer.
// The first layer is the input layer, and the last layer is the output layer.
func NewNetwork(neurons ...int) (*network, error) {
	if len(neurons) < 2 {
		return nil, errors.New("At least 2 neurons required")
	}
	layers := make([]*layer, len(neurons)-1)

	for i := 0; i < len(neurons) - 1; i++ {
		in, out := neurons[i], neurons[i+1]
		if in == 0 || out == 0 {
			return nil, errors.New("Neurons cannot be 0")
		}
		layers[i] = newLayer(in, out)

	}

	return &network{layers: layers}, nil
}

// Randomizes the weights of the network.
func (n *network) RandomizeWeights() {
	for _, layer:= range n.layers {
		for i := 0; i < layer.input; i++ {
			for j := 0; j < layer.output; j++ {
				layer.weights[i][j] = rand.Float64() 
			}
		}
	}
}

// Forward propagates the input through the network and returns the output.
func (n *network) Forward(x []float64) ([]float64, error) {
	var err error
	out := x
	for i, l := range n.layers {
		act := reLU
		if i == len(n.layers)-1 {
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
		input: input,
		output: output,
		weights: make([][]float64, input),
		biases: make([]float64, output),
	}
	for i := range l.weights {
		l.weights[i] = make([]float64, output)
	}
	return l
}

// Feed forwards the input through the network and returns the output.
func (l *layer) feedForward(input []float64, activationFunc func(float64) float64) ([]float64, error) {
	if len(input) != l.input {
		return nil, errors.New("Input length does not match layer input length")
	}

	output := make([]float64, l.output)
	for j := 0; j < l.output; j++ {
		sum := l.biases[j]
		for i := 0; i < l.input; i++ {
			sum += l.weights[i][j] * input[i]
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
