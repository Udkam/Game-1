import type { AudioCue } from "../animation/transitions";

export interface AudioPlayback {
  readonly kind: AudioCue["kind"];
  readonly volume: number;
  readonly atMs: number;
}

export class AudioManager {
  private readonly playbackLog: AudioPlayback[] = [];

  get recentPlayback(): readonly AudioPlayback[] {
    return this.playbackLog;
  }

  play(cue: AudioCue) {
    this.playbackLog.push({
      kind: cue.kind,
      volume: cue.volume,
      atMs: performance.now(),
    });
  }

  playAll(cues: readonly AudioCue[]) {
    for (const cue of cues) {
      this.play(cue);
    }
  }

  clear() {
    this.playbackLog.length = 0;
  }
}
