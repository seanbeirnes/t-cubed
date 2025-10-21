import type { ReactNode } from "react";

interface BoardFrameProps {
  children: ReactNode;
  ariaLabel?: string;
}

export function BoardFrame({ children, ariaLabel = "3 by 3 game board" }: BoardFrameProps) {
  return (
    <div
      className="relative rounded-xl outline-2 outline-slate-600/70 bg-slate-800/60 shadow-inner overflow-clip"
      role="grid"
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

export default BoardFrame;
