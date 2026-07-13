import type { RunnerEvent } from '../core';

interface ToneOptions {
  frequency: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  endFrequency?: number;
  delay?: number;
}

export class AudioEngine {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = true;
  private readonly voices = new Set<OscillatorNode>();
  private lastFootstepTick = -1;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) void this.context?.suspend();
    else if (this.context) void this.prime();
  }

  async prime(): Promise<void> {
    if (!this.enabled || typeof AudioContext === 'undefined') return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0.42;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch {
      // Audio is optional; autoplay/privacy failures must never break gameplay.
    }
  }

  play(events: readonly RunnerEvent[]): void {
    if (!this.enabled || !this.context || !this.master) return;
    for (const event of events) {
      if (event.type === 'lane-shifted') this.tone({ frequency: 180, endFrequency: 240, duration: 0.055, gain: 0.035 });
      else if (event.type === 'jump-started') this.tone({ frequency: 220, endFrequency: 520, duration: 0.14, gain: 0.055, type: 'triangle' });
      else if (event.type === 'slide-started') this.tone({ frequency: 150, endFrequency: 80, duration: 0.16, gain: 0.05, type: 'sawtooth' });
      else if (event.type === 'turn-queued') this.tone({ frequency: 420, duration: 0.06, gain: 0.04, type: 'square' });
      else if (event.type === 'turned') {
        this.tone({ frequency: 260, endFrequency: 390, duration: 0.12, gain: 0.055, type: 'triangle' });
        this.tone({ frequency: 520, duration: 0.08, gain: 0.028, delay: 0.05 });
      } else if (event.type === 'pickup-collected' && event.pickup === 'shard') this.tone({ frequency: 740, endFrequency: 980, duration: 0.08, gain: 0.04, type: 'sine' });
      else if (event.type === 'pickup-collected' && event.pickup === 'shield') this.tone({ frequency: 330, endFrequency: 660, duration: 0.24, gain: 0.06, type: 'triangle' });
      else if (event.type === 'shield-broken') this.tone({ frequency: 170, endFrequency: 70, duration: 0.3, gain: 0.075, type: 'sawtooth' });
      else if (event.type === 'run-failed') {
        this.tone({ frequency: 150, endFrequency: 44, duration: 0.72, gain: 0.09, type: 'sawtooth' });
        this.tone({ frequency: 220, endFrequency: 88, duration: 0.46, gain: 0.045, type: 'triangle', delay: 0.08 });
      }
    }
  }

  footstep(tick: number, speed: number): void {
    if (!this.enabled || !this.context || tick === this.lastFootstepTick) return;
    const period = Math.max(11, Math.round(18 - speed * 0.35));
    if (tick % period !== 0) return;
    this.lastFootstepTick = tick;
    this.tone({ frequency: tick % (period * 2) === 0 ? 92 : 108, duration: 0.045, gain: 0.025, type: 'triangle' });
  }

  suspend(): void {
    void this.context?.suspend();
  }

  destroy(): void {
    for (const voice of this.voices) {
      try { voice.stop(); } catch { /* already stopped */ }
      voice.disconnect();
    }
    this.voices.clear();
    this.master?.disconnect();
    this.master = null;
    const context = this.context;
    this.context = null;
    if (context && context.state !== 'closed') void context.close();
  }

  private tone(options: ToneOptions): void {
    const context = this.context;
    const master = this.master;
    if (!context || !master || this.voices.size >= 16) return;
    const start = context.currentTime + (options.delay ?? 0);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = options.type ?? 'sine';
    oscillator.frequency.setValueAtTime(options.frequency, start);
    if (options.endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.endFrequency), start + options.duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(options.gain, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + options.duration);
    oscillator.connect(gain);
    gain.connect(master);
    this.voices.add(oscillator);
    oscillator.addEventListener('ended', () => {
      this.voices.delete(oscillator);
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
    oscillator.start(start);
    oscillator.stop(start + options.duration + 0.02);
  }
}
