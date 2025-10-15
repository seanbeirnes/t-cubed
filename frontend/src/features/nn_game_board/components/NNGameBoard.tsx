import { type GameToken, GAME_TOKENS } from "../../../shared/types";

import { ErrorMessage } from "../../../shared/components";

import BoardHeader from "./BoardHeader";
import BoardGrid from "./BoardGrid";
import BoardFrame from "./BoardFrame";
import InfoBlurb from "./InfoBlurb";

import { getWinningLine, validateBoardState, validateTokens } from "./utils";

// Converts a 32-bit array (16 bits P1, 16 bits P2) to GameToken[] of len 9
// Least significant bit is first
function boardStateFromBits(bits: number[], p1Piece: GameToken, p2Piece: GameToken): GameToken[] {
    // Split into bitboards
    const bitsP1: number[] = bits.slice(7, 16)
    const bitsP2: number[] = bits.slice(23, 32)

    // Convert 1s to tokens
    const boardState: GameToken[] = [
        GAME_TOKENS.EMPTY, GAME_TOKENS.EMPTY, GAME_TOKENS.EMPTY,
        GAME_TOKENS.EMPTY, GAME_TOKENS.EMPTY, GAME_TOKENS.EMPTY,
        GAME_TOKENS.EMPTY, GAME_TOKENS.EMPTY, GAME_TOKENS.EMPTY
    ]
    // Must go from right to left to start at least significant bit
    for (let i = 8; i >= 0; i--) {
        const p1Bit = bitsP1[i]
        const p2Bit = bitsP2[i]
        if (p1Bit === 1 && p2Bit === 1) {
            throw new Error('Conflicting player pieces')
        }
        if (p1Bit === 1) {
            boardState[i] = p1Piece
        } else if (p2Bit === 1) {
            boardState[i] = p2Piece
        }
    }
    return boardState
}

interface NNGameBoardProps {
    gameTitle: string | undefined;
    boardState: number[] | undefined;
    p1Piece: string | undefined; // Human
    p2Piece: string | undefined; // AI
}

export default function NNGameBoard({ gameTitle, boardState, p1Piece, p2Piece }: NNGameBoardProps) {
    if (!boardState || !p1Piece || !p2Piece) {
        boardState = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        p1Piece = "X"
        p2Piece = "O"
    }

    const board = boardStateFromBits(boardState, p1Piece, p2Piece)

    if (!validateBoardState(board) || !validateTokens(p1Piece, p2Piece)) {
        return (
            <div className="flex flex-col items-center justify-center w-100 h-124 bg-slate-600/60 rounded-xl shadow-2xl">
                <ErrorMessage />
            </div>
        );
    }

    const winningLine = getWinningLine(board);

    return (
        <div
            className="relative w-82 md:w-102 h-103 md:h-120 rounded-2xl shadow-xl overflow-hidden"
            aria-label="Tic Tac Toe game board"
            role="region"
        >
            <div className="absolute -inset-10 bg-gradient-to-br from-slate-800 via-slate-600 to-slate-900" />

            <div className="relative p-4">
                <BoardHeader gameTitle={gameTitle} humanToken={p1Piece} aiToken={p2Piece} />

                <BoardFrame ariaLabel="3 by 3 game board">
                    <BoardGrid boardState={board} winningLine={winningLine} />
                </BoardFrame>

                <InfoBlurb />
            </div>
        </div>
    );
}
