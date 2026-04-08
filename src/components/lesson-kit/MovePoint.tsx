import { useEffect, useRef, useState } from "react";
import NumberLine, { NumberLinePoint } from "./NumberLine";
import type { MovePointStep } from "@/lib/schemas/lesson";

export interface MovePointProps {
  step: MovePointStep;
  onSelect: (value: number | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

export default function MovePoint({ step, onSelect, locked }: MovePointProps) {
  const [value, setValue] = useState<number>(step.startValue);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onSelect(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setFromEvent = (clientX: number) => {
    if (!lineRef.current) return;
    const rect = lineRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const snap = step.tickStep ?? 1;
    let v = step.min + pct * (step.max - step.min);
    v = Math.round(v / snap) * snap;
    v = Math.max(step.min, Math.min(step.max, v));
    setValue(v);
    onSelect(v);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (locked) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setFromEvent(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (locked) return;
    if (e.buttons === 0) return;
    setFromEvent(e.clientX);
  };

  return (
    <div>
      {step.equationLabel && (
        <div className="eq-label">{step.equationLabel}</div>
      )}
      <div
        ref={lineRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        style={{ touchAction: "none" }}
      >
        <NumberLine
          min={step.min}
          max={step.max}
          tickStep={step.tickStep}
          labelStep={step.labelStep}
        >
          <NumberLinePoint value={value} min={step.min} max={step.max} placed />
        </NumberLine>
      </div>
    </div>
  );
}

export function gradeMovePoint(
  step: MovePointStep,
  value: number,
): { correct: boolean; hint?: string } {
  if (value === step.target) return { correct: true };
  if (step.moveBy !== undefined) {
    const dir = step.moveBy > 0 ? "right" : "left";
    const verb = step.moveBy > 0 ? "Adding" : "Subtracting";
    return {
      correct: false,
      hint: `${verb} ${Math.abs(step.moveBy)} means move ${Math.abs(step.moveBy)} units to the ${dir}.`,
    };
  }
  return { correct: false, hint: step.hint };
}
