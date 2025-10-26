import { createContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import useEventQueue from "../hooks/useEventQueue";

import retry from "../../../shared/utils/retry";
import boardBitsFromHex from "../../../shared/utils/bitboard";

import { type Game, type MoveRecord } from "../../../shared/types";
import { NN_GAME_STATES, EVENT_TYPES, type NNGameState, type HoveredNeuron, type NNHoverState, type Event } from "../types";
import type { Layer } from "../../../features/nn_animation_panel";

import { NNGameBoard } from "../../../features/nn_game_board";
import { NNAnimationPanel } from "../../../features/nn_animation_panel";
import { ErrorMessage } from "../../../shared/components";
import { OVERRIDE_EXPANDED_STATE, type OverrideExpandedState } from "../../nn_animation_panel/types";
import sleep from "../../../shared/utils/sleep";
import MoveHistoryControls from "./MoveHistoryControls";

const ANIMATION_STEP_DELAY = 500;

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

type AgregatedState = {
    state: NNGameState;
    game: Game | null;
    network: Layer[];
    trace: number[][] | null;
    rankedMoves: number[] | null;
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
        trace: data.trace !== null ? data.trace.layerOutputs : null,
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

function getOverrideExpandedState(state: AgregatedState): OverrideExpandedState {
    switch (state.state) {
        case NN_GAME_STATES.PLAYER_1_TURN:
            // Do not allow the panel to expand if there is no network trace
            if (state.trace === null) {
                return OVERRIDE_EXPANDED_STATE.CLOSED
            }
            return OVERRIDE_EXPANDED_STATE.NONE;
        case NN_GAME_STATES.PLAYER_2_TURN:
            // While the AI is thinking, disable expanding the panel
            return OVERRIDE_EXPANDED_STATE.CLOSED
        case NN_GAME_STATES.ANIMATING:
            // While the AI is animating, keep the panel open
            return OVERRIDE_EXPANDED_STATE.OPEN
        case NN_GAME_STATES.GAME_OVER:
            // Do not allow the panel to expand if there is no network trace
            if (state.trace === null) {
                return OVERRIDE_EXPANDED_STATE.CLOSED
            }
            return OVERRIDE_EXPANDED_STATE.NONE
        default:
            return OVERRIDE_EXPANDED_STATE.NONE
    }
}

function getGameStateMessage(gameState: NNGameState, terminalState: number | undefined): string {
    const MSG_HUMAN_TURN = "Your turn, Human!"
    const MSG_AI_TURN = "The AI is thinking... 🤖"
    const MSG_HUMAN_WINS = "Human wins!"
    const MSG_AI_WINS = "AI wins!"
    const MSG_DRAW = "Draw!"
    const MSG_LOADING = "Loading..."
    const MSG_ERROR = "Error"

    switch (gameState) {
        case NN_GAME_STATES.PLAYER_1_TURN:
            return MSG_HUMAN_TURN
        case NN_GAME_STATES.PLAYER_2_TURN:
            return MSG_AI_TURN
        case NN_GAME_STATES.GAME_OVER:
            switch (terminalState) {
                case 1:
                    return MSG_HUMAN_WINS
                case 2:
                    return MSG_AI_WINS
                case 3:
                    return MSG_DRAW
                default:
                    return MSG_ERROR
            }
        case NN_GAME_STATES.ANIMATING:
            return MSG_AI_TURN
        case NN_GAME_STATES.LOADING:
            return MSG_LOADING
        case NN_GAME_STATES.ERROR:
            return MSG_ERROR
        default:
            return MSG_ERROR
    }
}

function animateNetwork(step: number, boardState: string, network: Layer[], trace: number[][] | null): Layer[] {
    if (!trace) return network;
    switch (step) {
        case 0:
            network = getEmptyNetwork();
            setInputLayerActivations(network, boardBitsFromHex(boardState));
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
        case EVENT_TYPES.ERROR:
            return {
                state: NN_GAME_STATES.ERROR,
                game: null,
                network: getEmptyNetwork(),
                trace: null,
                rankedMoves: null,
            }

        case EVENT_TYPES.LOAD_GAME:
            const newNetwork = getEmptyNetwork();
            setInputLayerActivations(newNetwork, boardBitsFromHex(action.payload.game.boardState));

            return {
                state: action.payload.game.terminalState > 0 ? NN_GAME_STATES.GAME_OVER : NN_GAME_STATES.PLAYER_1_TURN,
                game: action.payload.game,
                network: newNetwork,
                trace: null,
                rankedMoves: null,
            }

        case EVENT_TYPES.HUMAN_MOVE:
            // If the AI did not need to make a move (draw or Human won), end the game without animating
            if (action.payload.trace === null && action.payload.rankedMoves === null) {
                return {
                    state: NN_GAME_STATES.GAME_OVER,
                    game: action.payload.game,
                    network: state.network,
                    trace: null,
                    rankedMoves: null,
                }
            }

            // Call the callback to start animation steps, but don't update the board or ranked moves yet
            action.payload.callback(action.payload.game, action.payload.rankedMoves);

            return {
                state: NN_GAME_STATES.PLAYER_2_TURN,
                game: state.game,
                network: state.network,
                trace: action.payload.trace,
                rankedMoves: state.rankedMoves,
            }

        case EVENT_TYPES.SET_MOVE_HISTORY:
            const moveRecord = action.payload as MoveRecord

            // Update the board state
            const updatedGameState = state.game
            if (updatedGameState) {
                updatedGameState.boardState = moveRecord.move_event.post_move_state
            }
            const updatedNetwork = state.network
            if (moveRecord.trace) {
                moveRecord.trace.layerOutputs.forEach((layer, i) => {
                    updatedNetwork[i].activations = layer
                })
            }
            return {
                ...state,
                game: updatedGameState,
                network: updatedNetwork,
                trace: moveRecord.trace ? moveRecord.trace.layerOutputs : null,
            }

        case EVENT_TYPES.ANIMATION_STEP:
            const step = action.payload.step;
            const prevGameState = state.game;
            const nextGameState = action.payload.newGameState;
            const nextRankedMoves = action.payload.rankedMoves;

            // Keep AI move from showing in Player 1's board state
            if (step === 0 && prevGameState) {
                const newHumanBoardState = nextGameState.boardState.slice(0, 4)
                const prevComputerBoardState = prevGameState.boardState.slice(4, 8)
                prevGameState.boardState = newHumanBoardState.concat(prevComputerBoardState)
            }

            // Handle the game ending before AI's turn
            if (nextGameState?.terminalState === 1) {
                return {
                    state: NN_GAME_STATES.GAME_OVER,
                    game: nextGameState,
                    network: state.network,
                    trace: state.trace,
                    rankedMoves: nextRankedMoves,
                }
            }

            // Append the next animation step to the queue
            if (step < 4) action.payload.callback(nextGameState, nextRankedMoves);

            // Handle the game ending after AI's turn
            let nextState = NN_GAME_STATES.ANIMATING;
            if (step > 3 && nextGameState?.terminalState === 0) {
                nextState = NN_GAME_STATES.PLAYER_1_TURN;
            }
            if (step > 3 && (nextGameState?.terminalState === 2 || nextGameState?.terminalState === 3)) {
                nextState = NN_GAME_STATES.GAME_OVER;
            }
            return {
                state: nextState,
                game: step === 4 ? nextGameState : prevGameState,
                network: animateNetwork(step, prevGameState?.boardState || "00000000", state.network, state.trace),
                trace: state.trace,
                rankedMoves: step === 4 ? nextRankedMoves : state.rankedMoves,
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
                try {
                    const currGame = await retry(async () => await fetchGame(uuid));
                    dispatch({ type: EVENT_TYPES.LOAD_GAME, payload: { game: currGame } });
                } catch (error) {
                    dispatch({ type: EVENT_TYPES.ERROR, payload: { error: error } });
                    return;
                }
                break;
            case EVENT_TYPES.HUMAN_MOVE:
                try {
                    const { game, trace, rankedMoves } = await retry(async () => await sendMove(uuid, event.payload.position));
                    dispatch({ type: EVENT_TYPES.HUMAN_MOVE, payload: { game: game, trace: trace, rankedMoves: rankedMoves, callback: event.payload.callback } });
                } catch (error) {
                    dispatch({ type: EVENT_TYPES.ERROR, payload: { error: error } });
                    return;
                }
                break;
            case EVENT_TYPES.ANIMATION_STEP:
                const step = event.payload.step;
                if (step > 0) {
                    await sleep(ANIMATION_STEP_DELAY)
                }
                dispatch({
                    type: EVENT_TYPES.ANIMATION_STEP, payload:
                    {
                        step: event.payload.step,
                        newGameState: event.payload.newGameState,
                        rankedMoves: event.payload.rankedMoves,
                        callback: (newGameState: Game, rankedMoves: number[]) => enqueue({
                            type: EVENT_TYPES.ANIMATION_STEP,
                            payload: { step: step + 1, newGameState: newGameState, rankedMoves: rankedMoves }
                        })
                    }
                });
                break;
            default:
                console.warn("Unknown event type");
        }
    });

    // useEffect runs the game loop by checking if the event queue needs processing
    useEffect(() => {
        if (state.state === NN_GAME_STATES.LOADING && !refLoading.current) {
            refLoading.current = true;
            enqueue({ type: EVENT_TYPES.LOAD_GAME, payload: {} });
        }
        if (!isProcessing) {
            processNext();
        }
        const interval = setInterval(() => processNext(), 100);
        return () => clearInterval(interval)
    }, [isProcessing, state.state]);

    if (state.state === NN_GAME_STATES.LOADING) {
        return (
            <div className="flex flex-col items-center justify-center w-100 h-124 bg-slate-500/60 rounded-xl shadow-2xl">
                <p className="text-center text-amber-500 text-shadow-md text-shadow-amber-900 animate-ping">Loading...</p>
            </div>
        )
    }

    if (state.state === NN_GAME_STATES.ERROR) {
        return <ErrorMessage />
    }

    return (
        <NNHoverStateContext.Provider value={{
            hoveredCell,
            hoveredNeuron,
            setHoveredCell,
            setHoveredNeuron,
        }} >
            <p className={`w-82 md:w-102 px-4 py-2 mb-2 border-2 border-amber-500/80 rounded-full 
                text-2xl text-center text-amber-500 bg-slate-500 text-shadow-md text-shadow-amber-900 
                ${state.state === NN_GAME_STATES.PLAYER_2_TURN || state.state === NN_GAME_STATES.ANIMATING ? "animate-pulse" : ""}
                shadow-inner`}>
                {getGameStateMessage(state.state, state.game?.terminalState)}
            </p>
            {state.state === NN_GAME_STATES.GAME_OVER && <MoveHistoryControls 
                game={state.game} 
                onMoveSelected={(moveRecord) => dispatch({ type: EVENT_TYPES.SET_MOVE_HISTORY, payload: moveRecord })}
            />}
            <NNGameBoard
                gameTitle={state.game?.name}
                gameState={state.state}
                boardState={bitBoard}
                p1Piece={state.game?.player1Piece}
                p2Piece={state.game?.player2Piece}
                rankedMoves={state.rankedMoves}
                playMove={(position: number) => {
                    enqueue({
                        type: EVENT_TYPES.HUMAN_MOVE, payload: {
                            position: position,
                            callback: (newGameState: Game, rankedMoves: number[]) => enqueue({ 
                                type: EVENT_TYPES.ANIMATION_STEP,
                                payload: { step: 0, newGameState: newGameState, rankedMoves: rankedMoves } })
                        }
                    });
                }}
            />
            <NNAnimationPanel width={animationPanelWidth} network={state.network} overrideExpandedState={getOverrideExpandedState(state)} />
        </NNHoverStateContext.Provider>
    )
}
