#!/usr/bin/env node
// Insert Section 1-2 "Inequalities" with Lesson 1 "Introduction to Inequalities"
// containing 3 mini-lessons (31 steps total).
// Idempotent: detects existing section by id.
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

const mod = blob.modules[0];
if (!mod) { console.error("Module 1 not found"); process.exit(1); }

// Remove any existing s2 (idempotent)
const existingIdx = mod.sections.findIndex((s) => s.id === "s2");
if (existingIdx >= 0) {
  console.log("Existing section s2 found — replacing");
  mod.sections.splice(existingIdx, 1);
}

// ── Mini-lesson 1: "What's an inequality line?" ──────────────
const ml1 = {
  id: "ml1",
  title: "What's an inequality line?",
  steps: [
    // 1-2-1-1-1
    {
      type: "tap-point",
      instruction: "Tap the point that is greater than 7.",
      min: 0, max: 10, tickStep: 1,
      points: [5, 8],
      targets: [8],
      hintButton: "\"Greater than\" means farther to the right on the number line.",
    },
    // 1-2-1-1-2
    {
      type: "tap-point",
      instruction: "Tap the point that is less than 6.",
      min: 0, max: 10, tickStep: 1,
      points: [5, 8],
      targets: [5],
      hintButton: "\"Less than\" means farther to the left on the number line.",
    },
    // 1-2-1-1-3
    {
      type: "tap-point",
      instruction: "Tap ALL the points that are greater than 3.",
      min: 0, max: 10, tickStep: 1,
      points: [1, 4, 9],
      targets: [4, 9],
      multi: true,
      hintButton: "Remember to tap more than one point.",
    },
    // 1-2-1-1-4
    {
      type: "place-point",
      instruction:
        "The green line means \"all numbers greater than 5.\" Plot a point on the line that is greater than 5.",
      min: 0, max: 10, tickStep: 1,
      condition: "greaterThan",
      conditionValue: 5,
      inequalityLine: { start: 5, direction: ">" },
    },
    // 1-2-1-1-5
    {
      type: "place-point",
      instruction: "This line means \"all numbers less than 5.\" Plot a point less than 5.",
      min: 0, max: 10, tickStep: 1,
      condition: "lessThan",
      conditionValue: 5,
      inequalityLine: { start: 5, direction: "<" },
    },
    // 1-2-1-1-6
    {
      type: "multiple-choice",
      instruction: "What does the green line here mean?",
      showNumberLine: true,
      min: 0, max: 10, tickStep: 1,
      inequalityLine: { start: 7, direction: ">" },
      choices: [
        { text: "Greater than 7", correct: true },
        { text: "Less than 7", correct: false },
      ],
    },
    // 1-2-1-1-7
    {
      type: "multiple-choice",
      instruction:
        "Number lines can include both positive and negative parts. What does the green line mean here?",
      showNumberLine: true,
      min: -5, max: 5, tickStep: 1,
      inequalityLine: { start: 0, direction: "<" },
      choices: [
        { text: "Greater than 0", correct: false },
        { text: "Less than 0", correct: true },
      ],
    },
    // 1-2-1-1-8
    {
      type: "inequality-build",
      instruction:
        "These lines are called \"inequalities.\" You'll see why later. Move the start of this line so that it shows \"less than 3.\"",
      min: -5, max: 5, tickStep: 1,
      initialStart: 0,
      fixedDirection: "<",
      targetStart: 3,
      targetDirection: "<",
    },
    // 1-2-1-1-9
    {
      type: "inequality-build",
      instruction: "Make this inequality show \"greater than -2.\"",
      min: -5, max: 5, tickStep: 1,
      initialStart: 0,
      fixedDirection: ">",
      targetStart: -2,
      targetDirection: ">",
    },
    // 1-2-1-1-10
    {
      type: "inequality-build",
      instruction:
        "To show \"greater than 3\", tap a direction for the line, then drag the start to the right place.",
      min: -5, max: 5, tickStep: 1,
      initialStart: 0,
      targetStart: 3,
      targetDirection: ">",
    },
  ],
};

// ── Mini-lesson 2: "Inequality sentences" ──────────────────
const ml2 = {
  id: "ml2",
  title: "Inequality sentences",
  steps: [
    // 1-2-1-2-1
    {
      type: "inequality-build",
      instruction: "This scale shows the temperature. Draw a line that shows \"less than 3°.\"",
      min: -5, max: 10, tickStep: 1,
      initialStart: 0,
      targetStart: 3,
      targetDirection: "<",
      unitSuffix: "°",
    },
    // 1-2-1-2-2
    {
      type: "inequality-build",
      instruction:
        "Call the temperature *t*. Now plot t > 0 (meaning \"the temperature is greater than 0°\").",
      min: -5, max: 10, tickStep: 1,
      initialStart: 0,
      targetStart: 0,
      targetDirection: ">",
      unitSuffix: "°",
    },
    // 1-2-1-2-3
    {
      type: "inequality-build",
      instruction: "Plot t < 5.",
      min: -5, max: 10, tickStep: 1,
      initialStart: 0,
      targetStart: 5,
      targetDirection: "<",
      unitSuffix: "°",
      hintButton: "< means \"less than\".",
    },
    // 1-2-1-2-4
    {
      type: "inequality-build",
      instruction:
        "Call the age of a traveler *a*. Draw an inequality line that shows \"you have to be 16 or older to enter.\"",
      min: 0, max: 25, tickStep: 1, labelStep: 5,
      initialStart: 0,
      targetStart: 16,
      targetDirection: ">",
    },
    // 1-2-1-2-5
    {
      type: "multiple-choice",
      instruction:
        "If *a* is age, how would you write \"you have to be 16 or older\" as a math sentence?",
      choices: [
        { text: "a < 16", correct: false },
        { text: "a = 16", correct: false },
        { text: "a > 16", correct: true },
      ],
    },
    // 1-2-1-2-6
    {
      type: "inequality-write",
      instruction:
        "Tonight's concert will be canceled if the temperature is 2° or colder. Write an inequality for temperatures when the concert still happens.",
      leftVar: "t",
      rightValue: 2,
      target: { sign: ">", value: 2 },
      image: "/rocker-icicles.svg",
      hintButton: "< is less than. > is greater than.",
    },
    // 1-2-1-2-7
    {
      type: "inequality-write",
      instruction:
        "A tunnel floods when the water rises above -3 feet. Write an inequality for water levels when the tunnel floods.",
      leftVar: "w",
      rightIsInput: true,
      target: { sign: ">", value: -3 },
      image: "/tunnel-flood.svg",
      hintButton: "You are trying to write \"w is greater than -3\" as a math sentence.",
    },
    // 1-2-1-2-8
    {
      type: "inequality-write",
      instruction:
        "The reactor will melt down if the core temperature rises above 3°. Write an inequality for that. Choose a letter to represent the temperature.",
      leftIsInput: true,
      rightIsInput: true,
      target: { sign: ">", value: 3 },
      image: "/reactor.svg",
      hintButton: "You are trying to write \"temperature is greater than 3\" as a math sentence.",
    },
    // 1-2-1-2-9
    {
      type: "inequality-write",
      instruction:
        "You have to be taller than 4 feet to ride the Astro rollercoaster. Write an inequality for who can ride.",
      leftIsInput: true,
      rightIsInput: true,
      target: { sign: ">", value: 4 },
      image: "/height-test.svg",
    },
    // 1-2-1-2-10
    {
      type: "multiple-choice",
      instruction: "A sign on Math Highway reads \"s < 65 mph\". What do you think it means?",
      image: "/highway-cars.svg",
      choices: [
        { text: "Your speed must be less than 65 mph", correct: true },
        { text: "Your speed must be more than 65 mph", correct: false },
      ],
    },
  ],
};

// ── Mini-lesson 3: "Solutions" ───────────────────────────────
const ml3 = {
  id: "ml3",
  title: "Solutions",
  steps: [
    // 1-2-1-3-1
    {
      type: "inequality-build",
      instruction:
        "Draw \"greater than 4\" on this number line. Tap a direction for the line, then drag the start to the right place.",
      min: 0, max: 10, tickStep: 1,
      initialStart: 0,
      targetStart: 4,
      targetDirection: ">",
      hintButton:
        "To show \"greater than 4\", tap a direction for the line, then drag the start to the right place.",
    },
    // 1-2-1-3-2
    {
      type: "multiple-choice",
      instruction:
        "A *solution* is any number that makes an equation true. Agree or disagree: a solution to n > 4 is 10.",
      showNumberLine: true,
      min: 0, max: 10, tickStep: 1,
      inequalityLine: { start: 4, direction: ">" },
      choices: [
        { text: "Agree", correct: true },
        { text: "Disagree", correct: false },
      ],
      hintButton: "If n = 10, is it true that n > 4?",
    },
    // 1-2-1-3-3
    {
      type: "multiple-choice",
      instruction: "Agree or disagree: 2 is a solution to t > 4.",
      showNumberLine: true,
      min: 0, max: 10, tickStep: 1,
      inequalityLine: { start: 4, direction: ">" },
      choices: [
        { text: "Agree", correct: false },
        { text: "Disagree", correct: true },
      ],
    },
    // 1-2-1-3-4
    {
      type: "multiple-choice",
      instruction: "Which number is a solution to p < 0?",
      showNumberLine: true,
      min: -5, max: 5, tickStep: 1,
      inequalityLine: { start: 0, direction: "<" },
      choices: [
        { text: "-2", correct: true },
        { text: "2", correct: false },
      ],
    },
    // 1-2-1-3-5
    {
      type: "equation-input",
      instruction: "Write a number that is a possible solution to w > -4.",
      showNumberLine: true,
      min: -5, max: 5, tickStep: 1,
      inequalityLine: { start: -4, direction: ">" },
      condition: "greaterThan",
      conditionValue: -4,
      hintButton: "Write any number > -4.",
    },
    // 1-2-1-3-6
    {
      type: "multiple-choice",
      instruction:
        "Try without a number line. (Draw one if you want.) Which value of x makes x < 1000 true?",
      choices: [
        { text: "200", correct: true },
        { text: "1200", correct: false },
      ],
    },
    // 1-2-1-3-7
    {
      type: "multiple-choice",
      instruction: "Which number makes n < 0 true?",
      choices: [
        { text: "½", correct: false },
        { text: "-½", correct: true },
        { text: "0", correct: false },
      ],
      hintButton: "Remember 0 is not less than 0.",
    },
    // 1-2-1-3-8
    {
      type: "multiple-choice",
      instruction:
        "A jar has more than 100 nickels in it. Marla thinks it could have 99 nickels. Do you agree or disagree?",
      choices: [
        { text: "Agree", correct: false },
        { text: "Disagree", correct: true },
      ],
      hintButton: "Is 99 > 100 a true statement?",
    },
    // 1-2-1-3-9
    {
      type: "inequality-write",
      instruction: "Write an inequality for which 7, 15, and 33 are solutions.",
      leftIsInput: true,
      rightIsInput: true,
      solutions: [7, 15, 33],
      hintButton: "Choose any name for the variable in the first box.",
    },
    // 1-2-1-3-10
    {
      type: "inequality-write",
      instruction: "Write an inequality for which 3, -4, 0, and 2300 are solutions.",
      leftIsInput: true,
      rightIsInput: true,
      solutions: [3, -4, 0, 2300],
    },
    // 1-2-1-3-11
    {
      type: "inequality-write",
      instruction:
        "The solution set for an inequality is shown on this number line. Write an inequality that matches it.",
      min: 5, max: 15, tickStep: 1,
      inequalityLine: { start: 10, direction: ">" },
      leftIsInput: true,
      rightIsInput: true,
      target: { sign: ">", value: 10 },
    },
  ],
};

const newSection = {
  id: "s2",
  title: "Inequalities",
  lessons: [
    {
      id: "l1",
      title: "Introduction to Inequalities",
      miniLessons: [ml1, ml2, ml3],
    },
  ],
};

mod.sections.push(newSection);
console.log(
  "Added section s2 with",
  ml1.steps.length + ml2.steps.length + ml3.steps.length,
  "steps across 3 mini-lessons",
);

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
