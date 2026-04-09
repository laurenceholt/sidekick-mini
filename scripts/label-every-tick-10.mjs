#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://qwqsgfepygsfempjmquq.supabase.co",
  "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl",
);
const { data: row, error } = await sb
  .from("lessons_content").select("data").eq("id", "main").single();
if (error) { console.error(error); process.exit(1); }
const blob = row.data;
let n = 0;
for (const mod of blob.modules) for (const sec of mod.sections)
  for (const les of sec.lessons) for (const ml of les.miniLessons)
    for (const s of ml.steps) {
      if (s && s.min === -10 && s.max === 10 && s.labelStep && s.labelStep !== s.tickStep) {
        s.labelStep = s.tickStep;
        n++;
      }
    }
console.log("updated", n, "steps");
const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
