package ai

import (
	"testing"
)

func TestNewTrainingNetwork_DetailedShapes(t *testing.T) {
	// Create a test network: 3 inputs -> 4 hidden -> 2 outputs
	n, err := NewNetwork(3, 4, 2)
	if err != nil {
		t.Fatalf("NewNetwork failed: %v", err)
	}

	lr := 0.01
	ct := 0.001
	tn := newTrainingNetwork(n, lr, ct)

	if tn == nil {
		t.Fatalf("newTrainingNetwork returned nil")
	}

	// Test basic properties
	if tn.network != n {
		t.Errorf("network pointer not preserved")
	}
	if tn.learningRate != lr {
		t.Errorf("learningRate = %v, want %v", tn.learningRate, lr)
	}
	if tn.costThreshold != ct {
		t.Errorf("costThreshold = %v, want %v", tn.costThreshold, ct)
	}

	// Test slice lengths match number of layers
	numLayers := len(n.Layers) // Should be 2 layers
	if len(tn.layerCaches) != numLayers {
		t.Errorf("layerCaches length = %d, want %d", len(tn.layerCaches), numLayers)
	}
	if len(tn.deltaCache) != numLayers {
		t.Errorf("deltaCache length = %d, want %d", len(tn.deltaCache), numLayers)
	}
	if len(tn.wGradients) != numLayers {
		t.Errorf("wGradients length = %d, want %d", len(tn.wGradients), numLayers)
	}
	if len(tn.bGradients) != numLayers {
		t.Errorf("bGradients length = %d, want %d", len(tn.bGradients), numLayers)
	}

	// Test inner shapes for each layer
	for i, layer := range n.Layers {
		// Test layerCache shapes
		if tn.layerCaches[i] == nil {
			t.Errorf("layerCaches[%d] is nil", i)
			continue
		}
		if len(tn.layerCaches[i].As) != layer.Output {
			t.Errorf("layerCaches[%d].As length = %d, want %d", i, len(tn.layerCaches[i].As), layer.Output)
		}
		if len(tn.layerCaches[i].Zs) != layer.Output {
			t.Errorf("layerCaches[%d].Zs length = %d, want %d", i, len(tn.layerCaches[i].Zs), layer.Output)
		}

		// Test deltaCache shapes
		if len(tn.deltaCache[i]) != layer.Output {
			t.Errorf("deltaCache[%d] length = %d, want %d", i, len(tn.deltaCache[i]), layer.Output)
		}

		// Test weight gradients shapes
		if len(tn.wGradients[i]) != layer.Input {
			t.Errorf("wGradients[%d] outer length = %d, want %d", i, len(tn.wGradients[i]), layer.Input)
		} else {
			for j := 0; j < layer.Input; j++ {
				if len(tn.wGradients[i][j]) != layer.Output {
					t.Errorf("wGradients[%d][%d] length = %d, want %d", i, j, len(tn.wGradients[i][j]), layer.Output)
				}
			}
		}

		// Test bias gradients shapes
		if len(tn.bGradients[i]) != layer.Output {
			t.Errorf("bGradients[%d] length = %d, want %d", i, len(tn.bGradients[i]), layer.Output)
		}
	}
}

func TestNewTrainingNetwork_ZeroInitialization(t *testing.T) {
	n, err := NewNetwork(2, 3, 1)
	if err != nil {
		t.Fatalf("NewNetwork failed: %v", err)
	}

	tn := newTrainingNetwork(n, 0.1, 0.01)

	// Verify all gradient arrays are zero-initialized
	for i := range tn.wGradients {
		for j := range tn.wGradients[i] {
			for k := range tn.wGradients[i][j] {
				if tn.wGradients[i][j][k] != 0.0 {
					t.Errorf("wGradients[%d][%d][%d] = %v, want 0.0", i, j, k, tn.wGradients[i][j][k])
				}
			}
		}
	}

	for i := range tn.bGradients {
		for j := range tn.bGradients[i] {
			if tn.bGradients[i][j] != 0.0 {
				t.Errorf("bGradients[%d][%d] = %v, want 0.0", i, j, tn.bGradients[i][j])
			}
		}
	}

	for i := range tn.deltaCache {
		for j := range tn.deltaCache[i] {
			if tn.deltaCache[i][j] != 0.0 {
				t.Errorf("deltaCache[%d][%d] = %v, want 0.0", i, j, tn.deltaCache[i][j])
			}
		}
	}
}

func TestNewTrainingNetwork_EdgeCases(t *testing.T) {
	// Test minimal network
	n, err := NewNetwork(1, 1)
	if err != nil {
		t.Fatalf("NewNetwork failed: %v", err)
	}

	tn := newTrainingNetwork(n, 1.0, 0.5)
	if tn == nil {
		t.Fatalf("newTrainingNetwork returned nil for minimal network")
	}

	// Should have exactly 1 layer
	if len(tn.layerCaches) != 1 {
		t.Errorf("Expected 1 layer, got %d", len(tn.layerCaches))
	}

	// Test parameters are set correctly
	if tn.learningRate != 1.0 {
		t.Errorf("learningRate = %v, want 1.0", tn.learningRate)
	}
	if tn.costThreshold != 0.5 {
		t.Errorf("costThreshold = %v, want 0.5", tn.costThreshold)
	}
}
