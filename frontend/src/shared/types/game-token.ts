export const GAME_TOKENS = {
    X: "X",
    O: "O",
    EMPTY: "_",
}

export type GameToken = typeof GAME_TOKENS[keyof typeof GAME_TOKENS];
