#!/usr/bin/env node
// Pass-D revisions for Unit 8 (Module m6):
//   5. 6-8-9-1-3/4/5 (Mean intro) — render static bars via the new
//      `barsDisplay` prop on EquationInput.
//   6. 6-8-9-1-7 — italicize the first "average".
// Idempotent.
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://qwqsgfepygsfempjmquq.supabase.co",
  "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl",
);

const { data: row, error } = await sb
  .from("lessons_content").select("data").eq("id", "main").single();
if (error) { console.error(error); process.exit(1); }
const blob = row.data;

const mod = blob.modules.find((m) => m.id === "m6");
if (!mod) { console.error("Module m6 not found"); process.exit(1); }

const findML = (lid, mlid) => {
  for (const sec of mod.sections) {
    for (const les of sec.lessons) {
      if (les.id === lid) return les.miniLessons.find((m) => m.id === mlid);
    }
  }
  return null;
};

const ml = findML("l9", "ml1");
if (!ml) { console.error("Mini-lesson 6-8-9-1 not found"); process.exit(1); }

// 5. Add barsDisplay to steps 3, 4, 5 (idx 2, 3, 4)
ml.steps[2].barsDisplay = { values: [4, 3, 2], barHeight: 6 };
ml.steps[3].barsDisplay = { values: [2, 1, 3], barHeight: 6 };
ml.steps[4].barsDisplay = { values: [4, 1, 7], barHeight: 7 };

// 6. 6-8-9-1-7 (idx 6) — italicize first "average"
const s7 = ml.steps[6];
s7.instruction = s7.instruction.replace(
  /another word for mean is average/,
  "another word for mean is *average*",
);

console.log("done");

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("Saved.");
