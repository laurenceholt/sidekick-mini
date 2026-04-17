import { useEffect, useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";
import type { TapPointStep } from "@/lib/schemas/lesson";

export interface TapPointProps {
  step: TapPointStep;
  onSelect: (v: number[] | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function TapPoint({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: TapPointProps) {
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    setSelected([]);
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  const toggle = (v: number) => {
    if (locked) return;
    let next: number[];
    if (step.multi) {
      // Multi-select: toggle membership
      next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
    } else {
      // Single-select: only one can be active
      next = selected.includes(v) ? [] : [v];
    }
    setSelected(next);
    onSelect(next.length === 0 ? null : next);
  };

  return (
    <div>
      <NumberLine
        min={step.min}
        max={step.max}
        tickStep={step.tickStep}
        labelStep={step.labelStep}
        inequalityLine={step.inequalityLine}
      >
        {step.points.map((v) => (
          <NumberLinePoint
            key={v}
            value={v}
            min={step.min}
            max={step.max}
            placed
            selected={selected.includes(v)}
            onClick={locked ? undefined : () => toggle(v)}
          />
        ))}
      </NumberLine>
    </div>
  );
}

function sameSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => Math.abs(v - sb[i]) < 1e-9);
}

export function gradeTapPoint(
  step: TapPointStep,
  answer: number[],
): { correct: boolean; hint?: string } {
  if (!Array.isArray(answer) || answer.length === 0) {
    return { correct: false, hint: step.hint || "Tap a point first." };
  }
  if (sameSet(answer, step.targets)) return { correct: true };
  return {
    correct: false,
    hint: step.hint || "Not quite. Look carefully at each point.",
  };
}
