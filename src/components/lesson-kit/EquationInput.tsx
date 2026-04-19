import { useEffect, useRef, useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";
import CoordPlane from "./CoordPlane";
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

  return (
    <div>
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
