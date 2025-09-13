import type { GameToken } from "../../../shared/types";

import { renderToken, tokenClasses } from "./utils";

interface TokenProps {
  token: GameToken;
}

export function TokenView({ token }: TokenProps) {
  return (
    <span
      className={[
        "font-extrabold",
        "transition-all duration-200",
        "tracking-tight",
        tokenClasses(token),
        token === "_" ? "scale-95" : "scale-100",
        "text-5xl md:text-6xl lg:text-7xl",
      ].join(" ")}
    >
      {renderToken(token)}
    </span>
  );
}

export default TokenView;
