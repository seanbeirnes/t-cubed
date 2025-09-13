interface BoardHeaderProps {
  humanToken: "X" | "O";
  aiToken: "X" | "O";
}

export function BoardHeader({ humanToken, aiToken }: BoardHeaderProps) {
  return (
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
  );
}

export default BoardHeader;
