import { supabase } from "./supabase";
import type { ContentData, MiniLesson } from "./schemas/lesson";

let cache: ContentData | null = null;

export async function loadContent(): Promise<ContentData> {
  if (cache) return cache;
  const { data, error } = await supabase
    .from("lessons_content")
    .select("data")
    .eq("id", "main")
    .single();
  if (error) throw error;
  cache = data.data as ContentData;
  return cache;
}

export async function getMiniLesson(
  moduleId: string,
  sectionId: string,
  lessonId: string,
  miniId: string,
): Promise<MiniLesson | null> {
  const content = await loadContent();
  const mod = content.modules.find((m) => m.id === moduleId);
  if (!mod) return null;
  const sec = mod.sections.find((s) => s.id === sectionId);
  if (!sec) return null;
  const les = sec.lessons.find((l) => l.id === lessonId);
  if (!les) return null;
  const ml = les.miniLessons.find((m) => m.id === miniId);
  return ml ?? null;
}
