import { useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";
import type { NumberLineChoiceStep } from "@/lib/schemas/lesson";

export interface NumberLineChoiceProps {
  step: NumberLineChoiceStep;
  onSelect: (idx: number | null) => void;
  locked?: boolean;
  selectedIdx?: number | null;
  result?: "correct" | "wrong" | null;
}

export default function NumberLineChoice({
  step,
  onSelect,
  locked,
  selectedIdx,
  result,
}: NumberLineChoiceProps) {
  const [internal, setInternal] = useState<number | null>(null);
  const sel = selectedIdx ?? internal;

  return (
    <div>
      <NumberLine
        min={step.min}
        max={step.max}
        tickStep={step.tickStep}
        labelStep={step.labelStep}
        highlightValues={step.points}
        inequalityLine={(step as any).inequalityLine}
      >
        {step.points.map((v, i) => (
          <NumberLinePoint key={i} value={v} min={step.min} max={step.max} />
        ))}
      </NumberLine>
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
              style={{ fontSize: 28 }}
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

export function gradeNumberLineChoice(
  step: NumberLineChoiceStep,
  idx: number,
): { correct: boolean; hint?: string } {
  if (step.choices[idx]?.correct) return { correct: true };
  return { correct: false, hint: step.hint };
}
