import { useRef, type ReactNode } from "react";

/**
 * Coordinate plane primitive for Section 1-3.
 *
 * Renders a 2D grid between (xMin,yMin) and (xMax,yMax). Optional backgrounds:
 *  - `showBuildings` — 5 buildings with 5 floors, each floor a "window"
 *  - `showAxes`      — labeled x/y axis arrows
 *  - `showArchery`   — concentric rings at radii 3/6/9 with scores 10/5/2
 *
 * Children can be dots (via `points`), tappable selectable points (`tapPoints`),
 * or a student-placed point (`plottedPoint`). Click on any grid intersection
 * is forwarded via `onGridClick`.
 */
export interface CoordPoint {
  x: number;
  y: number;
  label?: string;
  figure?: boolean; // render as a stick figure
}

export interface CoordPlaneProps {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  showGrid?: boolean;
  showBuildings?: boolean;
  showAxes?: boolean;
  showArchery?: boolean;
  /** Pre-placed static points (no interaction) */
  points?: CoordPoint[];
  /** Selectable points (student taps one) */
  tapPoints?: CoordPoint[];
  selectedTap?: CoordPoint | null;
  onTap?: (p: CoordPoint) => void;
  /** Student's plotted point */
  plottedPoint?: CoordPoint | null;
  /** Figure position (for buildings mode). null = hidden */
  figure?: CoordPoint | null;
  onGridClick?: (x: number, y: number) => void;
  locked?: boolean;
  size?: number; // pixel size of each grid cell; auto by default
  children?: ReactNode;
}

export default function CoordPlane({
  xMin,
  xMax,
  yMin,
  yMax,
  showGrid = true,
  showBuildings,
  showAxes,
  showArchery,
  points = [],
  tapPoints,
  selectedTap,
  onTap,
  plottedPoint,
  figure,
  onGridClick,
  locked,
}: CoordPlaneProps) {
  const ref = useRef<HTMLDivElement>(null);

  const xRange = xMax - xMin;
  const yRange = yMax - yMin;

  // Auto-size: fit within 480px wide, but no more than 32px per cell
  const cell = Math.min(
    32,
    Math.floor(Math.min(480 / Math.max(xRange, 1), 320 / Math.max(yRange, 1))),
  );
  const boardW = xRange * cell;
  const boardH = yRange * cell;

  const toPx = (x: number, y: number) => ({
    left: (x - xMin) * cell,
    // y axis flipped: yMax at top
    top: (yMax - y) * cell,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (!onGridClick || locked || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const x = Math.round(px / cell) + xMin;
    const y = Math.round((boardH - py) / cell) + yMin;
    if (x < xMin || x > xMax || y < yMin || y > yMax) return;
    onGridClick(x, y);
  };

  // Grid lines
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    for (let x = xMin; x <= xMax; x++) {
      const pct = ((x - xMin) / xRange) * 100;
      gridLines.push(
        <div
          key={`vx${x}`}
          className={`cp-grid-v${x === 0 ? " axis" : ""}`}
          style={{ left: `${pct}%` }}
        />,
      );
    }
    for (let y = yMin; y <= yMax; y++) {
      const pct = ((yMax - y) / yRange) * 100;
      gridLines.push(
        <div
          key={`hy${y}`}
          className={`cp-grid-h${y === 0 ? " axis" : ""}`}
          style={{ top: `${pct}%` }}
        />,
      );
    }
  }

  // Axis number labels
  const axisLabels: React.ReactNode[] = [];
  if (showGrid) {
    // x-axis labels under bottom edge
    for (let x = xMin; x <= xMax; x++) {
      // skip 0 label if both axes present to avoid overlap with y-axis label
      const p = toPx(x, yMin);
      axisLabels.push(
        <div
          key={`lx${x}`}
          className="cp-axis-label cp-axis-label-x"
          style={{ left: p.left }}
        >
          {x}
        </div>,
      );
    }
    // y-axis labels to the left
    for (let y = yMin; y <= yMax; y++) {
      const p = toPx(xMin, y);
      axisLabels.push(
        <div
          key={`ly${y}`}
          className="cp-axis-label cp-axis-label-y"
          style={{ top: p.top }}
        >
          {y}
        </div>,
      );
    }
  }

  return (
    <div className="cp-wrap">
      <div
        className={`cp-board${showBuildings ? " buildings" : ""}`}
        ref={ref}
        onClick={handleClick}
        style={{ width: boardW, height: boardH }}
      >
        {showBuildings && <BuildingsBg xRange={xRange} yRange={yRange} />}
        {showArchery && (
          <ArcheryBg boardW={boardW} boardH={boardH} toPx={toPx} cell={cell} />
        )}
        {showGrid && <>{gridLines}</>}

        {/* Pre-placed points */}
        {points.map((p, i) => {
          const { left, top } = toPx(p.x, p.y);
          return (
            <div key={`pp${i}`}>
              {p.figure ? (
                <Figure style={{ left, top }} />
              ) : (
                <div className="cp-point" style={{ left, top }} />
              )}
              {p.label && (
                <div className="cp-point-label" style={{ left, top }}>
                  {p.label}
                </div>
              )}
            </div>
          );
        })}

        {/* Tappable points */}
        {tapPoints?.map((p, i) => {
          const { left, top } = toPx(p.x, p.y);
          const isSel =
            selectedTap && selectedTap.x === p.x && selectedTap.y === p.y;
          return (
            <div
              key={`tp${i}`}
              className={`cp-point cp-tap${isSel ? " selected" : ""}`}
              style={{ left, top }}
              onClick={(e) => {
                e.stopPropagation();
                if (!locked && onTap) onTap(p);
              }}
            />
          );
        })}

        {/* Student's plotted point */}
        {plottedPoint && (
          <div
            className="cp-point cp-plotted"
            style={toPx(plottedPoint.x, plottedPoint.y)}
          />
        )}

        {/* Figure (buildings mode) */}
        {figure && <Figure style={toPx(figure.x, figure.y)} />}
      </div>

      {/* Axis number labels (rendered outside board for clarity) */}
      <div className="cp-axis-labels-x" style={{ width: boardW }}>
        {Array.from({ length: xRange + 1 }, (_, i) => {
          const x = xMin + i;
          return (
            <span
              key={x}
              className="cp-axis-label"
              style={{ left: i * cell }}
            >
              {x}
            </span>
          );
        })}
      </div>
      <div className="cp-axis-labels-y" style={{ height: boardH }}>
        {Array.from({ length: yRange + 1 }, (_, i) => {
          const y = yMax - i;
          return (
            <span
              key={y}
              className="cp-axis-label"
              style={{ top: i * cell }}
            >
              {y}
            </span>
          );
        })}
      </div>

      {showAxes && (
        <>
          <div className="cp-axis-name cp-axis-name-x" style={{ left: boardW }}>
            x
          </div>
          <div className="cp-axis-name cp-axis-name-y">y</div>
        </>
      )}
    </div>
  );
}

function BuildingsBg({ xRange, yRange }: { xRange: number; yRange: number }) {
  // 5 buildings centered at grid x=1..5, each 0.7 grid units wide.
  // Windows on floors 1..5, each window centered at grid y=F.
  // viewBox uses 100 SVG units per grid unit.
  const U = 100;
  const W = xRange * U;
  const H = yRange * U;
  return (
    <svg
      className="cp-buildings-bg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
    >
      {/* Sky */}
      <rect width="100%" height="100%" fill="#FFE0B2" opacity="0.55" />
      {[1, 2, 3, 4, 5].map((bx, idx) => {
        const colors = ["#90A4AE", "#A1887F", "#78909C", "#BCAAA4", "#8D6E63"];
        const centerX = bx * U;
        const w = 0.7 * U;
        const leftX = centerX - w / 2;
        // Body runs from grid y=0.5 (base) to y=5.5 (top) → SVG y range:
        const bodyTopY = (yRange - 5.5) * U;
        const bodyBottomY = (yRange - 0.3) * U;
        const bodyH = bodyBottomY - bodyTopY;
        return (
          <g key={bx}>
            {/* Body */}
            <rect
              x={leftX}
              y={bodyTopY}
              width={w}
              height={bodyH}
              fill={colors[idx]}
              stroke="#37474F"
              strokeWidth={1.2}
            />
            {/* Windows: 5 floors × 1 per floor, centered at grid (bx, F) */}
            {[1, 2, 3, 4, 5].map((fy) => {
              const winCenterY = (yRange - fy) * U;
              const ww = 36;
              const wh = 40;
              const winX = centerX - ww / 2;
              const winY = winCenterY - wh / 2;
              return (
                <g key={fy}>
                  <rect
                    x={winX}
                    y={winY}
                    width={ww}
                    height={wh}
                    fill="#1a2a3a"
                    stroke="#0d1722"
                    strokeWidth={1}
                    rx={3}
                  />
                  <line
                    x1={centerX}
                    y1={winY}
                    x2={centerX}
                    y2={winY + wh}
                    stroke="#0d1722"
                    strokeWidth={1.2}
                  />
                  <line
                    x1={winX}
                    y1={winCenterY}
                    x2={winX + ww}
                    y2={winCenterY}
                    stroke="#0d1722"
                    strokeWidth={1.2}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function ArcheryBg({
  toPx,
  cell,
}: {
  boardW: number;
  boardH: number;
  toPx: (x: number, y: number) => { left: number; top: number };
  cell: number;
}) {
  const origin = toPx(0, 0);
  return (
    <svg
      className="cp-archery-bg"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
      }}
    >
      {/* radii 9, 6, 3 concentric */}
      {[
        { r: 9, fill: "#FFCDD2", score: 2 },
        { r: 6, fill: "#FFE0B2", score: 5 },
        { r: 3, fill: "#FFECB3", score: 10 },
      ].map(({ r, fill, score }) => (
        <g key={r}>
          <circle
            cx={origin.left}
            cy={origin.top}
            r={r * cell}
            fill={fill}
            stroke="#B71C1C"
            strokeWidth={1.2}
            opacity={0.85}
          />
          <text
            x={origin.left}
            y={origin.top - r * cell + 14}
            fontFamily="Nunito, sans-serif"
            fontSize={11}
            fontWeight={900}
            fill="#B71C1C"
            textAnchor="middle"
          >
            {score}
          </text>
        </g>
      ))}
      <circle cx={origin.left} cy={origin.top} r={3} fill="#B71C1C" />
    </svg>
  );
}

function Figure({ style }: { style: React.CSSProperties }) {
  return (
    <svg className="cp-figure" style={style} viewBox="0 0 20 28" width={18} height={26}>
      {/* Head */}
      <circle cx="10" cy="5" r="4" fill="#FFCC80" stroke="#1a1a2e" strokeWidth="1" />
      {/* Body */}
      <line x1="10" y1="9" x2="10" y2="18" stroke="#1a1a2e" strokeWidth="1.5" />
      {/* Arms */}
      <line x1="10" y1="12" x2="4" y2="16" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="10" y1="12" x2="16" y2="16" stroke="#1a1a2e" strokeWidth="1.5" />
      {/* Legs */}
      <line x1="10" y1="18" x2="5" y2="26" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="10" y1="18" x2="15" y2="26" stroke="#1a1a2e" strokeWidth="1.5" />
    </svg>
  );
}
