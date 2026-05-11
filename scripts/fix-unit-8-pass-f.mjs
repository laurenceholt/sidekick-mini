#!/usr/bin/env node
// Pass-F revisions for Unit 8 (Module m6) — median mini-lesson + mean-vs-median:
//
//  13-1-3 wording: "order them" -> "write them in order"; hint "put the
//          numbers" -> "Write the numbers"
//  13-1-5 wording: rewrite instruction; use numberTiles + "Median = " prefix
//  13-1-6 swap to /u8/desert-sonoran.svg; new hint
//  13-1-9 numberTiles + "Median = " prefix + decimal hint
//  14-1-3 reword
//  14-1-5 reword + hint reword
//  14-1-6 reword
//  14-1-8 reword
//  14-1-9 reword + change correct choice text to "The 0 and 1 pull the mean down."
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

// === 13-1: Finding the median =============================================
const ml13 = findML("l13", "ml1");
if (!ml13) { console.error("ml 6-8-13-1 not found"); process.exit(1); }

// 13-1-3 (idx 2): "order them" → "write them in order"; hint update
ml13.steps[2].instruction =
  "If values are not in order, you have to write them in order first. What is the median of this list?";
ml13.steps[2].hintButton =
  "Write the numbers in order smallest to largest, then pick the middle.";

// 13-1-5 (idx 4): switch from `prefix` to `numberTiles`, new instruction
ml13.steps[4] = {
  ...ml13.steps[4],
  type: "equation-input",
  instruction:
    "To find the median of an even number of values, find the value halfway between the two middle ones.",
  numberTiles: [4, 7, 9, 12],
  prefix: "Median = ",
  target: 8,
  hintButton:
    "To find the value halfway between 7 and 9, add them and divide by 2.",
};
delete ml13.steps[4].dotPlot;
delete ml13.steps[4].multiThermo;

// 13-1-6 (idx 5): new desert image + hint
ml13.steps[5].image = "/u8/desert-sonoran.svg";
ml13.steps[5].hintButton = "Remember, write the values in order first.";

// 13-1-9 (idx 8): numberTiles + Median = prefix + decimal hint
ml13.steps[8] = {
  ...ml13.steps[8],
  type: "equation-input",
  instruction:
    "These are the numbers of minutes six students spent getting ready for school. What is the median?",
  numberTiles: [5, 30, 10, 20, 10, 15],
  prefix: "Median = ",
  target: 12.5,
  hintButton: "You may need a decimal here.",
};

// === 14-1: Mean vs median (first mini-lesson) =============================
const ml14 = findML("l14", "ml1");
if (!ml14) { console.error("ml 6-8-14-1 not found"); process.exit(1); }

// 14-1-3 (idx 2)
ml14.steps[2].instruction =
  "Compare the mean (2) and the median (2) for this distribution.";

// 14-1-5 (idx 4)
ml14.steps[4].instruction = "What is the mean number of points scored here?";
ml14.steps[4].hintButton = "Add all the points scored and divide by the number of dots.";

// 14-1-6 (idx 5)
ml14.steps[5].instruction =
  "Compare the mean (3) and the median (2) for this distribution of points. Agree or disagree: the high score 7 pulls the mean up.";

// 14-1-8 (idx 7)
ml14.steps[7].instruction = "What is the mean number of unread texts here?";

// 14-1-9 (idx 8): reword + change correct choice text
ml14.steps[8].instruction =
  "The mean here is 3 and the median is 4. Why is the mean lower than the median?";
const correctChoice = ml14.steps[8].choices.find((c) => c.correct);
if (correctChoice) correctChoice.text = "The 0 and 1 pull the mean down.";

console.log("Saving...");
const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
