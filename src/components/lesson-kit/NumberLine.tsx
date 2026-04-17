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
  const ineqEndPct = ineq
    ? ineq.direction === ">"
      ? 100
      : 0
    : 0;

  return (
    <div className="number-line-container">
      <div ref={lineRef} className="number-line">
        {onLineClick && <div className="click-zone" onClick={handleClick} />}
        {ineq && (
          <IneqRay
            startPct={ineqStartPct}
            endPct={ineqEndPct}
            direction={ineq.direction}
          />
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

/** Inequality ray: open circle at start, solid line to the edge, with an arrow head. */
function IneqRay({
  startPct,
  endPct,
  direction,
}: {
  startPct: number;
  endPct: number;
  direction: ">" | "<";
}) {
  const left = Math.min(startPct, endPct);
  const right = Math.max(startPct, endPct);
  const width = right - left;
  return (
    <>
      {/* Ray segment */}
      <div
        className="ineq-ray"
        style={{
          left: `${left}%`,
          width: `${width}%`,
        }}
      />
      {/* Open circle at start */}
      <div
        className="ineq-start-circle"
        style={{ left: `${startPct}%` }}
      />
      {/* Arrow head at the far end */}
      <div
        className={`ineq-arrow ineq-arrow-${direction === ">" ? "right" : "left"}`}
        style={{ left: `${endPct}%` }}
      />
    </>
  );
}
