#!/usr/bin/env node
// Pass-E revisions for Unit 8 (Module m6) — sticker mini-lesson fixes:
//   - 6-8-9-2-1/2/3 sticker dot plot: change data so the total is 10
//     (was 8). New data [1, 1, 1, 3, 4] keeps count-of-1s = 3 (Q1 target)
//     and makes the mean 10/5 = 2 (Q3 target). Q2 target → 10.
//   - Add legend "Each ● is one student" to all three sticker steps.
//   - 6-8-9-2-2 wording: "How many stickers are shown altogether"
//     → "How many stickers were there altogether?"
//   - 6-8-9-2-3 wording: "Divide the total stickers (8) by …"
//     → "Divide the total stickers (10) by …"
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

const ml = findML("l9", "ml2");
if (!ml) { console.error("Mini-lesson 6-8-9-2 not found"); process.exit(1); }

const stickerDP = {
  xMin: 0,
  xMax: 4,
  data: [1, 1, 1, 3, 4], // total = 10, count(1) = 3, mean = 2
  label: "Number of stickers",
  legend: "Each ● is one student",
};

// Steps 1, 2, 3 (idx 0, 1, 2) all show the same sticker dot plot.
ml.steps[0].dotPlot = stickerDP;
ml.steps[1].dotPlot = stickerDP;
ml.steps[2].dotPlot = stickerDP;

// Target values
ml.steps[0].target = 3; // count of 1s (unchanged)
ml.steps[1].target = 10; // total stickers (was 8)
ml.steps[2].target = 2; // mean (unchanged)

// Step 2 wording
ml.steps[1].instruction =
  "To find the mean of a dot plot, first find the total number of stickers. How many stickers were there altogether?";
// Step 2 hintButton — used to say "Add three 1s, one 2, and one 3."; with
// new data it should be "Add three 1s, one 3, and one 4."
ml.steps[1].hintButton = "Add three 1s, one 3, and one 4.";

// Step 3 instruction: update "(8)" → "(10)"
ml.steps[2].instruction = ml.steps[2].instruction.replace(/\(8\)/, "(10)");

console.log("Sticker steps updated. Saving...");
const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
