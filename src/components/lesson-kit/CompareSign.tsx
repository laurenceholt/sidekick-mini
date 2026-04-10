import { useEffect, useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";

export interface CompareSignStep {
  type: "compare-sign";
  instruction?: string;
  hint?: string;
  left: number | string;
  right: number | string;
  target: ">" | "<";
  /** Optional number line */
  showNumberLine?: boolean;
  min?: number;
  max?: number;
  tickStep?: number;
  labelStep?: number;
  staticPoints?: number[];
  /** URL to an illustration displayed above the comparison */
  image?: string;
  /** Sentence template with {sign} placeholder — renders as flowing text */
  sentence?: string;
}

export interface CompareSignProps {
  step: CompareSignStep;
  onSelect: (v: string | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function CompareSign({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: CompareSignProps) {
  const [chosen, setChosen] = useState<string>("?");

  useEffect(() => {
    setChosen("?");
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  const handleChange = (v: string) => {
    setChosen(v);
    onSelect(v === "?" ? null : v);
  };

  const dropdown = (
    <select
      className="compare-sign-select"
      value={chosen}
      disabled={locked}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="?">?</option>
      <option value="&gt;">&gt;</option>
      <option value="&lt;">&lt;</option>
    </select>
  );

  // Sentence mode: render flowing text with dropdown inline
  if (step.sentence) {
    const parts = step.sentence.split("{sign}");
    return (
      <div className="compare-sign-sentence">
        <span>{parts[0]}</span>
        {dropdown}
        <span>{parts[1] ?? ""}</span>
      </div>
    );
  }

  return (
    <div>
      {step.showNumberLine &&
        step.min !== undefined &&
        step.max !== undefined && (
          <NumberLine
            min={step.min}
            max={step.max}
            tickStep={step.tickStep}
            labelStep={step.labelStep}
          >
            {(step.staticPoints ?? []).map((v, i) => (
              <NumberLinePoint key={i} value={v} min={step.min!} max={step.max!} />
            ))}
          </NumberLine>
        )}

      {step.image && (
        <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
          <img
            src={step.image}
            alt=""
            style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }}
          />
        </div>
      )}

      <div className="compare-sign-row">
        <span className="compare-sign-value">{step.left}</span>
        {dropdown}
        <span className="compare-sign-value">{step.right}</span>
      </div>
    </div>
  );
}

export function gradeCompareSign(
  step: CompareSignStep,
  answer: string,
): { correct: boolean; hint?: string } {
  if (answer === step.target) return { correct: true };
  return { correct: false, hint: step.hint };
}
