#!/usr/bin/env node
// Migrate the `hint` field → `hintButton` for all steps in section 1-2.
// The MD content column "Hint" maps to the on-demand HINT button.
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://qwqsgfepygsfempjmquq.supabase.co",
  "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl",
);
const { data: row, error } = await sb
  .from("lessons_content").select("data").eq("id", "main").single();
if (error) { console.error(error); process.exit(1); }
const blob = row.data;

const mod = blob.modules[0];
const sec = mod.sections.find((s) => s.id === "s2");
if (!sec) { console.error("Section s2 not found"); process.exit(1); }

let moved = 0;
for (const les of sec.lessons) {
  for (const ml of les.miniLessons) {
    for (const s of ml.steps) {
      if (s.hint && !s.hintButton) {
        s.hintButton = s.hint;
        delete s.hint;
        moved++;
      }
    }
  }
}
console.log("Migrated", moved, "hints → hintButton");

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
