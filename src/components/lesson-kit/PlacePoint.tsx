import { useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";
import type { PlacePointStep } from "@/lib/schemas/lesson";

export interface PlacePointProps {
  step: PlacePointStep;
  /** Called with a boolean when the student clicks CHECK. */
  onAnswer: (correct: boolean, value: number) => void;
  /** Called whenever the student places/moves a point, to enable the CHECK button. */
  onSelect: (value: number | null) => void;
  /** Incremented by parent to force a fresh attempt (TRY AGAIN). */
  attemptKey?: number;
  /** When true, ignore further clicks (e.g. while showing wrong feedback). */
  locked?: boolean;
}

/**
 * Place-point step: the student clicks on a number line to drop a point,
 * then CHECK evaluates it against the step's target or condition.
 *
 * Mirrors mathkcs/src/components/lesson-kit pattern: one component per
 * step type, pure presentation + a narrow answer callback.
 */
export default function PlacePoint({ step, onSelect, attemptKey = 0, locked }: PlacePointProps) {
  const [value, setValue] = useState<number | null>(null);

  // Reset on new attempt
  const resetKey = `${attemptKey}`;

  // If the target has a fractional part, snap to a finer grid than tickStep
  // so the student can place the dot anywhere on the line.
  const targetFrac =
    step.target !== undefined && Math.abs(step.target - Math.round(step.target)) > 1e-9;
  const snapStep = (step as any).snapStep ?? (targetFrac ? 0.1 : step.tickStep ?? 1);

  return (
    <div key={resetKey}>
      <NumberLine
        min={step.min}
        max={step.max}
        tickStep={step.tickStep}
        labelStep={step.labelStep}
        highlightValues={step.highlightValues}
        extraTickValues={
          step.referencePoint !== undefined ? [step.referencePoint] : undefined
        }
        snapStep={snapStep}
        inequalityLine={(step as any).inequalityLine}
        onLineClick={
          locked
            ? undefined
            : (v) => {
                setValue(v);
                onSelect(v);
              }
        }
      >
        {(step.staticPoints ?? []).map((sv, i) => (
          <NumberLinePoint key={`s${i}`} value={sv} min={step.min} max={step.max} ghost />
        ))}
        {value !== null && (
          <NumberLinePoint
            value={value}
            min={step.min}
            max={step.max}
            variant="selected"
            placed
          />
        )}
      </NumberLine>
    </div>
  );
}

/** Pure grading helper — no UI. Used by MultiStepShell on CHECK. */
export function gradePlacePoint(
  step: PlacePointStep,
  value: number,
): { correct: boolean; hint?: string } {
  if (step.condition === "lessThan" && step.conditionValue !== undefined) {
    if (value < step.conditionValue) return { correct: true };
    return {
      correct: false,
      hint: `Less than ${step.conditionValue} means to the LEFT of ${step.conditionValue} on the number line.`,
    };
  }
  if (step.condition === "greaterThan" && step.conditionValue !== undefined) {
    if (value > step.conditionValue) return { correct: true };
    return {
      correct: false,
      hint: `Greater than ${step.conditionValue} means to the RIGHT of ${step.conditionValue} on the number line.`,
    };
  }
  if (step.target !== undefined) {
    const tol = step.tolerance ?? 0;
    if (Math.abs(value - step.target) <= tol + 1e-9) return { correct: true };
    const sameSide =
      (step.target < 0 && value < 0) ||
      (step.target > 0 && value > 0) ||
      step.target === 0;
    let hint: string;
    if (step.hint) {
      hint = step.hint;
    } else if (sameSide) {
      hint = "You're on the correct side of zero, but not quite right.";
    } else {
      hint =
        step.target < 0
          ? "Look for the negative side: it's to the LEFT of zero."
          : "Look for the positive side: it's to the RIGHT of zero.";
    }
    return { correct: false, hint };
  }
  return { correct: true };
}
