import { useRef, useState } from "react";
import type { ElevationStep } from "@/lib/schemas/lesson";

export interface ElevationProps {
  step: ElevationStep;
  onSelect: (v: number | null) => void;
  locked?: boolean;
  selectedIdx?: number | null;
  result?: "correct" | "wrong" | null;
}

export default function Elevation({
  step,
  onSelect,
  locked,
  selectedIdx,
  result,
}: ElevationProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [choiceIdx, setChoiceIdx] = useState<number | null>(null);
  const hasChoices = !!step.choices?.length;
  const isInteractive = step.target !== undefined && !hasChoices;
  const tickStep = step.tickStep ?? 20;
  // Snap on half the tick step so values like 50 (on a 20-step grid) still work.
  const snapStep = step.target !== undefined && step.target % tickStep !== 0
    ? tickStep / 2
    : tickStep;
  const range = step.max - step.min;
  const zeroPct = ((0 - step.min) / range) * 100;

  const ticks: number[] = [];
  const numSteps = Math.round(range / tickStep);
  for (let i = 0; i <= numSteps; i++) ticks.push(step.min + i * tickStep);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isInteractive || locked || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const y = rect.bottom - e.clientY;
    const pct = y / rect.height;
    const raw = step.min + pct * range;
    const snapped = Math.round(raw / snapStep) * snapStep;
    const clamped = Math.max(step.min, Math.min(step.max, snapped));
    setPicked(clamped);
    onSelect(clamped);
  };

  return (
    <div className="elev-wrap">
      <div className="elev-instr-col">
        {hasChoices && (
          <div className="choices">
            {step.choices!.map((ch, i) => {
              const cur = selectedIdx ?? choiceIdx;
              const isSel = cur === i;
              const cls =
                "choice-btn" +
                (isSel ? " selected" : "") +
                (isSel && result === "correct" ? " correct" : "") +
                (isSel && result === "wrong" ? " wrong" : "");
              return (
                <button
                  key={i}
                  className={cls}
                  disabled={locked}
                  onClick={() => {
                    if (locked) return;
                    setChoiceIdx(i);
                    onSelect(i);
                  }}
                >
                  {ch.text}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="elev-visual" ref={wrapRef}>
        <div className="elev-sky" style={{ height: `${100 - zeroPct}%` }} />
        <div className="elev-water" style={{ height: `${zeroPct}%` }} />
        <div className="elev-sea-line" style={{ bottom: `${zeroPct}%` }}>
          <span className="elev-sea-label">Sea Level</span>
        </div>
        <div className="elev-mountain" style={{ bottom: `${zeroPct}%` }}>
          <svg viewBox="0 0 120 80" preserveAspectRatio="none" width="100%" height="100%">
            <polygon points="20,80 60,8 100,80" fill="#8BC34A" opacity="0.6" />
            <polygon points="50,80 80,25 110,80" fill="#689F38" opacity="0.5" />
            <polygon points="55,15 60,8 65,15" fill="white" opacity="0.7" />
          </svg>
        </div>
        <div className="elev-waves" style={{ bottom: `${zeroPct - 2}%` }}>
          <svg viewBox="0 0 120 12" preserveAspectRatio="none" width="100%" height="100%">
            <path
              d="M0,6 Q15,0 30,6 Q45,12 60,6 Q75,0 90,6 Q105,12 120,6"
              fill="none"
              stroke="#29B6F6"
              strokeWidth={2}
              opacity={0.6}
            />
          </svg>
        </div>
        <div className="elev-scale">
          {ticks.map((t) => {
            const pct = ((t - step.min) / range) * 100;
            return (
              <div
                key={t}
                className={`elev-tick${picked === t ? " highlight" : ""}`}
                style={{ bottom: `${pct}%` }}
              >
                <span
                  className="elev-tick-label"
                  style={t === 0 ? { fontWeight: 900, color: "#1a1a2e" } : {}}
                >
                  {t}m
                </span>
                <div className="elev-tick-line" />
              </div>
            );
          })}
        </div>
        {step.min <= -80 && step.max >= -80 && (
          <div
            style={{
              position: "absolute",
              bottom: `${((-80 - step.min) / range) * 100}%`,
              right: 8,
              fontSize: 22,
              transform: "translateY(50%)",
              zIndex: 7,
              pointerEvents: "none",
            }}
          >
            🐙
          </div>
        )}
        {(step.staticPoints ?? []).map((v, i) => {
          const pct = ((v - step.min) / range) * 100;
          return (
            <div key={i} className="elev-static-point" style={{ bottom: `${pct}%` }}>
              <span className="elev-point-label">{v}m</span>
            </div>
          );
        })}
        {isInteractive && (
          <div className="elev-click-zone" onClick={handleClick} />
        )}
        {picked !== null && (
          <div
            className="elev-pointer"
            style={{ bottom: `${((picked - step.min) / range) * 100}%` }}
          >
            {picked}m
          </div>
        )}
      </div>
    </div>
  );
}

export function gradeElevation(
  step: ElevationStep,
  ans: number,
): { correct: boolean; hint?: string } {
  if (step.choices?.length) {
    if (step.choices[ans]?.correct) return { correct: true };
    return { correct: false, hint: step.hint };
  }
  if (ans === step.target) return { correct: true };
  return {
    correct: false,
    hint: step.hint || `Try clicking closer to ${step.target}m on the scale.`,
  };
}
