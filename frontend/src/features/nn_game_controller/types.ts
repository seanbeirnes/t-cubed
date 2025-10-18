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

export const NN_GAME_STATES = {
    PLAYER_1_TURN: "PLAYER_1_TURN",
    PLAYER_2_TURN: "PLAYER_2_TURN",
    GAME_OVER: "GAME_OVER",
    ANIMATING: "ANIMATING",
    LOADING: "LOADING",
    ERROR: "ERROR",
}

export type NNGameState = typeof NN_GAME_STATES[keyof typeof NN_GAME_STATES];
