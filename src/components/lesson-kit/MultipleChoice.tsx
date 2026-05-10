import { useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";
import CoordPlane from "./CoordPlane";
import DotPlot from "./DotPlot";
import Histogram from "./Histogram";
import MultiThermo from "./MultiThermo";
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

  // When the question already has a chart/visual primitive, the image is a
  // decorative corner illustration — render it small in the top-right.
  const hasChart =
    !!(step as any).dotPlot ||
    !!(step as any).histogram ||
    !!(step as any).multiThermo ||
    !!(step as any).coordPlane ||
    step.showNumberLine;
  const stepImage = (step as any).image as string | undefined;

  // Compact button row: lots of short choices (e.g. "0","1","2","3","4","5")
  // fit better as a flex-wrap grid than one-per-row.
  const compactChoices =
    step.choices.length > 3 && step.choices.every((c) => c.text.length <= 4);

  return (
    <div key={attemptKey} className="mc-wrap">
      {stepImage &&
        (hasChart ? (
          <img className="lesson-corner-illustration" src={stepImage} alt="" />
        ) : (
          <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
            <img
              src={stepImage}
              alt=""
              style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }}
            />
          </div>
        ))}
      {step.showNumberLine && step.min !== undefined && step.max !== undefined && (
        <NumberLine
          min={step.min}
          max={step.max}
          tickStep={step.tickStep}
          labelStep={step.labelStep}
          highlightValues={step.staticPoints}
          inequalityLine={(step as any).inequalityLine}
          hops={(step as any).hops}
        >
          {(step.staticPoints ?? []).map((v, i) => (
            <NumberLinePoint key={i} value={v} min={step.min!} max={step.max!} />
          ))}
        </NumberLine>
      )}
      {(step as any).coordPlane && (
        <CoordPlane
          xMin={(step as any).coordPlane.xMin}
          xMax={(step as any).coordPlane.xMax}
          yMin={(step as any).coordPlane.yMin}
          yMax={(step as any).coordPlane.yMax}
          showGrid={(step as any).coordPlane.showGrid !== false}
          showBuildings={(step as any).coordPlane.showBuildings}
          showAxes={(step as any).coordPlane.showAxes}
          showArchery={(step as any).coordPlane.showArchery}
          points={(step as any).coordPlane.points}
          figure={(step as any).coordPlane.figure}
        />
      )}
      {(step as any).dotPlot && <DotPlot spec={(step as any).dotPlot} />}
      {(step as any).histogram && <Histogram spec={(step as any).histogram} />}
      {(step as any).multiThermo && <MultiThermo spec={(step as any).multiThermo} />}
      <div className={`choices${compactChoices ? " compact" : ""}`}>
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
              {ch.arrow ? (
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <SvgArrow direction={ch.arrow} />
                  <span style={{ fontSize: 18 }}>
                    {ch.text.charAt(0).toUpperCase() + ch.text.slice(1)}
                  </span>
                </span>
              ) : (
                ch.text
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SvgArrow({ direction }: { direction: "left" | "right" }) {
  const d =
    direction === "left"
      ? "M 8 25 L 35 4 C 37 2, 40 4, 40 7 L 40 16 L 88 16 C 92 16, 94 18, 94 22 L 94 28 C 94 32, 92 34, 88 34 L 40 34 L 40 43 C 40 46, 37 48, 35 46 L 8 25 Z"
      : "M 92 25 L 65 4 C 63 2, 60 4, 60 7 L 60 16 L 12 16 C 8 16, 6 18, 6 22 L 6 28 C 6 32, 8 34, 12 34 L 60 34 L 60 43 C 60 46, 63 48, 65 46 L 92 25 Z";
  return (
    <svg viewBox="0 0 100 50" width="120" height="60" style={{ display: "block", margin: "0 auto" }}>
      <path d={d} fill="currentColor" />
    </svg>
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
