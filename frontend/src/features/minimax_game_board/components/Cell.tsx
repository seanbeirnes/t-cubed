import type { GameToken } from "../../../shared/types";
import { GAME_TOKENS } from "../../../shared/types";

import TokenView from "./Token";

interface CellProps {
    index: number;
    token: GameToken;
    humanToken: GameToken;
    isWinning: boolean;
    onClick: () => void
}

const isTopLeftCell = (idx: number) => idx === 0;
const isTopRightCell = (idx: number) => idx === 2;
const isBottomLeftCell = (idx: number) => idx === 6;
const isBottomRightCell = (idx: number) => idx === 8;

export default function Cell({ index, token, humanToken, isWinning, onClick}: CellProps) {
    return (
        <div
            className="relative aspect-square"
        >
            <button
                role="gridcell"
                aria-label={`cell ${index + 1} ${token === "_" ? "empty" : token}`}
                disabled={token === GAME_TOKENS.O || token === GAME_TOKENS.X}
                onClick={onClick}
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
                    token === "_" ? "cursor-pointer hover:bg-slate-700/40 active:bg-slate-400/40 active:shadow-inner" : "cursor-not-allowed",
                    "border-2",
                    isWinning ? "bg-gradient-to-br from-amber-500/10 to-amber-400/5" : "",
                ].join(" ")}
            >
                {isWinning && (
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-2 rounded-xl ring-2 ring-amber-400/70 blur-[1px]"></div>
                        <div className="absolute inset-3 rounded-xl ring-1 ring-amber-300/60 opacity-60"></div>
                    </div>
                )}

                <TokenView token={token} humanToken={humanToken} />
            </button>
        </div>
    );
}
