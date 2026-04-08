import { useEffect, useState } from "react";
import { loadContent } from "@/lib/content";
import type { ContentData, Module } from "@/lib/schemas/lesson";

declare const __COMMIT_SHA__: string;
const COMMIT_SHA: string =
  typeof __COMMIT_SHA__ !== "undefined" ? __COMMIT_SHA__ : "dev";

/**
 * Map view — ported from legacy/app.js `renderMap()`.
 *
 * Shows Module → Section → Lesson → Mini-lesson structure as a vertical
 * "path" of circular nodes with connectors, section checks, and a current/
 * available/locked/completed state machine. Click an available node to
 * navigate to that mini-lesson.
 *
 * Progress (completion state) lives in localStorage under `sidekick-progress`
 * for the spike; a real build will move this server-side.
 */
export default function MapView() {
  const [content, setContent] = useState<ContentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sidekick-progress");
      if (raw) setProgress(JSON.parse(raw));
    } catch {}
    loadContent()
      .then((c) => setContent(c))
      .catch((e) => setError(String(e.message || e)));
  }, []);

  if (error) return <div className="map-content">Error: {error}</div>;
  if (!content) return <div className="map-content">Loading…</div>;
  const mod: Module | undefined = content.modules[0];
  if (!mod) return <div className="map-content">No modules.</div>;

  const key = (sId: string, lId: string, mlId: string) =>
    `${mod.id}-${sId}-${lId}-${mlId}`;
  const isCompleted = (sId: string, lId: string, mlId: string) => {
    const v = progress[key(sId, lId, mlId)];
    if (typeof v === "boolean") return v;
    if (v && typeof v === "object") return !!(v as any).completed;
    return false;
  };

  // First incomplete mini-lesson (the "current" node).
  let current: { sId: string; lId: string; mlId: string } | null = null;
  outer: for (const sec of mod.sections) {
    for (const les of sec.lessons) {
      for (const ml of les.miniLessons) {
        if (ml.steps.length === 0) continue;
        if (!isCompleted(sec.id, les.id, ml.id)) {
          current = { sId: sec.id, lId: les.id, mlId: ml.id };
          break outer;
        }
      }
    }
  }

  let nodeIndex = 0;
  const boba =
    typeof window !== "undefined"
      ? parseInt(localStorage.getItem("bobaCount") || "0", 10) || 0
      : 0;

  return (
    <>
      <div className="map-header">
        <div className="map-title-bar">
          <div className="map-module-title">{mod.title}</div>
          <div className="map-gems">
            <img src="/boba.svg" className="boba-icon" alt="boba" />
            <span>{boba}</span>
          </div>
        </div>
      </div>
      <div className="map-content">
        {mod.sections.map((sec) => {
          const allDone = sec.lessons.every((l) =>
            l.miniLessons
              .filter((ml) => ml.steps.length > 0)
              .every((ml) => isCompleted(sec.id, l.id, ml.id)),
          );
          return (
            <div key={sec.id} className="map-section">
              <div className="map-section-title">{sec.title}</div>
              {sec.lessons.map((les, li) => {
                const mlNodes = les.miniLessons.filter((ml) => ml.steps.length > 0);
                return (
                  <div key={les.id}>
                    <div className="map-lesson-title">
                      {li + 1}. {les.title}
                    </div>
                    <div className="map-path">
                      {mlNodes.map((ml, mli) => {
                        nodeIndex++;
                        const completed = isCompleted(sec.id, les.id, ml.id);
                        const isCurrent =
                          current !== null &&
                          current.sId === sec.id &&
                          current.lId === les.id &&
                          current.mlId === ml.id;
                        const available = completed || isCurrent;
                        const circleCls = completed
                          ? "completed"
                          : isCurrent
                          ? "current"
                          : available
                          ? "available"
                          : "locked";
                        return (
                          <>
                            {mli > 0 && (
                              <div
                                className={`map-connector${completed ? " completed" : ""}`}
                              />
                            )}
                            <div
                              key={ml.id}
                              className={`map-node${completed ? " completed" : ""}${
                                isCurrent ? " current" : ""
                              }`}
                              onClick={
                                available
                                  ? () => {
                                      window.location.href = `/lesson?m=${mod.id}&s=${sec.id}&l=${les.id}&ml=${ml.id}`;
                                    }
                                  : undefined
                              }
                            >
                              <div className={`map-node-circle ${circleCls}`}>
                                {completed ? "✓" : nodeIndex}
                              </div>
                              <div className="map-node-label">{ml.title}</div>
                            </div>
                          </>
                        );
                      })}
                      {/* Section check, only appended after last lesson in section */}
                      {li === sec.lessons.length - 1 && (
                        <>
                          <div
                            className={`map-connector${allDone ? " completed" : ""}`}
                          />
                          <div className={`map-node${allDone ? " completed" : ""}`}>
                            <div
                              className={`map-node-circle section-check${
                                allDone ? " completed" : ""
                              }`}
                            >
                              {allDone ? "★" : "☆"}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="step-number">astro {COMMIT_SHA}</div>
    </>
  );
}
