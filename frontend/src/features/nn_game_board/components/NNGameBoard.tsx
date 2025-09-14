import { useContext, useState } from "react";

import { ErrorMessage } from "../../../shared/components";
import { NNGameStateContext } from "../../nn_game_controller";

import BoardHeader from "./BoardHeader";
import BoardGrid from "./BoardGrid";
import BoardFrame from "./BoardFrame";
import InfoBlurb from "./InfoBlurb";

import { getWinningLine, validateBoardState, validateTokens } from "./utils";

export default function NNGameBoard() {
    const gameState = useContext(NNGameStateContext);

    if (!validateBoardState(gameState.boardState) || !validateTokens(gameState.humanToken, gameState.aiToken)) {
        return (
            <div className="flex flex-col items-center justify-center w-100 h-124 bg-slate-600/60 rounded-xl shadow-2xl">
                <ErrorMessage />
            </div>
        );
    }

    const winningLine = getWinningLine(gameState.boardState);

    return (
        <div
            className="relative w-82 md:w-102 h-103 md:h-120 rounded-2xl shadow-xl overflow-hidden"
            aria-label="Tic Tac Toe game board"
            role="region"
        >
            <div className="absolute -inset-10 bg-gradient-to-br from-slate-800 via-slate-600 to-slate-900" />

            <div className="relative p-4">
                <BoardHeader humanToken={gameState.humanToken} aiToken={gameState.aiToken} />

                <BoardFrame ariaLabel="3 by 3 game board">
                    <BoardGrid boardState={gameState.boardState} winningLine={winningLine} />
                </BoardFrame>

                <InfoBlurb />
            </div>
        </div>
    );
}
