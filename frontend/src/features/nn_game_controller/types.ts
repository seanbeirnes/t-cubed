export type NNHoverState = {
    hoveredCell: number | null;
    setHoveredCell: ((cell: number | null) => void) | null;
    hoveredNeuron: HoveredNeuron | null;
    setHoveredNeuron: ((neuron: HoveredNeuron | null) => void) | null;
}

export type HoveredNeuron = {
    layerIndex: number,
    neuronIndex: number
} | null;
