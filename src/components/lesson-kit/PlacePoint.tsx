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
}

/**
 * Place-point step: the student clicks on a number line to drop a point,
 * then CHECK evaluates it against the step's target or condition.
 *
 * Mirrors mathkcs/src/components/lesson-kit pattern: one component per
 * step type, pure presentation + a narrow answer callback.
 */
export default function PlacePoint({ step, onSelect, attemptKey = 0 }: PlacePointProps) {
  const [value, setValue] = useState<number | null>(null);

  // Reset on new attempt
  const resetKey = `${attemptKey}`;

  return (
    <div key={resetKey}>
      <NumberLine
        min={step.min}
        max={step.max}
        tickStep={step.tickStep}
        highlightValues={step.highlightValues}
        extraTickValues={
          step.referencePoint !== undefined ? [step.referencePoint] : undefined
        }
        snapStep={step.tickStep ?? 1}
        onLineClick={(v) => {
          setValue(v);
          onSelect(v);
        }}
      >
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
    if (value === step.target) return { correct: true };
    return {
      correct: false,
      hint:
        step.hint ||
        (step.target < 0
          ? "Look for the negative side — it's to the LEFT of zero."
          : "Look for the positive side — it's to the RIGHT of zero."),
    };
  }
  return { correct: true };
}
