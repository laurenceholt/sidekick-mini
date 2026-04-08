#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qwqsgfepygsfempjmquq.supabase.co";
const SUPABASE_KEY = "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const TITLES = {
  l1: "Positive and Negative Numbers",
  l2: "Points on the Number Line",
  l3: "Comparing Positive and Negative Numbers",
  l4: "Absolute Value of Numbers",
};

const { data: row, error } = await supabase
  .from("lessons_content").select("data").eq("id", "main").single();
if (error) { console.error(error); process.exit(1); }

const blob = row.data;
const sec = blob.modules.find(m => m.id === "m1").sections.find(s => s.id === "s1");
for (const les of sec.lessons) {
  if (TITLES[les.id]) {
    console.log(`${les.id}: "${les.title}" -> "${TITLES[les.id]}"`);
    les.title = TITLES[les.id];
  }
}

const { error: upErr } = await supabase
  .from("lessons_content").upsert({ id: "main", data: blob });
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
