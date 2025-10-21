import type { GameToken } from "../../../shared/types";
import { GAME_TOKENS } from "../../../shared/types";

export function validateBoardState(boardState: string[]): boolean {
    if (boardState.length !== 9) return false;
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] !== GAME_TOKENS.X && boardState[i] !== GAME_TOKENS.O && boardState[i] !== GAME_TOKENS.EMPTY) {
            return false;
        }
    }
    return true;
}

export function validateTokens(humanToken: GameToken, aiToken: GameToken): boolean {
    return (
        (humanToken === GAME_TOKENS.X && aiToken === GAME_TOKENS.O) ||
        (humanToken === GAME_TOKENS.O && aiToken === GAME_TOKENS.X)
    );
}

export function tokenClasses(token: GameToken, humanToken: GameToken): string {
    const isHuman = token === humanToken;
    const isAi = token !== GAME_TOKENS.EMPTY && token !== humanToken;
    if (isHuman) {
        return "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.65)]";
    }
    if (isAi) {
        return "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.65)]";
    }
    return "text-slate-400/40";
}

export function renderToken(token: GameToken) {
    if (token === GAME_TOKENS.EMPTY) return "";
    return token;
}

export function getWinningLine(boardState: GameToken[]): number[] | null {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
        const va = boardState[a], vb = boardState[b], vc = boardState[c];
        if (va !== "_" && va === vb && vb === vc) {
            return [a, b, c];
        }
    }
    return null;
}
