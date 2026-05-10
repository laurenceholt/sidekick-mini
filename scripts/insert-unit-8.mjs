#!/usr/bin/env node
// Insert Module 6 / Section 8 ("Unit 8: Statistics") with five lessons:
//   Lesson 4 (Dot plots): 2 mini-lessons, 21 steps
//   Lesson 6 (Histograms): 1 mini-lesson, 10 steps
//   Lesson 9 (Mean): 2 mini-lessons, 20 steps
//   Lesson 13 (Median): 1 mini-lesson, 10 steps
//   Lesson 14 (Mean vs median): 2 mini-lessons, 19 steps
// Total: 80 steps
//
// Uses displayNum overrides so step IDs render as 6-8-4-1-1 etc, matching the
// source curriculum tags rather than the app's array-index numbering.
//
// Idempotent: removes any existing module with id m6 before re-inserting.
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

// Remove existing m6 if present
const existing = blob.modules.findIndex((m) => m.id === "m6");
if (existing >= 0) {
  console.log("Existing module m6 found - replacing");
  blob.modules.splice(existing, 1);
}

// ── Lesson 4: Dot plots ──────────────────────────────────────
// Mini-lesson 4-1: dots, students, plots
const dp_grapes = (data, redValues, highlightValue) => ({
  xMin: 0, xMax: 5,
  data,
  redValues,
  highlightValue,
  label: "Score: number of grapes caught",
  legend: "Each ● is one student",
});

const l4_ml1 = {
  id: "ml1",
  title: "Dot plots",
  displayNum: 1,
  steps: [
    {
      type: "multiple-choice",
      instruction:
        "This dot plot shows how many grapes (out of 5) students could catch in their mouth. Each dot is a student. This is Sakeem. How many grapes did he catch?",
      dotPlot: dp_grapes([3], [3]),
      image: "/u8/grape.svg",
      choices: [
        { text: "0", correct: false },
        { text: "1", correct: false },
        { text: "2", correct: false },
        { text: "3", correct: true },
        { text: "4", correct: false },
        { text: "5", correct: false },
      ],
      hintButton: "What number is the dot above?",
    },
    {
      type: "multiple-choice",
      instruction: "This is Jemisha's dot. How many grapes did she catch?",
      dotPlot: dp_grapes([3, 0], [0]),
      choices: [
        { text: "0", correct: true },
        { text: "1", correct: false },
        { text: "2", correct: false },
        { text: "3", correct: false },
        { text: "4", correct: false },
        { text: "5", correct: false },
      ],
    },
    {
      type: "equation-input",
      instruction: "Here is the whole plot. How many students were there altogether?",
      // 0=3, 1=1, 2=3, 3=4, 4=1, 5=0 → 12 students
      dotPlot: dp_grapes([0, 0, 0, 1, 2, 2, 2, 3, 3, 3, 3, 4]),
      target: 12,
      hintButton: "Each dot is one student.",
    },
    {
      type: "equation-input",
      instruction: "How many students caught 4 grapes?",
      dotPlot: dp_grapes([0, 0, 0, 1, 2, 2, 2, 3, 3, 3, 3, 4]),
      target: 1,
      hintButton: "How many dots are above the number 4?",
    },
    {
      type: "multiple-choice",
      instruction:
        "Which value on the line would you say is the center? (Imagine the dots were lined up from least to greatest and pick the middle value.)",
      dotPlot: dp_grapes([0, 0, 0, 1, 2, 2, 2, 3, 3, 3, 3, 4]),
      choices: [
        { text: "0", correct: false },
        { text: "1", correct: false },
        { text: "2", correct: true },
        { text: "3", correct: false },
        { text: "4", correct: false },
        { text: "5", correct: false },
      ],
      hintButton: "There are 12 dots. The middle is between the 6th and 7th dots.",
    },
    {
      type: "multiple-choice",
      instruction: "What does the center value 2 mean?",
      dotPlot: dp_grapes([0, 0, 0, 1, 2, 2, 2, 3, 3, 3, 3, 4], undefined, 2),
      choices: [
        { text: "Only 2 students caught grapes", correct: false },
        { text: "Every student caught 2 grapes", correct: false },
        { text: "A score around the middle was 2", correct: true },
      ],
    },
    {
      type: "two-chart-choice",
      instruction: "Tap the dot plot that is more spread out.",
      // Wider variation: 1..8 with dots well distributed
      // Narrower variation: clustered around 4-5
      choices: [
        {
          // Spread out — the target
          correct: true,
          dotPlot: {
            xMin: 1, xMax: 8,
            data: [1, 1, 2, 2, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 7, 8, 8, 1],
          },
        },
        {
          correct: false,
          dotPlot: {
            xMin: 1, xMax: 8,
            data: [3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6],
          },
        },
      ],
      hintButton: "More spread out means the dots cover more of the number line.",
    },
    {
      type: "equation-input",
      instruction:
        "This plot shows the number of siblings (brothers and sisters) 20 students had. How many had 0?",
      dotPlot: {
        xMin: 0, xMax: 6,
        data: [0, 1, 2, 1, 3, 2, 0, 4, 2, 2, 3, 2, 1, 5, 0, 2, 3, 1, 2, 6],
        label: "Number of siblings",
        legend: "Each ● is one student",
      },
      image: "/u8/paper-dolls.svg",
      target: 3,
      hintButton: "How many dots are above the number 0?",
    },
    {
      type: "equation-input",
      instruction: "How many had 4 or more siblings?",
      dotPlot: {
        xMin: 0, xMax: 6,
        data: [0, 1, 2, 1, 3, 2, 0, 4, 2, 2, 3, 2, 1, 5, 0, 2, 3, 1, 2, 6],
        label: "Number of siblings",
      },
      target: 3,
      hintButton: "Count the dots at 4, 5, or 6.",
    },
    {
      type: "equation-input",
      instruction:
        "What is the center of this *distribution* (dih-struh-BYOO-shun)?",
      dotPlot: {
        xMin: 0, xMax: 6,
        data: [0, 1, 2, 1, 3, 2, 0, 4, 2, 2, 3, 2, 1, 5, 0, 2, 3, 1, 2, 6],
        label: "Number of siblings",
      },
      target: 2,
    },
    {
      type: "multiple-choice",
      instruction: "Would you say the plot is spread out or grouped tightly together?",
      dotPlot: {
        xMin: 0, xMax: 6,
        data: [0, 1, 2, 1, 3, 2, 0, 4, 2, 2, 3, 2, 1, 5, 0, 2, 3, 1, 2, 6],
        label: "Number of siblings",
      },
      choices: [
        { text: "Spread out", correct: true },
        { text: "Not spread out", correct: false },
      ],
    },
  ],
};

// Mini-lesson 4-2: temperature + sleep dot plots
const tempData = [-4, -2, -1, 0, 1, 1, 2, 2, 3, 4];
const sleepData = [5, 5.5, 6, 6, 6.5, 7, 7, 7.5, 7.5, 8, 8, 8, 8, 8.5, 8.5, 9, 9, 9, 7, 6];

const l4_ml2 = {
  id: "ml2",
  title: "Dot plots with negatives and decimals",
  displayNum: 2,
  steps: [
    {
      type: "equation-input",
      instruction:
        "This dot plot shows the temperature for 10 days in Minnesota in degrees Fahrenheit. What was the coldest temperature?",
      dotPlot: {
        xMin: -4, xMax: 4,
        data: tempData,
        label: "Temperature (°F)",
      },
      image: "/u8/thermometer.svg",
      target: -4,
      hintButton: "Colder is farther to the left.",
    },
    {
      type: "multiple-choice",
      instruction:
        "Agree or disagree: more than half of the days had temperatures above 0 degrees.",
      dotPlot: { xMin: -4, xMax: 4, data: tempData, label: "Temperature (°F)" },
      choices: [
        { text: "Agree", correct: true },
        { text: "Disagree", correct: false },
      ],
      hintButton: "How many dots are above 0? Don't include dots at exactly 0.",
    },
    {
      type: "equation-input",
      instruction: "How many days had temperatures at least 2 degrees?",
      dotPlot: { xMin: -4, xMax: 4, data: tempData, label: "Temperature (°F)" },
      target: 4,
      hintButton: "How many dots are at 2 or above?",
    },
    {
      type: "equation-input",
      instruction: "What was the difference between the warmest day and the coldest day?",
      dotPlot: { xMin: -4, xMax: 4, data: tempData, label: "Temperature (°F)" },
      target: 8,
      hintButton: "Find the value of the dot farthest to the right and the dot farthest to the left.",
    },
    {
      type: "multiple-choice",
      instruction: "Would you say the plot is spread out or grouped tightly?",
      dotPlot: { xMin: -4, xMax: 4, data: tempData, label: "Temperature (°F)" },
      choices: [
        { text: "Spread out", correct: true },
        { text: "Not spread out", correct: false },
      ],
    },
    {
      type: "equation-input",
      instruction:
        "This distribution shows the number of hours 20 sixth graders slept before a big test. What was the least amount of sleep a student got?",
      dotPlot: {
        xMin: 5, xMax: 9,
        step: 0.5,
        data: sleepData,
        label: "Hours of sleep",
      },
      image: "/u8/pillow.svg",
      target: 5,
    },
    {
      type: "equation-input",
      instruction: "How many students slept for at least 8 hours?",
      dotPlot: {
        xMin: 5, xMax: 9, step: 0.5,
        data: sleepData,
        label: "Hours of sleep",
      },
      target: 9,
      hintButton: "How many dots are at 8 or above?",
    },
    {
      type: "multiple-choice",
      instruction: "Agree or disagree: more than half of the students slept for 8 hours or more.",
      dotPlot: {
        xMin: 5, xMax: 9, step: 0.5,
        data: sleepData,
        label: "Hours of sleep",
      },
      choices: [
        { text: "Agree", correct: false },
        { text: "Disagree", correct: true },
      ],
      hintButton: "How many dots are at 8 or above? How many are below 8?",
    },
    {
      type: "multiple-choice",
      instruction: "Agree or disagree: more students slept for 6 hours than for 8 hours.",
      dotPlot: {
        xMin: 5, xMax: 9, step: 0.5,
        data: sleepData,
        label: "Hours of sleep",
      },
      choices: [
        { text: "Agree", correct: false },
        { text: "Disagree", correct: true },
      ],
    },
    {
      type: "equation-input",
      instruction:
        "What was the difference between the student who slept the most hours and the student who slept the least?",
      dotPlot: {
        xMin: 5, xMax: 9, step: 0.5,
        data: sleepData,
        label: "Hours of sleep",
      },
      target: 4,
      hintButton: "Find the value of the dot farthest to the right and the dot farthest to the left.",
    },
  ],
};

// ── Lesson 6: Histograms ──────────────────────────────────────
const popHist = [
  { label: "0-5",   count: 29 },
  { label: "5-10",  count: 15 },
  { label: "10-15", count: 4 },
  { label: "15-20", count: 1 },
  { label: "20-25", count: 0 },
  { label: "25-30", count: 0 },
  { label: "30-35", count: 0 },
  { label: "35-40", count: 1 },
];

const miaHist = [
  { label: "0-5",   count: 4 },
  { label: "6-10",  count: 9 },
  { label: "11-15", count: 11 },
  { label: "16-20", count: 6 },
];

const l6_ml1 = {
  id: "ml1",
  title: "Histograms",
  displayNum: 1,
  steps: [
    {
      type: "tile-sort",
      instruction: "Sort each of these values into the correct bucket.",
      tiles: [3, 5, 1, 8, 1, 4, 7],
      buckets: ["1-5", "6-10"],
    },
    {
      type: "multiple-choice",
      instruction:
        "This is called a *histogram* (HIST-o-gram). Tap the bucket with the most values in it.",
      histogram: {
        buckets: [
          { label: "1-5", count: 4 },
          { label: "6-10", count: 3 },
        ],
        yStep: 1,
      },
      choices: [
        { text: "1-5", correct: true },
        { text: "6-10", correct: false },
      ],
    },
    {
      type: "multiple-choice",
      instruction:
        "Real histograms don't show buckets. But they still call the range of values for each bar a bucket. Which bucket here has the *least* values in it?",
      histogram: {
        buckets: [
          { label: "1-3", count: 2 },
          { label: "4-6", count: 6 },
          { label: "7-9", count: 4 },
          { label: "10-12", count: 1 },
        ],
      },
      choices: [
        { text: "1-3", correct: false },
        { text: "4-6", correct: false },
        { text: "7-9", correct: false },
        { text: "10-12", correct: true },
      ],
      hintButton: "The bucket with the least values in it is the shortest.",
    },
    {
      type: "multiple-choice",
      instruction:
        "Dot plots are great if you have 12 or 20 dots, but not if you have 100 or 1,000. Which of these data sets will be very large?",
      choices: [
        { text: "Class votes for favorite band", correct: false },
        { text: "The weight of every dog in Chicago", correct: true },
      ],
    },
    {
      type: "multiple-choice",
      instruction:
        "For large data sets, histograms are better. This bar shows the number of US states with a population between 0 and 5 million. How many are there?",
      histogram: {
        buckets: popHist,
        bucketsVisible: 1,
        arrowAtBucket: 0,
        xLabel: "Population (millions)",
        yLabel: "Number of states",
      },
      choices: [
        { text: "5", correct: false },
        { text: "29", correct: true },
        { text: "50", correct: false },
      ],
      hintButton: "The height of the bar tells you how many states.",
    },
    {
      type: "multiple-choice",
      instruction:
        "Think of a bar as being like a stack of dots. How many states have populations between 5 and 10 million?",
      histogram: {
        buckets: popHist,
        bucketsVisible: 2,
        dotsInBars: true,
        xLabel: "Population (millions)",
        yLabel: "Number of states",
      },
      choices: [
        { text: "5", correct: false },
        { text: "10", correct: false },
        { text: "15", correct: true },
      ],
      hintButton: "You can count the dots but it's quicker to read off the total.",
    },
    {
      type: "multiple-choice",
      instruction: "Agree or disagree: the largest state has more than 40 million people?",
      histogram: {
        buckets: popHist,
        xLabel: "Population (millions)",
        yLabel: "Number of states",
      },
      choices: [
        { text: "Agree", correct: false },
        { text: "Disagree", correct: true },
      ],
      hintButton: "The short bar on the right has between 35 and 40 million people.",
    },
    {
      type: "multiple-choice",
      instruction:
        "This histogram shows the number of pages Mia read on 30 nights. Tap the bar containing the most pages she read in one night.",
      histogram: {
        buckets: miaHist,
        xLabel: "Pages read in one night",
        yLabel: "Number of nights",
      },
      choices: [
        { text: "0-5", correct: false },
        { text: "6-10", correct: false },
        { text: "11-15", correct: false },
        { text: "16-20", correct: true },
      ],
      hintButton: "Think about it: is the most she read the tallest bar or the bar farthest right?",
    },
    {
      type: "multiple-choice",
      instruction:
        "Look at the bar in the 0-5 bucket. Agree or disagree: Mia could have read 0 pages one night?",
      histogram: { buckets: miaHist, xLabel: "Pages read in one night", yLabel: "Number of nights" },
      choices: [
        { text: "Agree", correct: true },
        { text: "Disagree", correct: false },
      ],
      hintButton: "0-5 means values in that bar could be anything from 0 to 5.",
    },
    {
      type: "multiple-choice",
      instruction:
        "Agree or disagree: Mia read between 0 and 5 pages on the same number of nights as she read between 10 and 15 pages.",
      histogram: { buckets: miaHist, xLabel: "Pages read in one night", yLabel: "Number of nights" },
      choices: [
        { text: "Agree", correct: false },
        { text: "Disagree", correct: true },
      ],
    },
  ],
};

// ── Lesson 9: Mean ────────────────────────────────────────────
const l9_ml1 = {
  id: "ml1",
  title: "Finding the mean",
  displayNum: 1,
  steps: [
    {
      type: "bar-leveler",
      instruction: "Level out these two bars by moving blue boxes left or right.",
      initial: [1, 3],
      barHeight: 4,
      target: 2,
      hintButton: "Make both blue areas the same.",
    },
    {
      type: "bar-leveler",
      instruction: "Level out these three bars.",
      initial: [1, 4, 1],
      barHeight: 4,
      target: 2,
    },
    {
      type: "equation-input",
      instruction:
        "When you level out, you find what mathematicians call the *mean*. What is the mean of these bars? Type your answer.",
      // Show 3 bars (no arrows) with values 4, 3, 2 — total 9, mean 3
      target: 3,
      hintButton: "Level the bars first. How many blue boxes does each have?",
    },
    {
      type: "equation-input",
      instruction:
        "You can find the mean by 'leveling' a set of numbers: add them up then divide by the number of containers. What is the mean of 2, 1, and 3?",
      target: 2,
      hintButton: "Add the numbers and divide by 3.",
    },
    {
      type: "equation-input",
      instruction: "Find the mean of 4, 1, and 7.",
      target: 4,
      hintButton: "Add them up and divide by the number of values.",
    },
    {
      type: "equation-input",
      instruction: "Just the numbers now: find the mean of 5, 3, 9, 2, and 1.",
      target: 4,
      hintButton: "Add them up and divide by the number of values in the list (5).",
    },
    {
      type: "equation-input",
      instruction:
        "By the way, another word for mean is average. What is the average of -1, 3, and 1?",
      showNumberLine: true,
      min: -3, max: 3, tickStep: 1,
      staticPoints: [-1, 1, 3],
      target: 1,
      hintButton: "Remember, -1 + 1 = 0.",
    },
    {
      type: "equation-input",
      instruction:
        "The temperatures on three days in Death Valley were 120, 124, and 122. What was the mean temperature?",
      multiThermo: { values: [120, 124, 122], min: 110, max: 130, unit: "°" },
      image: "/u8/desert.svg",
      target: 122,
      hintButton: "You can add and divide. But could you just level the three numbers?",
    },
    {
      type: "equation-input",
      instruction:
        "The mean is one way to talk about the center of a distribution of numbers. What is the mean of 3, 0, and 6?",
      target: 3,
    },
    {
      type: "compare-means",
      instruction:
        "Tariq scored 6, 8, 7 in three games. Ava scored 7, 9, 2. Calculate the means. Whose is larger?",
      leftLabel: "Tariq mean",
      rightLabel: "Ava mean",
      leftTarget: 7,
      rightTarget: 6,
      hintButton: "Remember > means greater than.",
    },
  ],
};

const stickersDP = {
  xMin: 0, xMax: 4,
  data: [1, 1, 1, 2, 3],
  label: "Number of stickers",
};
const goalsDP = {
  xMin: 0, xMax: 4,
  data: [0, 1, 1, 2],
  label: "Number of goals",
};
const booksDP = {
  xMin: 0, xMax: 4,
  data: [1, 2, 2, 2, 3],
  label: "Books read",
};

const l9_ml2 = {
  id: "ml2",
  title: "Mean from a dot plot",
  displayNum: 2,
  steps: [
    {
      type: "equation-input",
      instruction:
        "This dot plot shows how many stickers each Kindergarten student got. How many students got 1 sticker?",
      dotPlot: stickersDP,
      image: "/u8/sticker.svg",
      target: 3,
      hintButton: "Count the dots stacked above 1 on the line.",
    },
    {
      type: "equation-input",
      instruction:
        "To find the mean of a dot plot, first find the total number of stickers. How many stickers are shown altogether?",
      dotPlot: stickersDP,
      target: 8,
      hintButton: "Add three 1s, one 2, and one 3.",
    },
    {
      type: "equation-input",
      instruction:
        "Find the mean number of stickers here. Divide the total stickers (8) by the total students (the number of dots).",
      dotPlot: stickersDP,
      target: 2,
    },
    {
      type: "equation-input",
      instruction:
        "This dot plot shows how many goals each player scored. What is the total number of goals?",
      dotPlot: goalsDP,
      image: "/u8/soccer-ball.svg",
      target: 4,
      hintButton: "Don't count the dots, add the values for each of them: 0 + 1 + 1 + …",
    },
    {
      type: "equation-input",
      instruction: "What is the mean number of goals in this dot plot?",
      dotPlot: goalsDP,
      target: 1,
      hintButton: "Divide the total number of goals by the number of players/dots.",
    },
    {
      type: "equation-input",
      instruction:
        "This dot plot shows how many books students read last month. How many students are shown?",
      dotPlot: booksDP,
      image: "/u8/open-book.svg",
      target: 5,
      hintButton: "Each dot is a student.",
    },
    {
      type: "equation-input",
      instruction: "What is the total number of books read in this distribution?",
      dotPlot: booksDP,
      target: 10,
    },
    {
      type: "equation-input",
      instruction: "For these students, what is the mean number of books read last month?",
      dotPlot: booksDP,
      target: 2,
    },
    {
      type: "multiple-choice",
      instruction: "What does the mean (2) represent here?",
      dotPlot: booksDP,
      choices: [
        { text: "Two students read books last month", correct: false },
        { text: "Students read 2 books last month", correct: false },
        {
          text: "The average number of books a student read last month was 2",
          correct: true,
        },
      ],
    },
    {
      type: "multiple-choice",
      instruction: "Which sentence explains how to find the mean from a dot plot?",
      choices: [
        {
          text: "Add the value of every dot, then divide by the number of dots",
          correct: true,
        },
        {
          text: "Divide the number of dots by the total value of the dots",
          correct: false,
        },
        {
          text: "Count the number of different values on the line",
          correct: false,
        },
      ],
    },
  ],
};

// ── Lesson 13: Median ─────────────────────────────────────────
const songsDP = {
  xMin: 0, xMax: 6,
  data: [0, 2, 2, 5, 6],
  label: "Songs added",
};
const textsDP = {
  xMin: 0, xMax: 5,
  data: [1, 1, 3, 4],
  label: "Texts sent",
};

const l13_ml1 = {
  id: "ml1",
  title: "Median",
  displayNum: 1,
  steps: [
    {
      type: "pick-from-list",
      instruction:
        "Another way to talk about the center of a set of values is to line them up in order and find the middle. Click on the middle value here.",
      values: [1, 4, 4, 7, 12, 21, 64],
      target: 7,
    },
    {
      type: "pick-from-list",
      instruction:
        "We call the middle value the *median* (“MEE-dee-un”). What is the median of this list?",
      values: [20, 25, 32, 40, 55],
      target: 32,
      hintButton: "Median is the middle number when the values are in order.",
    },
    {
      type: "pick-from-list",
      instruction:
        "If values are not in order, you have to order them first. What is the median of this list?",
      values: [7, 13, 2],
      target: 7,
      hintButton: "Put the numbers in order smallest to largest, then pick the middle.",
    },
    {
      type: "pick-from-list",
      instruction:
        "What is the median of this list? Write them in order on a separate piece of paper first.",
      values: [15, 104, 37, 22, -4],
      target: 22,
    },
    {
      type: "equation-input",
      instruction:
        "If there are an even number of values, there are two middle values. Find the value halfway between them.",
      prefix: "4, 7, 9, 12",
      target: 8,
      hintButton: "To find the value halfway between 7 and 9, add them and divide by 2.",
    },
    {
      type: "equation-input",
      instruction:
        "These are temperatures for four days in Sonoran Desert, on the US-Mexico border. What was the median temperature?",
      multiThermo: { values: [112, 123, 114, 108], min: 100, max: 130, unit: "°" },
      image: "/u8/desert.svg",
      target: 113,
      hintButton: "Remember, order the values first.",
    },
    {
      type: "equation-input",
      instruction:
        "This dot plot shows how many songs five students added to a playlist. What is the median?",
      dotPlot: songsDP,
      image: "/u8/music-bar.svg",
      target: 2,
      hintButton: "Write out the value for each dot: 0, 2, 2, 5, 6. Now find the median.",
    },
    {
      type: "equation-input",
      instruction:
        "This dot plot shows how many texts four friends sent during lunch. What is the median?",
      dotPlot: textsDP,
      target: 2,
      hintButton: "What are the middle two values? The median is halfway between them.",
    },
    {
      type: "equation-input",
      instruction:
        "These are the numbers of minutes six students spent getting ready for school. What is the median?",
      prefix: "5, 30, 10, 20, 10, 15",
      target: 12.5,
    },
    {
      type: "multiple-choice",
      instruction: "Which sentence explains how to find the median?",
      choices: [
        {
          text: "Add all the values and divide by how many values there are",
          correct: false,
        },
        { text: "Put the values in order and find the middle", correct: true },
        { text: "Pick the value that appears most often", correct: false },
      ],
      hintButton: "Mean, median, and most common value are different ways to describe a data set.",
    },
  ],
};

// ── Lesson 14: Mean vs median ─────────────────────────────────
const likesDP = { xMin: 0, xMax: 4, data: [1, 2, 2, 2, 3], label: "Likes" };
const pointsDP = { xMin: 0, xMax: 8, data: [1, 2, 2, 3, 7], label: "Points scored" };
const unreadDP = { xMin: 0, xMax: 6, data: [0, 1, 4, 5, 5], label: "Unread texts" };

const l14_ml1 = {
  id: "ml1",
  title: "Comparing mean and median",
  displayNum: 1,
  steps: [
    {
      type: "equation-input",
      instruction:
        "This dot plot shows how many likes 5 short videos got. What is the median number of likes?",
      dotPlot: likesDP,
      image: "/u8/heart.svg",
      target: 2,
      hintButton: "The median is the middle value after the numbers are in order.",
    },
    {
      type: "equation-input",
      instruction: "For this dot plot, what is the mean number of likes?",
      dotPlot: likesDP,
      target: 2,
      hintButton: "To find the mean, add all the values and divide by the number of values.",
    },
    {
      type: "multiple-choice",
      instruction: "For this dot plot, compare the mean (2) and the median (2).",
      dotPlot: likesDP,
      choices: [
        { text: "Mean < median", correct: false },
        { text: "Mean = median", correct: true },
        { text: "Mean > median", correct: false },
      ],
    },
    {
      type: "equation-input",
      instruction:
        "This dot plot shows how many points 5 players scored. What is the median number of points?",
      dotPlot: pointsDP,
      image: "/u8/scoreboard.svg",
      target: 2,
    },
    {
      type: "equation-input",
      instruction: "For this dot plot, what is the mean number of points scored?",
      dotPlot: pointsDP,
      target: 3,
      hintButton: "The mean uses all the values.",
    },
    {
      type: "multiple-choice",
      instruction:
        "For this dot plot, compare the mean (3) and the median (2). Agree or disagree: the high score of 7 pulls the mean up.",
      dotPlot: pointsDP,
      choices: [
        { text: "Agree", correct: true },
        { text: "Disagree", correct: false },
      ],
    },
    {
      type: "equation-input",
      instruction:
        "This dot plot shows how many unread texts are on 5 phones. What is the median number of unread texts?",
      dotPlot: unreadDP,
      target: 4,
    },
    {
      type: "equation-input",
      instruction: "For this dot plot, what is the mean number of unread texts?",
      dotPlot: unreadDP,
      target: 3,
    },
    {
      type: "multiple-choice",
      instruction:
        "For this dot plot, the mean is 3 and the median is 4. Why is the mean lower than the median?",
      dotPlot: unreadDP,
      choices: [
        { text: "The 0 pulls the mean down", correct: true },
        { text: "The 5s pull the mean down", correct: false },
        { text: "The median is always bigger than the mean", correct: false },
      ],
    },
  ],
};

const songsAddedDP = { xMin: 0, xMax: 8, data: [2, 3, 3, 4, 4, 5, 6], label: "Songs added" };
const homeworkDP = { xMin: 0, xMax: 60, data: [10, 10, 15, 15, 20, 20, 55], label: "Homework minutes" };
const backpackDP = { xMin: 0, xMax: 12, data: [2, 2, 3, 3, 3, 4, 4, 5, 12], label: "Backpack weight (kg)" };
const heightHist = {
  buckets: [
    { label: "66-68", count: 2 },
    { label: "68-70", count: 4 },
    { label: "70-72", count: 13 },
    { label: "72-74", count: 18 },
    { label: "74-76", count: 9 },
    { label: "76-78", count: 3 },
    { label: "78-80", count: 1 },
  ],
  xLabel: "Height (inches)",
  yLabel: "Number of players",
};
const ageHist = {
  buckets: [
    { label: "0-10", count: 2 },
    { label: "10-20", count: 4 },
    { label: "20-30", count: 3 },
    { label: "30-40", count: 5 },
    { label: "40-50", count: 16 },
  ],
  xLabel: "Age (years)",
  yLabel: "Number of people",
};

const l14_ml2 = {
  id: "ml2",
  title: "Picking the right center",
  displayNum: 2,
  steps: [
    {
      type: "multiple-choice",
      instruction:
        "This dot plot shows how many songs 7 students added to a playlist. Which number looks typical?",
      dotPlot: songsAddedDP,
      image: "/u8/music-bar.svg",
      choices: [
        { text: "0", correct: false },
        { text: "4", correct: true },
        { text: "8", correct: false },
      ],
      hintButton: "A good estimate of “typical” is the median.",
    },
    {
      type: "multiple-choice",
      instruction:
        "For this dot plot, the mean is 4 and the median is 4. Which center works better?",
      dotPlot: songsAddedDP,
      choices: [
        { text: "Mean", correct: false },
        { text: "Median", correct: false },
        { text: "Both work well", correct: true },
      ],
    },
    {
      type: "multiple-choice",
      instruction:
        "This dot plot shows how many minutes 7 students spent on homework. Which value is unusual?",
      dotPlot: homeworkDP,
      image: "/u8/timer.svg",
      choices: [
        { text: "10", correct: false },
        { text: "20", correct: false },
        { text: "55", correct: true },
      ],
      hintButton: "Unusual means far away from the other values.",
    },
    {
      type: "multiple-choice",
      instruction:
        "For this homework dot plot, which do you think will be larger, the mean or the median?",
      dotPlot: homeworkDP,
      choices: [
        { text: "Mean", correct: true },
        { text: "Median", correct: false },
        { text: "They are equal", correct: false },
      ],
      hintButton:
        "An unusual value pulls the mean in its direction, higher or lower, but leaves the median unchanged.",
    },
    {
      type: "multiple-choice",
      instruction:
        "Which center better describes a typical homework time for this dot plot?",
      dotPlot: homeworkDP,
      image: "/u8/timer.svg",
      choices: [
        { text: "Mean, about 21 minutes", correct: false },
        { text: "Median, 15 minutes", correct: true },
      ],
      hintButton: "“Typical” is where most students cluster.",
    },
    {
      type: "multiple-choice",
      instruction:
        "This dot plot shows backpack weights in kilograms. One backpack is much heavier than the rest. What will happen to the mean?",
      dotPlot: backpackDP,
      image: "/u8/backpack.svg",
      choices: [
        { text: "The mean will be pulled down", correct: false },
        { text: "The mean will be pulled up", correct: true },
        { text: "The mean will not change", correct: false },
      ],
    },
    {
      type: "multiple-choice",
      instruction:
        "This histogram shows heights of basketball players. The bars are pretty balanced. What is probably true?",
      histogram: heightHist,
      image: "/u8/basketball.svg",
      choices: [
        { text: "The mean and median are probably close", correct: true },
        { text: "The mean is much greater than the median", correct: false },
        { text: "The median is much greater than the mean", correct: false },
      ],
    },
    {
      type: "multiple-choice",
      instruction:
        "This histogram shows ages at a family dinner. Most people are adults. A few people are kids. What will the younger ages do to the mean?",
      histogram: ageHist,
      image: "/u8/birthday-cake.svg",
      choices: [
        { text: "They will pull the mean down", correct: true },
        { text: "They will pull the mean up", correct: false },
        { text: "They will not affect the mean", correct: false },
      ],
    },
    {
      type: "multiple-choice",
      instruction:
        "For the family dinner ages histogram, which center probably better describes a typical age?",
      histogram: ageHist,
      choices: [
        { text: "Mean", correct: false },
        { text: "Median", correct: true },
      ],
      hintButton: "Most people are in the older age groups.",
    },
    {
      type: "multiple-choice",
      instruction: "Which sentence is true?",
      image: "/u8/balanced-dot-plot.svg",
      choices: [
        {
          text: "When the data are balanced, the mean and median are usually close",
          correct: true,
        },
        { text: "A high unusual value pulls the median more than the mean", correct: false },
        { text: "The tallest bar is always the mean", correct: false },
      ],
    },
  ],
};

// Assemble module
const newModule = {
  id: "m6",
  title: "Unit 8: Statistics",
  displayNum: 6,
  sections: [
    {
      id: "s8",
      title: "Dot plots, histograms, mean and median",
      displayNum: 8,
      lessons: [
        { id: "l4",  title: "Dot plots",                displayNum: 4,  miniLessons: [l4_ml1, l4_ml2] },
        { id: "l6",  title: "Histograms",               displayNum: 6,  miniLessons: [l6_ml1] },
        { id: "l9",  title: "Mean",                     displayNum: 9,  miniLessons: [l9_ml1, l9_ml2] },
        { id: "l13", title: "Median",                   displayNum: 13, miniLessons: [l13_ml1] },
        { id: "l14", title: "Mean vs median",           displayNum: 14, miniLessons: [l14_ml1, l14_ml2] },
      ],
    },
  ],
};

blob.modules.push(newModule);

const stepCount = newModule.sections[0].lessons.reduce(
  (s, l) => s + l.miniLessons.reduce((m, ml) => m + ml.steps.length, 0),
  0,
);
console.log(`Inserted module m6 with ${stepCount} steps across 5 lessons`);

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
