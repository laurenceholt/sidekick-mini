const KEY = "sidekick-progress";

export type Progress = Record<string, { completed?: boolean }>;

export function loadProgress(): Progress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveProgress(p: Progress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function markCompleted(
  moduleId: string,
  sectionId: string,
  lessonId: string,
  miniId: string,
) {
  const p = loadProgress();
  p[`${moduleId}-${sectionId}-${lessonId}-${miniId}`] = { completed: true };
  saveProgress(p);
}

export function isCompleted(
  moduleId: string,
  sectionId: string,
  lessonId: string,
  miniId: string,
) {
  const p = loadProgress();
  return !!p[`${moduleId}-${sectionId}-${lessonId}-${miniId}`]?.completed;
}
