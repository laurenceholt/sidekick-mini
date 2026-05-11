#!/usr/bin/env node
// Pass-C revisions for Unit 8 (Module m6) per author review:
//   4. 6-8-6-1-5 — remove arrowAtBucket (only one bar shown)
//   5. y-axis label position is handled in Histogram.tsx (no content change)
//   6. 6-8-6-1-6 — dotColumns:3, updated popHist
//   7. yStep:5 on the population histogram (6-8-6-1-5/6/7)
//   8. 6-8-6-1-5/6/7 — bar counts 29, 15, 3, 2, 0, 1, 0, 1, 0
//   9. xTickStyle:"edges" on the population histogram
//  10. 6-8-6-1-8/9/10 — xTickStyle:"edges", contiguous bucket labels
//     (0-5, 5-10, 10-15, 15-20), shortened x-label
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

const popHist = [
  { label: "0-5", count: 29 },
  { label: "5-10", count: 15 },
  { label: "10-15", count: 3 },
  { label: "15-20", count: 2 },
  { label: "20-25", count: 0 },
  { label: "25-30", count: 1 },
  { label: "30-35", count: 0 },
  { label: "35-40", count: 1 },
  { label: "40-45", count: 0 },
];

const ml = findML("l6", "ml1");
if (!ml) { console.error("Mini-lesson 6-8-6-1 not found"); process.exit(1); }

// Step 6-8-6-1-2 (idx 1): selectable histogram → also show tilesInBars so
// students see the connection from tile-sort to histogram bars
ml.steps[1].histogram = {
  ...ml.steps[1].histogram,
  tilesInBars: true,
  yStep: 1,
};

// Step 6-8-6-1-5 (idx 4): population histogram, one bar visible, NO arrow
ml.steps[4].histogram = {
  buckets: popHist,
  bucketsVisible: 1,
  xLabel: "Population of states (millions)",
  yLabel: "Number of states",
  yStep: 5,
  xTickStyle: "edges",
};

// Step 6-8-6-1-6 (idx 5): two bars visible, 3 columns of dots
ml.steps[5].histogram = {
  buckets: popHist,
  bucketsVisible: 2,
  dotsInBars: true,
  dotColumns: 3,
  xLabel: "Population of states (millions)",
  yLabel: "Number of states",
  yStep: 5,
  xTickStyle: "edges",
};

// Step 6-8-6-1-7 (idx 6): all bars
ml.steps[6].histogram = {
  buckets: popHist,
  xLabel: "Population of states (millions)",
  yLabel: "Number of states",
  yStep: 5,
  xTickStyle: "edges",
};

// Steps 6-8-6-1-8/9/10 (idx 7/8/9): Mia's pages — contiguous edges, edge ticks
const miaHist = [
  { label: "0-5", count: 4 },
  { label: "5-10", count: 9 },
  { label: "10-15", count: 11 },
  { label: "15-20", count: 6 },
];
for (const i of [7, 8, 9]) {
  ml.steps[i].histogram = {
    buckets: miaHist,
    xLabel: "Pages read in one night",
    yLabel: "Number of nights",
    xTickStyle: "edges",
  };
}

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
