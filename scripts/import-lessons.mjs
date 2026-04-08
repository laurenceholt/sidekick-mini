#!/usr/bin/env node
/**
 * Splice the new lessons (S1-L2, L3, L4) into the live Supabase content blob.
 *
 * Usage: node scripts/import-lessons.mjs
 *
 * Strategy: fetch lessons_content/main, find module m1 / section s1, replace
 * any existing l2/l3/l4 (or append if missing), upsert back. Idempotent.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const SUPABASE_URL = "https://qwqsgfepygsfempjmquq.supabase.co";
const SUPABASE_KEY = "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const here = dirname(fileURLToPath(import.meta.url));
const newLessons = JSON.parse(
  readFileSync(join(here, "lessons-s1-l2-l3-l4.json"), "utf8"),
).lessons;

const { data: row, error: fetchErr } = await supabase
  .from("lessons_content")
  .select("data")
  .eq("id", "main")
  .single();

if (fetchErr) {
  console.error("fetch failed:", fetchErr);
  process.exit(1);
}

const blob = row.data;
const mod = blob.modules.find((m) => m.id === "m1");
if (!mod) throw new Error("module m1 not found");
const sec = mod.sections.find((s) => s.id === "s1");
if (!sec) throw new Error("section s1 not found");

for (const newL of newLessons) {
  const idx = sec.lessons.findIndex((l) => l.id === newL.id);
  if (idx >= 0) {
    console.log(`replacing existing ${newL.id} (${sec.lessons[idx].title})`);
    sec.lessons[idx] = newL;
  } else {
    console.log(`appending new ${newL.id} (${newL.title})`);
    sec.lessons.push(newL);
  }
}

// Sort by id so l1 < l2 < l3 < l4
sec.lessons.sort((a, b) => a.id.localeCompare(b.id, "en", { numeric: true }));

const { error: upErr } = await supabase
  .from("lessons_content")
  .upsert({ id: "main", data: blob });

if (upErr) {
  console.error("upsert failed:", upErr);
  process.exit(1);
}

console.log(
  `done. section s1 now has ${sec.lessons.length} lessons:`,
  sec.lessons.map((l) => `${l.id}: ${l.title}`).join(", "),
);
