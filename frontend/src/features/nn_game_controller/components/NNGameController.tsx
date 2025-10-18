import { createContext, useEffect, useState } from "react";

import { type Game } from "../../../shared/types";
import type { HoveredNeuron, NNHoverState } from "../types";
import type { Layer } from "../../../features/nn_animation_panel";

import { NNGameBoard } from "../../../features/nn_game_board";
import { NNAnimationPanel } from "../../../features/nn_animation_panel";

const network: Layer[] = [
    {
        size: 18,
        activations: [
           0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
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

const initialHoverState: NNHoverState = {
    hoveredCell: null,
    setHoveredCell: null,
    hoveredNeuron: null,
    setHoveredNeuron: null,
}

export const NNHoverStateContext = createContext<NNHoverState>(initialHoverState);

interface NNGameControllerProps {
    uuid: string;
    animationPanelWidth: number;
}

const hexToBitsMap: Record<string, number[]> = {
    "0": [0, 0, 0, 0],
    "1": [0, 0, 0, 1],
    "2": [0, 0, 1, 0],
    "3": [0, 0, 1, 1],
    "4": [0, 1, 0, 0],
    "5": [0, 1, 0, 1],
    "6": [0, 1, 1, 0],
    "7": [0, 1, 1, 1],
    "8": [1, 0, 0, 0],
    "9": [1, 0, 0, 1],
    "A": [1, 0, 1, 0],
    "B": [1, 0, 1, 1],
    "C": [1, 1, 0, 0],
    "D": [1, 1, 0, 1],
    "E": [1, 1, 1, 0],
    "F": [1, 1, 1, 1],
}

// Converts a 32-bit encoded hex string to a 32-bit array (16 bits P1, 16 bits P2)
function boardBitsFromHex(hex: string): number[] {
    if (hex.length !== 8) {
        throw new Error('Invalid board state hex')
    }

    // Convert hex to bits
    const bits: number[] = []
    hex.split('').forEach((char: string) => {
        const nums = hexToBitsMap[char.toUpperCase()]
        if (!nums) {
            throw new Error('Invalid board state hex')
        }
        bits.push(...nums)
    })

    return bits
}

function setInputLayerActivations(network: Layer[], bitBoard: number[]): void {
    if (!bitBoard) {
        console.warn("Invalid board state")
        return
    }

    const inputLayerActivations = network[0]?.activations
    if (!inputLayerActivations) {
        console.warn("Input layer does not exist")
        return
    }
    if (inputLayerActivations.length !== 18) {
        console.warn("Input layer has an unexpected number of neurons")
        return
    }

    // Set activations for player 1 ([7, 15]) and player 2 ([23, 31])
    const p1StartIndex = 15
    const p1EndIndex = 7
    const p2StartIndex = 31
    let bitBoardIndex = p1StartIndex
    inputLayerActivations.forEach((_, i) => {
        inputLayerActivations[i] = bitBoard[bitBoardIndex]
        if (bitBoardIndex ===  p1EndIndex) {
            bitBoardIndex = p2StartIndex
        } else {
            bitBoardIndex--
        }
    })
}

async function fetchGame(uuid: string): Promise<Game> {
    const res = await fetch(`/api/v1/game/${uuid}`)
    if (!res.ok) {
        throw new Error('Failed to fetch game')
    }
    const data = await res.json()
    return {
        boardState: data.board_state,
        gameType: data.game_type,
        name: data.name,
        nextPlayerId: data.next_player_id,
        player1Piece: data.player_1_piece,
        player2Piece: data.player_2_piece,
        terminalState: data.terminal_state,
        uuid: data.uuid,
    }
}

export default function NNGameController({ uuid, animationPanelWidth }: NNGameControllerProps) {
    const [game, setGame] = useState<Game | null>(null);
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);
    const [hoveredNeuron, setHoveredNeuron] = useState<HoveredNeuron | null>(null);

    const bitBoard = boardBitsFromHex(game?.boardState || "00000000")
    setInputLayerActivations(network, bitBoard)

    useEffect(() => {
        const getGame = async () => {
            const data = await fetchGame(uuid)
            setGame(data)
        }
        getGame()

    }, [])
    console.log(game)

    return (
        <NNHoverStateContext.Provider value={{
            hoveredCell,
            hoveredNeuron,
            setHoveredCell,
            setHoveredNeuron,
        }} >
            <NNGameBoard
                gameTitle={game?.name} 
                boardState={bitBoard}
                p1Piece={game?.player1Piece}
                p2Piece={game?.player2Piece}
            />
            <NNAnimationPanel width={animationPanelWidth} network={network} />
        </NNHoverStateContext.Provider>
    )
}
