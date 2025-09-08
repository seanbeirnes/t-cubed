import { ErrorMessage } from "../../../shared/components";

export interface NNGameBoardProps {
    boardState: string[];
    humanToken: "X" | "O";
    aiToken: "X" | "O";
}

function validateBoardState(boardState: string[]): boolean {
    if (boardState.length !== 9) {
        return false;
    }
    for (let i = 0; i < boardState.length; i++) {
        if (boardState[i] !== "X" && boardState[i] !== "O" && boardState[i] !== "_") {
            return false;
        }
    }
    return true;
}

function validateTokens(humanToken: "X" | "O", aiToken: "X" | "O"): boolean {
    return humanToken === "X" && aiToken === "O" || humanToken === "O" && aiToken === "X";
}

function tokenClasses(token: string): string {
    switch (token) {
        case "X":
            // Human (green) styling to align with NN panel
            return "text-green-400 drop-shadow-[0_0_8px_rgba(34,197,94,0.65)]";
        case "O":
            // AI (blue) styling to align with NN panel
            return "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.65)]";
        default:
            return "text-slate-400/40";
    }
}

function renderToken(token: string) {
    if (token === "_") return "";
    return token;
}

export function NNGameBoard({ boardState, humanToken, aiToken }: NNGameBoardProps) {
    if (!validateBoardState(boardState) || !validateTokens(humanToken, aiToken)) {
        return (
            <div className="flex flex-col items-center justify-center w-100 h-124 bg-slate-600/60 rounded-xl shadow-2xl">
                <ErrorMessage />
            </div>
        );
    }

    // Determine simple winner/highlight if any (client-only visual cue)
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
    let winningLine: number[] | null = null;
    for (const [a, b, c] of lines) {
        const va = boardState[a], vb = boardState[b], vc = boardState[c];
        if (va !== "_" && va === vb && vb === vc) {
            winningLine = [a, b, c];
            break;
        }
    }

    return (
        <div
            className="relative w-82 md:w-102 h-103 md:h-120 rounded-2xl shadow-xl hover:shadow-md transition-shadow overflow-hidden"
            aria-label="Tic Tac Toe game board"
            role="region"
        >
            {/* Ambient background with subtle motion */}
            <div className="absolute -inset-10 bg-gradient-to-br from-slate-800 via-slate-600 to-slate-900" />

            {/* Framing and title bar */}
            <div className="relative p-4">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-amber-400 font-semibold tracking-wide text-sm md:text-base drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                        Tic Tac Toe
                    </h2>
                    <div className="text-xs md:text-sm text-slate-300/80">
                        <span className="mr-3">
                            <span className="text-green-400 font-semibold">{humanToken}</span> Human
                        </span>
                        <span>
                            <span className="text-blue-400 font-semibold">{aiToken}</span> AI
                        </span>
                    </div>
                </div>

                {/* Board */}
                <div
                    className="relative rounded-xl outline-2 outline-slate-600/70 bg-slate-800/60 shadow-inner overflow-clip"
                    role="grid"
                    aria-label="3 by 3 game board"
                >
                    {/* Cells */}
                    <div className="grid grid-cols-3 grid-rows-3 gap-0">
                        {boardState.map((token, idx) => {
                            const isWinning = winningLine?.includes(idx) ?? false;

                            return (
                                <button
                                    key={idx}
                                    role="gridcell"
                                    aria-label={`cell ${idx + 1} ${token === "_" ? "empty" : token}`}
                                    disabled={token !== "_"}
                                    className={[
                                        "relative aspect-square flex items-center justify-center select-none",
                                        "transition-all duration-200",
                                        "focus-within:bg-slate-700/40",
                                        token === "_" ? "cursor-pointer hover:bg-slate-700/40 active:bg-slate-400/40 active:shadow-inner" : "",
                                        "outline-1 outline-slate-600/60",
                                        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]",
                                        isWinning ? "bg-gradient-to-br from-amber-500/10 to-amber-400/5" : "",
                                    ].join(" ")}
                                >
                                    {/* Glow ring on win */}
                                    {isWinning && (
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute inset-2 rounded-xl ring-2 ring-amber-400/70 blur-[1px]"></div>
                                            <div className="absolute inset-3 rounded-xl ring-1 ring-amber-300/60 opacity-60"></div>
                                        </div>
                                    )}

                                    {/* Token */}
                                    <span
                                        className={[
                                            "font-extrabold",
                                            "transition-all duration-200",
                                            "tracking-tight",
                                            tokenClasses(token),
                                            token === "_" ? "scale-95" : "scale-100",
                                            // fluid sizing
                                            "text-5xl md:text-6xl lg:text-7xl",
                                        ].join(" ")}
                                    >
                                        {renderToken(token)}
                                    </span>
                                    {/* Move rankings */}
                                    <p className={`absolute top-2 left-2 w-4 h-4 text-xs text-center rounded-full outline-2 ${token === "_" ? "text-amber-50 outline-amber-400 bg-amber-400/80" : "text-slate-200 outline-slate-400 bg-slate-400/80"}`}>
                                        2
                                    </p>
                                </button>
                            );
                        })}
                    </div>
                </div>
                {/* Info blurb about numbers in circles (move rankings) */}
                <div className="flex items-center justify-center text-xs text-slate-300/80 mt-2">
                    <span className="px-4 py-1 rounded-full bg-slate-700/60 outline-1 outline-slate-600">
                        Numbers indicate the ranking of the neural net's suggested moves. 1 is the best move, 9 is the worst.
                    </span>
                </div>
            </div>
        </div>
    );
}
