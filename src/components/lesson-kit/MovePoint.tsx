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
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setFromEvent(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (locked) return;
    // On touch, pressure/buttons may report 0 even while dragging — use
    // pointerType instead and always move while captured.
    if (e.pointerType === "mouse" && e.buttons === 0) return;
    e.preventDefault();
    setFromEvent(e.clientX);
  };
  const onPointerUp = (e: React.PointerEvent) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const range = step.max - step.min;
  const arcs: { d: string; ax: number; ay: number }[] = [];
  const from = step.startValue;
  const to = value;
  if (from !== to) {
    const dir = from < to ? 1 : -1;
    const steps = Math.abs(to - from);
    for (let i = 0; i < steps; i++) {
      const a = from + i * dir;
      const b = a + dir;
      const x1 = ((a - step.min) / range) * 100;
      const x2 = ((b - step.min) / range) * 100;
      const midX = (x1 + x2) / 2;
      arcs.push({
        d: `M ${x1} 40 Q ${midX} 4 ${x2} 40`,
        ax: x2,
        ay: 40,
      });
    }
  }

  return (
    <div>
      {step.equationLabel && (
        <div className="equation">
          <span>{step.equationLabel}</span>
        </div>
      )}
      <div
        ref={lineRef}
        className="move-point-drag"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: "none", position: "relative" }}
      >
        <NumberLine
          min={step.min}
          max={step.max}
          tickStep={step.tickStep}
          labelStep={step.labelStep}
        >
          {arcs.length > 0 && (
            <svg
              className="jump-arrows"
              viewBox="0 0 100 44"
              preserveAspectRatio="none"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "100%",
                width: "100%",
                height: 44,
                overflow: "visible",
                pointerEvents: "none",
              }}
            >
              {arcs.map((a, i) => (
                <g
                  key={i}
                  stroke="#57B477"
                  strokeWidth={0.6}
                  fill="none"
                  strokeLinecap="round"
                >
                  <path d={a.d} />
                </g>
              ))}
            </svg>
          )}
          <NumberLinePoint
            value={step.startValue}
            min={step.min}
            max={step.max}
            ghost={value !== step.startValue}
          />
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
