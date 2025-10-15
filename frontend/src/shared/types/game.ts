import type { GameToken } from "./game-token";

export type Game = {
    boardState: string;
    gameType: "neural_network" | "minimax";
    name: string;
    nextPlayerId: number;
    player1Piece: GameToken;
    player2Piece: GameToken;
    terminalState: number;
    uuid: string;
}
