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

// Sounds disabled for now — stubs so callers don't need to change.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ = tone;
export function playCorrect() {}
export function playWrong() {}
export function playBonus() {}
