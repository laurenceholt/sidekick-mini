#!/usr/bin/env node
// Move 1-1-1-2-3's step.hint → step.hintButton (idempotent).
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://qwqsgfepygsfempjmquq.supabase.co",
  "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl",
);
const { data: row, error } = await sb
  .from("lessons_content").select("data").eq("id", "main").single();
if (error) { console.error(error); process.exit(1); }
const blob = row.data;
const step = blob.modules[0].sections[0].lessons[0].miniLessons[1].steps[2];
if (step.hint && !step.hintButton) {
  step.hintButton = step.hint;
  delete step.hint;
  console.log("migrated");
} else {
  console.log("nothing to migrate", { hint: step.hint, hintButton: step.hintButton });
}
const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
