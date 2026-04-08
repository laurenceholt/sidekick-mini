import { useRef, useState } from "react";
import type {
  ThermometerStep,
  ThermometerCompareStep,
} from "@/lib/schemas/lesson";

interface VisualProps {
  min: number;
  max: number;
  tickStep: number;
  fillValue?: number;
  pointerValue?: number | null;
  onClickValue?: (v: number) => void;
  compact?: boolean;
  label?: string;
}

function ThermoVisual({
  min,
  max,
  tickStep,
  fillValue,
  pointerValue,
  onClickValue,
  compact,
  label,
}: VisualProps) {
  const tubeRef = useRef<HTMLDivElement>(null);
  const range = max - min;

  const ticks: number[] = [];
  const steps = Math.round(range / tickStep);
  for (let i = 0; i <= steps; i++) ticks.push(min + i * tickStep);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onClickValue || !tubeRef.current) return;
    const rect = tubeRef.current.getBoundingClientRect();
    const y = rect.bottom - e.clientY;
    const pct = y / rect.height;
    const raw = min + pct * range;
    const snapped = Math.round(raw / tickStep) * tickStep;
    onClickValue(Math.max(min, Math.min(max, snapped)));
  };

  const fillPct = fillValue !== undefined
    ? Math.max(0, ((fillValue - min) / range) * 100)
    : 0;
  const zeroPct = ((0 - min) / range) * 100;

  return (
    <div className="thermo-visual">
      <div className="thermo-scale-area">
        {ticks.map((t) => {
          const pct = ((t - min) / range) * 100;
          return (
            <div key={t} className="thermo-tick" style={{ bottom: `${pct}%` }}>
              <div className="thermo-tick-line" />
              <span
                className="thermo-tick-label"
                style={t === 0 ? { fontWeight: 900, color: "#1a1a2e" } : {}}
              >
                {t}°
              </span>
            </div>
          );
        })}
        <div className="thermo-zero-line" style={{ bottom: `${zeroPct}%` }} />
        <div
          ref={tubeRef}
          className="thermo-tube"
          style={{ cursor: onClickValue ? "pointer" : undefined }}
          onClick={handleClick}
        >
          <div className="thermo-fill" style={{ height: `${fillPct}%` }} />
        </div>
        {pointerValue !== undefined && pointerValue !== null && (
          <div
            className="thermo-pointer"
            style={{ bottom: `${((pointerValue - min) / range) * 100}%` }}
          >
            {pointerValue}°
          </div>
        )}
      </div>
      <div className="thermo-bulb" />
      {label && <div className="thermo-temp-label">{label}</div>}
      {compact && null}
    </div>
  );
}

// ─── Thermometer (single) ──────────────────────────────────

export interface ThermometerProps {
  step: ThermometerStep;
  onSelect: (v: number | null) => void;
  locked?: boolean;
  selectedIdx?: number | null;
  result?: "correct" | "wrong" | null;
}

export default function Thermometer({
  step,
  onSelect,
  locked,
  selectedIdx,
  result,
}: ThermometerProps) {
  const [picked, setPicked] = useState<number | null>(null);
  const [choiceIdx, setChoiceIdx] = useState<number | null>(null);
  const hasChoices = !!step.choices?.length;
  const isInteractive = step.target !== undefined && !hasChoices;

  return (
    <div className="thermo-wrap">
      <div className="thermo-instr-col">
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
      <ThermoVisual
        min={step.min}
        max={step.max}
        tickStep={step.tickStep ?? 10}
        fillValue={step.displayTemp ?? picked ?? undefined}
        pointerValue={isInteractive ? picked : undefined}
        onClickValue={
          isInteractive && !locked
            ? (v) => {
                setPicked(v);
                onSelect(v);
              }
            : undefined
        }
      />
    </div>
  );
}

export function gradeThermometer(
  step: ThermometerStep,
  ans: number,
): { correct: boolean; hint?: string } {
  if (step.choices?.length) {
    if (step.choices[ans]?.correct) return { correct: true };
    return { correct: false, hint: step.hint };
  }
  if (ans === step.target) return { correct: true };
  return {
    correct: false,
    hint: step.hint || `Try clicking closer to ${step.target}° on the thermometer.`,
  };
}

// ─── Thermometer-Compare ──────────────────────────────────

export interface ThermometerCompareProps {
  step: ThermometerCompareStep;
  onSelect: (idx: number | null) => void;
  locked?: boolean;
  selectedIdx?: number | null;
  result?: "correct" | "wrong" | null;
}

export function ThermometerCompare({
  step,
  onSelect,
  locked,
  selectedIdx,
  result,
}: ThermometerCompareProps) {
  const [internal, setInternal] = useState<number | null>(null);
  const sel = selectedIdx ?? internal;
  return (
    <div className="thermo-wrap thermo-compare">
      <div className="thermo-instr-col">
        <div className="choices">
          {step.choices.map((ch, i) => {
            const isSel = sel === i;
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
                  setInternal(i);
                  onSelect(i);
                }}
              >
                {ch.text}
              </button>
            );
          })}
        </div>
      </div>
      <div className="thermo-pair">
        {step.temperatures.map((t, i) => (
          <ThermoVisual
            key={i}
            min={step.min}
            max={step.max}
            tickStep={step.tickStep ?? 10}
            fillValue={t}
            label={`${t}°`}
          />
        ))}
      </div>
    </div>
  );
}

export function gradeThermometerCompare(
  step: ThermometerCompareStep,
  idx: number,
): { correct: boolean; hint?: string } {
  if (step.choices[idx]?.correct) return { correct: true };
  return { correct: false, hint: step.hint };
}
