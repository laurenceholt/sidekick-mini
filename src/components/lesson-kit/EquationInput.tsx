import { useEffect, useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";
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
  useEffect(() => {
    setVal("");
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  return (
    <div>
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
      <div className="equation equation-row">
        {step.prefix && <ColorizedEq text={step.prefix} />}
        <input
          className="answer-box"
          type="text"
          value={val}
          disabled={locked}
          onChange={(e) => {
            const v = e.target.value;
            setVal(v);
            onSelect(v.trim() === "" ? null : v.trim());
          }}
          autoFocus
        />
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
  const acceptable = (step.acceptable ?? [String(step.target)]).map(normalize);
  if (acceptable.includes(v)) return { correct: true };
  const num = parseFloat(v);
  if (!Number.isNaN(num) && num === step.target) return { correct: true };
  return { correct: false, hint: step.hint };
}
