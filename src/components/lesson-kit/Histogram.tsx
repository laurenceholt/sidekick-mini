/**
 * Histogram — vertical bars per bucket.
 *
 * Bars sit edge-to-edge with NO gap. Each bar carries a 1.5px outline; the
 * `box-sizing: border-box` + 1.5px horizontal overlap means adjacent bars'
 * borders coincide and read as a single 1.5px line between them, while the
 * top of the taller bar continues alone above the shorter bar's top — the
 * classic stair-step silhouette.
 *
 * Features:
 *  - `bucketsVisible` — progressive reveal (first N bars only)
 *  - `dotsInBars` + `dotColumns` — visualize each bar as a stack of small
 *    dots (1 or 3 columns; counts distributed evenly)
 *  - `tilesInBars` — visualize each bar as a stack of outlined boxes,
 *    matching the look of the TileSort step
 *  - `arrowAtBucket` — small down-arrow above a target bar
 *  - `xTickStyle: "ranges"` (default) draws each bucket's full label centered
 *    under its bar. `xTickStyle: "edges"` parses bucket labels "lo-hi" and
 *    draws tick marks + numeric labels at each bar boundary instead.
 *  - `selectable` — bars become tappable
 */
export interface HistogramBucket {
  label: string;
  count: number;
}

export interface HistogramSpec {
  buckets: HistogramBucket[];
  bucketsVisible?: number;
  dotsInBars?: boolean;
  dotColumns?: number;
  tilesInBars?: boolean;
  arrowAtBucket?: number;
  yLabel?: string;
  xLabel?: string;
  yStep?: number;
  xTickStyle?: "ranges" | "edges";
  size?: "regular" | "small";
}

export interface HistogramProps {
  spec: HistogramSpec;
  selectable?: boolean;
  selectedLabel?: string | null;
  onSelect?: (label: string) => void;
  locked?: boolean;
}

// Colors
const BAR_FILL = "#C5E1F5";
const BAR_BORDER = "#1565C0";
const GRID_LINE = "#E8EAF1";
const AXIS_LINE = "#37474F";
const AXIS_TEXT = "#1a1a2e";

const BORDER_W = 1.5;

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
  const yMax = Math.max(yStep, Math.ceil(maxCount / yStep) * yStep);

  const barW = small ? 30 : 44;
  const chartH = small ? 150 : 220;
  // padLeft sized to fit: rotated y-axis NAME (~16px) + gap (4) +
  // widest value label (~9px per digit @ font-size 12, weight 700) + tick gap (10).
  const maxYDigits = String(yMax).length;
  const valueLabelW = Math.max(12, maxYDigits * 9);
  const nameW = spec.yLabel ? 18 : 0;
  const nameGap = spec.yLabel ? 4 : 0;
  const padLeft = nameW + nameGap + valueLabelW + 10;
  const padRight = 16;
  const padTop = 14;
  const padBottom = small ? 44 : 56;

  // Bars overlap by BORDER_W so adjacent borders read as a single line.
  const stride = barW - BORDER_W;
  const chartW = buckets.length * stride + BORDER_W;
  const totalW = chartW + padLeft + padRight;
  const totalH = chartH + padTop + padBottom;

  // y-axis ticks
  const yTicks: number[] = [];
  for (let v = 0; v <= yMax; v += yStep) yTicks.push(v);

  const xStyle = spec.xTickStyle ?? "ranges";

  // For "edges" style, compute the edge value at each bar boundary by
  // parsing "lo-hi" labels.
  const edges: (number | string)[] = (() => {
    if (xStyle !== "edges") return [];
    const out: (number | string)[] = [];
    buckets.forEach((b, i) => {
      const m = b.label.match(/^(-?\d+(?:\.\d+)?)\s*[-–]\s*(-?\d+(?:\.\d+)?)$/);
      if (!m) {
        if (i === 0) out.push(b.label);
        out.push("");
        return;
      }
      if (i === 0) out.push(Number(m[1]));
      out.push(Number(m[2]));
    });
    return out;
  })();

  return (
    <div
      className={`histogram-wrap${small ? " small" : ""}`}
      style={{ width: totalW, minHeight: totalH, position: "relative" }}
    >
      <div className="histogram-inner" style={{ position: "relative", width: totalW, height: totalH }}>
        {/* Horizontal grid lines (light) at each y-tick */}
        {yTicks.map((v) => {
          if (v === 0) return null;
          const top = padTop + chartH - (v / yMax) * chartH;
          return (
            <div
              key={`g${v}`}
              style={{
                position: "absolute",
                left: padLeft,
                top,
                width: chartW,
                height: 1,
                background: GRID_LINE,
                pointerEvents: "none",
              }}
            />
          );
        })}

        {/* y-axis line */}
        <div
          style={{
            position: "absolute",
            left: padLeft,
            top: padTop,
            width: 1.5,
            height: chartH,
            background: AXIS_LINE,
          }}
        />
        {/* x-axis line */}
        <div
          style={{
            position: "absolute",
            left: padLeft,
            top: padTop + chartH,
            width: chartW,
            height: 1.5,
            background: AXIS_LINE,
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
                  left: padLeft - 4,
                  top,
                  width: 4,
                  height: 1.5,
                  background: AXIS_LINE,
                  transform: "translateY(-50%)",
                }}
              />
              <div
                className="histogram-y-label"
                style={{
                  position: "absolute",
                  right: totalW - padLeft + 10,
                  top,
                  transform: "translateY(-50%)",
                }}
              >
                {v}
              </div>
            </div>
          );
        })}

        {/* Bars */}
        {buckets.map((b, i) => {
          if (i >= visibleCount) return null;
          if (b.count === 0) return null;
          const heightPx = (b.count / yMax) * chartH;
          const left = padLeft + i * stride;
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
                  boxSizing: "border-box",
                  border: `${BORDER_W}px solid ${BAR_BORDER}`,
                  background: sel ? "#FFE0B2" : BAR_FILL,
                  cursor: selectable && !locked ? "pointer" : "default",
                }}
                onClick={() => {
                  if (!selectable || locked) return;
                  onSelect?.(b.label);
                }}
              >
                {spec.dotsInBars && !spec.tilesInBars && (
                  <DotStack
                    count={b.count}
                    barW={barW}
                    barH={heightPx}
                    columns={Math.max(1, spec.dotColumns ?? 1)}
                  />
                )}
                {spec.tilesInBars && (
                  <TileStack
                    count={b.count}
                    barW={barW}
                    unitH={chartH / yMax}
                  />
                )}
              </div>
              {/* down-arrow above bar */}
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

        {/* x-axis labels — "ranges" style: centered under each bar */}
        {xStyle === "ranges" &&
          buckets.map((b, i) => {
            const left = padLeft + i * stride + barW / 2;
            return (
              <div
                key={`xr${i}`}
                className="histogram-x-label"
                style={{
                  position: "absolute",
                  left,
                  top: padTop + chartH + 8,
                  transform: "translateX(-50%)",
                }}
              >
                {b.label}
              </div>
            );
          })}

        {/* x-axis labels — "edges" style: at each bar boundary */}
        {xStyle === "edges" &&
          edges.map((e, i) => {
            const left = padLeft + i * stride;
            return (
              <div key={`xe${i}`}>
                {/* small tick mark */}
                <div
                  style={{
                    position: "absolute",
                    left: left - 0.75,
                    top: padTop + chartH,
                    width: 1.5,
                    height: 5,
                    background: AXIS_LINE,
                  }}
                />
                <div
                  className="histogram-x-label"
                  style={{
                    position: "absolute",
                    left,
                    top: padTop + chartH + 10,
                    transform: "translateX(-50%)",
                  }}
                >
                  {e}
                </div>
              </div>
            );
          })}

        {/* y-axis label: rotated text, vertically centered along the axis */}
        {spec.yLabel && (
          <div
            className="histogram-axis-name-y"
            style={{
              position: "absolute",
              left: 0,
              top: padTop,
              height: chartH,
              width: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              color: AXIS_TEXT,
              fontFamily: "Nunito, sans-serif",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {spec.yLabel}
          </div>
        )}

        {/* x-axis label */}
        {spec.xLabel && (
          <div
            className="histogram-axis-name-x"
            style={{
              position: "absolute",
              left: padLeft + chartW / 2,
              top: padTop + chartH + 30,
              transform: "translateX(-50%)",
              color: AXIS_TEXT,
              fontFamily: "Nunito, sans-serif",
              fontSize: 13,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {spec.xLabel}
          </div>
        )}
      </div>
    </div>
  );
}

/** Distribute `count` dots across `columns` columns, stacked from the bottom. */
function DotStack({
  count,
  barW,
  barH,
  columns,
}: {
  count: number;
  barW: number;
  barH: number;
  columns: number;
}) {
  // How many dots per column? Fill from left to right, larger columns first.
  const perCol: number[] = [];
  let remaining = count;
  for (let c = 0; c < columns; c++) {
    const colsLeft = columns - c;
    const n = Math.ceil(remaining / colsLeft);
    perCol.push(n);
    remaining -= n;
  }
  const maxPerCol = Math.max(1, ...perCol);
  const dotSize = Math.max(4, Math.min(10, Math.floor(Math.min(barH / maxPerCol, barW / (columns + 1)))));
  const gap = 2;
  const colSpacing = barW / (columns + 1);

  const dots: React.ReactNode[] = [];
  perCol.forEach((n, c) => {
    const colLeft = colSpacing * (c + 1);
    for (let i = 0; i < n; i++) {
      dots.push(
        <div
          key={`${c}-${i}`}
          style={{
            position: "absolute",
            left: colLeft,
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
  });
  return <>{dots}</>;
}

/**
 * Outlined boxes stacked inside a bar. Each tile is exactly one y-axis unit
 * tall (`unitH` pixels) and stacked tightly, so tile boundaries line up with
 * the y-axis tick marks AND the top tile aligns with the top of the bar.
 */
function TileStack({
  count,
  barW,
  unitH,
}: { count: number; barW: number; unitH: number }) {
  const tileW = Math.min(barW - 4, 36);
  const tiles: React.ReactNode[] = [];
  for (let i = 0; i < count; i++) {
    tiles.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: "50%",
          bottom: i * unitH,
          width: tileW,
          height: unitH,
          background: "rgba(255,255,255,0.5)",
          // Top + side borders only — the bottom of tile k coincides with
          // the top of tile k-1, and the bottommost tile uses the bar's
          // own bottom border.
          borderTop: "1px solid #455A64",
          borderLeft: "1px solid #455A64",
          borderRight: "1px solid #455A64",
          transform: "translateX(-50%)",
          boxSizing: "border-box",
        }}
      />,
    );
  }
  return <>{tiles}</>;
}
