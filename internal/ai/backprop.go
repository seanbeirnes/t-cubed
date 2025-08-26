package ai

type TrainingExample struct {
	Input  []float64 `json:"input"`
	Target []float64 `json:"target"`
}

type TrainingConfig struct {
	LearningRate  float64 `json:"learningRate"`
	CostThreshold float64 `json:"costThreshold"`
	Epochs        int     `json:"epochs"`
	BatchSize     int     `json:"batchSize"`
	ExamplesDir   string  `json:"examplesDir"`
}

type trainingNetwork struct {
	network *network

	layerCaches []*layerCache
	deltaCache  [][]float64
	wGradients  [][][]float64 // accumulates weight gradients
	bGradients  [][]float64   // accumulates bias gradients

	learningRate  float64
	costThreshold float64
}

func newTrainingNetwork(network *network, learningRate float64, costThreshold float64) *trainingNetwork {
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
		network:       network,
		layerCaches:   layerCaches,
		deltaCache:    deltaCache,
		wGradients:    wGradients,
		bGradients:    bGradients,
		learningRate:  learningRate,
		costThreshold: costThreshold,
	}

	return n
}

func (n *network) Train(trainingConfig *TrainingConfig) error {
	_ = newTrainingNetwork(n, trainingConfig.LearningRate, trainingConfig.CostThreshold)
	return nil
}

func (tn *trainingNetwork) forwardWithCache(x []float64) error {
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
	return nil
}
