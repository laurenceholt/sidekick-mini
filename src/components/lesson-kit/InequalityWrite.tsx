import { useEffect, useState } from "react";
import NumberLine from "./NumberLine";
import type { InequalityWriteStep } from "@/lib/schemas/lesson";

export interface InequalityWriteProps {
  step: InequalityWriteStep;
  onSelect: (
    v: { varText: string; sign: string; rightText: string } | null,
  ) => void;
  attemptKey?: number;
  locked?: boolean;
}

type Sign = "?" | ">" | "<" | "=";

export default function InequalityWrite({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: InequalityWriteProps) {
  const [leftText, setLeftText] = useState<string>(step.leftVar ?? "");
  const [sign, setSign] = useState<Sign>((step.fixedSign as Sign) ?? "?");
  const [rightText, setRightText] = useState<string>(
    step.rightValue !== undefined ? String(step.rightValue) : "",
  );

  useEffect(() => {
    setLeftText(step.leftVar ?? "");
    setSign((step.fixedSign as Sign) ?? "?");
    setRightText(
      step.rightValue !== undefined ? String(step.rightValue) : "",
    );
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  // Emit whenever pieces change
  useEffect(() => {
    const leftOk = step.leftIsInput ? leftText.trim().length > 0 : true;
    const rightOk = step.rightIsInput ? rightText.trim().length > 0 : true;
    const signOk = sign !== "?";
    if (leftOk && rightOk && signOk) {
      onSelect({ varText: leftText.trim(), sign, rightText: rightText.trim() });
    } else {
      onSelect(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftText, sign, rightText]);

  // Left slot
  const leftNode = step.leftIsInput ? (
    <input
      className="answer-box iw-var-input"
      type="text"
      maxLength={6}
      value={leftText}
      disabled={locked}
      onChange={(e) => setLeftText(e.target.value)}
      placeholder="?"
    />
  ) : (
    <span className="iw-value">{step.leftVar}</span>
  );

  // Sign slot
  const signNode = step.fixedSign ? (
    <span className="iw-sign-fixed">{step.fixedSign}</span>
  ) : (
    <select
      className="iw-sign-select"
      value={sign}
      disabled={locked}
      onChange={(e) => setSign(e.target.value as Sign)}
    >
      <option value="?">?</option>
      <option value="&lt;">&lt;</option>
      <option value="&gt;">&gt;</option>
      {step.includeEquals && <option value="=">=</option>}
    </select>
  );

  // Right slot
  const rightNode = step.rightIsInput ? (
    <input
      className="answer-box iw-num-input"
      type="text"
      inputMode="decimal"
      value={rightText}
      disabled={locked}
      onChange={(e) => setRightText(e.target.value)}
      placeholder="?"
    />
  ) : (
    <span className="iw-value">{step.rightValue}</span>
  );

  const nlMin = (step as any).min as number | undefined;
  const nlMax = (step as any).max as number | undefined;
  const nlTick = (step as any).tickStep as number | undefined;
  const nlLabelStep = (step as any).labelStep as number | undefined;

  return (
    <div>
      {nlMin !== undefined && nlMax !== undefined && (
        <NumberLine
          min={nlMin}
          max={nlMax}
          tickStep={nlTick}
          labelStep={nlLabelStep}
          inequalityLine={step.inequalityLine}
        />
      )}
      {step.image && (
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0" }}>
          <img
            src={step.image}
            alt=""
            style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }}
          />
        </div>
      )}
      <div className="iw-row">
        {leftNode}
        {signNode}
        {rightNode}
      </div>
    </div>
  );
}

function parseNumber(s: string): number | null {
  const n = parseFloat(s.replace(/−/g, "-"));
  return Number.isNaN(n) ? null : n;
}

function satisfies(n: number, sign: string, val: number): boolean {
  if (sign === ">") return n > val;
  if (sign === "<") return n < val;
  if (sign === "=") return Math.abs(n - val) < 1e-9;
  return false;
}

export function gradeInequalityWrite(
  step: InequalityWriteStep,
  ans: { varText: string; sign: string; rightText: string } | null,
): { correct: boolean; hint?: string } {
  if (!ans) {
    return { correct: false, hint: step.hint || "Fill in all the slots." };
  }
  const { varText, sign, rightText } = ans;

  // Check the variable name is non-empty when required
  if (step.leftIsInput && !varText) {
    return { correct: false, hint: "Type a variable name on the left." };
  }

  // Parse right side number when it's an input
  let rightNum: number | null = null;
  if (step.rightIsInput) {
    rightNum = parseNumber(rightText);
    if (rightNum === null) {
      return { correct: false, hint: "Type a number on the right." };
    }
  } else {
    rightNum = step.rightValue ?? null;
  }

  // --- Solution-set grading ---
  if (step.solutions && step.solutions.length > 0) {
    if (rightNum === null) {
      return { correct: false, hint: step.hint };
    }
    const all = step.solutions.every((s) => satisfies(s, sign, rightNum!));
    if (all) return { correct: true };
    return {
      correct: false,
      hint:
        step.hint ||
        "Pick a sign and number so that ALL the listed numbers make it true.",
    };
  }

  // --- Exact-target grading ---
  if (step.target) {
    // Variable name: if target.var given, require match; else any non-empty name ok (already checked)
    if (step.target.var && step.leftIsInput) {
      if (varText !== step.target.var) {
        return {
          correct: false,
          hint:
            step.hint ||
            `Use the variable ${step.target.var}.`,
        };
      }
    }
    if (sign !== step.target.sign) {
      return {
        correct: false,
        hint:
          step.hint ||
          (step.target.sign === ">"
            ? "Try the greater-than sign."
            : step.target.sign === "<"
              ? "Try the less-than sign."
              : "Try the equals sign."),
      };
    }
    if (rightNum === null || Math.abs(rightNum - step.target.value) > 1e-9) {
      return {
        correct: false,
        hint: step.hint || `Try the number ${step.target.value}.`,
      };
    }
    return { correct: true };
  }

  // No grading spec — accept any completed answer
  return { correct: true };
}
