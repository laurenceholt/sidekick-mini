import { useEffect, useRef, useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";
import CoordPlane from "./CoordPlane";
import DotPlot from "./DotPlot";
import Histogram from "./Histogram";
import MultiThermo from "./MultiThermo";
import type { EquationInputStep } from "@/lib/schemas/lesson";

export interface EquationInputProps {
  step: EquationInputStep;
  onSelect: (val: string | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function EquationInput({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: EquationInputProps) {
  const [val, setVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVal("");
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  // Focus the input on mount/attempt change, but DO NOT scroll the page to
  // reveal it. Otherwise a tall coord plane above pushes the question text
  // off the top of the screen on a Chromebook viewport.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [attemptKey]);

  const cp = (step as any).coordPlane;
  const suffix = (step as any).suffix as string | undefined;
  const stepImage = (step as any).image as string | undefined;

  return (
    <div>
      {stepImage && (
        <img className="lesson-corner-illustration" src={stepImage} alt="" />
      )}
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
      {cp && (
        <CoordPlane
          xMin={cp.xMin}
          xMax={cp.xMax}
          yMin={cp.yMin}
          yMax={cp.yMax}
          showGrid={cp.showGrid !== false}
          showBuildings={cp.showBuildings}
          showAxes={cp.showAxes}
          showArchery={cp.showArchery}
          points={cp.points}
        />
      )}
      {(step as any).dotPlot && <DotPlot spec={(step as any).dotPlot} />}
      {(step as any).histogram && <Histogram spec={(step as any).histogram} />}
      {(step as any).multiThermo && <MultiThermo spec={(step as any).multiThermo} />}
      {(step as any).barsDisplay && (
        <BarsDisplay spec={(step as any).barsDisplay} />
      )}
      {(step as any).numberTiles && (
        <NumberTiles values={(step as any).numberTiles as (number | string)[]} />
      )}
      <div className="equation equation-row">
        {step.prefix && <ColorizedEq text={step.prefix} />}
        <input
          ref={inputRef}
          className="answer-box"
          type="text"
          value={val}
          disabled={locked}
          onChange={(e) => {
            const v = e.target.value;
            setVal(v);
            onSelect(v.trim() === "" ? null : v.trim());
          }}
        />
        {suffix && <ColorizedEq text={suffix} />}
      </div>
    </div>
  );
}

/**
 * NumberTiles — a row of numbers shown as styled tiles (same visual as the
 * TileSort tile). Used by median steps to make a value list look like
 * "draggable tiles" so students see the link to the earlier tile-sort step.
 */
function NumberTiles({ values }: { values: (number | string)[] }) {
  return (
    <div className="numbertiles-row">
      {values.map((v, i) => (
        <div key={i} className="numbertile">
          {v}
        </div>
      ))}
    </div>
  );
}

function ColorizedEq({ text }: { text: string }) {
  const parts = text.split(/(\s*[+\−\-=]\s*)/);
  return (
    <>
      {parts.map((tok, i) => {
        const t = tok.trim();
        const isOp = t === "+" || t === "−" || t === "-" || t === "=";
        return (
          <span key={i} className={isOp ? "op" : undefined}>
            {tok}
          </span>
        );
      })}
    </>
  );
}

function normalize(s: string) {
  return s.replace(/\s+/g, "").replace(/−/g, "-");
}

export function gradeEquationInput(
  step: EquationInputStep,
  value: string,
): { correct: boolean; hint?: string } {
  const v = normalize(value);
  const num = parseFloat(v);

  // Range-based grading ("any number greater than X") takes precedence
  const cond = (step as any).condition as "lessThan" | "greaterThan" | undefined;
  const condVal = (step as any).conditionValue as number | undefined;
  if (cond && condVal !== undefined) {
    if (Number.isNaN(num)) {
      return { correct: false, hint: step.hint || "Type a number." };
    }
    if (cond === "greaterThan" && num > condVal) return { correct: true };
    if (cond === "lessThan" && num < condVal) return { correct: true };
    return {
      correct: false,
      hint:
        step.hint ||
        "Does your number make the inequality true? Try a different one.",
    };
  }

  const acceptable = (step.acceptable ?? [String(step.target)]).map(normalize);
  if (acceptable.includes(v)) return { correct: true };
  if (!Number.isNaN(num) && num === step.target) return { correct: true };
  return { correct: false, hint: step.hint };
}

/**
 * Static "stack of blue cells" bars used to illustrate mean / leveling
 * questions where the answer is a typed number (no leveling interaction).
 * Mirrors the visual style of the BarLeveler step type.
 */
function BarsDisplay({
  spec,
}: {
  spec: { values: number[]; barHeight: number };
}) {
  const cellSize = 28;
  const barW = cellSize;
  const barH = spec.barHeight * cellSize;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 18,
        margin: "12px 0 6px",
      }}
    >
      {spec.values.map((v, i) => (
        <div
          key={i}
          style={{
            width: barW,
            height: barH,
            border: "2px solid #455A64",
            borderRadius: 4,
            position: "relative",
            background: "#ECEFF1",
          }}
        >
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
                borderTop:
                  k === v - 1 ? "1.5px solid #1565C0" : "none",
              }}
            />
          ))}
          {Array.from({ length: spec.barHeight - 1 }, (_, k) => (
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
      ))}
    </div>
  );
}
