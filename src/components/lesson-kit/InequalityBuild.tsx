import { useEffect, useRef, useState } from "react";
import NumberLine from "./NumberLine";
import type { InequalityBuildStep } from "@/lib/schemas/lesson";

export interface InequalityBuildProps {
  step: InequalityBuildStep;
  onSelect: (v: { start: number; direction: ">" | "<" | null } | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function InequalityBuild({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: InequalityBuildProps) {
  const fixedDir = step.fixedDirection;
  const [direction, setDirection] = useState<">" | "<" | null>(
    fixedDir ?? step.initialDirection ?? null,
  );
  const [start, setStart] = useState<number>(step.initialStart ?? 0);

  const lineRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Reset on retry
  useEffect(() => {
    setDirection(fixedDir ?? step.initialDirection ?? null);
    setStart(step.initialStart ?? 0);
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  // Emit selection whenever direction or start changes
  useEffect(() => {
    if (direction === null) {
      onSelect(null);
    } else {
      onSelect({ start, direction });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, start]);

  // Native drag listeners for reliable touch dragging of the inequality start.
  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;

    const setFromClientX = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const snap = step.tickStep ?? 1;
      let v = step.min + pct * (step.max - step.min);
      v = Math.round(v / snap) * snap;
      v = Math.max(step.min, Math.min(step.max, v));
      setStart(v);
    };

    const onDown = (e: TouchEvent | MouseEvent) => {
      if (locked) return;
      draggingRef.current = true;
      let x: number | undefined;
      if ("touches" in e && e.touches.length) x = e.touches[0].clientX;
      else if ("clientX" in e) x = (e as MouseEvent).clientX;
      if (x !== undefined) {
        e.preventDefault();
        setFromClientX(x);
      }
    };
    const onMove = (e: TouchEvent | MouseEvent) => {
      if (locked || !draggingRef.current) return;
      let x: number | undefined;
      if ("touches" in e && e.touches.length) x = e.touches[0].clientX;
      else if ("clientX" in e) x = (e as MouseEvent).clientX;
      if (x !== undefined) {
        e.preventDefault();
        setFromClientX(x);
      }
    };
    const onUp = () => {
      draggingRef.current = false;
    };

    el.addEventListener("touchstart", onDown, { passive: false });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onUp);
    el.addEventListener("touchcancel", onUp);
    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      el.removeEventListener("touchstart", onDown);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onUp);
      el.removeEventListener("touchcancel", onUp);
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [locked, step.min, step.max, step.tickStep]);

  const showDirectionButtons = !fixedDir;

  return (
    <div>
      {showDirectionButtons && (
        <div className="ineq-dir-buttons">
          <button
            type="button"
            className={`ineq-dir-btn${direction === "<" ? " active" : ""}`}
            disabled={locked}
            onClick={() => !locked && setDirection("<")}
            aria-label="Less than"
          >
            <svg viewBox="0 0 50 30" width="60" height="36">
              <path
                d="M8,15 L20,6 L20,11 L42,11 L42,19 L20,19 L20,24 Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            type="button"
            className={`ineq-dir-btn${direction === ">" ? " active" : ""}`}
            disabled={locked}
            onClick={() => !locked && setDirection(">")}
            aria-label="Greater than"
          >
            <svg viewBox="0 0 50 30" width="60" height="36">
              <path
                d="M42,15 L30,6 L30,11 L8,11 L8,19 L30,19 L30,24 Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      )}

      <div
        ref={lineRef}
        className="move-point-drag"
        style={{ touchAction: "none", position: "relative" }}
      >
        <NumberLine
          min={step.min}
          max={step.max}
          tickStep={step.tickStep}
          labelStep={step.labelStep}
          inequalityLine={direction ? { start, direction } : null}
        />
      </div>
    </div>
  );
}

export function gradeInequalityBuild(
  step: InequalityBuildStep,
  answer: { start: number; direction: ">" | "<" | null } | null,
): { correct: boolean; hint?: string } {
  if (!answer || !answer.direction) {
    return { correct: false, hint: step.hint || "Pick a direction first (the ← or → button)." };
  }
  const dirOk = answer.direction === step.targetDirection;
  const startOk = Math.abs(answer.start - step.targetStart) < 1e-9;
  if (dirOk && startOk) return { correct: true };
  if (!dirOk) {
    return {
      correct: false,
      hint:
        step.hint ||
        "Think carefully: does the arrow point the right way?",
    };
  }
  return {
    correct: false,
    hint:
      step.hint || "Not quite. Try dragging the open circle somewhere else.",
  };
}
