"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animált, kör alakú százalékmutató. Betöltéskor 0-ról a célértékre tölt
 * (gyűrű + felfutó szám). SVG-alapú, élesen skálázódik.
 */
export function CircularProgress({
  value,
  size = 132,
  stroke = 12,
  label,
}: {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Csak akkor indul, amikor láthatóvá válik (és csak egyszer).
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const target = Math.max(0, Math.min(100, value));
          const start = performance.now();
          const dur = 1400;
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - p, 3);
            setShown(Math.round(eased * target));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (shown / 100) * circ;

  return (
    <div ref={ref} className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#a3e635"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 80ms linear", filter: "drop-shadow(0 0 6px rgba(163,230,53,0.5))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black tabular-nums">{shown}%</span>
        </div>
      </div>
      {label ? <span className="text-sm font-semibold text-muted-foreground">{label}</span> : null}
    </div>
  );
}
