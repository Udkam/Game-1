// Lightweight, asset-free sound hooks. This is the placeholder audio interface
// the rest of the UI calls at key events; richer audio can be swapped in later
// without touching call sites. Off by default (toggle in the top bar); when on it
// synthesizes short, soft WebAudio blips — no external files, no autoplay surprises
// (the first key press is the user gesture that unlocks the AudioContext).

export type SfxName = 'move' | 'push' | 'slide' | 'warp' | 'fill' | 'gate' | 'key' | 'win' | 'blocked';

const KEY = 'driftbox.sound';
let enabled = (() => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();
let ctx: AudioContext | null = null;

export function soundEnabled(): boolean {
  return enabled;
}
export function setSound(on: boolean): void {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* storage unavailable */
  }
}

const TONES: Record<SfxName, { f: number; d: number; type: OscillatorType; g: number }> = {
  move: { f: 300, d: 0.04, type: 'sine', g: 0.025 },
  push: { f: 180, d: 0.08, type: 'sine', g: 0.05 },
  slide: { f: 540, d: 0.2, type: 'triangle', g: 0.045 },
  warp: { f: 720, d: 0.16, type: 'sine', g: 0.05 },
  fill: { f: 120, d: 0.18, type: 'sine', g: 0.07 },
  gate: { f: 300, d: 0.12, type: 'square', g: 0.035 },
  key: { f: 880, d: 0.14, type: 'triangle', g: 0.045 },
  win: { f: 620, d: 0.5, type: 'sine', g: 0.06 },
  blocked: { f: 110, d: 0.05, type: 'sine', g: 0.03 },
};

export function sfx(name: SfxName): void {
  if (!enabled) return;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx ??= new AC();
    const t = TONES[name];
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = t.type;
    osc.frequency.setValueAtTime(t.f, now);
    if (name === 'slide' || name === 'warp') osc.frequency.exponentialRampToValueAtTime(t.f * 1.6, now + t.d);
    gain.gain.setValueAtTime(t.g, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t.d);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + t.d);
  } catch {
    /* audio unavailable — stay silent */
  }
}
