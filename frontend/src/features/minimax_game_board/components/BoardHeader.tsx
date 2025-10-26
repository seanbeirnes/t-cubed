import type { GameToken } from "../../../shared/types";
import { GAME_TOKENS } from "../../../shared/types";

interface BoardHeaderProps {
    gameTitle: string | undefined;
  humanToken: GameToken;
  aiToken: GameToken;
}

export function BoardHeader({ gameTitle,  humanToken, aiToken }: BoardHeaderProps) {
    if (!gameTitle) {
        gameTitle = "Tic Tac Toe"
    }
    if (gameTitle.length > 30) {
        gameTitle = gameTitle.slice(0, 30) + "..."
    }
    if (humanToken === aiToken) {
        console.warn("Human and AI tokens are the same");
        return null;
    }
    if (humanToken === GAME_TOKENS.EMPTY || aiToken === GAME_TOKENS.EMPTY) {
        console.warn("Human or AI token is empty");
        return null;
    }

  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-amber-400 font-semibold tracking-wide text-xs sm:text-sm md:text-base drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]">
        {gameTitle}
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
