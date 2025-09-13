import { useState } from "react";
import { ErrorMessage } from "../../../shared/components";
import BoardHeader from "./BoardHeader";
import BoardGrid from "./BoardGrid";
import BoardFrame from "./BoardFrame";
import InfoBlurb from "./InfoBlurb";
import { getWinningLine, validateBoardState, validateTokens } from "./utils";
import type { GameToken } from "../../../shared/types";

export interface NNGameBoardProps {
    boardState: string[];
    humanToken: GameToken;
    aiToken: GameToken;
}

export default function NNGameBoard({ boardState, humanToken, aiToken }: NNGameBoardProps) {
    if (!validateBoardState(boardState) || !validateTokens(humanToken, aiToken)) {
        return (
            <div className="flex flex-col items-center justify-center w-100 h-124 bg-slate-600/60 rounded-xl shadow-2xl">
                <ErrorMessage />
            </div>
        );
    }

    const [_, setHoveredCell] = useState<number | null>(null);

    const handleCellHover = (cell: number | null) => {
        if (cell !== null && (cell < 0 || cell > 8)) {
            console.warn("Invalid cell index");
            return;
        }
        setHoveredCell(cell);
    };

    const winningLine = getWinningLine(boardState as GameToken[]);

    return (
        <div
            className="relative w-82 md:w-102 h-103 md:h-120 rounded-2xl shadow-xl hover:shadow-md transition-shadow overflow-hidden"
            aria-label="Tic Tac Toe game board"
            role="region"
        >
            <div className="absolute -inset-10 bg-gradient-to-br from-slate-800 via-slate-600 to-slate-900" />

            <div className="relative p-4">
                <BoardHeader humanToken={humanToken} aiToken={aiToken} />

                <BoardFrame ariaLabel="3 by 3 game board">
                    <BoardGrid boardState={boardState as GameToken[]} winningLine={winningLine} onCellHover={handleCellHover} />
                </BoardFrame>

                <InfoBlurb />
            </div>
        </div>
    );
}
