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
    LOADING: "LOADING",
    PLAYER_1_TURN: "PLAYER_1_TURN",
    PLAYER_2_TURN: "PLAYER_2_TURN",
    ANIMATING: "ANIMATING",
    GAME_OVER: "GAME_OVER",
    ERROR: "ERROR",
}

export type NNGameState = typeof NN_GAME_STATES[keyof typeof NN_GAME_STATES];

export const EVENT_TYPES = {
    ERROR: "ERROR",
    LOAD_GAME: "LOAD_GAME",
    HUMAN_MOVE: "HUMAN_MOVE",
    ANIMATION_STEP: "ANIMATION_STEP",
    TERMINAL_STATE: "TERMINAL_STATE",
}

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];

export type Event = {
    type: EventType;
    payload: any;
}
