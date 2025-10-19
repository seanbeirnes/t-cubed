import { createContext, useEffect, useMemo, useReducer, useRef, useState} from "react";
import useEventQueue from "../hooks/useEventQueue";

import retry from "../../../shared/utils/retry";

import { type Game } from "../../../shared/types";
import { NN_GAME_STATES, EVENT_TYPES, type NNGameState, type HoveredNeuron, type NNHoverState, type Event } from "../types";
import type { Layer } from "../../../features/nn_animation_panel";

import { NNGameBoard } from "../../../features/nn_game_board";
import { NNAnimationPanel } from "../../../features/nn_animation_panel";
import { ErrorMessage } from "../../../shared/components";
import { OVERRIDE_EXPANDED_STATE, type OverrideExpandedState } from "../../nn_animation_panel/types";
import sleep from "../../../shared/utils/sleep";

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
        if (bitBoardIndex === p1EndIndex) {
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

async function sendMove(uuid: string, position: number): Promise<{ game: Game, trace: number[], rankedMoves: number[] }> {
    const res = await fetch(`/api/v1/game/${uuid}/nn`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({ player_id: String(1), position: String(position) }),
    })
    if (!res.ok) {
        throw new Error('Failed to send move')
    }
    const data = await res.json()
    return {
        game: {
            boardState: data.game.board_state,
            gameType: data.game.game_type,
            name: data.game.name,
            nextPlayerId: data.game.next_player_id,
            player1Piece: data.game.player_1_piece,
            player2Piece: data.game.player_2_piece,
            terminalState: data.game.terminal_state,
            uuid: data.game.uuid,
        },
        trace: data.trace.layerOutputs,
        rankedMoves: data.ranked_moves,
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
            return "The AI is thinking... 🤖"
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
            return "The AI is thinking... 🤖"
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

type AgregatedState = {
    state: NNGameState;
    game: Game | null;
    network: Layer[];
    trace: number[][] | null;
    rankedMoves: number[] | null;
}

function animateNetwork(step: number, network: Layer[], trace: number[][] | null): Layer[] {
    if (!trace) return network;
    switch (step) {
        case 0:
            return network;
        case 1:
            network[1].activations = trace[1];
            return network;
        case 2:
            network[2].activations = trace[2];
            return network;
        case 3:
            network[3].activations = trace[3];
            return network;
        case 4:
            network[4].activations = trace[4];
            return network;
        default:
            return network;
    }
}

function reducer(state: AgregatedState, action: Event): AgregatedState {
    switch (action.type) {
        case EVENT_TYPES.LOAD_GAME:
            return {
                state: NN_GAME_STATES.PLAYER_1_TURN,
                game: action.payload.game,
                network: getEmptyNetwork(),
                trace: null,
                rankedMoves: null,
            }
        case EVENT_TYPES.HUMAN_MOVE:
            return {
                state: NN_GAME_STATES.PLAYER_2_TURN,
                game: action.payload.game,
                network: state.network,
                trace: action.payload.trace,
                rankedMoves: action.payload.rankedMoves,
            }
        case EVENT_TYPES.ANIMATION_STEP:
            const step = action.payload.step;
            action.payload.callback();
            return {
                state: step < 4 ? NN_GAME_STATES.ANIMATING : NN_GAME_STATES.PLAYER_1_TURN,
                game: state.game,
                network: animateNetwork(step, state.network, state.trace),
                trace: state.trace,
                rankedMoves: state.rankedMoves,
            }
        default:
            console.warn("Unknown event type");
            return state;
    }
}

export default function NNGameController({ uuid, animationPanelWidth }: NNGameControllerProps) {
    const refLoading = useRef(false);
    const [hoveredCell, setHoveredCell] = useState<number | null>(null);
    const [hoveredNeuron, setHoveredNeuron] = useState<HoveredNeuron | null>(null);
    const [state, dispatch] = useReducer(reducer, { state: NN_GAME_STATES.LOADING, game: null, network: getEmptyNetwork(), trace: null, rankedMoves: null });
    const bitBoard = useMemo(() => boardBitsFromHex(state.game?.boardState || "00000000"), [state.game?.boardState]);
    const { enqueue, processNext, isProcessing } = useEventQueue(async (event: Event) => {
        switch (event.type) {
            case EVENT_TYPES.LOAD_GAME:
                const currGame = await retry(async () => await fetchGame(uuid));
                dispatch({ type: EVENT_TYPES.LOAD_GAME, payload: { game: currGame } });
                break;
            case EVENT_TYPES.HUMAN_MOVE:
                const { game, trace, rankedMoves } = await retry(async () => await sendMove(uuid, event.payload.position));
                dispatch({ type: EVENT_TYPES.HUMAN_MOVE, payload: { game: game, trace: trace, rankedMoves: rankedMoves } });
                break;
            case EVENT_TYPES.ANIMATION_STEP:
                const step = event.payload.step;
                if (step === 0) {
                    await sleep(10)
                } else if (step === 1) {
                    await sleep(1200)
                } else {
                    await sleep(100)
                }
                dispatch({ type: EVENT_TYPES.ANIMATION_STEP, payload: 
                    {step: event.payload.step, callback: () => enqueue({type: EVENT_TYPES.ANIMATION_STEP, payload: {step: step + 1}})}
                });
                break;
            default:
                console.warn("Unknown event type");
        }
    });

    useEffect(() => {
        if (state.state === NN_GAME_STATES.LOADING && !refLoading.current) {
            refLoading.current = true;
            enqueue({ type: EVENT_TYPES.LOAD_GAME, payload: {} });
        }
        if (state.state === NN_GAME_STATES.PLAYER_2_TURN) {
            enqueue({ type: EVENT_TYPES.ANIMATION_STEP, payload: {step: 0} });
        }
        if (!isProcessing) {
            processNext();
        }
        const interval = setInterval(() => processNext(), 100);
        return () => clearInterval(interval)
    }, [isProcessing, state.state]);
    if (state.state === NN_GAME_STATES.LOADING) {
        return <div>Loading...</div>
    }

    if (state.state === NN_GAME_STATES.ERROR) {
        return <ErrorMessage />
    }

    setInputLayerActivations(state.network, bitBoard)

    return (
        <NNHoverStateContext.Provider value={{
            hoveredCell,
            hoveredNeuron,
            setHoveredCell,
            setHoveredNeuron,
        }} >
            <p className={`w-100 px-4 py-2 mb-2 border-2 border-amber-500/80 rounded-full 
                text-2xl text-center text-amber-500 bg-slate-500 text-shadow-md text-shadow-amber-900 
                ${state.state === NN_GAME_STATES.PLAYER_2_TURN || state.state === NN_GAME_STATES.ANIMATING ? "animate-pulse" : ""}
                shadow-inner`}>
                {getGameStateMessage(state.state, state.game)}
            </p>
            <NNGameBoard
                gameTitle={state.game?.name}
                boardState={bitBoard}
                p1Piece={state.game?.player1Piece}
                p2Piece={state.game?.player2Piece}
                playMove={(position: number) => {
                    enqueue({ type: EVENT_TYPES.HUMAN_MOVE, payload: { position: position } });
                }}
            />
            <NNAnimationPanel width={animationPanelWidth} network={state.network} overrideExpandedState={getOverrideExpandedState(state.state, state.network)} />
        </NNHoverStateContext.Provider>
    )
}
