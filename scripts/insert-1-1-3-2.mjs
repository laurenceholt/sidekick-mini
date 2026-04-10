#!/usr/bin/env node
// Insert new mini-lesson 1-1-3-2 "Greater Than, Less Than" into lesson 3.
// Idempotent: checks for existing ml by title before inserting.
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
if (error) { console.error(error); process.exit(1); }
const blob = row.data;

const lesson = blob.modules[0].sections[0].lessons[2]; // 1-1-3
if (!lesson) { console.error("Lesson 1-1-3 not found"); process.exit(1); }

const ML_TITLE = "Greater Than, Less Than";
const already = lesson.miniLessons.some((ml) => ml.title === ML_TITLE);
if (already) {
  console.log("Mini-lesson already exists, skipping");
} else {
  const newML = {
    id: "ml2",
    title: ML_TITLE,
    steps: [
      // 1-1-3-2-1
      {
        type: "multiple-choice",
        instruction:
          'A quick way to write "greater than" is the > sign. Agree or disagree: -5 > 5.',
        showNumberLine: true,
        min: -7,
        max: 7,
        tickStep: 1,
        staticPoints: [-5, 5],
        choices: [
          { text: "Agree", correct: false },
          { text: "Disagree", correct: true },
        ],
        hint: "-5 is less than 5, not greater. So -5 > 5 is false.",
      },
      // 1-1-3-2-2
      {
        type: "multiple-choice",
        instruction:
          'Remember the "alligator eats the bigger number". Agree or disagree: 10 > 0.',
        image: "/alligator-gt.svg",
        choices: [
          { text: "Agree", correct: true },
          { text: "Disagree", correct: false },
        ],
        hint: "10 is bigger than 0, and the alligator mouth opens toward 10. So 10 > 0 is true.",
      },
      // 1-1-3-2-3
      {
        type: "compare-sign",
        instruction:
          "So > is greater than; < is less than. Choose the correct sign here. (Think carefully.)",
        showNumberLine: true,
        min: -10,
        max: 10,
        tickStep: 1,
        staticPoints: [3, -3],
        left: 3,
        right: -3,
        target: ">",
        hint: "3 is to the right of -3 on the number line, so 3 is greater.",
      },
      // 1-1-3-2-4
      {
        type: "compare-sign",
        instruction: "So > is greater than; < is less than. Choose the correct sign here.",
        left: -35,
        right: -10,
        target: "<",
        hint: "-35 is further left (more negative) than -10, so -35 is less than -10.",
      },
      // 1-1-3-2-5
      {
        type: "compare-sign",
        instruction: "Choose the correct sign.",
        showNumberLine: true,
        min: -3,
        max: 3,
        tickStep: 0.1,
        labelStep: 1,
        staticPoints: [-1.8, -1.0],
        left: -1.0,
        right: -1.8,
        target: ">",
        hint: "-1.0 is to the right of -1.8 on the number line, so -1.0 is greater.",
      },
      // 1-1-3-2-6
      {
        type: "compare-sign",
        instruction: 'Use > or < to write "-22° is colder than -15°".',
        left: -22,
        right: -15,
        target: "<",
        hint: "Colder means a lower number. -22 is less than -15.",
      },
      // 1-1-3-2-7
      {
        type: "compare-sign",
        instruction:
          "Godzilla (393 feet) is taller than the original King Kong (104 feet). Say why.",
        image: "/godzilla-kong.svg",
        left: 393,
        right: 104,
        target: ">",
        hint: "393 is greater than 104, so 393 > 104.",
      },
      // 1-1-3-2-8
      {
        type: "inequality-input",
        instruction: "Write any number that makes this true.",
        leftValue: 33,
        sign: ">",
        hint: "You need a number that is less than 33.",
      },
      // 1-1-3-2-9
      {
        type: "inequality-input",
        instruction: "Write any number that makes this true.",
        rightValue: 0,
        sign: "<",
        hint: "You need a negative number (less than 0).",
      },
      // 1-1-3-2-10
      {
        type: "compare-sign",
        instruction: "Make this true.",
        sentence: "Any number that is to the right of 0 is {sign} 0.",
        left: "",
        right: "",
        target: ">",
        hint: "Numbers to the right of 0 are greater than 0.",
      },
    ],
  };

  lesson.miniLessons.push(newML);
  console.log(
    "Inserted mini-lesson 1-1-3-2 with",
    newML.steps.length,
    "steps",
  );
}

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
