import type { Token } from "./utils";
import Cell from "./Cell";

interface BoardGridProps {
  boardState: Token[];
  winningLine: number[] | null;
  onCellHover?: (idx: number | null) => void;
}

export function BoardGrid({ boardState, winningLine, onCellHover }: BoardGridProps) {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-0">
      {boardState.map((token, idx) => (
        <Cell
          key={`cell-${idx}`}
          index={idx}
          token={token}
          isWinning={!!winningLine?.includes(idx)}
          onHover={onCellHover}
          moveRank={2}
        />
      ))}
    </div>
  );
}

export default BoardGrid;
