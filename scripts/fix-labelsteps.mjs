#!/usr/bin/env node
// Set labelStep on wide number lines so they don't cram labels.
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://qwqsgfepygsfempjmquq.supabase.co",
  "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl",
);

const { data: row, error } = await sb
  .from("lessons_content").select("data").eq("id", "main").single();
if (error) { console.error(error); process.exit(1); }
const blob = row.data;

// Target steps (loc -> labelStep)
const targets = {
  "1-1-1-2-2": 20,
  "1-1-1-2-3": 20,
  "1-1-1-2-7": 20,
  "1-1-1-2-8": 20,
  "1-1-1-2-9": 20,
};
let changed = 0;
blob.modules.forEach((mod, mi) =>
  mod.sections.forEach((sec, si) =>
    sec.lessons.forEach((les, li) =>
      les.miniLessons.forEach((ml, mli) =>
        ml.steps.forEach((st, sti) => {
          const loc = `${mi+1}-${si+1}-${li+1}-${mli+1}-${sti+1}`;
          if (targets[loc] != null && st.labelStep !== targets[loc]) {
            st.labelStep = targets[loc];
            changed++;
            console.log("set labelStep on", loc, "->", targets[loc]);
          }
        })))));

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done;", changed, "updated");
