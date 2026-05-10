import { useEffect, useState } from "react";
import DotPlot from "./DotPlot";
import Histogram from "./Histogram";
import type { TwoChartChoiceStep } from "@/lib/schemas/lesson";

/**
 * TwoChartChoice — two charts shown side-by-side as tappable cards. The
 * student picks one whole chart. Used for "tap the dot plot that is more
 * spread out" (6-8-4-1-7) and similar.
 *
 * Each choice has either a `dotPlot` or a `histogram` spec.
 */
export interface TwoChartChoiceProps {
  step: TwoChartChoiceStep;
  onSelect: (idx: number | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function TwoChartChoice({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: TwoChartChoiceProps) {
  const [chosen, setChosen] = useState<number | null>(null);

  useEffect(() => {
    setChosen(null);
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  return (
    <div className="twochart-row">
      {step.choices.map((ch, i) => {
        const sel = chosen === i;
        return (
          <div
            key={i}
            className={`twochart-card${sel ? " selected" : ""}`}
            onClick={() => {
              if (locked) return;
              setChosen(i);
              onSelect(i);
            }}
          >
            {ch.dotPlot && <DotPlot spec={{ ...ch.dotPlot, size: "small" }} />}
            {ch.histogram && (
              <Histogram spec={{ ...ch.histogram, size: "small" }} />
            )}
            {ch.label && <div className="twochart-label">{ch.label}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function gradeTwoChartChoice(
  step: TwoChartChoiceStep,
  idx: number | null,
): { correct: boolean; hint?: string } {
  if (idx === null) return { correct: false, hint: step.hint };
  if (step.choices[idx]?.correct) return { correct: true };
  return { correct: false, hint: step.hint };
}
