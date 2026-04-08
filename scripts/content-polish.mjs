#!/usr/bin/env node
// Sweep lesson content for "spaces" -> "units" wording in instructions/hints,
// and clear any stray "30" label on step 1-1-1-2-2 highlighted values.
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qwqsgfepygsfempjmquq.supabase.co";
const SUPABASE_KEY = "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl";
const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

function replaceWord(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/\bspaces\b/g, "units")
    .replace(/\bSpaces\b/g, "Units")
    .replace(/\bspace\b/g, "unit")
    .replace(/\bSpace\b/g, "Unit");
}

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
let changed = 0;

for (const mod of blob.modules) {
  for (const sec of mod.sections) {
    for (const les of sec.lessons) {
      for (const ml of les.miniLessons) {
        for (const step of ml.steps) {
          const before = JSON.stringify(step);
          if (step.instruction) step.instruction = replaceWord(step.instruction);
          if (step.hint) step.hint = replaceWord(step.hint);
          if (Array.isArray(step.choices)) {
            for (const c of step.choices) {
              if (c && typeof c.text === "string") c.text = replaceWord(c.text);
            }
          }
          const after = JSON.stringify(step);
          if (before !== after) changed++;
        }
      }
    }
  }
}

// Remove stray "30" highlight on 1-1-1-2-2
try {
  const ml = blob.modules[0].sections[0].lessons[0].miniLessons[1];
  const step = ml && ml.steps && ml.steps[1];
  if (step && Array.isArray(step.highlightValues)) {
    const filtered = step.highlightValues.filter((v) => v !== 30);
    if (filtered.length !== step.highlightValues.length) {
      step.highlightValues = filtered;
      changed++;
      console.log('Removed "30" label from 1-1-1-2-2');
    }
  }
} catch {}

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) {
  console.error(upErr);
  process.exit(1);
}
console.log(`done; ${changed} step(s) updated`);
