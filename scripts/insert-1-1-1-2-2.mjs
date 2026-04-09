#!/usr/bin/env node
// Insert a new step at 1-1-1-2-2 and add a hint to what becomes 1-1-1-2-3.
// Idempotent: detects the marker instruction before re-inserting.
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://qwqsgfepygsfempjmquq.supabase.co",
  "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl",
);

const { data: row, error } = await sb
  .from("lessons_content")
  .select("data")
  .eq("id", "main")
  .single();
if (error) {
  console.error(error);
  process.exit(1);
}
const blob = row.data;

const NEW_INSTRUCTION =
  "Number lines can go on forever in both directions. What number is this?";

const newStep = {
  type: "multiple-choice",
  instruction: NEW_INSTRUCTION,
  showNumberLine: true,
  min: -100,
  max: 100,
  tickStep: 10,
  labelStep: 20,
  staticPoints: [70],
  choices: [
    { text: "70", correct: true },
    { text: "65", correct: false },
  ],
};

const ml = blob.modules[0].sections[0].lessons[0].miniLessons[1]; // 1-1-1-2
if (!ml) {
  console.error("mini-lesson 1-1-1-2 not found");
  process.exit(1);
}

const already = ml.steps.some(
  (s) => s && s.instruction === NEW_INSTRUCTION,
);

if (already) {
  console.log("step already inserted, skipping insert");
} else {
  ml.steps.splice(1, 0, newStep); // insert at index 1 → becomes 1-1-1-2-2
  console.log(
    "inserted new step at 1-1-1-2-2; total steps now",
    ml.steps.length,
  );
}

// Hint on 1-1-1-2-3 (which is the old 1-1-1-2-2 after shifting)
const HINT = "Look at which two numbers the dot between?";
if (ml.steps[2]) {
  if (ml.steps[2].hint !== HINT) {
    ml.steps[2].hint = HINT;
    console.log("set hint on 1-1-1-2-3");
  } else {
    console.log("hint on 1-1-1-2-3 already set");
  }
}

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) {
  console.error(upErr);
  process.exit(1);
}
console.log("done");
