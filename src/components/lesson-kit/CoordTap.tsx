import { useEffect, useState } from "react";
import CoordPlane, { type CoordPoint } from "./CoordPlane";
import type { CoordTapStep } from "@/lib/schemas/lesson";

export interface CoordTapProps {
  step: CoordTapStep;
  onSelect: (v: { x: number; y: number } | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function CoordTap({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: CoordTapProps) {
  const [sel, setSel] = useState<CoordPoint | null>(null);

  useEffect(() => {
    setSel(null);
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  return (
    <CoordPlane
      xMin={step.xMin}
      xMax={step.xMax}
      yMin={step.yMin}
      yMax={step.yMax}
      showGrid={step.showGrid !== false}
      showAxes={step.showAxes}
      tapPoints={step.tapPoints}
      selectedTap={sel}
      onTap={(p) => {
        if (locked) return;
        setSel(p);
        onSelect({ x: p.x, y: p.y });
      }}
      locked={locked}
    />
  );
}

export function gradeCoordTap(
  step: CoordTapStep,
  ans: { x: number; y: number } | null,
): { correct: boolean; hint?: string } {
  if (!ans) return { correct: false, hint: step.hint || "Tap one of the dots." };
  if (ans.x === step.targetX && ans.y === step.targetY) return { correct: true };
  return {
    correct: false,
    hint: step.hint || "Not that one. Look carefully at the coordinates.",
  };
}
