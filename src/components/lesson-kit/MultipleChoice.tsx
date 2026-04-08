import { useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";
import type { MultipleChoiceStep } from "@/lib/schemas/lesson";

export interface MultipleChoiceProps {
  step: MultipleChoiceStep;
  onSelect: (idx: number | null) => void;
  attemptKey?: number;
  locked?: boolean;
  result?: "correct" | "wrong" | null;
  selectedIdx?: number | null;
}

export default function MultipleChoice({
  step,
  onSelect,
  attemptKey = 0,
  locked,
  result,
  selectedIdx,
}: MultipleChoiceProps) {
  const [internal, setInternal] = useState<number | null>(null);
  const sel = selectedIdx ?? internal;

  return (
    <div key={attemptKey}>
      {step.showNumberLine && step.min !== undefined && step.max !== undefined && (
        <NumberLine
          min={step.min}
          max={step.max}
          tickStep={step.tickStep}
          labelStep={step.labelStep}
          highlightValues={step.staticPoints}
        >
          {(step.staticPoints ?? []).map((v, i) => (
            <NumberLinePoint key={i} value={v} min={step.min!} max={step.max!} />
          ))}
        </NumberLine>
      )}
      <div className="choices">
        {step.choices.map((ch, i) => {
          const isSel = sel === i;
          const cls =
            "choice-btn" +
            (isSel ? " selected" : "") +
            (isSel && result === "correct" ? " correct" : "") +
            (isSel && result === "wrong" ? " wrong" : "");
          return (
            <button
              key={i}
              className={cls}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                setInternal(i);
                onSelect(i);
              }}
            >
              {ch.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function gradeMultipleChoice(
  step: MultipleChoiceStep,
  idx: number,
): { correct: boolean; hint?: string } {
  const ch = step.choices[idx];
  if (ch?.correct) return { correct: true };
  return { correct: false, hint: step.hint };
}
