interface ConnectionProps {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    activation: number;
    maxActivation: number;
    hidden?: boolean;
}

function getLineColor(activation: number): string {
  const clamped = Math.max(0, Math.min(1, activation)); // ensure [0,1]

  // light gray RGB: 200,200,200
  // bright orange RGB: 255,165,0
  const r = Math.floor(200 + clamped * (255 - 200));
  const g = Math.floor(200 + clamped * (165 - 200));
  const b = Math.floor(200 + clamped * (0 - 200));

  return `rgb(${r},${g},${b})`;
}

export default function Connection({ x1, y1, x2, y2, activation, maxActivation, hidden=false }: ConnectionProps) {
    if (activation === 0) return null;
    return (
        <line
            x1={`${x1}vw`}
            y1={`${y1}vw`}
            x2={`${x2}vw`}
            y2={`${y2}vw`}
            stroke={getLineColor(activation/maxActivation)}
            strokeOpacity={(activation/maxActivation) ** 4 + 0.1}
            strokeWidth={1}
            className={`${hidden ? "hidden" : ""}`}
            style={{
                transition: "stroke-opacity stroke 0.5s ease-in-out",
            }}
        />
    );
}
