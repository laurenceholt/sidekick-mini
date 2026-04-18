#!/usr/bin/env node
// Walk the entire Supabase content blob and convert straight quotes to smart quotes
// in every string value. Preserves URLs, field names, and already-curly characters.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://qwqsgfepygsfempjmquq.supabase.co",
  "sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl",
);

const LEFT_DOUBLE = "\u201C";
const RIGHT_DOUBLE = "\u201D";
const LEFT_SINGLE = "\u2018";
const RIGHT_SINGLE = "\u2019";

function isUrlLike(s) {
  return /^(\/|https?:\/\/|data:|blob:)/.test(s);
}

function smartQuote(s) {
  if (isUrlLike(s)) return s;

  // Double quotes — use a stateful per-string transform
  let out = "";
  let openD = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c === '"') {
      // Opening if preceded by start, whitespace, or opening punctuation
      const prev = i === 0 ? "" : s[i - 1];
      const isOpening = i === 0 || /[\s\(\[\{<]/.test(prev);
      if (isOpening && !openD) {
        out += LEFT_DOUBLE;
        openD = true;
      } else {
        out += RIGHT_DOUBLE;
        openD = false;
      }
    } else {
      out += c;
    }
  }

  // Now do single quotes / apostrophes on the result
  let out2 = "";
  let openS = false;
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (c === "'") {
      const prev = i === 0 ? "" : out[i - 1];
      const next = i + 1 < out.length ? out[i + 1] : "";
      // Heuristic: if preceded by a letter/digit and followed by a letter (contraction or possessive),
      // it's an apostrophe → RIGHT single.
      if (/[A-Za-z0-9]/.test(prev) && /[A-Za-z]/.test(next)) {
        out2 += RIGHT_SINGLE;
        continue;
      }
      // Opening if preceded by start, whitespace, or opening punctuation
      const isOpening = i === 0 || /[\s\(\[\{<]/.test(prev);
      if (isOpening && !openS) {
        out2 += LEFT_SINGLE;
        openS = true;
      } else {
        out2 += RIGHT_SINGLE;
        openS = false;
      }
    } else {
      out2 += c;
    }
  }

  return out2;
}

let converted = 0;
function walk(v) {
  if (typeof v === "string") {
    const next = smartQuote(v);
    if (next !== v) converted++;
    return next;
  }
  if (Array.isArray(v)) return v.map(walk);
  if (v && typeof v === "object") {
    const out = {};
    for (const [k, val] of Object.entries(v)) out[k] = walk(val);
    return out;
  }
  return v;
}

const { data: row, error } = await sb
  .from("lessons_content")
  .select("data")
  .eq("id", "main")
  .single();
if (error) { console.error(error); process.exit(1); }

const newBlob = walk(row.data);
console.log("Converted", converted, "string values");

const { error: upErr } = await sb
  .from("lessons_content")
  .update({ data: newBlob, updated_at: new Date().toISOString() })
  .eq("id", "main");
if (upErr) { console.error(upErr); process.exit(1); }
console.log("done");
