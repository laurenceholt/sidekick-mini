#!/usr/bin/env node
// Rewrite 1-2-1-2-6: canceled-if-below-2° version (target t < 2).
import { createClient } from "@supabase/supabase-js";
const sb = createClient(
  "https://qwqsgfepygsfempjmquq.supabase.co",
  "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl",
);
const { data: row, error } = await sb
  .from("lessons_content").select("data").eq("id", "main").single();
if (error) { console.error(error); process.exit(1); }
const blob = row.data;

const mod = blob.modules[0];
const sec = mod.sections.find((s) => s.id === "s2");
const ml = sec.lessons[0].miniLessons.find((m) => m.id === "ml2");
const step = ml.steps[5]; // 1-2-1-2-6

step.instruction =
  "Tonight's concert will be canceled if the temperature is below 2°. Write an inequality for temperatures when the concert will be canceled.";
step.target = { sign: "<", value: 2 };
console.log("Updated 1-2-1-2-6");

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: blob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
