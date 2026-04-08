import { supabase } from "./supabase";

let cachedUserId: string | null = null;

async function getUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  if (typeof window === "undefined") return "9999";
  const stored = localStorage.getItem("sidekick-uid");
  if (stored) {
    cachedUserId = stored;
    return stored;
  }
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    if (j?.ip) {
      localStorage.setItem("sidekick-uid", j.ip);
      cachedUserId = j.ip;
      return j.ip;
    }
  } catch {}
  cachedUserId = "9999";
  return "9999";
}

function etTime() {
  return new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    hour12: false,
  });
}

export async function logEvent(params: {
  stepId: string;
  answer: string | null;
  correct: boolean;
  bobaTotal: number;
}) {
  try {
    const user_id = await getUserId();
    await supabase.from("events").insert({
      user_id,
      step_id: params.stepId,
      answer: params.answer,
      correct: params.correct,
      boba_total: params.bobaTotal,
      et_time: etTime(),
    });
  } catch (e) {
    console.warn("logEvent failed", e);
  }
}
