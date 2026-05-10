import { useEffect, useState } from "react";
import type { CompareMeansStep } from "@/lib/schemas/lesson";

/**
 * CompareMeans — three-part input: "[leftLabel] [input] [sign-dropdown]
 * [rightLabel] [input]". Used by 6-8-9-1-10 where the student computes two
 * means and compares them.
 *
 * Grading: each numeric input matches its target, AND the chosen sign is
 * correct for the inputs (regardless of what the student typed — i.e. the
 * inequality the student writes must actually be true).
 */
export interface CompareMeansProps {
  step: CompareMeansStep;
  onSelect: (
    v: { leftVal: string; sign: string; rightVal: string } | null,
  ) => void;
  attemptKey?: number;
  locked?: boolean;
}

type Sign = "?" | ">" | "<" | "=";

export default function CompareMeans({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: CompareMeansProps) {
  const [leftVal, setLeftVal] = useState("");
  const [sign, setSign] = useState<Sign>("?");
  const [rightVal, setRightVal] = useState("");

  useEffect(() => {
    setLeftVal("");
    setSign("?");
    setRightVal("");
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  useEffect(() => {
    if (leftVal.trim() === "" || rightVal.trim() === "" || sign === "?") {
      onSelect(null);
    } else {
      onSelect({ leftVal: leftVal.trim(), sign, rightVal: rightVal.trim() });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftVal, sign, rightVal]);

  return (
    <div className="comparemeans-wrap">
      <div className="comparemeans-row">
        <span className="comparemeans-label">{step.leftLabel}</span>
        <input
          className="answer-box comparemeans-input"
          type="text"
          inputMode="decimal"
          value={leftVal}
          disabled={locked}
          onChange={(e) => setLeftVal(e.target.value)}
        />
        <select
          className="iw-sign-select"
          value={sign}
          disabled={locked}
          onChange={(e) => setSign(e.target.value as Sign)}
        >
          <option value="?">?</option>
          <option value=">">&gt;</option>
          <option value="<">&lt;</option>
          <option value="=">=</option>
        </select>
        <span className="comparemeans-label">{step.rightLabel}</span>
        <input
          className="answer-box comparemeans-input"
          type="text"
          inputMode="decimal"
          value={rightVal}
          disabled={locked}
          onChange={(e) => setRightVal(e.target.value)}
        />
      </div>
    </div>
  );
}

function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(/−/g, "-"));
  return Number.isNaN(n) ? null : n;
}

export function gradeCompareMeans(
  step: CompareMeansStep,
  ans: { leftVal: string; sign: string; rightVal: string } | null,
): { correct: boolean; hint?: string } {
  if (!ans) return { correct: false, hint: step.hint || "Fill in both numbers and pick a sign." };
  const lv = parseNum(ans.leftVal);
  const rv = parseNum(ans.rightVal);
  if (lv === null || rv === null) {
    return { correct: false, hint: "Type a number in each box." };
  }
  if (Math.abs(lv - step.leftTarget) > 1e-9) {
    return {
      correct: false,
      hint: step.hint || "One of the means isn't quite right — recompute it.",
    };
  }
  if (Math.abs(rv - step.rightTarget) > 1e-9) {
    return {
      correct: false,
      hint: step.hint || "One of the means isn't quite right — recompute it.",
    };
  }
  // Sign must make the inequality TRUE for the chosen values.
  const holds =
    ans.sign === ">"
      ? lv > rv
      : ans.sign === "<"
        ? lv < rv
        : Math.abs(lv - rv) < 1e-9;
  if (!holds) {
    return {
      correct: false,
      hint: step.hint || "Your numbers are right but the sign doesn't make a true statement.",
    };
  }
  return { correct: true };
}
