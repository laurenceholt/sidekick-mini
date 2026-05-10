#!/usr/bin/env node
// Pass-A revisions for Unit 8 (Module m6) per author review:
//   1. Module title: "Data Sets and Distributions"
//   2. Split the single section into TWO sections under m6:
//        s8a  "Dot Plots and Histograms"   (L4, L6)
//        s8b  "Measures of Center"         (L9, L13, L14)
//      Both keep the same displayNum=8 so step IDs stay 6-8-*.
//   3. Lesson titles tweaked (no caps): "Dot Plots", "Interpreting
//      Histograms", "Comparing Mean and Median".
//   4. Mini-lesson titles: 4-1 "Introducing dot plots", 13-1
//      "Finding the median", 14-1 "Mean vs median".
//   5. 6-8-4-1-3 instruction: "Here is the whole grape-catching plot..."
//   6. 6-8-4-1-5 wrong-answer hint.
//   7. 6-8-4-1-7 chart data trimmed to 14 dots each.
//   8. 6-8-4-1-10 hintButton.
//
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

// 1. Module + unit title
mod.title = "Data Sets and Distributions";

// 2. Split sections.
// Collect existing lessons by id from whatever section structure currently exists.
const lessonById = {};
for (const sec of mod.sections) {
  for (const les of sec.lessons) lessonById[les.id] = les;
}
const need = ["l4", "l6", "l9", "l13", "l14"];
for (const id of need) {
  if (!lessonById[id]) {
    console.error("Missing lesson", id);
    process.exit(1);
  }
}

// 3. Lesson title tweaks (lowercase "Dot Plots" already, rest)
lessonById["l4"].title = "Dot Plots";
lessonById["l6"].title = "Interpreting Histograms";
lessonById["l14"].title = "Comparing Mean and Median";
// L9 stays "Mean", L13 stays "Median"

// Rebuild sections
mod.sections = [
  {
    id: "s8a",
    title: "Dot Plots and Histograms",
    displayNum: 8,
    lessons: [lessonById["l4"], lessonById["l6"]],
  },
  {
    id: "s8b",
    title: "Measures of Center",
    displayNum: 8,
    lessons: [lessonById["l9"], lessonById["l13"], lessonById["l14"]],
  },
];

// 4. Mini-lesson titles
const ml = (lid, mlid) => {
  const les = lessonById[lid];
  return les.miniLessons.find((m) => m.id === mlid);
};
ml("l4", "ml1").title = "Introducing dot plots";
ml("l13", "ml1").title = "Finding the median";
ml("l14", "ml1").title = "Mean vs median";

// 5–8. Specific step edits
const stepsL4ML1 = ml("l4", "ml1").steps;

// 5. 6-8-4-1-3 — prefix with "grape-catching"
stepsL4ML1[2].instruction =
  "Here is the whole grape-catching plot. How many students were there altogether?";

// 6. 6-8-4-1-5 — add a wrong-answer hint
stepsL4ML1[4].hint =
  "Nearly. You are looking for the 6th or 7th dot from the left.";

// 7. 6-8-4-1-7 — fewer dots per chart (14 each)
const ts = stepsL4ML1[6];
ts.choices[0].dotPlot.data = [1, 1, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8, 8];
ts.choices[1].dotPlot.data = [4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6];

// 8. 6-8-4-1-10 — hintButton
stepsL4ML1[9].hintButton =
  "There are 20 dots. The center is the 10th or 11th from the left.";

const stepCount = mod.sections.reduce(
  (acc, s) => acc + s.lessons.reduce((a, l) => a + l.miniLessons.reduce((b, m) => b + m.steps.length, 0), 0),
  0,
);
console.log("Module m6 has", stepCount, "steps across", mod.sections.length, "sections");

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
