import { useEffect, useState } from "react";
import { loadContent } from "@/lib/content";
import type { MiniLesson } from "@/lib/schemas/lesson";
import MultiStepShell from "./MultiStepShell";

export interface LessonRunnerProps {
  moduleId?: string;
  sectionId?: string;
  lessonId?: string;
  miniId?: string;
}

/**
 * Client island: resolves the mini-lesson from Supabase and computes the
 * numeric `m-s-l-ml` index prefix used for the on-screen step ID badge.
 */
export default function LessonRunner(props: LessonRunnerProps) {
  const [mini, setMini] = useState<MiniLesson | null>(null);
  const [prefix, setPrefix] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  // Fall back to query string so the page works as a static /lesson?m=…&s=…&l=…&ml=…
  const qs = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const moduleId = props.moduleId ?? qs?.get("m") ?? "m1";
  const sectionId = props.sectionId ?? qs?.get("s") ?? "s1";
  const lessonId = props.lessonId ?? qs?.get("l") ?? "l1";
  const miniId = props.miniId ?? qs?.get("ml") ?? "ml1";

  useEffect(() => {
    let alive = true;
    loadContent()
      .then((content) => {
        if (!alive) return;
        const mi = content.modules.findIndex((m) => m.id === moduleId);
        const mod = content.modules[mi];
        if (!mod) return setError("Module not found");
        const si = mod.sections.findIndex((s) => s.id === sectionId);
        const sec = mod.sections[si];
        if (!sec) return setError("Section not found");
        const li = sec.lessons.findIndex((l) => l.id === lessonId);
        const les = sec.lessons[li];
        if (!les) return setError("Lesson not found");
        const mli = les.miniLessons.findIndex((m) => m.id === miniId);
        const ml = les.miniLessons[mli];
        if (!ml) return setError("Mini-lesson not found");
        setMini(ml);
        setPrefix(`${mi + 1}-${si + 1}-${li + 1}-${mli + 1}`);
      })
      .catch((e) => alive && setError(String(e.message || e)));
    return () => {
      alive = false;
    };
  }, [moduleId, sectionId, lessonId, miniId]);

  if (error) {
    return <div className="step-content">{error}</div>;
  }
  if (!mini) {
    return <div className="step-content">Loading…</div>;
  }

  return (
    <MultiStepShell
      miniLesson={mini}
      stepIdPrefix={prefix}
      onExit={() => (window.location.href = "/")}
      onComplete={() => (window.location.href = "/")}
    />
  );
}
