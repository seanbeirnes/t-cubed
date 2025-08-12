package ai

import (
	"math"
	"testing"
)

func almostEqual(a, b, eps float64) bool { return math.Abs(a-b) <= eps }

func TestLayerForward_SimpleOnes(t *testing.T) {
	l := newLayer(3, 2)
	// weights: 3x2 of ones
	l.weights = [][]float64{{1,1},{1,1},{1,1}}
	l.biases  = []float64{0,0}
	out, err := l.feedForward([]float64{1,2,3}, identity)
	if err != nil { t.Fatal(err) }
	if len(out) != 2 || out[0] != 6 || out[1] != 6 {
		t.Fatalf("expected [6 6], got %#v", out)
	}
}

func TestNetworkForward_TwoLayers_NoReLUOnLast(t *testing.T) {
	n, err := NewNetwork(3, 2, 2) // 3 -> 2 -> 2
	if err != nil { t.Fatal(err) }

	// Set deterministic weights
	// Layer 0: 3x2
	n.layers[0].weights = [][]float64{{1,0},{0,1},{1,1}}
	n.layers[0].biases  = []float64{0,0}
	// Layer 1: 2x2
	n.layers[1].weights = [][]float64{{1,2},{3,4}}
	n.layers[1].biases  = []float64{0,0}

	// Input
	x := []float64{1, 2, 3}
	// Forward
	probs, err := n.Forward(x)
	if err != nil { t.Fatal(err) }
	if len(probs) != 2 { t.Fatalf("expected 2 outputs, got %d", len(probs)) }

	// Validate softmax sums to 1 and values are sane
	sum := probs[0] + probs[1]
	if !almostEqual(sum, 1.0, 1e-9) {
		t.Fatalf("softmax probabilities must sum to 1, got %f", sum)
	}
}
