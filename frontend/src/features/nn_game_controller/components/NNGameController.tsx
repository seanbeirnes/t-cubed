import { createContext, useEffect, useState } from "react";

import { type Game } from "../../../shared/types";
import { NN_GAME_STATES, type NNGameState, type HoveredNeuron, type NNHoverState} from "../types";
import type { Layer } from "../../../features/nn_animation_panel";

import { NNGameBoard } from "../../../features/nn_game_board";
import { NNAnimationPanel } from "../../../features/nn_animation_panel";
import { ErrorMessage } from "../../../shared/components";
import { OVERRIDE_EXPANDED_STATE, type OverrideExpandedState } from "../../nn_animation_panel/types";

const initialHoverState: NNHoverState = {
    hoveredCell: null,
    setHoveredCell: null,
    hoveredNeuron: null,
    setHoveredNeuron: null,
}

export const NNHoverStateContext = createContext<NNHoverState>(initialHoverState);

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

function getEmptyNetwork(): Layer[] {
    const makeLayer = (size: number): Layer => ({
        size,
        activations: Array(size).fill(0),
    })
    return [makeLayer(18), makeLayer(32), makeLayer(32), makeLayer(32), makeLayer(9)]
}

function getOverrideExpandedState(gameState: NNGameState, network: Layer[]): OverrideExpandedState {
    switch (gameState) {
        case NN_GAME_STATES.PLAYER_1_TURN:
            // If no moves played, disabled expanding the panel
            return !network[0]?.activations?.includes(1) ? OVERRIDE_EXPANDED_STATE.CLOSED : OVERRIDE_EXPANDED_STATE.NONE;
        case NN_GAME_STATES.PLAYER_2_TURN:
            // While the AI is thinking, disable expanding the panel
            return OVERRIDE_EXPANDED_STATE.CLOSED
        case NN_GAME_STATES.ANIMATING:
            // While the AI is animating, keep the panel open
            return OVERRIDE_EXPANDED_STATE.OPEN
        default:
            return OVERRIDE_EXPANDED_STATE.NONE
    }
}

function getGameStateMessage(gameState: NNGameState, game: Game | null): string {
    switch (gameState) {
        case NN_GAME_STATES.PLAYER_1_TURN:
            return "Your turn, Human!"
        case NN_GAME_STATES.PLAYER_2_TURN:
            return "The AI is thinking... 🤫"
        case NN_GAME_STATES.GAME_OVER:
            switch (game?.terminalState) {
                case 1:
                    return "Human wins!"
                case 2:
                    return "AI wins!"
                case 3:
                    return "Draw!"
                default:
                    return "Unknown"
            }
        case NN_GAME_STATES.ANIMATING:
            return "The AI is thinking... 🤫"
        case NN_GAME_STATES.LOADING:
            return "Loading..."
        case NN_GAME_STATES.ERROR:
            return "Error"
        default:
            return "Unknown"
    }
}

interface NNGameControllerProps {
    uuid: string;
    animationPanelWidth: number;
}

export default function NNGameController({ uuid, animationPanelWidth }: NNGameControllerProps) {
    const [gameState, setGameState] = useState<NNGameState>(NN_GAME_STATES.PLAYER_2_TURN);
    const [game, setGame] = useState<Game | null>(null);
    const [network, setNetwork] = useState<Layer[]>(getEmptyNetwork());
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
    if (gameState === NN_GAME_STATES.LOADING) {
        return <div>Loading...</div>
    }

    if (gameState === NN_GAME_STATES.ERROR) {
        return <ErrorMessage />
    }

    return (
        <NNHoverStateContext.Provider value={{
            hoveredCell,
            hoveredNeuron,
            setHoveredCell,
            setHoveredNeuron,
        }} >
            <p className={`w-100 px-4 py-2 mb-2 border-2 border-amber-500/80 rounded-full 
                text-2xl text-center text-amber-500 bg-slate-500 text-shadow-md text-shadow-amber-900 
                ${gameState === NN_GAME_STATES.PLAYER_2_TURN || gameState === NN_GAME_STATES.ANIMATING ? "animate-pulse" : ""}
                shadow-inner`}>
                {getGameStateMessage(gameState, game)}
            </p>
            <NNGameBoard
                gameTitle={game?.name} 
                boardState={bitBoard}
                p1Piece={game?.player1Piece}
                p2Piece={game?.player2Piece}
            />
            <NNAnimationPanel width={animationPanelWidth} network={network} overrideExpandedState={getOverrideExpandedState(gameState, network)} />
        </NNHoverStateContext.Provider>
    )
}
