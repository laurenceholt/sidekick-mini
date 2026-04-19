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
 *
 * In buildings mode the board is padded so buildings don't clip at the edges.
 */
export interface CoordPoint {
  x: number;
  y: number;
  label?: string;
  figure?: boolean;
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
  points?: CoordPoint[];
  tapPoints?: CoordPoint[];
  selectedTap?: CoordPoint | null;
  onTap?: (p: CoordPoint) => void;
  plottedPoint?: CoordPoint | null;
  figure?: CoordPoint | null;
  onGridClick?: (x: number, y: number) => void;
  locked?: boolean;
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

  // Auto-size cell: capped small enough that a 10-unit tall plane fits on a
  // 1366x768 Chromebook viewport without scrolling.
  const cell = Math.min(
    26,
    Math.floor(Math.min(480 / Math.max(xRange, 1), 260 / Math.max(yRange, 1))),
  );

  // Axis layout
  const xAxisInRange = xMin <= 0 && 0 <= xMax; // horizontal axis at y=0 exists
  const yAxisInRange = yMin <= 0 && 0 <= yMax; // vertical axis at x=0 exists
  const xAxisNeedsLeftArrow = xMin < 0;
  const yAxisNeedsBottomArrow = yMin < 0;

  // Padding around the grid area
  // - Buildings mode: room for overhang on sides/top, plus stick-figure feet below
  // - showAxes: extra room for axis arrows + x/y labels on the relevant sides
  // - Non-buildings: small buffer so edge dots/labels don't clip
  let padLeft = showBuildings ? Math.ceil(cell * 0.45) + 4 : 12;
  let padRight = showBuildings ? Math.ceil(cell * 0.45) + 4 : 12;
  let padTop = showBuildings ? Math.ceil(cell * 0.55) : 12;
  let padBottom = showBuildings ? 22 : 12;

  if (showAxes) {
    // Room for right-end x-arrow + 'x' label
    padRight = Math.max(padRight, 30);
    // Room for top-end y-arrow + 'y' label
    padTop = Math.max(padTop, 26);
    // Room for left-end x-arrow
    if (xAxisNeedsLeftArrow) padLeft = Math.max(padLeft, 18);
    // Room for bottom-end y-arrow
    if (yAxisNeedsBottomArrow) padBottom = Math.max(padBottom, 18);
  }
  // Always leave some room for axis-labels positioned just outside the grid
  // (labels live along the relevant axis; when axis is at the edge they
  // effectively sit outside the grid).
  if (!showBuildings && !yAxisInRange) padLeft = Math.max(padLeft, 18);
  if (!showBuildings && !xAxisInRange) padBottom = Math.max(padBottom, 20);
  if (!showBuildings) {
    // For grids with axis at the edge, labels need to sit outside.
    if (xMin === 0) padLeft = Math.max(padLeft, 18);
    if (yMin === 0) padBottom = Math.max(padBottom, 20);
  }

  const gridW = xRange * cell;
  const gridH = yRange * cell;
  const boardW = gridW + padLeft + padRight;
  const boardH = gridH + padTop + padBottom;

  // Convert grid coords → pixel coords (relative to board's top-left)
  const toPx = (x: number, y: number) => ({
    left: padLeft + (x - xMin) * cell,
    top: padTop + (yMax - y) * cell,
  });

  const handleClick = (e: React.MouseEvent) => {
    if (!onGridClick || locked || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = e.clientX - rect.left - padLeft;
    const py = e.clientY - rect.top - padTop;
    if (px < -cell / 2 || px > gridW + cell / 2) return;
    if (py < -cell / 2 || py > gridH + cell / 2) return;
    const x = Math.round(px / cell) + xMin;
    const y = Math.round((gridH - py) / cell) + yMin;
    if (x < xMin || x > xMax || y < yMin || y > yMax) return;
    onGridClick(x, y);
  };

  // Build grid lines (positioned relative to grid area, offset by padLeft/padTop)
  const gridLines: React.ReactNode[] = [];
  if (showGrid) {
    for (let x = xMin; x <= xMax; x++) {
      const p = toPx(x, yMin);
      gridLines.push(
        <div
          key={`vx${x}`}
          className={`cp-grid-v${x === 0 ? " axis" : ""}`}
          style={{ left: p.left, top: padTop, height: gridH }}
        />,
      );
    }
    for (let y = yMin; y <= yMax; y++) {
      const p = toPx(xMin, y);
      gridLines.push(
        <div
          key={`hy${y}`}
          className={`cp-grid-h${y === 0 ? " axis" : ""}`}
          style={{ top: p.top, left: padLeft, width: gridW }}
        />,
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
        {showBuildings && (
          <BuildingsBg
            xMin={xMin}
            xMax={xMax}
            yMax={yMax}
            cell={cell}
            padLeft={padLeft}
            padTop={padTop}
            gridH={gridH}
            figure={figure ?? null}
          />
        )}
        {showArchery && <ArcheryBg toPx={toPx} cell={cell} />}
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

        {/* Figure — drawn only when NOT inside a building room.
            Inside a room (buildings mode, x in 1..5 and y in 1..5), the lit
            window takes over rendering. */}
        {figure &&
          !(
            showBuildings &&
            figure.x >= 1 &&
            figure.x <= 5 &&
            figure.y >= 1 &&
            figure.y <= 5
          ) && <Figure style={toPx(figure.x, figure.y)} />}

        {/* On-axis number labels — x-axis labels along y=0 line (or bottom edge
            if yMin>0), y-axis labels along x=0 line (or left edge if xMin>0). */}
        {showGrid && (
          <>
            {/* X-axis labels */}
            {Array.from({ length: xRange + 1 }, (_, i) => {
              const x = xMin + i;
              // Skip 0 if y-axis exists in range (avoid overlap with y-labels)
              if (x === 0 && yAxisInRange && xAxisInRange) return null;
              const axisY = xAxisInRange ? padTop + (yMax - 0) * cell : padTop + gridH;
              const left = padLeft + i * cell;
              return (
                <span
                  key={`xl${x}`}
                  className="cp-axis-label cp-axis-label-inline cp-axis-label-x"
                  style={{ left, top: axisY + 4 }}
                >
                  {x}
                </span>
              );
            })}
            {/* Y-axis labels (skip 0 — it's drawn once by x-axis labels) */}
            {Array.from({ length: yRange + 1 }, (_, i) => {
              const y = yMax - i;
              if (y === 0) return null;
              const axisX = yAxisInRange ? padLeft + (0 - xMin) * cell : padLeft;
              const top = padTop + i * cell;
              return (
                <span
                  key={`yl${y}`}
                  className="cp-axis-label cp-axis-label-inline cp-axis-label-y"
                  style={{ left: axisX - 5, top }}
                >
                  {y}
                </span>
              );
            })}
          </>
        )}

        {/* Axis arrows + x/y names (only when showAxes). Arrows attach to the
            existing axis lines; padding above/right (and left/below if needed)
            was reserved for them. */}
        {showAxes && xAxisInRange && (
          <>
            {/* Right arrow on x-axis */}
            <AxisArrow
              dir="right"
              left={padLeft + gridW}
              top={padTop + (yMax - 0) * cell}
            />
            {xAxisNeedsLeftArrow && (
              <AxisArrow
                dir="left"
                left={padLeft}
                top={padTop + (yMax - 0) * cell}
              />
            )}
            <div
              className="cp-axis-name cp-axis-name-x"
              style={{
                left: padLeft + gridW + 18,
                top: padTop + (yMax - 0) * cell - 10,
              }}
            >
              x
            </div>
          </>
        )}
        {showAxes && yAxisInRange && (
          <>
            <AxisArrow
              dir="up"
              left={padLeft + (0 - xMin) * cell}
              top={padTop}
            />
            {yAxisNeedsBottomArrow && (
              <AxisArrow
                dir="down"
                left={padLeft + (0 - xMin) * cell}
                top={padTop + gridH}
              />
            )}
            <div
              className="cp-axis-name cp-axis-name-y"
              style={{
                left: padLeft + (0 - xMin) * cell - 5,
                top: padTop - 22,
              }}
            >
              y
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AxisArrow({
  dir,
  left,
  top,
}: {
  dir: "up" | "down" | "left" | "right";
  left: number;
  top: number;
}) {
  // 10px triangle, rendered via CSS borders
  const size = 6;
  let borderStyle: React.CSSProperties = {};
  const color = "#78909C";
  if (dir === "right") {
    borderStyle = {
      borderTop: `${size}px solid transparent`,
      borderBottom: `${size}px solid transparent`,
      borderLeft: `${size + 2}px solid ${color}`,
      transform: "translate(0, -50%)",
    };
  } else if (dir === "left") {
    borderStyle = {
      borderTop: `${size}px solid transparent`,
      borderBottom: `${size}px solid transparent`,
      borderRight: `${size + 2}px solid ${color}`,
      transform: "translate(-100%, -50%)",
    };
  } else if (dir === "up") {
    borderStyle = {
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderBottom: `${size + 2}px solid ${color}`,
      transform: "translate(-50%, -100%)",
    };
  } else {
    borderStyle = {
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderTop: `${size + 2}px solid ${color}`,
      transform: "translate(-50%, 0)",
    };
  }
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 0,
        height: 0,
        zIndex: 3,
        pointerEvents: "none",
        ...borderStyle,
      }}
    />
  );
}

/**
 * Draws 5 buildings centered at grid x=1..5. Each building has 5 floors,
 * with a window centered on grid (bx, 1..5). Rendered as absolute-positioned
 * elements using pixel coordinates.
 */
function BuildingsBg({
  xMin,
  xMax,
  yMax,
  cell,
  padLeft,
  padTop,
  gridH,
  figure,
}: {
  xMin: number;
  xMax: number;
  yMax: number;
  cell: number;
  padLeft: number;
  padTop: number;
  gridH: number;
  figure: CoordPoint | null;
}) {
  const colors = ["#90A4AE", "#A1887F", "#78909C", "#BCAAA4", "#8D6E63"];

  const toPx = (x: number, y: number) => ({
    left: padLeft + (x - xMin) * cell,
    top: padTop + (yMax - y) * cell,
  });

  const buildingW = cell * 0.68;
  const winSize = Math.max(10, cell * 0.42);

  // Body vertical extent: top slightly above floor 5, bottom at grid y=0
  const bodyTop = toPx(0, 5).top - Math.ceil(cell * 0.3);
  const bodyBottom = padTop + gridH;
  const bodyH = bodyBottom - bodyTop;

  const buildings: React.ReactNode[] = [];

  // Sky rectangle (just for color) over the full board is done via CSS
  for (let bx = 1; bx <= 5; bx++) {
    if (bx < xMin || bx > xMax) continue;
    const centerX = toPx(bx, 0).left;
    const leftX = centerX - buildingW / 2;
    const color = colors[(bx - 1) % colors.length];

    buildings.push(
      <div
        key={`b${bx}`}
        style={{
          position: "absolute",
          left: leftX,
          top: bodyTop,
          width: buildingW,
          height: bodyH,
          background: color,
          border: "1.5px solid #37474F",
          borderRadius: "3px 3px 0 0",
          pointerEvents: "none",
          zIndex: 1,
        }}
      >
        {/* Windows for floors 1..5 */}
        {[1, 2, 3, 4, 5].map((fy) => {
          const winCenterY = (yMax - fy) * cell + padTop - bodyTop;
          const lit = figure && figure.x === bx && figure.y === fy;
          return (
            <div
              key={fy}
              style={{
                position: "absolute",
                left: (buildingW - winSize) / 2,
                top: winCenterY - winSize / 2,
                width: winSize,
                height: winSize,
                background: lit ? "#FFE082" : "#1a2a3a",
                border: `1px solid ${lit ? "#F57F17" : "#0d1722"}`,
                borderRadius: 3,
                boxShadow: lit ? "0 0 6px 2px #FFEB3B" : undefined,
                overflow: "hidden",
              }}
            >
              {lit ? (
                <WindowSilhouette size={winSize} />
              ) : (
                <>
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: "#0d1722",
                      transform: "translateX(-50%)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: 0,
                      right: 0,
                      height: 1,
                      background: "#0d1722",
                      transform: "translateY(-50%)",
                    }}
                  />
                </>
              )}
            </div>
          );
        })}
      </div>,
    );
  }

  return (
    <>
      {/* Sky background (below buildings) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#FFE0B2",
          opacity: 0.55,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* Ground strip at bottom */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: padTop > 0 ? 4 : 0,
          background: "#8BC34A",
          opacity: 0.5,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {buildings}
    </>
  );
}

function ArcheryBg({
  toPx,
  cell,
}: {
  toPx: (x: number, y: number) => { left: number; top: number };
  cell: number;
}) {
  const origin = toPx(0, 0);
  return (
    <svg
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
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
          {/* Label in upper-right quadrant so it doesn't sit on the y-axis */}
          <text
            x={origin.left + r * cell * 0.7}
            y={origin.top - r * cell * 0.7 + 4}
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
  // Anchored by feet: the figure's feet sit on the clicked point.
  return (
    <svg
      className="cp-figure cp-figure-full"
      style={style}
      viewBox="0 0 20 28"
      width={18}
      height={26}
    >
      <circle cx="10" cy="5" r="4" fill="#FFCC80" stroke="#1a1a2e" strokeWidth="1" />
      <line x1="10" y1="9" x2="10" y2="18" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="10" y1="12" x2="4" y2="16" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="10" y1="12" x2="16" y2="16" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="10" y1="18" x2="5" y2="26" stroke="#1a1a2e" strokeWidth="1.5" />
      <line x1="10" y1="18" x2="15" y2="26" stroke="#1a1a2e" strokeWidth="1.5" />
    </svg>
  );
}

/** Head + shoulders silhouette shown inside a lit window. */
function WindowSilhouette({ size }: { size: number }) {
  const pad = Math.max(1, size * 0.08);
  const viewS = 30;
  return (
    <svg
      viewBox={`0 0 ${viewS} ${viewS}`}
      width={size - pad * 2}
      height={size - pad * 2}
      style={{
        position: "absolute",
        left: pad,
        top: pad,
        display: "block",
      }}
      preserveAspectRatio="xMidYMax meet"
    >
      {/* Shoulders / bust — rounded mound from bottom */}
      <path
        d="M 3 30 Q 3 20 15 19 Q 27 20 27 30 Z"
        fill="#1a1a2e"
      />
      {/* Head — circle above shoulders */}
      <circle cx="15" cy="13" r="6" fill="#1a1a2e" />
    </svg>
  );
}
