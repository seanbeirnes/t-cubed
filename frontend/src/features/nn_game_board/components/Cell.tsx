import type { GameToken } from "../../../shared/types";
import { GAME_TOKENS } from "../../../shared/types";

import TokenView from "./Token";
import MoveRankBadge from "./MoveRankBadge";

interface CellProps {
    index: number;
    token: GameToken;
    isWinning: boolean;
    emphasized: boolean;
    onHover: (idx: number | null) => void;
    moveRank: number | null;
}

const isTopLeftCell = (idx: number) => idx === 0;
const isTopRightCell = (idx: number) => idx === 2;
const isBottomLeftCell = (idx: number) => idx === 6;
const isBottomRightCell = (idx: number) => idx === 8;

/*
 * emphasizedCell - The zero-based index of the cell that should be highlighted with a border. This is used to
 * highlight the cell when the user hovers over the corresponding input neuron.
 *
 * moveRank - The rank of the suggested move for the cell. This is used to display the move ranking badge.
 */
export default function Cell({ index, token, isWinning, emphasized, onHover, moveRank}: CellProps) {
    return (
        <div
            className="relative aspect-square"
            onMouseEnter={() => onHover?.(index)}
            onMouseLeave={() => onHover?.(null)}
        >
            <button
                role="gridcell"
                aria-label={`cell ${index + 1} ${token === "_" ? "empty" : token}`}
                disabled={token === GAME_TOKENS.O || token === GAME_TOKENS.X}
                className={[
                    "w-full h-full flex items-center justify-center select-none",
                    "transition-all duration-200",
                    "focus-within:bg-slate-700/40",
                    "outline-1 outline-slate-600/60",
                    "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
                    isTopLeftCell(index) ? "rounded-tl-xl" : "",
                    isTopRightCell(index) ? "rounded-tr-xl" : "",
                    isBottomLeftCell(index) ? "rounded-bl-xl" : "",
                    isBottomRightCell(index) ? "rounded-br-xl" : "",
                    token === "_" ? "cursor-pointer hover:bg-slate-700/40 active:bg-slate-400/40 active:shadow-inner" : "",
                    "border-2",
                    emphasized ? "border-amber-400/95" : "border-amber-400/0",
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

                {token !== null && token === GAME_TOKENS.EMPTY && <MoveRankBadge token={token} rank={moveRank} />}
            </button>
        </div>
    );
}
