import { useMemo, useRef, type ReactNode } from "react";

export interface InequalityLineSpec {
  start: number;
  direction: ">" | "<";
}

export interface NumberLineProps {
  min: number;
  max: number;
  tickStep?: number;
  /** If set, labels only show on multiples of labelStep (ticks still drawn at tickStep). */
  labelStep?: number;
  highlightValues?: number[];
  extraTickValues?: number[];
  children?: ReactNode;
  onLineClick?: (value: number) => void;
  snapStep?: number;
  /** Optional green inequality ray (open circle + line + arrow). */
  inequalityLine?: InequalityLineSpec | null;
  /** Optional static jump arcs from `from` to `to` (one arc per integer hop). */
  hops?: { from: number; to: number } | null;
}

/**
 * Number line primitive — matches legacy `.number-line-container` / `.number-line`
 * styles pixel-for-pixel. Labels sit above the line, click-zone extends ±25px
 * vertically so tapping anywhere near it registers.
 */
export default function NumberLine({
  min,
  max,
  tickStep = 1,
  labelStep,
  highlightValues,
  extraTickValues,
  children,
  onLineClick,
  snapStep,
  inequalityLine,
  hops,
}: NumberLineProps) {
  const lineRef = useRef<HTMLDivElement>(null);
  const range = max - min;

  const ticks = useMemo(() => {
    const set = new Set<number>();
    const steps = Math.round((max - min) / tickStep);
    for (let i = 0; i <= steps; i++) {
      const v = Math.round((min + i * tickStep) * 1e6) / 1e6;
      set.add(v);
    }
    (highlightValues ?? []).forEach((v) => set.add(v));
    (extraTickValues ?? []).forEach((v) => set.add(v));
    return [...set].sort((a, b) => a - b);
  }, [min, max, tickStep, highlightValues, extraTickValues]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onLineClick || !lineRef.current) return;
    const rect = lineRef.current.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    let value = min + pct * range;
    if (snapStep) value = Math.round(value / snapStep) * snapStep;
    else value = Math.round(value);
    if (value < min) value = min;
    if (value > max) value = max;
    onLineClick(value);
  };

  // Inequality line positioning (render into the number-line coordinate space)
  const ineq = inequalityLine;
  const ineqStartPct = ineq ? ((ineq.start - min) / range) * 100 : 0;

  // Jump arcs (static display)
  const arcs: { d: string }[] = [];
  if (hops && hops.from !== hops.to) {
    const dir = hops.from < hops.to ? 1 : -1;
    const steps = Math.abs(hops.to - hops.from);
    for (let i = 0; i < steps; i++) {
      const a = hops.from + i * dir;
      const b = a + dir;
      const x1 = ((a - min) / range) * 100;
      const x2 = ((b - min) / range) * 100;
      const midX = (x1 + x2) / 2;
      arcs.push({ d: `M ${x1} 40 Q ${midX} 4 ${x2} 40` });
    }
  }

  return (
    <div className="number-line-container">
      <div ref={lineRef} className="number-line">
        {onLineClick && <div className="click-zone" onClick={handleClick} />}
        {ineq && (
          <IneqRay startPct={ineqStartPct} direction={ineq.direction} />
        )}
        {arcs.length > 0 && (
          <svg
            className="jump-arrows"
            viewBox="0 0 100 44"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: "100%",
              width: "100%",
              height: 44,
              overflow: "visible",
              pointerEvents: "none",
            }}
          >
            {arcs.map((a, i) => (
              <g
                key={i}
                stroke="#57B477"
                strokeWidth={0.6}
                fill="none"
                strokeLinecap="round"
              >
                <path d={a.d} />
              </g>
            ))}
          </svg>
        )}
        {ticks.map((v) => {
          const pct = ((v - min) / range) * 100;
          const isHighlight = highlightValues?.includes(v);
          const showLabel =
            !labelStep ||
            Math.abs(v / labelStep - Math.round(v / labelStep)) < 1e-6;
          return (
            <div key={v}>
              <div
                className={`tick${Math.abs(v - Math.round(v)) > 1e-6 ? " minor" : ""}`}
                style={{ left: `${pct}%` }}
              />
              {showLabel && (
                <div
                  className={`tick-label${isHighlight ? " highlight" : ""}`}
                  style={{ left: `${pct}%` }}
                >
                  {v}
                </div>
              )}
            </div>
          );
        })}
        {children}
      </div>
    </div>
  );
}

export interface NumberLinePointProps {
  value: number;
  min: number;
  max: number;
  variant?: "default" | "selected" | "correct" | "wrong";
  placed?: boolean;
  ghost?: boolean;
  onClick?: () => void;
  selected?: boolean;
}

export function NumberLinePoint({
  value,
  min,
  max,
  placed,
  ghost,
  onClick,
  selected,
}: NumberLinePointProps) {
  const pct = ((value - min) / (max - min)) * 100;
  const cls =
    `point${placed ? " placed" : ""}${ghost ? " ghost" : ""}` +
    `${onClick ? " tappable" : ""}${selected ? " selected-point" : ""}`;
  return (
    <div
      className={cls}
      style={{ left: `${pct}%`, cursor: onClick ? "pointer" : undefined }}
      onClick={onClick}
    />
  );
}

/** Inequality ray: open circle at start, solid line extending past the end of the
 *  number line (into the margin beyond the line's bounds), with an arrow head. */
function IneqRay({
  startPct,
  direction,
}: {
  startPct: number;
  direction: ">" | "<";
}) {
  // Extend the ray 28px past the edge of the number line so the arrow
  // visually points "off the end" into an imagined continuation.
  const OVERHANG = 28;
  if (direction === ">") {
    return (
      <>
        <div
          className="ineq-ray"
          style={{ left: `${startPct}%`, right: `-${OVERHANG}px` }}
        />
        <div className="ineq-start-circle" style={{ left: `${startPct}%` }} />
        <div
          className="ineq-arrow ineq-arrow-right"
          style={{ right: `-${OVERHANG + 8}px` }}
        />
      </>
    );
  }
  return (
    <>
      <div
        className="ineq-ray"
        style={{ left: `-${OVERHANG}px`, right: `${100 - startPct}%` }}
      />
      <div className="ineq-start-circle" style={{ left: `${startPct}%` }} />
      <div
        className="ineq-arrow ineq-arrow-left"
        style={{ left: `-${OVERHANG + 8}px` }}
      />
    </>
  );
}
