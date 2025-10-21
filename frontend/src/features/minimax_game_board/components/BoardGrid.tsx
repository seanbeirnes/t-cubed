import type { GameToken } from "../../../shared/types";
import Cell from "./Cell";

interface BoardGridProps {
    boardState: GameToken[];
    winningLine: number[] | null;
    playMove: (position: number) => void;
    humanToken: GameToken;
}

export function BoardGrid({ boardState, winningLine, playMove, humanToken }: BoardGridProps) {
    return (
        <div className="grid grid-cols-3 grid-rows-3 gap-0">
            {boardState.map((token, idx) => (
                <Cell
                    key={`cell-${idx}`}
                    index={idx}
                    token={token}
                    isWinning={!!winningLine?.includes(idx)}
                    onClick={() => playMove(idx + 1)}
                    humanToken={humanToken}
                />
            ))}
        </div>
    );
}

export default BoardGrid;
