/**
 * DotPlot — a horizontal number line with stacked dots above each value.
 *
 * Used as a passive visual (above multiple-choice / text input) and also as
 * a tappable card variant (TwoChartChoice).
 *
 * Each value in `data` adds one dot stacked above that tick.
 *  - `highlightValue` highlights a single tick label
 *  - `redValues` renders matching dots in red instead of slate (e.g. "this is
 *    Sakeem's dot")
 *
 * `label` shows under the number line ("Score: number of grapes caught").
 * `legend` shows on the right ("Each ● is one student").
 */
export interface DotPlotSpec {
  xMin: number;
  xMax: number;
  step?: number; // grid step (defaults to 1)
  /** All data values; each adds a dot at that x-value. */
  data: number[];
  /** Values whose top-most dot should render red ("this is Sakeem"). */
  redValues?: number[];
  /** Tick value to highlight on the axis label. */
  highlightValue?: number;
  label?: string;
  legend?: string;
  /** Visual size factor (small for two-card comparisons). */
  size?: "regular" | "small";
}

export interface DotPlotProps {
  spec: DotPlotSpec;
}

export default function DotPlot({ spec }: DotPlotProps) {
  const step = spec.step ?? 1;
  const xMin = spec.xMin;
  const xMax = spec.xMax;
  const range = xMax - xMin;
  const small = spec.size === "small";

  const cell = small ? 22 : 36;
  const dotSize = small ? 10 : 13;
  // `cell` is the width per STEP, not per integer unit — fixes plots with
  // half-step ticks (e.g. xMin=5, xMax=9, step=0.5 → 8 cells, not 4).
  const numCells = range / step;
  const lineW = numCells * cell;
  const padX = small ? 22 : 30;
  const padTop = small ? 28 : 38;
  const padBottom = small ? 40 : 54;
  // Space between the line and the bottom-most dot.
  const dotBaseGap = small ? 4 : 6;

  // Build stack heights & per-position red flags
  const ticks: number[] = [];
  for (let i = 0; i <= range / step + 1e-6; i++) {
    ticks.push(+(xMin + i * step).toFixed(6));
  }

  // group data values into stacks
  const stacks = new Map<number, number>();
  for (const v of spec.data) {
    stacks.set(v, (stacks.get(v) ?? 0) + 1);
  }
  const redSet = new Set(spec.redValues ?? []);

  const maxStack = Math.max(1, ...Array.from(stacks.values()));
  // Vertical room for dots: cap at maxStack * dotSize + spacing
  const stackArea = Math.max(70, maxStack * (dotSize + 2) + 12);
  const totalH = stackArea + padBottom;

  const totalW = lineW + padX * 2;

  return (
    <div className="dotplot-wrap" style={{ width: totalW, minHeight: totalH + padTop }}>
      <div
        className="dotplot-inner"
        style={{
          position: "relative",
          width: totalW,
          height: stackArea + 24, // 24 = baseline + tick gap
          marginTop: padTop,
        }}
      >
        {/* Stacked dots */}
        {ticks.map((v) => {
          const count = stacks.get(v) ?? 0;
          if (count === 0) return null;
          const leftPx = padX + ((v - xMin) / step) * cell;
          return (
            <div key={`s${v}`}>
              {Array.from({ length: count }, (_, k) => {
                const isTopRed = redSet.has(v) && k === count - 1;
                // Line top sits at ~19 from container bottom; add a gap so
                // the bottom-most dot doesn't crash into the line.
                const bottomFromBase = 19 + dotBaseGap + k * (dotSize + 2);
                return (
                  <div
                    key={k}
                    className={`dotplot-dot${isTopRed ? " red" : ""}`}
                    style={{
                      left: leftPx,
                      bottom: bottomFromBase,
                      width: dotSize,
                      height: dotSize,
                    }}
                  />
                );
              })}
            </div>
          );
        })}

        {/* Number line */}
        <div
          className="dotplot-line"
          style={{
            position: "absolute",
            left: padX,
            right: padX,
            bottom: 16,
            height: 3,
          }}
        />
        {/* Ticks + labels */}
        {ticks.map((v) => {
          const leftPx = padX + ((v - xMin) / step) * cell;
          const isHi = spec.highlightValue !== undefined && Math.abs(v - spec.highlightValue) < 1e-9;
          // Only label integer values (or half-units in small mode is fine)
          const labelable = Math.abs(v - Math.round(v)) < 1e-9;
          return (
            <div key={`t${v}`}>
              <div
                className="dotplot-tick"
                style={{
                  position: "absolute",
                  left: leftPx,
                  bottom: 10,
                  width: 1.5,
                  height: 8,
                  transform: "translateX(-50%)",
                }}
              />
              {labelable && (
                <div
                  className={`dotplot-label${isHi ? " hi" : ""}`}
                  style={{
                    position: "absolute",
                    left: leftPx,
                    bottom: -8,
                    fontSize: small ? 11 : 13,
                  }}
                >
                  {v}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {spec.label && (
        <div className="dotplot-axis-name" style={{ marginTop: small ? 6 : 10 }}>
          {spec.label}
        </div>
      )}
      {spec.legend && <div className="dotplot-legend">{spec.legend}</div>}
    </div>
  );
}
