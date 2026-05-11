#!/usr/bin/env node
// Pass-B revisions for Unit 8 (Module m6) per author review:
//   1. Module title: "Unit 8 Data Sets and Distributions"
//   2. Repeat each scenario's icon on every step that uses that scenario
//      (instead of only on the first step).
//   3. 6-8-4-1-6 instruction reworded.
//   4. 6-8-4-1-7 narrow distribution: 3 dots at x=4, 7 dots at x=5,
//      4 dots at x=6 (14 total clustered).
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

// 1. Unit title
mod.title = "Unit 8 Data Sets and Distributions";

// Helper: navigate to a mini-lesson by lesson id / mini-lesson id
const findML = (lid, mlid) => {
  for (const sec of mod.sections) {
    for (const les of sec.lessons) {
      if (les.id === lid) return les.miniLessons.find((m) => m.id === mlid);
    }
  }
  return null;
};

// 2. Icon repetition across scenario steps.
//    Map: lesson-id -> mini-lesson-id -> [stepIdxFrom..stepIdxTo, image]
const repeats = [
  // Grape scenario: 6-8-4-1-1 through 6-8-4-1-7 (Sakeem dot plot)
  ["l4", "ml1", [0, 1, 2, 3, 4, 5, 6], "/u8/grape.svg"],
  // Paper dolls / siblings scenario: 6-8-4-1-8 through 4-1-11
  ["l4", "ml1", [7, 8, 9, 10], "/u8/paper-dolls.svg"],
  // Thermometer / Minnesota temp: 6-8-4-2-1 through 4-2-5
  ["l4", "ml2", [0, 1, 2, 3, 4], "/u8/thermometer.svg"],
  // Pillow / sleep hours: 6-8-4-2-6 through 4-2-10
  ["l4", "ml2", [5, 6, 7, 8, 9], "/u8/pillow.svg"],
  // Desert / Death Valley temperatures (just one step, 6-8-9-1-8)
  // Stickers: 6-8-9-2-1..3
  ["l9", "ml2", [0, 1, 2], "/u8/sticker.svg"],
  // Soccer ball: 6-8-9-2-4..5
  ["l9", "ml2", [3, 4], "/u8/soccer-ball.svg"],
  // Open book: 6-8-9-2-6..9
  ["l9", "ml2", [5, 6, 7, 8], "/u8/open-book.svg"],
  // Music bar / songs added: 6-8-13-1-7 only (already set)
  // Music bar / Sonoran Desert temps NO (uses desert)
  // Likes / heart: 6-8-14-1-1..3
  ["l14", "ml1", [0, 1, 2], "/u8/heart.svg"],
  // Points / scoreboard: 6-8-14-1-4..6
  ["l14", "ml1", [3, 4, 5], "/u8/scoreboard.svg"],
  // Unread texts (no icon assigned originally; keep blank)
  // Songs added (14-2-1, 14-2-2): music-bar
  ["l14", "ml2", [0, 1], "/u8/music-bar.svg"],
  // Homework: 14-2-3..5: timer
  ["l14", "ml2", [2, 3, 4], "/u8/timer.svg"],
  // Backpack: 14-2-6
  ["l14", "ml2", [5], "/u8/backpack.svg"],
  // Basketball: 14-2-7
  ["l14", "ml2", [6], "/u8/basketball.svg"],
  // Birthday cake (family dinner ages): 14-2-8..9
  ["l14", "ml2", [7, 8], "/u8/birthday-cake.svg"],
  // Balanced dot plot (14-2-10): already set
];

let touched = 0;
for (const [lid, mlid, idxs, img] of repeats) {
  const ml = findML(lid, mlid);
  if (!ml) continue;
  for (const i of idxs) {
    if (ml.steps[i] && ml.steps[i].image !== img) {
      ml.steps[i].image = img;
      touched++;
    }
  }
}
console.log("Set image on", touched, "steps");

// 3. 6-8-4-1-6 reword
const ml41 = findML("l4", "ml1");
ml41.steps[5].instruction = "What does the center value 2 represent?";

// 4. 6-8-4-1-7 narrow distribution → 3 at x=4, 7 at x=5, 4 at x=6
const ts = ml41.steps[6];
ts.choices[1].dotPlot.data = [
  4, 4, 4,
  5, 5, 5, 5, 5, 5, 5,
  6, 6, 6, 6,
];

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
