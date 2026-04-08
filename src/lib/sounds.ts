/**
 * Tiny WebAudio sound effects. No assets — synthesized on the fly.
 */
let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  return ctx;
}

function tone(freq: number, dur: number, type: OscillatorType = "sine", delay = 0, gain = 0.15) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playCorrect() {
  tone(660, 0.12, "triangle", 0);
  tone(880, 0.18, "triangle", 0.08);
}

export function playWrong() {
  tone(220, 0.2, "square", 0, 0.08);
  tone(180, 0.2, "square", 0.05, 0.08);
}

export function playBonus() {
  tone(660, 0.1, "triangle", 0);
  tone(880, 0.1, "triangle", 0.1);
  tone(1100, 0.2, "triangle", 0.2);
}
