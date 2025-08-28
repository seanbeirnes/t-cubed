package ai

import (
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"math/rand"
	"os"
	"path/filepath"
)

type TrainingConfig struct {
	LearningRate  float64 `json:"learningRate"`
	CostThreshold float64 `json:"costThreshold"`
	Epochs        int     `json:"epochs"`
	BatchSize     int     `json:"batchSize"`
	ExamplesDir   string  `json:"examplesDir"`
}

type TrainingExample struct {
	Input  []float64 `json:"input"`
	Target []float64 `json:"target"`
}

type trainingNetwork struct {
	network *network

	layerCaches []*layerCache
	deltaCache  [][]float64
	wGradients  [][][]float64 // accumulates weight gradients
	bGradients  [][]float64   // accumulates bias gradients

	forwardCalled bool
}

func (n *network) Train(trainingConfig *TrainingConfig) error {
	path := filepath.Clean(trainingConfig.ExamplesDir)
	files, err := os.ReadDir(path)
	if err != nil {
		return err
	}

	// Remove directories
	cleanFiles := []os.DirEntry{}
	for _, f := range files {
		if !f.IsDir() {
			cleanFiles = append(cleanFiles, f)
		}
	}
	files = cleanFiles

	tn := newTrainingNetwork(n)

	for epoch := range trainingConfig.Epochs {
		// Shuffle to ensure training does not fit data ordering
		rand.Shuffle(len(files), func(i, j int) {
			files[i], files[j] = files[j], files[i]
		})

		batchIndex := 0
		examplesProcessed := 0
		totalCost := 0.0

		for _, file := range files {
			data, err := os.ReadFile(filepath.Join(path, file.Name()))
			if err != nil {
				return err
			}
			var example TrainingExample
			if err := json.Unmarshal(data, &example); err != nil {
				return err
			}

			// Forward propogate
			if err := tn.forwardWithCache(example.Input); err != nil {
				return err
			}

			totalCost += crossEntropyLoss(tn.layerCaches[len(n.Layers)-1].As, example.Target)

			// Backpropagate
			if err := tn.backward(&example); err != nil {
				return err
			}

			examplesProcessed++
			batchIndex++

			if batchIndex == trainingConfig.BatchSize {
				tn.updateWeights(trainingConfig.LearningRate, trainingConfig.BatchSize)

				message := fmt.Sprintf("Completed batch of %d examples!\n\tEpoch %d: %d examples processed", batchIndex, epoch, examplesProcessed)
				slog.Info(message)

				batchIndex = 0
			}
		}

		if batchIndex > 0 {
			tn.updateWeights(trainingConfig.LearningRate, batchIndex)

			message := fmt.Sprintf("Completed batch of %d examples!\n\tEpoch %d: %d examples processed", batchIndex, epoch, examplesProcessed)
			slog.Info(message)
		}

		avgCost := totalCost / float64(examplesProcessed)
		message := fmt.Sprintf("Epoch %d: Average cost: %f", epoch, avgCost)
		slog.Info(message)

		if avgCost < trainingConfig.CostThreshold {
			message := fmt.Sprintf("Training complete: cost threshold reached (%f < %f)", avgCost, trainingConfig.CostThreshold)
			slog.Info(message)
			return nil
		}
	}

	message := "Training complete: cost threshold not reached"
	slog.Info(message)

	return nil
}

func crossEntropyLoss(predicted, target []float64) float64 {
	eps := 1e-15
	loss := 0.0
	for i := range predicted {
		loss += target[i] * math.Log(predicted[i]+eps)
	}
	return -loss
}

func newTrainingNetwork(network *network) *trainingNetwork {
	numLayers := len(network.Layers)

	layerCaches := make([]*layerCache, numLayers)
	deltaCache := make([][]float64, numLayers)
	wGradients := make([][][]float64, numLayers)
	bGradients := make([][]float64, numLayers)

	// Initialize caches
	for i := range numLayers {
		layerInputs := network.Layers[i].Input
		layerOutputs := network.Layers[i].Output

		// Initialize pre/post activation caches for each layer
		layerCaches[i] = &layerCache{
			As: make([]float64, layerOutputs),
			Zs: make([]float64, layerOutputs),
		}

		// Initialize delta caches for each layer
		deltaCache[i] = make([]float64, layerOutputs)

		// Initialize weight gradients for each layer
		wGradients[i] = make([][]float64, layerInputs)
		for j := range layerInputs {
			wGradients[i][j] = make([]float64, layerOutputs)
		}

		// Initialize bias gradients for each layer
		bGradients[i] = make([]float64, network.Layers[i].Output)
	}

	n := &trainingNetwork{
		network:     network,
		layerCaches: layerCaches,
		deltaCache:  deltaCache,
		wGradients:  wGradients,
		bGradients:  bGradients,
	}

	return n
}

// Forward propagates the input through the network and saves pre/post activations in layerCaches
func (tn *trainingNetwork) forwardWithCache(x []float64) error {
	if tn.forwardCalled {
		return errors.New("forwardWithCache() already called")
	}

	var err error
	out := x

	for i, layer := range tn.network.Layers {
		act := reLU
		if i == len(tn.network.Layers)-1 {
			act = identity // last layer emits logits
		}
		out, err = layer.feedForward(out, act, tn.layerCaches[i])
		if err != nil {
			return err
		}
	}
	// Update last layer cache with softmax output
	out = softmax(out)
	tn.layerCaches[len(tn.network.Layers)-1].As = copySlice(out)

	// Set flag so backward() can be called
	tn.forwardCalled = true
	return nil
}

// Backpropagate the error from the last layer to the first layer.
// Requires forwardWithCache to have been called first.
func (tn *trainingNetwork) backward(trainingExample *TrainingExample) error {
	if !tn.forwardCalled {
		return errors.New("forwardWithCache() must be called before backward()")
	}

	x := trainingExample.Input
	y := trainingExample.Target
	lli := len(tn.network.Layers) - 1 // last layer index

	// Compute deltas and gradients for output layer (derivative of J = softmax + cross-entropy)
	for i := range tn.layerCaches[lli].As {
		delta := tn.layerCaches[lli].As[i] - y[i]
		tn.deltaCache[lli][i] = delta
		for j := range tn.network.Layers[lli].Weights {
			tn.wGradients[lli][j][i] += delta * tn.layerCaches[lli-1].As[j]
		}
		tn.bGradients[lli][i] += delta
	}

	// Compute deltas and gradients for hidden layers (derivative of J = ReLU(W*x + b))
	for i := lli - 1; i >= 0; i-- {
		currentLayerCache := tn.layerCaches[i]
		currentLayerDeltas := tn.deltaCache[i]
		nextLayerDeltas := tn.deltaCache[i+1]
		nextLayerWeights := tn.network.Layers[i+1].Weights

		var previousLayerAs []float64
		if i == 0 {
			previousLayerAs = x // input layer
		} else {
			previousLayerAs = tn.layerCaches[i-1].As
		}

		// Compute deltas for each neuron in current layer
		for j := range currentLayerCache.As {
			sum := 0.0
			for k := range nextLayerDeltas {
				sum += nextLayerDeltas[k] * nextLayerWeights[j][k]
			}
			currentLayerDeltas[j] = sum * reLUDerivative(currentLayerCache.Zs[j])
		}

		// Compute gradients for each neuron in current layer
		for j := range currentLayerDeltas {
			for k := range previousLayerAs {
				tn.wGradients[i][k][j] += currentLayerDeltas[j] * previousLayerAs[k]
			}
			tn.bGradients[i][j] += currentLayerDeltas[j]
		}
	}

	// Reset flag so forwardWithCache() can be called again
	tn.forwardCalled = false

	tn.resetCaches()
	return nil
}

func reLUDerivative(z float64) float64 {
	if z > 0 {
		return 1
	}
	return 0
}

// Resets layerCaches and deltaCache. Should be used after each training example
func (tn *trainingNetwork) resetCaches() {
	for i := range tn.network.Layers {
		if len(tn.layerCaches[i].As) != len(tn.layerCaches[i].Zs) {
			panic("layerCaches length mismatch for As and Zs")
		}
		for j := range tn.layerCaches[i].As {
			tn.layerCaches[i].As[j] = 0
			tn.layerCaches[i].Zs[j] = 0
		}

		for j := range tn.deltaCache[i] {
			tn.deltaCache[i][j] = 0
		}
	}
}

// Updates weights and biases for batch gradient descent
// Should be used after each batch so it can average gradients across many examples
func (tn *trainingNetwork) updateWeights(learningRate float64, batchSize int) {
	scale := learningRate / float64(batchSize)

	for i := range tn.network.Layers {
		// Update weights
		for j := range tn.network.Layers[i].Weights {
			for k := range tn.network.Layers[i].Weights[j] {
				tn.network.Layers[i].Weights[j][k] -= scale * tn.wGradients[i][j][k]
			}
		}
		// Update biases
		for j := range tn.network.Layers[i].Biases {
			tn.network.Layers[i].Biases[j] -= scale * tn.bGradients[i][j]
		}
	}

	tn.resetGradients()
}

// Used to reset gradients after each training batch
func (tn *trainingNetwork) resetGradients() {
	for i := range tn.network.Layers {
		for j := range tn.wGradients[i] {
			for k := range tn.wGradients[i][j] {
				tn.wGradients[i][j][k] = 0
			}
		}

		for j := range tn.bGradients[i] {
			tn.bGradients[i][j] = 0
		}
	}
}
