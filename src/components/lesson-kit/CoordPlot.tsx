import { useEffect, useState } from "react";
import CoordPlane, { type CoordPoint } from "./CoordPlane";
import type { CoordPlotStep } from "@/lib/schemas/lesson";

export interface CoordPlotProps {
  step: CoordPlotStep;
  onSelect: (v: { x: number; y: number } | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function CoordPlot({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: CoordPlotProps) {
  const [pt, setPt] = useState<CoordPoint | null>(null);

  useEffect(() => {
    setPt(null);
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
      showBuildings={step.showBuildings}
      showAxes={step.showAxes}
      showArchery={step.showArchery}
      points={step.points}
      figure={pt ?? step.initialFigure ?? null}
      plottedPoint={step.showBuildings ? null : pt}
      locked={locked}
      onGridClick={(x, y) => {
        if (locked) return;
        setPt({ x, y });
        onSelect({ x, y });
      }}
    />
  );
}

export function gradeCoordPlot(
  step: CoordPlotStep,
  ans: { x: number; y: number } | null,
): { correct: boolean; hint?: string } {
  if (!ans) return { correct: false, hint: step.hint || "Tap somewhere on the grid." };
  if (ans.x === step.targetX && ans.y === step.targetY) return { correct: true };
  return {
    correct: false,
    hint: step.hint || "Not quite. Remember: go along first, then up.",
  };
}
