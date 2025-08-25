package ai

import (
	"encoding/json"
	"math"
	"os"
	"reflect"
	"testing"
)

func almostEqual(a, b, eps float64) bool { return math.Abs(a-b) <= eps }

func TestLayerForward_SimpleOnes(t *testing.T) {
	l := newLayer(3, 2)
	// Weights: 3x2 of ones
	l.Weights = [][]float64{{1, 1}, {1, 1}, {1, 1}}
	l.Biases = []float64{0, 0}
	out, err := l.feedForward([]float64{1, 2, 3}, identity, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(out) != 2 || out[0] != 6 || out[1] != 6 {
		t.Fatalf("expected [6 6], got %#v", out)
	}
}

func TestNetworkForward_TwoLayers_NoReLUOnLast(t *testing.T) {
	n, err := NewNetwork(3, 2, 2) // 3 -> 2 -> 2
	if err != nil {
		t.Fatal(err)
	}

	// Set deterministic Weights
	// Layer 0: 3x2
	n.Layers[0].Weights = [][]float64{{1, 0}, {0, 1}, {1, 1}}
	n.Layers[0].Biases = []float64{0, 0}
	// Layer 1: 2x2
	n.Layers[1].Weights = [][]float64{{1, 2}, {3, 4}}
	n.Layers[1].Biases = []float64{0, 0}

	// Input
	x := []float64{1, 2, 3}
	// Forward
	probs, err := n.Forward(x, nil)
	if err != nil {
		t.Fatal(err)
	}
	if len(probs) != 2 {
		t.Fatalf("expected 2 outputs, got %d", len(probs))
	}

	// Validate softmax sums to 1 and values are sane
	sum := probs[0] + probs[1]
	if !almostEqual(sum, 1.0, 1e-9) {
		t.Fatalf("softmax probabilities must sum to 1, got %f", sum)
	}
}

func TestLoadNetwork(t *testing.T) {
	fpath := "./ffnn_mock.json"
	data := `{ "Layers": [ { "Input": 2, "Output": 3, "Weights": [ [0.1, -0.2, 0.3], [0.4, 0.5, -0.6] ],
"Biases": [0.01, -0.02, 0.03] }, { "Input": 3, "Output": 2, "Weights": [ [0.7, -0.8], [-0.1, 0.2], [0.3, 0.4] ], "Biases": [0.05, -0.05] } ] }`

	if err := os.WriteFile(fpath, []byte(data), 0644); err != nil {
		t.Fatalf("write temp json: %v", err)
	}
	defer func() {
		_ = os.Remove(fpath)
	}()

	n, err := LoadNetwork(fpath)
	if err != nil {
		t.Fatalf("LoadNetwork returned error: %v", err)
	}

	// Basic structural checks
	if got := len(n.Layers); got != 2 {
		t.Fatalf("expected 2 Layers, got %d", got)
	}
	wantDims := []struct{ in, out int }{{2, 3}, {3, 2}}
	for i, want := range wantDims {
		if n.Layers[i].Input != want.in {
			t.Fatalf("layer %d: expected Input %d, got %d", i, want.in, n.Layers[i].Input)
		}
		if n.Layers[i].Output != want.out {
			t.Fatalf("layer %d: expected Output %d, got %d", i, want.out, n.Layers[i].Output)
		}
	}

	// Type checks for Weights and Biases (must be float64)
	assertFloat64 := func(t *testing.T, v interface{}, context string) {
		t.Helper()
		kt := reflect.TypeOf(v).Kind()
		if kt != reflect.Float64 {
			t.Fatalf("%s: expected kind Float64, got %v (%T)", context, kt, v)
		}
	}

	assertFloat64(t, n.Layers[0].Weights[0][0], "layer0.Weights[0][0]")
	assertFloat64(t, n.Layers[1].Weights[0][0], "layer1.Weights[0][0]")
	assertFloat64(t, n.Layers[0].Biases[0], "layer0.Biases[0]")
	assertFloat64(t, n.Layers[1].Biases[0], "layer1.Biases[0]")

	// Value checks (spot-check a few values to ensure correct copying)
	eps := 1e-9
	expectFloat := func(t *testing.T, got, want float64, field string) {
		t.Helper()
		if math.Abs(got-want) > eps {
			t.Fatalf("%s: expected %v, got %v", field, want, got)
		}
	}

	expectFloat(t, n.Layers[0].Weights[0][0], 0.1, "layer0.Weights[0][0]")
	expectFloat(t, n.Layers[0].Weights[1][2], -0.6, "layer0.Weights[1][2]")
	expectFloat(t, n.Layers[1].Weights[2][1], 0.4, "layer1.Weights[2][1]")
	expectFloat(t, n.Layers[0].Biases[1], -0.02, "layer0.Biases[1]")
	expectFloat(t, n.Layers[1].Biases[0], 0.05, "layer1.Biases[0]")
}

func TestSaveAndLoadNetwork(t *testing.T) {
	// build a small deterministic network
	l0 := newLayer(2, 3)
	l0.Weights[0][0], l0.Weights[0][1], l0.Weights[0][2] = 0.1, -0.2, 0.3
	l0.Weights[1][0], l0.Weights[1][1], l0.Weights[1][2] = 0.4, 0.5, -0.6
	l0.Biases[0], l0.Biases[1], l0.Biases[2] = 0.01, -0.02, 0.03

	l1 := newLayer(3, 2)
	l1.Weights[0][0], l1.Weights[0][1] = 0.7, -0.8
	l1.Weights[1][0], l1.Weights[1][1] = -0.1, 0.2
	l1.Weights[2][0], l1.Weights[2][1] = 0.3, 0.4
	l1.Biases[0], l1.Biases[1] = 0.05, -0.05

	n := &network{Layers: []*layer{l0, l1}}

	// save to temp file
	fname := "./ffnn_save_test.json"
	if err := SaveNetwork(fname, n); err != nil {
		t.Fatalf("Save returned error: %v", err)
	}
	defer func() { _ = os.Remove(fname) }()

	// load back
	n2, err := LoadNetwork(fname)
	if err != nil {
		t.Fatalf("LoadNetwork returned error: %v", err)
	}

	// structure checks
	if got := len(n2.Layers); got != len(n.Layers) {
		t.Fatalf("expected %d Layers, got %d", len(n.Layers), got)
	}
	for idx := range n.Layers {
		wantIn, wantOut := n.Layers[idx].Input, n.Layers[idx].Output
		if n2.Layers[idx].Input != wantIn {
			t.Fatalf("layer %d Input: expected %d got %d", idx, wantIn, n2.Layers[idx].Input)
		}
		if n2.Layers[idx].Output != wantOut {
			t.Fatalf("layer %d Output: expected %d got %d", idx, wantOut, n2.Layers[idx].Output)
		}
	}

	// type checks
	isFloat64 := func(v interface{}) bool { return reflect.TypeOf(v).Kind() == reflect.Float64 }
	if !isFloat64(n2.Layers[0].Weights[0][0]) || !isFloat64(n2.Layers[1].Weights[0][0]) {
		t.Fatalf("Weights have wrong kind: %T, %T", n2.Layers[0].Weights[0][0], n2.Layers[1].Weights[0][0])
	}
	if !isFloat64(n2.Layers[0].Biases[0]) || !isFloat64(n2.Layers[1].Biases[0]) {
		t.Fatalf("Biases have wrong kind: %T, %T", n2.Layers[0].Biases[0], n2.Layers[1].Biases[0])
	}

	// value checks (spot-check all entries to be thorough)
	eps := 1e-9
	for li := range n.Layers {
		for i := 0; i < n.Layers[li].Input; i++ {
			for j := 0; j < n.Layers[li].Output; j++ {
				want := n.Layers[li].Weights[i][j]
				got := n2.Layers[li].Weights[i][j]
				if math.Abs(want-got) > eps {
					t.Fatalf("layer %d Weights[%d][%d]: expected %v got %v", li, i, j, want, got)
				}
			}
		}
		for j := 0; j < n.Layers[li].Output; j++ {
			want := n.Layers[li].Biases[j]
			got := n2.Layers[li].Biases[j]
			if math.Abs(want-got) > eps {
				t.Fatalf("layer %d Biases[%d]: expected %v got %v", li, j, want, got)
			}
		}
	}

	// additionally, ensure the file contains valid JSON with expected top-level fields
	b, err := os.ReadFile(fname)
	if err != nil {
		t.Fatalf("read saved file: %v", err)
	}
	var raw struct {
		Layers []struct {
			Input   int           `json:"Input"`
			Output  int           `json:"Output"`
			Weights [][]float64   `json:"Weights"`
			Biases  []float64     `json:"Biases"`
		} `json:"Layers"`
	}
	if err := json.Unmarshal(b, &raw); err != nil {
		t.Fatalf("saved file is not valid json: %v", err)
	}
	if len(raw.Layers) != len(n.Layers) {
		t.Fatalf("saved json Layers mismatch: expected %d got %d", len(n.Layers), len(raw.Layers))
	}
}

func TestForward_TraceRecording(t *testing.T) {
	// Build a deterministic network: 2 inputs -> 2 hidden -> 2 outputs
	n := &network{
		Layers: []*layer{
			{
				Input:   2,
				Output:  2,
				Weights: [][]float64{{1, 0}, {0, 1}},
				Biases:  []float64{0, 0},
			},
			{
				Input:   2,
				Output:  2,
				Weights: [][]float64{{1, 0}, {0, 1}},
				Biases:  []float64{0, 0},
			},
		},
	}

	// Provide a simple input
	in := []float64{1.5, -2.0}

	trace := &ForwardTrace{}
	out, err := n.Forward(in, trace)
	if err != nil {
		t.Fatalf("Forward returned error: %v", err)
	}

	// Because final layer uses identity and softmax is applied to output
	// compute expected final softmax
	// After first layer with ReLU: reLU([1.5, -2.0]) -> [1.5, 0]
	// After second (last) layer identity: [1.5, 0]
	expectedLayer0 := []float64{1.5, -2.0}   // input (copied as-is)
	expectedLayer1 := []float64{1.5, 0.0}    // after first layer (ReLU)
	expectedLayer2 := []float64{1.5, 0.0}    // after second layer before softmax

	// verify trace length (input + number of layers)
	if len(trace.LayerOutputs) != len(n.Layers)+1 {
		t.Fatalf("unexpected trace length: got %d want %d", len(trace.LayerOutputs), len(n.Layers)+1)
	}

	// compare recorded values
	if !reflect.DeepEqual(trace.LayerOutputs[0], expectedLayer0) {
		t.Fatalf("layer 0 mismatch: got %v want %v", trace.LayerOutputs[0], expectedLayer0)
	}
	if !reflect.DeepEqual(trace.LayerOutputs[1], expectedLayer1) {
		t.Fatalf("layer 1 mismatch: got %v want %v", trace.LayerOutputs[1], expectedLayer1)
	}
	if !reflect.DeepEqual(trace.LayerOutputs[2], expectedLayer2) {
		t.Fatalf("layer 2 mismatch: got %v want %v", trace.LayerOutputs[2], expectedLayer2)
	}

	// Validate the returned softmaxed output sums to 1 and matches softmax(expectedLayer2)
	sum := 0.0
	for _, v := range out {
		if v < 0 {
			t.Fatalf("softmax output negative: %v", out)
		}
		sum += v
	}
	if (sum < 0.9999) || (sum > 1.0001) {
		t.Fatalf("softmax outputs do not sum to ~1: sum=%v out=%v", sum, out)
	}
}
