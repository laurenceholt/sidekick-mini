import { useEffect, useState } from "react";

export interface InequalityInputStep {
  type: "inequality-input";
  instruction?: string;
  hint?: string;
  /** Fixed number on the left (if set, input is on the right). */
  leftValue?: number;
  /** Fixed number on the right (if set, input is on the left). */
  rightValue?: number;
  /** The sign shown between the fixed value and the input. */
  sign: ">" | "<";
}

export interface InequalityInputProps {
  step: InequalityInputStep;
  onSelect: (v: string | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function InequalityInput({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: InequalityInputProps) {
  const [val, setVal] = useState("");

  useEffect(() => {
    setVal("");
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  const inputBox = (
    <input
      className="answer-box compare-sign-input"
      type="text"
      inputMode="decimal"
      value={val}
      disabled={locked}
      autoFocus
      onChange={(e) => {
        const v = e.target.value;
        setVal(v);
        onSelect(v.trim() === "" ? null : v.trim());
      }}
    />
  );

  const leftIsFixed = step.leftValue !== undefined;

  return (
    <div className="compare-sign-row">
      {leftIsFixed ? (
        <span className="compare-sign-value">{step.leftValue}</span>
      ) : (
        inputBox
      )}
      <span className="compare-sign-fixed">{step.sign}</span>
      {leftIsFixed ? (
        inputBox
      ) : (
        <span className="compare-sign-value">{step.rightValue}</span>
      )}
    </div>
  );
}

export function gradeInequalityInput(
  step: InequalityInputStep,
  answer: string,
): { correct: boolean; hint?: string } {
  const num = parseFloat(answer.replace(/−/g, "-"));
  if (Number.isNaN(num)) {
    return { correct: false, hint: "Enter a number." };
  }

  const leftIsFixed = step.leftValue !== undefined;
  let holds = false;

  if (leftIsFixed) {
    // leftValue [sign] answer
    holds = step.sign === ">" ? step.leftValue! > num : step.leftValue! < num;
  } else {
    // answer [sign] rightValue
    holds = step.sign === ">" ? num > step.rightValue! : num < step.rightValue!;
  }

  if (holds) return { correct: true };
  return {
    correct: false,
    hint: step.hint || `That doesn't make the inequality true. Try another number.`,
  };
}
