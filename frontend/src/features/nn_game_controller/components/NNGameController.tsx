import { createContext, useState } from "react";

import type { GameToken } from "../../../shared/types";
import type { HoveredNeuron, NNGameState, NNHoverState } from "../types";
import type { Layer } from "../../../features/nn_animation_panel";

import { NNGameBoard } from "../../../features/nn_game_board";
import { NNAnimationPanel } from "../../../features/nn_animation_panel";

const boardSate: GameToken[] = ["X", "O", "_", "_", "_", "X", "_", "_", "_"]

const network: Layer[] = [
    {
        size: 18,
        activations: [
            0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0,
        ],
    },
    {
        size: 32,
        activations: [
            0.41, 0.88, 0.12, 0.66, 0.27, 0.73, 0.34, 0.51, 0.99, 0.18,
            0.47, 0.62, 0.05, 0.83, 0.39, 0.74, 0.21, 0.56, 0.68, 0.91,
            0.02, 0.77, 0.36, 0.49, 0.15, 0.88, 0.63, 0.05, 0.92, 0.28,
            0.54, 0.79,
        ],
    },
    {
        size: 32,
        activations: [
            0.07, 0.63, 0.52, 0.95, 0.31, 0.48, 0.12, 0.77, 0.84, 0.20,
            0.39, 0.56, 0.68, 0.91, 0.03, 0.72, 0.44, 0.87, 0.29, 0.66,
            0.14, 0.53, 0.98, 0.37, 0.61, 0.19, 0.85, 0.25, 0.79, 0.43,
            0.57, 0.90,
        ],
    },
    {
        size: 32,
        activations: [
            0.22, 0.59, 0.81, 0.14, 0.67, 0.35, 0.92, 0.48, 0.03, 0.76,
            0.41, 0.88, 0.29, 0.55, 0.71, 0.16, 0.64, 0.37, 0.99, 0.23,
            0.50, 0.80, 0.12, 0.68, 0.44, 0.97, 0.31, 0.58, 0.84, 0.07,
            0.61, 0.33,
        ],
    },
    {
        size: 9,
        activations: [0.14, 0.76, 0.33, 0.89, 0.21, 0.65, 0.47, 0.09, 0.38],
    },
];

const initialGameState: NNGameState = {
    boardState: boardSate,
    network: network,
    humanToken: "X",
    aiToken: "O",
    moveRanks: [2, 2, 2, 2, 2, 2, 2, 2, 2],
}

const initialHoverState: NNHoverState = {
    hoveredCell: null,
    setHoveredCell: null,
    hoveredNeuron: null,
    setHoveredNeuron: null,
}

export const NNGameStateContext = createContext<NNGameState>(initialGameState);
export const NNHoverStateContext = createContext<NNHoverState>(initialHoverState);

interface NNGameControllerProps {
    animationPanelWidth: number;
}

export default function NNGameController({ animationPanelWidth }: NNGameControllerProps) {
    const [gameState, setGameState] = useState(initialGameState);
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);
    const [hoveredNeuron, setHoveredNeuron] = useState<HoveredNeuron | null>(null);

    return (
        <NNGameStateContext.Provider value={gameState}>
            <NNHoverStateContext.Provider value={{
                hoveredCell,
                hoveredNeuron,
                setHoveredCell,
                setHoveredNeuron,
            }} >
                <NNGameBoard />
                <NNAnimationPanel width={animationPanelWidth} />
            </NNHoverStateContext.Provider>
        </NNGameStateContext.Provider>
    )
}
