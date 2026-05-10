/**
 * Histogram — vertical bars per bucket.
 *
 * Used as a passive visual AND as the body of the bucket-tap step (6-8-6-1-2/3/8).
 *
 * `buckets` is an ordered list of { label, count }. Optionally:
 *  - `bucketsVisible` — when set, only the first N bars are drawn (the rest
 *    are skipped). Used in 6-8-6-1-5/6 (progressive reveal).
 *  - `dotsInBars` — when true, each bar is drawn as a stack of small dots so
 *    students can count them (6-8-6-1-6).
 *  - `arrowAtBucket` — index of a bucket to add a downward arrow above
 *    (6-8-6-1-5).
 *  - `yLabel` / `xLabel` — axis descriptions.
 *  - `yStep` — major grid line spacing on the y-axis (default 5).
 *  - `selectable` — bars become clickable; pass `selectedLabel` + `onSelect`.
 */
export interface HistogramBucket {
  label: string;
  count: number;
}

export interface HistogramSpec {
  buckets: HistogramBucket[];
  bucketsVisible?: number;
  dotsInBars?: boolean;
  arrowAtBucket?: number;
  yLabel?: string;
  xLabel?: string;
  yStep?: number;
  size?: "regular" | "small";
}

export interface HistogramProps {
  spec: HistogramSpec;
  selectable?: boolean;
  selectedLabel?: string | null;
  onSelect?: (label: string) => void;
  locked?: boolean;
}

export default function Histogram({
  spec,
  selectable,
  selectedLabel,
  onSelect,
  locked,
}: HistogramProps) {
  const small = spec.size === "small";
  const buckets = spec.buckets;
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const visibleCount = spec.bucketsVisible ?? buckets.length;
  const yStep = spec.yStep ?? Math.max(1, Math.ceil(maxCount / 5));
  const yMax = Math.ceil(maxCount / yStep) * yStep;

  const barW = small ? 30 : 44;
  const barGap = small ? 4 : 6;
  const chartH = small ? 140 : 200;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 18;
  const padBottom = small ? 40 : 46;

  const chartW = buckets.length * (barW + barGap) + barGap;
  const totalW = chartW + padLeft + padRight;
  const totalH = chartH + padTop + padBottom;

  // y-axis ticks
  const yTicks: number[] = [];
  for (let v = 0; v <= yMax; v += yStep) yTicks.push(v);

  return (
    <div
      className={`histogram-wrap${small ? " small" : ""}`}
      style={{ width: totalW, minHeight: totalH }}
    >
      <div className="histogram-inner" style={{ position: "relative", width: totalW, height: totalH }}>
        {/* y-axis line */}
        <div
          style={{
            position: "absolute",
            left: padLeft,
            top: padTop,
            width: 2,
            height: chartH,
            background: "#888",
          }}
        />
        {/* x-axis line */}
        <div
          style={{
            position: "absolute",
            left: padLeft,
            top: padTop + chartH,
            width: chartW,
            height: 2,
            background: "#888",
          }}
        />
        {/* y-axis ticks + labels */}
        {yTicks.map((v) => {
          const top = padTop + chartH - (v / yMax) * chartH;
          return (
            <div key={`y${v}`}>
              <div
                style={{
                  position: "absolute",
                  left: padLeft - 5,
                  top,
                  width: 5,
                  height: 1.5,
                  background: "#888",
                  transform: "translateY(-50%)",
                }}
              />
              <div
                className="histogram-y-label"
                style={{ position: "absolute", right: totalW - padLeft + 8, top, transform: "translateY(-50%)" }}
              >
                {v}
              </div>
            </div>
          );
        })}

        {/* Bars */}
        {buckets.map((b, i) => {
          if (i >= visibleCount) return null;
          const heightPx = (b.count / yMax) * chartH;
          const left = padLeft + barGap + i * (barW + barGap);
          const top = padTop + chartH - heightPx;
          const sel = selectedLabel === b.label;
          const arrow = spec.arrowAtBucket === i;
          return (
            <div key={b.label}>
              <div
                className={`histogram-bar${sel ? " selected" : ""}${selectable ? " selectable" : ""}`}
                style={{
                  position: "absolute",
                  left,
                  top,
                  width: barW,
                  height: heightPx,
                }}
                onClick={() => {
                  if (!selectable || locked) return;
                  onSelect?.(b.label);
                }}
              >
                {spec.dotsInBars && (
                  <DotStack
                    count={b.count}
                    barW={barW}
                    barH={heightPx}
                  />
                )}
              </div>
              {/* x-axis bucket label */}
              <div
                className="histogram-x-label"
                style={{
                  position: "absolute",
                  left: left + barW / 2,
                  top: padTop + chartH + 8,
                  transform: "translateX(-50%)",
                }}
              >
                {b.label}
              </div>
              {/* down-arrow (above bar) */}
              {arrow && (
                <div
                  style={{
                    position: "absolute",
                    left: left + barW / 2,
                    top: top - 18,
                    transform: "translateX(-50%)",
                    fontSize: 22,
                    color: "#D84315",
                    lineHeight: 1,
                  }}
                >
                  ↓
                </div>
              )}
            </div>
          );
        })}

        {/* y-axis label */}
        {spec.yLabel && (
          <div
            className="histogram-axis-name"
            style={{
              position: "absolute",
              left: 2,
              top: padTop + chartH / 2,
              transform: "rotate(-90deg) translateX(50%)",
              transformOrigin: "left top",
              whiteSpace: "nowrap",
            }}
          >
            {spec.yLabel}
          </div>
        )}
        {/* x-axis label */}
        {spec.xLabel && (
          <div
            className="histogram-axis-name"
            style={{
              position: "absolute",
              left: padLeft + chartW / 2,
              top: padTop + chartH + 26,
              transform: "translateX(-50%)",
            }}
          >
            {spec.xLabel}
          </div>
        )}
      </div>
    </div>
  );
}

function DotStack({ count, barW, barH }: { count: number; barW: number; barH: number }) {
  // Fit `count` dots inside the bar. Choose dot size that fits.
  const dotSize = Math.max(4, Math.min(10, Math.floor(Math.min(barH / count, barW / 3))));
  const gap = 2;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    dots.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: "50%",
          bottom: 3 + i * (dotSize + gap),
          width: dotSize,
          height: dotSize,
          borderRadius: "50%",
          background: "#fff",
          transform: "translateX(-50%)",
          boxShadow: "0 0 0 1px #455A64",
        }}
      />,
    );
  }
  return <>{dots}</>;
}
