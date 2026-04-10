#!/usr/bin/env node
// Fix 1-1-3-2 content: degree signs on step 6, "feet" on step 7.
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://qwqsgfepygsfempjmquq.supabase.co",
  "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl",
);
const { data: row, error } = await sb
  .from("lessons_content").select("data").eq("id", "main").single();
if (error) { console.error(error); process.exit(1); }
const blob = row.data;

const ml = blob.modules[0].sections[0].lessons[2].miniLessons[1]; // 1-1-3-2
if (!ml || ml.title !== "Greater Than, Less Than") {
  console.error("ML not found"); process.exit(1);
}

// Step 6 (index 5): add degree signs
const s6 = ml.steps[5];
s6.left = "-22°";
s6.right = "-15°";
console.log("step 6: set degree signs");

// Step 7 (index 6): add "feet" suffix, update instruction
const s7 = ml.steps[6];
s7.left = "393 feet";
s7.right = "104 feet";
console.log("step 7: added feet labels");

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
