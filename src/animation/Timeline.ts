import { clamp01, easeInOutCubic } from "./easing";

export type TimelineDirection = "forward" | "reverse";

export interface TimelineSnapshot {
  readonly direction: TimelineDirection;
  readonly rawProgress: number;
  readonly easedProgress: number;
  readonly running: boolean;
  readonly complete: boolean;
}

export class Timeline {
  private durationMs: number;
  private direction: TimelineDirection = "forward";
  private progress = 0;
  private running = false;

  constructor(durationMs: number) {
    this.durationMs = Math.max(1, durationMs);
  }

  get snapshot(): TimelineSnapshot {
    return {
      direction: this.direction,
      rawProgress: this.progress,
      easedProgress: easeInOutCubic(this.progress),
      running: this.running,
      complete: !this.running && (this.progress === 0 || this.progress === 1),
    };
  }

  start(direction: TimelineDirection, durationMs = this.durationMs, fromProgress = direction === "forward" ? 0 : 1) {
    this.direction = direction;
    this.durationMs = Math.max(1, durationMs);
    this.progress = clamp01(fromProgress);
    this.running = true;
    return this.snapshot;
  }

  cancel() {
    this.running = false;
    return this.snapshot;
  }

  step(deltaMs: number) {
    if (!this.running) {
      return this.snapshot;
    }

    const delta = Math.max(0, deltaMs) / this.durationMs;
    this.progress = clamp01(this.progress + (this.direction === "forward" ? delta : -delta));

    if (this.progress === 0 || this.progress === 1) {
      this.running = false;
    }

    return this.snapshot;
  }
}
