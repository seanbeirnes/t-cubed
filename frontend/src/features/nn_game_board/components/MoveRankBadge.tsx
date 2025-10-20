import type { GameToken } from "../../../shared/types";

interface MoveRankBadgeProps {
  token: GameToken;
  rank?: number | null;
}

export function MoveRankBadge({ token, rank }: MoveRankBadgeProps) {
  if (rank == null) return null;

  const filled = token === "_";
  const classes = [
    "absolute top-2 left-2 w-4 h-4 text-xs text-center rounded-full outline-2",
    filled
      ? "text-amber-50 outline-amber-400 bg-amber-400/80"
      : "text-slate-200 outline-slate-400 bg-slate-400/80",
  ].join(" ");

  return <p className={classes}>{rank}</p>;
}

export default MoveRankBadge;
