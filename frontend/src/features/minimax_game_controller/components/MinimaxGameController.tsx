import { useEffect, useMemo, useReducer, useRef } from "react";
import useEventQueue from "../hooks/useEventQueue";

import retry from "../../../shared/utils/retry";
import sleep from "../../../shared/utils/sleep";
import { type Game } from "../../../shared/types";
import { ErrorMessage } from "../../../shared/components";
import { MinimaxGameBoard } from "../../../features/minimax_game_board";

import { MINIMAX_GAME_STATES, EVENT_TYPES, type MinimaxGameState, type Event } from "../types";

const ANIMATION_STEP_DELAY = 250;

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

async function sendMove(uuid: string, position: number): Promise<Game> {
    const res = await fetch(`/api/v1/game/${uuid}/mm`, {
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
            boardState: data.game.board_state,
            gameType: data.game.game_type,
            name: data.game.name,
            nextPlayerId: data.game.next_player_id,
            player1Piece: data.game.player_1_piece,
            player2Piece: data.game.player_2_piece,
            terminalState: data.game.terminal_state,
            uuid: data.game.uuid,
    }
}

function getGameStateMessage(gameState: MinimaxGameState, game: Game | null): string {
    switch (gameState) {
        case MINIMAX_GAME_STATES.PLAYER_1_TURN:
            return "Your turn, Human!"
        case MINIMAX_GAME_STATES.PLAYER_2_TURN:
            return "The AI is thinking... 🤖"
        case MINIMAX_GAME_STATES.ANIMATING:
            return "The AI is thinking... 🤖"
        case MINIMAX_GAME_STATES.GAME_OVER:
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
        case MINIMAX_GAME_STATES.LOADING:
            return "Loading..."
        case MINIMAX_GAME_STATES.ERROR:
            return "Error"
        default:
            return "Unknown"
    }
}

interface MinimaxGameControllerProps {
    uuid: string;
}

type AgregatedState = {
    state: MinimaxGameState;
    game: Game | null;
}

function reducer(state: AgregatedState, action: Event): AgregatedState {
    switch (action.type) {
        case EVENT_TYPES.ERROR:
            return {
                state: MINIMAX_GAME_STATES.ERROR,
                game: null,
            }
        case EVENT_TYPES.LOAD_GAME:
            return {
                state: action.payload.game.terminalState > 0 ? MINIMAX_GAME_STATES.GAME_OVER : MINIMAX_GAME_STATES.PLAYER_1_TURN,
                game: action.payload.game,
            }
        case EVENT_TYPES.HUMAN_MOVE:
            const newGameState = action.payload.game;
            action.payload.callback(newGameState);
            return {
                state: MINIMAX_GAME_STATES.PLAYER_2_TURN,
                game: state.game,
            }
        case EVENT_TYPES.ANIMATION_STEP:
            const step = action.payload.step;
            const prevGameState = state.game;
            const nextGameState = action.payload.newGameState;
            // Keep AI move from showing in Player 1's board state
            if (step === 0 && prevGameState) {
                const newHumanBoardState = nextGameState.boardState.slice(0, 4)
                const prevComputerBoardState = prevGameState.boardState.slice(4, 8)
                prevGameState.boardState = newHumanBoardState.concat(prevComputerBoardState)
            }
            // Handle the game ending before AI's turn
            if (nextGameState?.terminalState === 1) {
                return {
                    state: MINIMAX_GAME_STATES.GAME_OVER,
                    game: nextGameState,
                }
            }

            // Append the next animation step to the queue
            if (step < 1) action.payload.callback(nextGameState);

            // Handle the game ending after AI's turn
            let nextState = MINIMAX_GAME_STATES.ANIMATING;
            if (step >= 1 && nextGameState?.terminalState === 0) {
                nextState = MINIMAX_GAME_STATES.PLAYER_1_TURN;
            }
            if (step >= 1 && (nextGameState?.terminalState === 2 || nextGameState?.terminalState === 3)) {
                nextState = MINIMAX_GAME_STATES.GAME_OVER;
            }
            return {
                state: nextState,
                game: step === 1 ? nextGameState : prevGameState,
            }
        default:
            console.warn("Unknown event type");
            return state;
    }
}

export default function NNGameController({ uuid }: MinimaxGameControllerProps) {
    const refLoading = useRef(false);
    const [state, dispatch] = useReducer(reducer, { state: MINIMAX_GAME_STATES.LOADING, game: null });
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
                    const game = await retry(async () => await sendMove(uuid, event.payload.position));
                    dispatch({ type: EVENT_TYPES.HUMAN_MOVE, payload: { game: game, callback: event.payload.callback } });
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
                        callback: (newGameState: Game) => enqueue({
                            type: EVENT_TYPES.ANIMATION_STEP,
                            payload: { step: step + 1, newGameState: newGameState }
                        })
                    }
                });
                break;
            default:
                console.warn("Unknown event type");
        }
    });

    useEffect(() => {
        if (state.state === MINIMAX_GAME_STATES.LOADING && !refLoading.current) {
            refLoading.current = true;
            enqueue({ type: EVENT_TYPES.LOAD_GAME, payload: {} });
        }
        if (!isProcessing) {
            processNext();
        }
        const interval = setInterval(() => processNext(), 100);
        return () => clearInterval(interval)
    }, [isProcessing, state.state]);

    if (state.state === MINIMAX_GAME_STATES.LOADING) {
        return (
            <div className="flex flex-col items-center justify-center w-100 h-124 bg-slate-500/60 rounded-xl shadow-2xl">
                <p className="text-center text-amber-500 text-shadow-md text-shadow-amber-900 animate-ping">Loading...</p>
            </div>
        )
    }

    if (state.state === MINIMAX_GAME_STATES.ERROR) {
        return <ErrorMessage />
    }

    return (
        <>
            <p className={`w-82 md:w-102 px-4 py-2 mb-2 border-2 border-amber-500/80 rounded-full 
                text-2xl text-center text-amber-500 bg-slate-500 text-shadow-md text-shadow-amber-900 
                ${state.state === MINIMAX_GAME_STATES.PLAYER_2_TURN || state.state === MINIMAX_GAME_STATES.ANIMATING ? "animate-pulse" : ""}
                shadow-inner`}>
                {getGameStateMessage(state.state, state.game)}
            </p>
            <MinimaxGameBoard
                gameTitle={state.game?.name}
                gameState={state.state}
                boardState={bitBoard}
                p1Piece={state.game?.player1Piece}
                p2Piece={state.game?.player2Piece}
                playMove={(position: number) => {
                    enqueue({
                        type: EVENT_TYPES.HUMAN_MOVE, payload: {
                            position: position,
                            callback: (newGameState: Game) => enqueue({ type: EVENT_TYPES.ANIMATION_STEP, payload: { step: 0, newGameState: newGameState } })
                        }
                    });
                }}
            />
        </>
    )
}
