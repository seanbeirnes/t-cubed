import type { Token } from "./utils";
import TokenView from "./Token";
import MoveRankBadge from "./MoveRankBadge";

interface CellProps {
  index: number;
  token: Token;
  isWinning: boolean;
  onHover?: (idx: number | null) => void;
  moveRank?: number | null;
}

export function Cell({ index, token, isWinning, onHover, moveRank = 2 }: CellProps) {
  return (
    <div
      className="relative aspect-square"
      onMouseEnter={() => onHover?.(index)}
      onMouseLeave={() => onHover?.(null)}
    >
      <button
        role="gridcell"
        aria-label={`cell ${index + 1} ${token === "_" ? "empty" : token}`}
        disabled={token !== "_"}
        className={[
          "w-full h-full flex items-center justify-center select-none",
          "transition-all duration-200",
          "focus-within:bg-slate-700/40",
          token === "_" ? "cursor-pointer hover:bg-slate-700/40 active:bg-slate-400/40 active:shadow-inner" : "",
          "outline-1 outline-slate-600/60",
          "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
          isWinning ? "bg-gradient-to-br from-amber-500/10 to-amber-400/5" : "",
        ].join(" ")}
      >
        {isWinning && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-2 rounded-xl ring-2 ring-amber-400/70 blur-[1px]"></div>
            <div className="absolute inset-3 rounded-xl ring-1 ring-amber-300/60 opacity-60"></div>
          </div>
        )}

        <TokenView token={token} />

        <MoveRankBadge token={token} rank={moveRank} />
      </button>
    </div>
  );
}

export default Cell;
