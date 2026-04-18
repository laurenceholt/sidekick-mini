#!/usr/bin/env node
// Insert Section 1-3 "Coordinate Plane" with one lesson containing 3 mini-lessons.
// All text uses smart quotes.
// Idempotent: detects existing section s3 by id.
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

const existingIdx = mod.sections.findIndex((s) => s.id === "s3");
if (existingIdx >= 0) {
  console.log("Existing section s3 — replacing");
  mod.sections.splice(existingIdx, 1);
}

// ── Mini-lesson 1: Finding rooms (buildings → grid) ────────────
const ml1 = {
  id: "ml1",
  title: "Finding rooms",
  steps: [
    // 1-3-1-1-1
    {
      type: "coord-plot",
      instruction: "Click on the room that is the 4th building and the 2nd floor.",
      xMin: 0, xMax: 5, yMin: 0, yMax: 5,
      showBuildings: true,
      showGrid: false,
      initialFigure: { x: 0, y: 0 },
      targetX: 4, targetY: 2,
      hintButton: "Start at the left and move to the 4th building then up 2 floors.",
    },
    // 1-3-1-1-2
    {
      type: "coord-plot",
      instruction:
        "For shorthand, we write (1, 2) to mean \u201Cfirst building, 2nd floor.\u201D Go to (2, 3).",
      xMin: 0, xMax: 5, yMin: 0, yMax: 5,
      showBuildings: true,
      showGrid: false,
      initialFigure: { x: 0, y: 0 },
      targetX: 2, targetY: 3,
    },
    // 1-3-1-1-3
    {
      type: "coord-plot",
      instruction: "Go to (4, 4).",
      xMin: 0, xMax: 5, yMin: 0, yMax: 5,
      showBuildings: true,
      showGrid: false,
      initialFigure: { x: 0, y: 0 },
      targetX: 4, targetY: 4,
    },
    // 1-3-1-1-4
    {
      type: "multiple-choice",
      instruction: "Marla says this is (3, 5). Agree or disagree?",
      coordPlane: {
        xMin: 0, xMax: 5, yMin: 0, yMax: 5,
        showBuildings: true,
        showGrid: false,
        figure: { x: 5, y: 3 },
      },
      choices: [
        { text: "Agree", correct: false },
        { text: "Disagree", correct: true },
      ],
      hintButton: "Count along the buildings first, then up the floors.",
    },
    // 1-3-1-1-5
    {
      type: "coord-plot",
      instruction:
        "We can number the houses like a number line and the floors like a vertical number line. Go to (5, 1).",
      xMin: 0, xMax: 5, yMin: 0, yMax: 5,
      showBuildings: true,
      showGrid: true,
      initialFigure: { x: 0, y: 0 },
      targetX: 5, targetY: 1,
    },
    // 1-3-1-1-6
    {
      type: "coord-plot",
      instruction: "Go to (1, 5).",
      xMin: 0, xMax: 5, yMin: 0, yMax: 5,
      showBuildings: true,
      showGrid: true,
      initialFigure: { x: 0, y: 0 },
      targetX: 1, targetY: 5,
    },
    // 1-3-1-1-7
    {
      type: "coord-plot",
      instruction:
        "Now try without the houses. Remember: go along first, then up. Where is (3, 4)?",
      xMin: 0, xMax: 5, yMin: 0, yMax: 5,
      showGrid: true,
      targetX: 3, targetY: 4,
      hintButton: "Along 3 then up 4.",
    },
    // 1-3-1-1-8
    {
      type: "coord-tap",
      instruction: "Tap the dot that is at (2, 5).",
      xMin: 0, xMax: 5, yMin: 0, yMax: 5,
      showGrid: true,
      tapPoints: [
        { x: 2, y: 5 },
        { x: 5, y: 2 },
      ],
      targetX: 2, targetY: 5,
    },
    // 1-3-1-1-9
    {
      type: "equation-input",
      instruction: "What point is this?",
      coordPlane: {
        xMin: 0, xMax: 5, yMin: 0, yMax: 5,
        showGrid: true,
        points: [{ x: 3, y: 1 }],
      },
      prefix: "(3, ",
      suffix: ")",
      target: 1,
      hintButton: "The first number is along. The second number is up.",
    },
    // 1-3-1-1-10
    {
      type: "coord-plot",
      instruction: "Plot (4, 0).",
      xMin: 0, xMax: 5, yMin: 0, yMax: 5,
      showGrid: true,
      targetX: 4, targetY: 0,
      hintButton: "0 means you don\u2019t go up at all, just along 4.",
    },
  ],
};

// ── Mini-lesson 2: The coordinate plane ────────────────────────
const ml2 = {
  id: "ml2",
  title: "The coordinate plane",
  steps: [
    // 1-3-1-2-1
    {
      type: "coord-plot",
      instruction:
        "We call the horizontal number line the x-axis and the vertical one the y-axis. Plot (2, 8).",
      xMin: 0, xMax: 10, yMin: 0, yMax: 10,
      showGrid: true,
      showAxes: true,
      targetX: 2, targetY: 8,
      hintButton: "Remember: go 2 along and then 8 up.",
    },
    // 1-3-1-2-2
    {
      type: "multiple-choice",
      instruction:
        "At the point (2, 8) we can say x = 2, meaning you counted to position 2 on the x-axis. What does y equal?",
      coordPlane: {
        xMin: 0, xMax: 10, yMin: 0, yMax: 10,
        showGrid: true, showAxes: true,
        points: [{ x: 2, y: 8 }],
      },
      choices: [
        { text: "y = 2", correct: false },
        { text: "y = 8", correct: true },
        { text: "y = x", correct: false },
      ],
      hintButton: "How far is the point above 0?",
    },
    // 1-3-1-2-3
    {
      type: "multiple-choice",
      instruction:
        "When we write (2, 8) we are writing an ordered pair, a pair of numbers where the order matters. What is the ordered pair for x = 7, y = 0?",
      coordPlane: {
        xMin: 0, xMax: 10, yMin: 0, yMax: 10,
        showGrid: true, showAxes: true,
        points: [{ x: 7, y: 0 }],
      },
      choices: [
        { text: "(7, 0)", correct: true },
        { text: "(0, 7)", correct: false },
        { text: "(7, 7)", correct: false },
      ],
      hintButton:
        "Plug the correct values into (x, y) to get the ordered pair for this point.",
    },
    // 1-3-1-2-4
    {
      type: "coord-plot",
      instruction: "Plot (5, 5).",
      xMin: 0, xMax: 10, yMin: 0, yMax: 10,
      showGrid: true,
      showAxes: true,
      targetX: 5, targetY: 5,
    },
    // 1-3-1-2-5
    {
      type: "coord-plot",
      instruction:
        "As you know, number lines can include negatives. Plot (-3, 2).",
      xMin: -5, xMax: 5, yMin: 0, yMax: 5,
      showGrid: true,
      showAxes: true,
      targetX: -3, targetY: 2,
      hintButton: "For -3 start at 0 and move left.",
    },
    // 1-3-1-2-6
    {
      type: "coord-plot",
      instruction:
        "It gets even more interesting if both axes include negatives. Now can you plot (-2, -3)?",
      xMin: -5, xMax: 5, yMin: -5, yMax: 5,
      showGrid: true,
      showAxes: true,
      targetX: -2, targetY: -3,
      hintButton: "Go left for x = -2. Go down for y = -3.",
    },
    // 1-3-1-2-7
    {
      type: "coord-plot",
      instruction:
        "A grid like this is called a coordinate plane (\u201Cco-ord-in-ate plane\u201D). Plot (3, -4).",
      xMin: -5, xMax: 5, yMin: -5, yMax: 5,
      showGrid: true,
      showAxes: true,
      targetX: 3, targetY: -4,
    },
    // 1-3-1-2-8
    {
      type: "coord-plot",
      instruction:
        "Plot (-8, 2) on this coordinate plane. (\u201CPlane\u201D means flat surface, by the way.)",
      xMin: -10, xMax: 10, yMin: -10, yMax: 10,
      showGrid: true,
      showAxes: true,
      targetX: -8, targetY: 2,
    },
    // 1-3-1-2-9
    {
      type: "multiple-choice",
      instruction:
        "Joleen plants cabbage and broccoli in her garden. What is the location of the broccoli?",
      coordPlane: {
        xMin: -10, xMax: 10, yMin: -10, yMax: 10,
        showGrid: true, showAxes: true,
        points: [
          { x: -4, y: -6, label: "cabbage" },
          { x: 4, y: -6, label: "broccoli" },
        ],
      },
      choices: [
        { text: "(4, 6)", correct: false },
        { text: "(4, -6)", correct: true },
        { text: "(-4, -6)", correct: false },
      ],
    },
    // 1-3-1-2-10
    {
      type: "multiple-choice",
      instruction:
        "Maya shot an arrow that landed at (-4, -3). How many points did she score?",
      coordPlane: {
        xMin: -10, xMax: 10, yMin: -10, yMax: 10,
        showGrid: true, showAxes: true,
        showArchery: true,
      },
      choices: [
        { text: "2 points", correct: false },
        { text: "5 points", correct: true },
        { text: "10 points", correct: false },
      ],
      hintButton:
        "First figure out where the arrow landed. Which scoring ring is it in?",
    },
  ],
};

// ── Mini-lesson 3: Distance ─────────────────────────────────────
const ml3 = {
  id: "ml3",
  title: "Distance",
  steps: [
    // 1-3-1-3-1
    {
      type: "equation-input",
      instruction: "What is the distance between 2 and 6 on the number line (count the hops)?",
      showNumberLine: true,
      min: 0, max: 10, tickStep: 1, labelStep: 1,
      hops: { from: 2, to: 6 },
      target: 4,
    },
    // 1-3-1-3-2
    {
      type: "equation-input",
      instruction: "What is the distance between -3 and 3?",
      showNumberLine: true,
      min: -5, max: 5, tickStep: 1, labelStep: 1,
      hops: { from: -3, to: 3 },
      target: 6,
    },
    // 1-3-1-3-3
    {
      type: "equation-input",
      instruction:
        "Try it without a number line. (Draw one if you like.) What is the distance between -1 and 3?",
      target: 4,
      hintButton: "Count hops: -1 \u2192 0 \u2192 1 \u2192 2 \u2192 3.",
    },
    // 1-3-1-3-4
    {
      type: "equation-input",
      instruction: "What is the distance from -7 to -5?",
      target: 2,
      hintButton: "Count hops: -7 \u2192 -6 \u2192 -5.",
    },
    // 1-3-1-3-5
    {
      type: "equation-input",
      instruction: "What is the distance from -1 to -1?",
      target: 0,
      hintButton: "Are there any hops?",
    },
    // 1-3-1-3-6
    {
      type: "equation-input",
      instruction:
        "When two points are on the same row or the same column, you can work out distance on a coordinate plane the same way. What is the distance between these two points?",
      coordPlane: {
        xMin: 0, xMax: 5, yMin: 0, yMax: 5,
        showGrid: true,
        points: [{ x: 1, y: 1 }, { x: 4, y: 1 }],
      },
      target: 3,
      hintButton: "Count the hops.",
    },
    // 1-3-1-3-7
    {
      type: "equation-input",
      instruction:
        "Here is the full plane. What is the distance between (-6, 3) and (1, 3)?",
      coordPlane: {
        xMin: -10, xMax: 10, yMin: -10, yMax: 10,
        showGrid: true, showAxes: true,
        points: [{ x: -6, y: 3 }, { x: 1, y: 3 }],
      },
      target: 7,
      hintButton:
        "Remember: the first number is along, the second number is up/down.",
    },
    // 1-3-1-3-8
    {
      type: "equation-input",
      instruction:
        "A guard is at (0, 5). A thief is trying to sneak past. Tell the guard how far away the thief is.",
      coordPlane: {
        xMin: -10, xMax: 10, yMin: -10, yMax: 10,
        showGrid: true, showAxes: true,
        points: [
          { x: 0, y: 5, label: "guard" },
          { x: -5, y: 5, label: "thief" },
        ],
      },
      target: 5,
    },
    // 1-3-1-3-9
    {
      type: "equation-input",
      instruction:
        "Try without a coordinate plane. (Draw one if you want.) What is the distance between (-4, 2) and (0, 2)? Notice that the y-coordinates are the same so you only need to think about the x-coordinates (the first numbers).",
      target: 4,
      hintButton: "How many hops from -4 to 0?",
    },
    // 1-3-1-3-10
    {
      type: "equation-input",
      instruction: "What is the distance from Marla to the escape door?",
      coordPlane: {
        xMin: -10, xMax: 10, yMin: -10, yMax: 10,
        showGrid: true, showAxes: true,
        points: [
          { x: 3, y: 2, label: "Marla" },
          { x: 3, y: 7, label: "Escape door" },
        ],
      },
      target: 5,
      hintButton: "Count the hops up.",
    },
  ],
};

const newSection = {
  id: "s3",
  title: "Coordinate Plane",
  lessons: [
    {
      id: "l1",
      title: "Introduction to the Coordinate Plane",
      miniLessons: [ml1, ml2, ml3],
    },
  ],
};

mod.sections.push(newSection);
console.log(
  "Added section s3 with",
  ml1.steps.length + ml2.steps.length + ml3.steps.length,
  "steps across 3 mini-lessons",
);

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
