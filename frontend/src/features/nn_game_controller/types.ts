import type { Layer } from "../nn_animation_panel";
import type { GameToken } from "../../shared/types";

export type NNGameState = {
    boardState: GameToken[];
    network: Layer[];
    humanToken: GameToken;
    aiToken: GameToken;
    moveRanks: number[];
}

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
