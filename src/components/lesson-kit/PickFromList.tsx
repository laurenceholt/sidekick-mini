import { useEffect, useState } from "react";
import DotPlot from "./DotPlot";
import MultiThermo from "./MultiThermo";
import type { PickFromListStep } from "@/lib/schemas/lesson";

/**
 * PickFromList — values shown inline (e.g. "1, 4, 4, 7, 12, 21, 64"), each
 * selectable. Used by 6-8-13-1-1 through 6-8-13-1-4 ("click the middle value").
 *
 * Grading: numeric value matches `target`.
 */
export interface PickFromListProps {
  step: PickFromListStep;
  onSelect: (idx: number | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function PickFromList({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: PickFromListProps) {
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    setChosen(null);
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  const stepImage = (step as any).image as string | undefined;

  return (
    <div>
      {stepImage && (
        <img className="lesson-corner-illustration" src={stepImage} alt="" />
      )}
      {(step as any).dotPlot && <DotPlot spec={(step as any).dotPlot} />}
      {(step as any).multiThermo && <MultiThermo spec={(step as any).multiThermo} />}
      <div className="pickfromlist-wrap">
      {step.values.map((v, i) => {
        const sel = chosen === i;
        return (
          <button
            key={i}
            type="button"
            className={`pickfromlist-item${sel ? " selected" : ""}`}
            disabled={locked}
            onClick={() => {
              if (locked) return;
              setChosen(i);
              onSelect(i);
            }}
          >
            {v}
          </button>
        );
      })}
      </div>
    </div>
  );
}

export function gradePickFromList(
  step: PickFromListStep,
  idx: number | null,
): { correct: boolean; hint?: string } {
  if (idx === null) return { correct: false, hint: step.hint };
  if (Math.abs(step.values[idx] - step.target) < 1e-9) return { correct: true };
  return {
    correct: false,
    hint:
      step.hint ||
      "Not quite. Write the numbers in order on a piece of paper and pick the middle one.",
  };
}
