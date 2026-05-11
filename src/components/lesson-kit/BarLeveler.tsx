import { useEffect, useState } from "react";
import type { BarLevelerStep } from "@/lib/schemas/lesson";

/**
 * BarLeveler — N bars sharing a fixed total. Between each adjacent pair of
 * bars sit a left arrow and a right arrow; clicking either moves one unit
 * from one bar to its neighbour.
 *
 * Visual: each bar is `barHeight` cells tall; filled cells (blue boxes) reach
 * up to the bar's current value. Used to teach the concept of "leveling" =
 * the mean.
 *
 * Grading: every bar matches the target value.
 */
export interface BarLevelerProps {
  step: BarLevelerStep;
  onSelect: (values: number[] | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function BarLeveler({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: BarLevelerProps) {
  const [values, setValues] = useState<number[]>([...step.initial]);

  useEffect(() => {
    setValues([...step.initial]);
    onSelect([...step.initial]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  useEffect(() => {
    onSelect(values);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const moveRight = (fromIdx: number) => {
    if (locked) return;
    if (values[fromIdx] <= 0) return;
    if (values[fromIdx + 1] >= step.barHeight) return;
    setValues((vs) => vs.map((v, i) => (i === fromIdx ? v - 1 : i === fromIdx + 1 ? v + 1 : v)));
  };
  const moveLeft = (fromIdx: number) => {
    if (locked) return;
    if (values[fromIdx] <= 0) return;
    if (values[fromIdx - 1] >= step.barHeight) return;
    setValues((vs) => vs.map((v, i) => (i === fromIdx ? v - 1 : i === fromIdx - 1 ? v + 1 : v)));
  };

  // Layout
  const cellSize = 28;
  const barW = cellSize;
  const barH = step.barHeight * cellSize;
  const gap = 48; // pixel width of the arrow column between adjacent bars
  const hideArrows = step.hideArrows;

  return (
    <div
      className="barlevel-wrap"
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 0,
        marginTop: 12,
      }}
    >
      {values.map((v, i) => {
        const isLast = i === values.length - 1;
        return (
          <div key={i} style={{ display: "contents" }}>
            {/* The bar */}
            <div
              style={{
                width: barW,
                height: barH,
                border: "2px solid #455A64",
                borderRadius: 4,
                position: "relative",
                background: "#ECEFF1",
                marginLeft: hideArrows && i > 0 ? 18 : 0,
              }}
            >
              {/* Filled cells from bottom up */}
              {Array.from({ length: v }, (_, k) => (
                <div
                  key={k}
                  style={{
                    position: "absolute",
                    left: 1,
                    right: 1,
                    bottom: k * cellSize + 1,
                    height: cellSize - 2,
                    background: "#42A5F5",
                    borderTop: k === v - 1 ? "1.5px solid #1565C0" : "none",
                  }}
                />
              ))}
              {/* Cell grid lines */}
              {Array.from({ length: step.barHeight - 1 }, (_, k) => (
                <div
                  key={`g${k}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: (k + 1) * cellSize,
                    height: 1,
                    background: "#B0BEC5",
                  }}
                />
              ))}
            </div>

            {/* Arrow controls: a SEPARATE column between adjacent bars, so
                they sit centered in the gap. */}
            {!isLast && !hideArrows && (
              <div
                style={{
                  width: gap,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  alignItems: "center",
                  justifyContent: "center",
                  // Vertical center of the arrow column ≈ middle of the bar
                  marginBottom: barH / 2 - 22,
                }}
              >
                <button
                  type="button"
                  className="barlevel-arrow"
                  aria-label="Move right"
                  disabled={locked || values[i] === 0 || values[i + 1] === step.barHeight}
                  onClick={() => moveRight(i)}
                >
                  →
                </button>
                <button
                  type="button"
                  className="barlevel-arrow"
                  aria-label="Move left"
                  disabled={locked || values[i + 1] === 0 || values[i] === step.barHeight}
                  onClick={() => moveLeft(i + 1)}
                >
                  ←
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function gradeBarLeveler(
  step: BarLevelerStep,
  values: number[] | null,
): { correct: boolean; hint?: string } {
  if (!values) {
    return { correct: false, hint: step.hint };
  }
  const ok = values.every((v) => v === step.target);
  if (ok) return { correct: true };
  return {
    correct: false,
    hint: step.hint || "Keep moving blue boxes until every bar has the same height.",
  };
}
