import { useEffect, useState } from "react";
import type { TileSortStep } from "@/lib/schemas/lesson";

/**
 * TileSort — students drag numbered tiles into the bucket whose label matches
 * the tile's value range. Tiles stack inside the bucket so the end result
 * looks like a histogram.
 *
 * Currently implemented with click-to-cycle (tap a tile, then tap a bucket)
 * for touch-friendliness on Chromebooks; HTML5 drag-and-drop is notoriously
 * flaky on touch.
 *
 * Grading: every tile is placed AND every tile is in the correct bucket.
 */
export interface TileSortProps {
  step: TileSortStep;
  onSelect: (placements: Record<string, string | null> | null) => void;
  attemptKey?: number;
  locked?: boolean;
}

interface Bucket {
  label: string;
  min: number;
  max: number;
}

function parseBucket(label: string): Bucket {
  // "1-5" → { min: 1, max: 5 }; "6-10" → { min: 6, max: 10 }
  const m = label.match(/^(-?\d+)\s*[-–]\s*(-?\d+)$/);
  if (m) return { label, min: parseInt(m[1], 10), max: parseInt(m[2], 10) };
  // fallback: single-value bucket
  const n = parseInt(label, 10);
  return { label, min: n, max: n };
}

export default function TileSort({
  step,
  onSelect,
  attemptKey = 0,
  locked,
}: TileSortProps) {
  const tileIds = step.tiles.map((v, i) => `t${i}`); // stable IDs (allow duplicates)
  const buckets = step.buckets.map(parseBucket);

  // placements[tileId] = bucketLabel | null (unplaced)
  const [placements, setPlacements] = useState<Record<string, string | null>>(
    () => Object.fromEntries(tileIds.map((id) => [id, null])),
  );
  const [activeTile, setActiveTile] = useState<string | null>(null);

  useEffect(() => {
    setPlacements(Object.fromEntries(tileIds.map((id) => [id, null])));
    setActiveTile(null);
    onSelect(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptKey]);

  // Send up to parent whenever ALL tiles have been placed
  useEffect(() => {
    const allPlaced = tileIds.every((id) => placements[id] !== null);
    onSelect(allPlaced ? placements : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placements]);

  const handleTileClick = (id: string) => {
    if (locked) return;
    if (placements[id] !== null) {
      // tile already in a bucket — pull it back out
      setPlacements((p) => ({ ...p, [id]: null }));
      setActiveTile(null);
      return;
    }
    setActiveTile((t) => (t === id ? null : id));
  };

  const handleBucketClick = (label: string) => {
    if (locked || activeTile === null) return;
    setPlacements((p) => ({ ...p, [activeTile]: label }));
    setActiveTile(null);
  };

  // Tiles still in the tray
  const trayIds = tileIds.filter((id) => placements[id] === null);

  return (
    <div className="tilesort-wrap">
      <div className="tilesort-buckets">
        {buckets.map((b) => {
          const inThisBucket = tileIds.filter((id) => placements[id] === b.label);
          return (
            <div
              key={b.label}
              className={`tilesort-bucket${activeTile !== null && !locked ? " droppable" : ""}`}
              onClick={() => handleBucketClick(b.label)}
            >
              <div className="tilesort-bucket-stack">
                {inThisBucket.map((id, k) => {
                  const idx = parseInt(id.slice(1), 10);
                  const v = step.tiles[idx];
                  return (
                    <div
                      key={id}
                      className="tilesort-tile placed"
                      style={{ bottom: 4 + k * 36 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (locked) return;
                        setPlacements((p) => ({ ...p, [id]: null }));
                      }}
                    >
                      {v}
                    </div>
                  );
                })}
              </div>
              <div className="tilesort-bucket-label">{b.label}</div>
            </div>
          );
        })}
      </div>
      <div className="tilesort-tray">
        {trayIds.length === 0 ? (
          <div className="tilesort-tray-empty">All tiles placed.</div>
        ) : (
          trayIds.map((id) => {
            const idx = parseInt(id.slice(1), 10);
            const v = step.tiles[idx];
            const active = activeTile === id;
            return (
              <div
                key={id}
                className={`tilesort-tile${active ? " active" : ""}`}
                onClick={() => handleTileClick(id)}
              >
                {v}
              </div>
            );
          })
        )}
      </div>
      {activeTile !== null && (
        <div className="tilesort-prompt">Tap a bucket to drop this tile.</div>
      )}
    </div>
  );
}

export function gradeTileSort(
  step: TileSortStep,
  placements: Record<string, string | null> | null,
): { correct: boolean; hint?: string } {
  if (!placements) {
    return { correct: false, hint: step.hint || "Place every tile in a bucket." };
  }
  const buckets = step.buckets.map(parseBucket);
  for (const id in placements) {
    const idx = parseInt(id.slice(1), 10);
    const v = step.tiles[idx];
    const placedLabel = placements[id];
    if (!placedLabel) {
      return { correct: false, hint: step.hint || "Place every tile in a bucket." };
    }
    const b = buckets.find((b) => b.label === placedLabel);
    if (!b) return { correct: false, hint: "Unknown bucket." };
    if (v < b.min || v > b.max) {
      return {
        correct: false,
        hint: step.hint || "One of the tiles isn't in the right bucket. Check the labels.",
      };
    }
  }
  return { correct: true };
}
