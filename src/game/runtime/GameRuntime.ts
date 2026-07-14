import { AudioEngine } from '../audio/AudioEngine';
import { createInitialState, dispatch, stateHash, type GameCommand, type GameEvent, type GameMode, type GameState, type PuzzleId } from '../core';
import { InputController, type InputAction } from '../input/InputController';
import { TetrisRenderer, type RendererSnapshot } from '../render/TetrisRenderer';
import { replayPuzzleRotation, replayRaceCompletion } from './qaScenario';

const FIXED_STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 5;
const UI_SYNC_INTERVAL_MS = 100;

export interface RuntimeOptions {
  seed?: number;
  mode?: GameMode;
  puzzleId?: PuzzleId;
  reducedMotion?: boolean;
  audioEnabled?: boolean;
  onState?: (state: GameState, events: readonly GameEvent[]) => void;
}

export interface RuntimeQaSurface {
  getState: () => GameState;
  getRendererSnapshot: () => RendererSnapshot;
  start: () => void;
  selectMode: (mode: GameMode) => void;
  selectPuzzle: (puzzleId: PuzzleId) => void;
  restart: () => void;
  action: (action: InputAction) => void;
  release: (action: InputAction) => void;
  advanceTicks: (ticks: number) => void;
  replayScenario: (name: 'race-completion' | 'puzzle-rotation') => { commandCount: number; hash: string; commands: readonly GameCommand[] };
  setFrozen: (frozen: boolean) => void;
  benchmarkRender: (iterations?: number) => { meanMs: number; p95Ms: number; maxMs: number };
}

declare global {
  interface Window {
    __SIGNAL_FOUNDRY_QA__?: RuntimeQaSurface;
  }
}

export class GameRuntime {
  private state: GameState;
  private readonly renderer = new TetrisRenderer();
  private readonly audio = new AudioEngine();
  private input: InputController | null = null;
  private accumulator = 0;
  private pendingEvents: GameEvent[] = [];
  private pendingUiEvents: GameEvent[] = [];
  private uiSyncElapsedMs = 0;
  private uiStateDirty = false;
  private destroyed = false;
  private qaFrozen = false;
  private readonly onState?: RuntimeOptions['onState'];

  constructor(private readonly options: RuntimeOptions = {}) {
    this.state = createInitialState(options.seed, options.mode, options.puzzleId);
    this.onState = options.onState;
    this.audio.setEnabled(options.audioEnabled ?? true);
  }

  async mount(host: HTMLElement): Promise<void> {
    await this.renderer.init(host);
    if (this.destroyed) {
      this.renderer.destroy();
      return;
    }
    this.renderer.setOptions({
      reducedMotion: this.options.reducedMotion ?? false,
    });
    this.renderer.setFrameCallback(this.frame);
    this.input = new InputController((action) => this.handleAction(action, true), window, this.onWindowBlur);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.onState?.(this.state, []);
    this.renderer.render(this.state, [], 0);

    if (import.meta.env.DEV) {
      window.__SIGNAL_FOUNDRY_QA__ = {
        getState: () => structuredClone(this.state),
        getRendererSnapshot: () => this.renderer.getSnapshot(),
        start: () => this.start(),
        selectMode: (mode) => this.selectMode(mode),
        selectPuzzle: (puzzleId) => this.selectPuzzle(puzzleId),
        restart: () => this.restart(),
        action: (action) => this.handleAction(action, false),
        release: (action) => this.input?.release(action),
        advanceTicks: (ticks) => {
          for (let index = 0; index < ticks; index += 1) this.fixedStep();
          this.flushUiState();
          this.flushRender(0);
        },
        replayScenario: (name) => {
          const scenario = name === 'race-completion'
            ? replayRaceCompletion(this.state.seed)
            : replayPuzzleRotation(this.state.seed);
          this.state = scenario.state;
          this.accumulator = 0;
          this.pendingEvents = [];
          this.pendingUiEvents = [];
          this.uiStateDirty = false;
          this.uiSyncElapsedMs = 0;
          this.input?.clearHeld();
          this.onState?.(this.state, []);
          this.renderer.render(this.state, [], 0);
          return { commandCount: scenario.commands.length, hash: stateHash(this.state), commands: scenario.commands };
        },
        setFrozen: (frozen) => {
          this.qaFrozen = frozen;
          this.accumulator = 0;
        },
        benchmarkRender: (iterations) => this.renderer.benchmark(this.state, iterations),
      };
    }
  }

  press(action: InputAction): void {
    this.input?.press(action);
  }

  start(): void {
    void this.audio.prime();
    this.apply({ type: 'start' });
  }

  togglePause(): void {
    this.handleAction('pause', true);
  }

  restart(seed = this.state.seed, mode = this.state.mode, puzzleId = this.state.puzzleId ?? undefined): void {
    void this.audio.prime();
    this.apply({ type: 'restart', seed, mode, puzzleId });
    this.input?.clearHeld();
  }

  selectMode(mode: GameMode): void {
    if (this.state.status !== 'ready' && this.state.status !== 'game-over' && this.state.status !== 'finished') return;
    this.apply({ type: 'restart', seed: this.state.seed, mode });
    this.input?.clearHeld();
  }

  /** Selects a validated authored Puzzle level through the public restart command. */
  selectPuzzle(puzzleId: PuzzleId): void {
    if (this.state.status !== 'ready' && this.state.status !== 'game-over' && this.state.status !== 'finished') return;
    this.apply({ type: 'restart', seed: this.state.seed, mode: 'puzzle', puzzleId });
    this.input?.clearHeld();
  }

  setModeSwitch(open: boolean): void {
    this.renderer.setOptions({ modeSwitch: open });
    this.flushRender(0);
  }

  release(action: InputAction): void {
    this.input?.release(action);
  }

  setAudioEnabled(enabled: boolean): void {
    this.audio.setEnabled(enabled);
    if (enabled) void this.audio.prime();
  }

  getState(): GameState {
    return this.state;
  }

  getRendererSnapshot(): RendererSnapshot {
    return this.renderer.getSnapshot();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.input?.destroy();
    this.input = null;
    this.renderer.destroy();
    this.audio.destroy();
    this.pendingEvents = [];
    this.pendingUiEvents = [];
    delete window.__SIGNAL_FOUNDRY_QA__;
  }

  private readonly frame = (deltaMs: number): void => {
    if (this.destroyed) return;
    if (this.qaFrozen) {
      this.flushRender(deltaMs);
      return;
    }
    this.accumulator += deltaMs;
    this.uiSyncElapsedMs += deltaMs;
    let steps = 0;
    while (this.accumulator >= FIXED_STEP_MS && steps < MAX_STEPS_PER_FRAME) {
      this.fixedStep();
      this.accumulator -= FIXED_STEP_MS;
      steps += 1;
    }
    if (this.uiStateDirty && this.uiSyncElapsedMs >= UI_SYNC_INTERVAL_MS) this.flushUiState();
    this.flushRender(deltaMs);
  };

  private fixedStep(): void {
    this.input?.step();
    this.apply({ type: 'tick' });
  }

  private flushRender(deltaMs: number): void {
    const events = this.pendingEvents;
    this.pendingEvents = [];
    this.renderer.render(this.state, events, deltaMs);
  }

  private apply(command: GameCommand): void {
    const transition = dispatch(this.state, command);
    if (transition.state === this.state && transition.events.length === 0) return;
    this.state = transition.state;
    this.pendingEvents.push(...transition.events);
    this.pendingUiEvents.push(...transition.events);
    this.uiStateDirty = true;
    this.audio.play(transition.events);
    if (transition.events.some(isImmediateUiEvent)) this.flushUiState();
  }

  private flushUiState(): void {
    if (!this.uiStateDirty) return;
    const events = this.pendingUiEvents;
    this.pendingUiEvents = [];
    this.uiStateDirty = false;
    this.uiSyncElapsedMs = 0;
    this.onState?.(this.state, events);
  }

  private readonly handleAction = (action: InputAction, shouldPrimeAudio: boolean): void => {
    if (shouldPrimeAudio) void this.audio.prime();
    if (action === 'pause') {
      if (this.state.status === 'paused') this.apply({ type: 'resume' });
      else if (this.state.status === 'playing') this.apply({ type: 'pause' });
      this.input?.clearHeld();
      return;
    }
    if (action === 'restart') {
      if (this.state.status === 'game-over' || this.state.status === 'finished' || this.state.status === 'paused' || this.state.status === 'ready') {
        this.apply({ type: 'restart', seed: this.state.seed });
        this.input?.clearHeld();
      }
      return;
    }
    if (this.state.status === 'ready') this.apply({ type: 'start' });
    if (this.state.status !== 'playing') return;

    const command: Record<Exclude<InputAction, 'pause' | 'restart'>, GameCommand> = {
      left: { type: 'move', dx: -1 },
      right: { type: 'move', dx: 1 },
      'soft-drop': { type: 'soft-drop' },
      'hard-drop': { type: 'hard-drop' },
      'rotate-cw': { type: 'rotate', direction: 1 },
      'rotate-ccw': { type: 'rotate', direction: -1 },
    };
    this.apply(command[action]);
  };

  private readonly onVisibilityChange = (): void => {
    if (document.hidden && this.state.status === 'playing') {
      this.apply({ type: 'pause' });
      this.input?.clearHeld();
      this.audio.suspend();
    }
  };

  private readonly onWindowBlur = (): void => {
    if (this.state.status !== 'playing') return;
    this.apply({ type: 'pause' });
    this.audio.suspend();
  };
}

function isImmediateUiEvent(event: GameEvent): boolean {
  return event.type === 'started'
    || event.type === 'restarted'
    || event.type === 'paused'
    || event.type === 'resumed'
    || event.type === 'clear-started'
    || event.type === 'lines-cleared'
    || event.type === 'level-up'
    || event.type === 'finished'
    || event.type === 'game-over';
}
