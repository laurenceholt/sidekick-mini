#!/usr/bin/env node
// Pass-G — small Unit 8 fixes:
//   14-2-3/4/5: set `step: 5` on the homework dot plot so ticks land at
//     0, 5, 10, … 55 (was step=1 implicit, plot was huge). xMax=55.
//   14-2-8/9: ageHist 10-20 and 20-30 bars set to 0 (only kids 0-10 +
//     adults 30-40, 40-50 buckets).
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
const findML = (lid, mlid) => {
  for (const sec of mod.sections) {
    for (const les of sec.lessons) {
      if (les.id === lid) return les.miniLessons.find((m) => m.id === mlid);
    }
  }
  return null;
};

const ml = findML("l14", "ml2");
if (!ml) { console.error("ml 6-8-14-2 not found"); process.exit(1); }

// 14-2-3/4/5 (idx 2/3/4) all share the homework dot plot
const newHomeworkDP = {
  xMin: 0,
  xMax: 55,
  step: 5,
  data: [10, 10, 15, 15, 20, 20, 55],
  label: "Homework minutes",
};
for (const i of [2, 3, 4]) {
  ml.steps[i].dotPlot = newHomeworkDP;
}

// 14-2-8/9 (idx 7/8) family-dinner ages histogram — zero out 10-20 + 20-30
const newAgeHist = {
  buckets: [
    { label: "0-10", count: 2 },
    { label: "10-20", count: 0 },
    { label: "20-30", count: 0 },
    { label: "30-40", count: 5 },
    { label: "40-50", count: 16 },
  ],
  xLabel: "Age (years)",
  yLabel: "Number of people",
};
for (const i of [7, 8]) {
  ml.steps[i].histogram = newAgeHist;
}

console.log("Saving...");
const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
