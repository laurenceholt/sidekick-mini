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

  // Auto-size cell
  const cell = Math.min(
    34,
    Math.floor(Math.min(480 / Math.max(xRange, 1), 340 / Math.max(yRange, 1))),
  );

  // Padding around the grid area
  // - Buildings mode: room for overhang on sides/top, plus stick-figure feet below
  // - Non-buildings: small bottom margin so a figure at y=yMin doesn't clip feet
  const padLeft = showBuildings ? Math.ceil(cell * 0.45) + 4 : 0;
  const padRight = showBuildings ? Math.ceil(cell * 0.45) + 4 : 0;
  const padTop = showBuildings ? Math.ceil(cell * 0.55) : 0;
  const padBottom = showBuildings ? 22 : 0;

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
      </div>

      {/* Axis number labels (below / left of grid area) */}
      <div
        className="cp-axis-labels-x"
        style={{ width: gridW, marginLeft: padLeft }}
      >
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
      <div
        className="cp-axis-labels-y"
        style={{ height: gridH, top: padTop + 12 }}
      >
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
          <div
            className="cp-axis-name cp-axis-name-x"
            style={{ left: padLeft + gridW + 8, top: padTop + gridH - 10 }}
          >
            x
          </div>
          <div
            className="cp-axis-name cp-axis-name-y"
            style={{ left: padLeft + 8, top: padTop - 18 }}
          >
            y
          </div>
        </>
      )}
    </div>
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
