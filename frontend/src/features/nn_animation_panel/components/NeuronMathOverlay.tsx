import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";

export type OverlayTerm = {
  index: number;
  weight: number;
  input: number;
  product: number;
};

export type OverlayData = {
  layerIndex: number;
  neuronIndex: number;
  bias: number;
  z: number;
  a: number;
  activationName: string;
  terms: OverlayTerm[];
  topTerms: OverlayTerm[];
};

interface Props {
  visible: boolean;
  anchor: { x: number; y: number } | null; // screen coords in px
  data: OverlayData | null;
}

type Side = "left" | "right";

export default function NeuronMathOverlay({ visible, anchor, data }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [side, setSide] = useState<Side>("right");
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  // Measure to improve flip/clamp accuracy
  const [arrowTop, setArrowTop] = useState<number>(16);

  useLayoutEffect(() => {
    if (!visible || !anchor) {
      setPos(null);
      return;
    }
    // Measure after first paint
    const el = ref.current;
    const PAD = 12; // viewport clamp padding
    const OFFSET = 14; // gap from neuron to card
    const FALLBACK_W = 420; // matches max-w
    const FALLBACK_H = 260;

    let width = FALLBACK_W;
    let height = FALLBACK_H;
    if (el) {
      const rect = el.getBoundingClientRect();
      width = rect.width || FALLBACK_W;
      height = rect.height || FALLBACK_H;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Horizontal placement
    let nextSide: Side = "right";
    let left = anchor.x + OFFSET;
    if (left + width + PAD > vw) {
      nextSide = "left";
      left = anchor.x - OFFSET - width;
      if (left < PAD) left = PAD; // clamp
    }

    // Vertical clamping
    let top = anchor.y; // aim pointer at the neuron's center
    // Temporarily compute top-left such that pointer top can be aligned later
    // We'll clamp while preserving arrow alignment as much as possible
    // Clamp by moving card up/down if it overflows
    if (top + height + PAD > vh) top = Math.max(PAD + height / 2, vh - height - PAD + height / 2);
    if (top - height / 2 < PAD) top = PAD + height / 2;

    // Convert to top-left
    top = top - height / 2;

    setSide(nextSide);
    setPos({ left, top });

    // Compute arrow position relative to card (clamped inside card bounds)
    const rawArrow = anchor.y - top; // distance from card top to anchor
    const TRI_H = 16; // visual height (borders 8+8)
    const ARROW_PAD = 12; // keep inside rounded corners
    const clampedArrow = Math.max(ARROW_PAD, Math.min(height - ARROW_PAD, rawArrow));
    setArrowTop(clampedArrow - TRI_H / 2);
  }, [visible, anchor, data]);

  return createPortal(
    <AnimatePresence>
      {visible && anchor && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed z-[9999] pointer-events-none"
          style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: -9999 }}
          aria-hidden
        >
          {/* Arrow pointer aligned to neuron center */}
          {side === "right" ? (
            <div className="absolute -left-2 w-0 h-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-slate-300/30" style={{ top: arrowTop }}></div>
          ) : (
            <div className="absolute -right-2 w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-slate-300/30" style={{ top: arrowTop }}></div>
          )}

          <div
            className="max-w-[420px] pointer-events-none select-none bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/80 text-slate-100/90 ring-1 ring-white/10 shadow-2xl rounded-xl p-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 mb-2">
              <div className="text-sm font-semibold text-amber-300">
                {data ? `Layer ${data.layerIndex + 1} → Neuron ${data.neuronIndex + 1}` : "No data"}
              </div>
              {data && (
                <div className="text-xs text-slate-300/80">
                  {data.activationName}(z) = a
                </div>
              )}
            </div>

            {/* Body */}
            {data ? (
              <div className="space-y-2">
                {/* Formula summary */}
                <div className="text-[13px] leading-snug text-slate-200">
                  <span className="text-slate-300/80">z</span>
                  <span className="mx-1">=</span>
                  <span className="text-slate-300/80">Σ</span>
                  <span className="mx-1">(w⋅x)</span>
                  <span className="mx-1">+</span>
                  <span className="text-slate-300/80">b</span>
                </div>

                {/* Top contributors */}
                <div className="mt-1 grid grid-cols-1 gap-1.5">
                  {data.topTerms.map((t) => {
                    const magnitude = Math.min(1, Math.abs(t.product) / (Math.abs(data.z) + 1e-9));
                    const color = t.product >= 0 ? "bg-emerald-400/70" : "bg-rose-400/70";
                    const barW = Math.max(4, Math.round(220 * magnitude));
                    return (
                      <div key={t.index} className="flex items-center gap-2">
                        <div className={`h-2 rounded-full ${color}`} style={{ width: barW }} />
                        <div className="text-[12px] tabular-nums text-slate-200/90">
                          w[{t.index + 1}]⋅x[{t.index + 1}] =
                          <span className="ml-1 text-slate-100">{t.product.toFixed(3)}</span>
                          <span className="ml-2 text-slate-400">(w={t.weight.toFixed(3)}, x={t.input.toFixed(3)})</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bias and totals */}
                <div className="mt-2 text-[12px] text-slate-300/90 tabular-nums">
                  b = <span className="text-slate-100">{data.bias.toFixed(3)}</span>
                </div>
                <div className="text-[12px] text-slate-300/90 tabular-nums">
                  z = Σ(w⋅x) + b = <span className="text-slate-100">{data.z.toFixed(3)}</span>
                </div>
                <div className="text-[12px] text-slate-300/90 tabular-nums">
                  a = {data.activationName}(z) = <span className="text-amber-300">{data.a.toFixed(3)}</span>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-300/80">No activations available yet for this layer.</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
