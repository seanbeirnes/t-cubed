export interface NNGameBoardProps {
    boardState: string[];
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

export function NNGameBoard({ boardState }: NNGameBoardProps) {
    if (!validateBoardState(boardState)) {
        return (
            <div className="flex flex-col items-center justify-center w-100 h-100 bg-slate-600/60 rounded-xl shadow-2xl">
                <span className="text-amber-400 text-xl md:text-2xl text-center px-6 py-4 bg-slate-700/70 rounded-lg outline outline-2 outline-slate-500">
                    Oops! An error occurred.
                    <br />
                    Please refresh the page.
                </span>
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
            className="relative w-100 h-100 rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.65)] overflow-hidden"
            aria-label="Tic Tac Toe game board"
            role="region"
        >
            {/* Ambient background with subtle motion */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
            <div className="pointer-events-none absolute -inset-24 opacity-30 blur-3xl bg-[radial-gradient(60%_60%_at_50%_40%,rgba(251,191,36,0.15)_0,rgba(251,191,36,0)_60%)]" />

            {/* Framing and title bar */}
            <div className="relative p-3 md:p-4">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h2 className="text-amber-400 font-semibold tracking-wide text-sm md:text-base drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
                        Tic Tac Toe
                    </h2>
                    <div className="text-xs md:text-sm text-slate-300/80">
                        <span className="mr-3">
                            <span className="text-green-400 font-semibold">X</span> Human
                        </span>
                        <span>
                            <span className="text-blue-400 font-semibold">O</span> AI
                        </span>
                    </div>
                </div>

                {/* Board */}
                <div
                    className="relative rounded-xl outline outline-2 outline-slate-600/70 bg-slate-800/60 shadow-inner"
                    role="grid"
                    aria-label="3 by 3 game board"
                >
                    {/* Grid backdrop lines using CSS gradients for crisp lines */}
                    <div className="pointer-events-none absolute inset-0 opacity-80 mix-blend-screen"
                        style={{
                            backgroundImage: `
                                linear-gradient(to right, transparent 0 calc(33.333% - 1px), rgba(15,23,42,0) calc(33.333% - 1px), rgba(30,41,59,0.9) calc(33.333%), rgba(15,23,42,0) calc(33.333% + 1px), transparent 100%),
                                linear-gradient(to right, transparent 0 calc(66.666% - 1px), rgba(15,23,42,0) calc(66.666% - 1px), rgba(30,41,59,0.9) calc(66.666%), rgba(15,23,42,0) calc(66.666% + 1px), transparent 100%),
                                linear-gradient(to bottom, transparent 0 calc(33.333% - 1px), rgba(15,23,42,0) calc(33.333% - 1px), rgba(30,41,59,0.9) calc(33.333%), rgba(15,23,42,0) calc(33.333% + 1px), transparent 100%),
                                linear-gradient(to bottom, transparent 0 calc(66.666% - 1px), rgba(15,23,42,0) calc(66.666% - 1px), rgba(30,41,59,0.9) calc(66.666%), rgba(15,23,42,0) calc(66.666% + 1px), transparent 100%)
                            `,
                        }}
                    />

                    {/* Cells */}
                    <div className="grid grid-cols-3 grid-rows-3 gap-0">
                        {boardState.map((token, idx) => {
                            const isWinning = winningLine?.includes(idx) ?? false;

                            return (
                                <div
                                    key={idx}
                                    role="gridcell"
                                    aria-label={`cell ${idx + 1} ${token === "_" ? "empty" : token}`}
                                    className={[
                                        "relative aspect-square flex items-center justify-center select-none",
                                        "transition-all duration-200",
                                        "hover:bg-slate-700/40 focus-within:bg-slate-700/40",
                                        "outline outline-1 outline-slate-600/60",
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

                                    {/* Subtle corner accents */}
                                    <div className="pointer-events-none absolute inset-0">
                                        <div className="absolute top-1 left-1 w-2 h-2 rounded-sm bg-amber-400/30 blur-[1px]" />
                                        <div className="absolute bottom-1 right-1 w-2 h-2 rounded-sm bg-amber-400/30 blur-[1px]" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer hint */}
                <div className="mt-3 md:mt-4 flex items-center justify-center text-[11px] md:text-xs text-slate-300/70">
                    <span className="px-3 py-1 rounded-full bg-slate-700/60 outline outline-1 outline-slate-600/70">
                        Neural net suggests best amber-highlighted moves in the panel below.
                    </span>
                </div>
            </div>

            {/* Subtle perimeter glow */}
            <div className="pointer-events-none absolute inset-0 ring-1 ring-slate-500/40 rounded-2xl" />
            <div className="pointer-events-none absolute -inset-1 rounded-3xl bg-[conic-gradient(at_50%_0%,rgba(251,191,36,0.12),rgba(15,23,42,0)_40%,rgba(251,191,36,0.12),rgba(15,23,42,0)_80%,rgba(251,191,36,0.12))] opacity-40 blur-md" />
        </div>
    );
}
