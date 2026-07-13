import {
  FIXED_TICK_SECONDS,
  createInitialState,
  dispatch,
  hashState,
  type CommandResult,
  type RunnerCommand,
  type RunnerEvent,
  type RunnerState,
} from "../core";
import { AudioEngine } from "../audio/AudioEngine";
import { InputController, type RunnerAction } from "../input/InputController";
import {
  WorldRenderer,
  type RenderOptions,
  type RenderSnapshot,
} from "../render/WorldRenderer";
import {
  QA_SCENARIO_NAMES,
  createQaScenario,
  type QaScenarioName,
} from "./qaScenarios";

const DEFAULT_SEED = 0x54494445;
const FIXED_STEP_MS = FIXED_TICK_SECONDS * 1000;
const MAX_CATCH_UP_TICKS = 5;
const MAX_FRAME_DELTA_MS = 250;

export interface RuntimeOptions extends RenderOptions {
  readonly seed: number;
  readonly audioEnabled: boolean;
}

export interface RuntimeSnapshot {
  readonly state: RunnerState;
  readonly previousState: RunnerState;
  readonly events: readonly RunnerEvent[];
  readonly options: RuntimeOptions;
  readonly initialized: boolean;
  readonly frozen: boolean;
}

export interface SimulationQaSnapshot {
  readonly state: RunnerState;
  readonly previousState: RunnerState;
  readonly events: readonly RunnerEvent[];
  readonly hash: string;
  readonly frozen: boolean;
  readonly accumulatorMs: number;
}

export interface FrameBenchmark {
  readonly meanMs: number;
  readonly p95Ms: number;
  readonly maxMs: number;
}

export interface RuntimeRenderer {
  readonly canvas: HTMLCanvasElement | null;
  init(host: HTMLElement): Promise<void>;
  setOptions(options: Partial<RenderOptions>): void;
  render(
    previous: RunnerState,
    state: RunnerState,
    alpha: number,
    events: readonly RunnerEvent[],
    deltaMs: number,
  ): void;
  setTurnProgress(progress: number): void;
  clearTurnProgressOverride(): void;
  getSnapshot(): RenderSnapshot;
  benchmark(state: RunnerState, iterations?: number): FrameBenchmark;
  destroy(): void;
}

export interface RuntimeAudio {
  setEnabled(enabled: boolean): void;
  prime(): Promise<void>;
  play(events: readonly RunnerEvent[]): void;
  footstep(tick: number, speed: number): void;
  suspend(): void;
  destroy(): void;
}

export interface RuntimeInput {
  clear(): void;
  destroy(): void;
}

export interface RuntimeClock {
  now(): number;
  requestFrame(callback: FrameRequestCallback): number;
  cancelFrame(handle: number): void;
}

export interface RuntimeAdapters {
  readonly renderer: RuntimeRenderer;
  readonly audio: RuntimeAudio;
  readonly createInput: (
    emit: (action: RunnerAction) => void,
    canvas: HTMLElement | null,
    suspend: () => void,
  ) => RuntimeInput;
  readonly clock: RuntimeClock;
  readonly documentTarget: Document | null;
  readonly windowTarget: Window | null;
}

export interface TideRelayQaApi {
  readonly scenarioNames: readonly QaScenarioName[];
  setSeed(seed: number): SimulationQaSnapshot;
  loadScenario(name: QaScenarioName): SimulationQaSnapshot;
  freeze(frozen?: boolean): SimulationQaSnapshot;
  advanceTicks(count: number): SimulationQaSnapshot;
  setTurnProgress(progress: number | null): RenderSnapshot | null;
  getSimulationSnapshot(): SimulationQaSnapshot;
  getRenderSnapshot(): RenderSnapshot | null;
  benchmarkFrames(iterations?: number): FrameBenchmark | null;
}

declare global {
  interface Window {
    __TIDE_RELAY_QA__?: TideRelayQaApi;
  }
}

const defaultClock: RuntimeClock = {
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
};

function defaultAdapters(): RuntimeAdapters {
  const renderer = new WorldRenderer();
  const audio = new AudioEngine();
  const windowTarget = typeof window === "undefined" ? null : window;
  return {
    renderer,
    audio,
    createInput: (emit, canvas, suspend) =>
      new InputController(emit, windowTarget, canvas, suspend),
    clock: defaultClock,
    documentTarget: typeof document === "undefined" ? null : document,
    windowTarget,
  };
}

function mergeAdapters(overrides: Partial<RuntimeAdapters> | undefined): RuntimeAdapters {
  const defaults = defaultAdapters();
  return {
    renderer: overrides?.renderer ?? defaults.renderer,
    audio: overrides?.audio ?? defaults.audio,
    createInput: overrides?.createInput ?? defaults.createInput,
    clock: overrides?.clock ?? defaults.clock,
    documentTarget:
      overrides && "documentTarget" in overrides
        ? overrides.documentTarget ?? null
        : defaults.documentTarget,
    windowTarget:
      overrides && "windowTarget" in overrides
        ? overrides.windowTarget ?? null
        : defaults.windowTarget,
  };
}

export class GameRuntime {
  private readonly adapters: RuntimeAdapters;
  private options: RuntimeOptions;
  private state: RunnerState;
  private previousState: RunnerState;
  private lastEvents: readonly RunnerEvent[] = [];
  private pendingRenderEvents: RunnerEvent[] = [];
  private readonly listeners = new Set<(snapshot: RuntimeSnapshot) => void>();
  private input: RuntimeInput | null = null;
  private frameHandle: number | null = null;
  private lastFrameTime = 0;
  private accumulatorMs = 0;
  private initialized = false;
  private destroyed = false;
  private frozen = false;
  private initPromise: Promise<void> | null = null;
  private qaApi: TideRelayQaApi | null = null;
  private resourcesDestroyed = false;

  constructor(
    options: Partial<RuntimeOptions> = {},
    adapters?: Partial<RuntimeAdapters>,
  ) {
    this.options = {
      seed: options.seed ?? DEFAULT_SEED,
      audioEnabled: options.audioEnabled ?? true,
      reducedMotion: options.reducedMotion ?? false,
      highContrast: options.highContrast ?? false,
    };
    this.state = createInitialState(this.options.seed);
    this.options = { ...this.options, seed: this.state.seed };
    this.previousState = this.state;
    this.adapters = mergeAdapters(adapters);
    this.adapters.audio.setEnabled(this.options.audioEnabled);
    this.adapters.renderer.setOptions(this.options);
  }

  init(host: HTMLElement): Promise<void> {
    if (this.destroyed) {
      return Promise.reject(new Error("Cannot initialize a destroyed GameRuntime"));
    }
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.initialize(host);
    return this.initPromise;
  }

  subscribe(listener: (snapshot: RuntimeSnapshot) => void): () => void {
    if (this.destroyed) return () => undefined;
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): RuntimeSnapshot {
    return {
      state: this.state,
      previousState: this.previousState,
      events: this.lastEvents,
      options: { ...this.options },
      initialized: this.initialized,
      frozen: this.frozen,
    };
  }

  start(): void {
    if (this.destroyed) return;
    this.applyCommand({ type: "Start" });
    if (this.state.status === "running") void this.adapters.audio.prime();
  }

  action(action: RunnerAction): void {
    if (this.destroyed) return;
    switch (action) {
      case "left":
        this.applyCommand({ type: "StepLeft" });
        break;
      case "right":
        this.applyCommand({ type: "StepRight" });
        break;
      case "jump":
        this.applyCommand({ type: "Jump" });
        break;
      case "slide":
        this.applyCommand({ type: "Slide" });
        break;
      case "pause":
        this.togglePause();
        break;
      case "restart":
        this.restart();
        break;
    }
  }

  pause(): void {
    if (this.destroyed || this.state.status !== "running") return;
    this.applyCommand({ type: "Pause" });
    this.accumulatorMs = 0;
    this.input?.clear();
    this.adapters.audio.suspend();
  }

  resume(): void {
    if (this.destroyed || this.state.status !== "paused") return;
    this.applyCommand({ type: "Resume" });
    this.accumulatorMs = 0;
    this.lastFrameTime = this.adapters.clock.now();
    void this.adapters.audio.prime();
  }

  togglePause(): void {
    if (this.state.status === "running") this.pause();
    else if (this.state.status === "paused") this.resume();
  }

  restart(seed?: number): void {
    if (this.destroyed || this.state.status === "running") return;
    this.accumulatorMs = 0;
    this.input?.clear();
    const restarted = this.applyCommand({
      type: "Restart",
      ...(seed === undefined ? {} : { seed }),
    });
    this.options = { ...this.options, seed: this.state.seed };
    if (restarted) void this.adapters.audio.prime();
  }

  setOptions(options: Partial<RuntimeOptions>): void {
    if (this.destroyed) return;
    const requestedSeed = options.seed;
    this.options = { ...this.options, ...options };
    this.adapters.renderer.setOptions(this.options);
    this.adapters.audio.setEnabled(this.options.audioEnabled);
    if (
      requestedSeed !== undefined &&
      requestedSeed !== this.state.seed &&
      this.state.status === "ready"
    ) {
      this.replaceState(createInitialState(requestedSeed), [], true);
      this.options = { ...this.options, seed: this.state.seed };
    }
    this.notify();
  }

  primeAudio(): void {
    if (this.destroyed || !this.options.audioEnabled) return;
    void this.adapters.audio.prime();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.initialized = false;
    if (this.frameHandle !== null) {
      this.adapters.clock.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
    this.input?.destroy();
    this.input = null;
    this.adapters.documentTarget?.removeEventListener(
      "visibilitychange",
      this.onVisibilityChange,
    );
    this.uninstallQaApi();
    this.destroyResources();
    this.listeners.clear();
    this.pendingRenderEvents = [];
    this.accumulatorMs = 0;
  }

  private async initialize(host: HTMLElement): Promise<void> {
    try {
      await this.adapters.renderer.init(host);
      if (this.destroyed) {
        this.destroyResources();
        return;
      }
      this.adapters.renderer.setOptions(this.options);
      this.input = this.adapters.createInput(
        (action) => this.action(action),
        this.adapters.renderer.canvas,
        () => this.pause(),
      );
      this.adapters.documentTarget?.addEventListener(
        "visibilitychange",
        this.onVisibilityChange,
      );
      this.initialized = true;
      this.lastFrameTime = this.adapters.clock.now();
      this.forceRender(0);
      this.installQaApi();
      this.notify();
      this.scheduleFrame();
    } catch (error) {
      this.destroyed = true;
      this.destroyResources();
      throw error;
    }
  }

  private readonly onVisibilityChange = (): void => {
    if (this.adapters.documentTarget?.visibilityState === "hidden") this.pause();
  };

  private readonly onFrame = (timestamp: number): void => {
    this.frameHandle = null;
    if (this.destroyed || !this.initialized) return;
    const rawDelta = timestamp - this.lastFrameTime;
    const deltaMs = Number.isFinite(rawDelta)
      ? Math.min(MAX_FRAME_DELTA_MS, Math.max(0, rawDelta))
      : 0;
    this.lastFrameTime = timestamp;

    let changed = false;
    if (!this.frozen && this.state.status === "running") {
      this.accumulatorMs += deltaMs;
      let catchUpTicks = 0;
      while (
        this.accumulatorMs >= FIXED_STEP_MS &&
        catchUpTicks < MAX_CATCH_UP_TICKS &&
        this.state.status === "running"
      ) {
        const result = dispatch(this.state, { type: "Tick" });
        if (!result.accepted) break;
        this.acceptResult(result, false);
        this.accumulatorMs -= FIXED_STEP_MS;
        catchUpTicks += 1;
        changed = true;
      }
      if (catchUpTicks === MAX_CATCH_UP_TICKS && this.accumulatorMs >= FIXED_STEP_MS) {
        this.accumulatorMs %= FIXED_STEP_MS;
      }
    } else {
      this.accumulatorMs = 0;
    }

    const alpha = this.frozen
      ? 1
      : this.state.status === "running"
        ? Math.min(1, this.accumulatorMs / FIXED_STEP_MS)
        : 0;
    this.forceRender(deltaMs, alpha);
    if (changed) this.notify();
    this.scheduleFrame();
  };

  private scheduleFrame(): void {
    if (this.destroyed || !this.initialized || this.frameHandle !== null) return;
    this.frameHandle = this.adapters.clock.requestFrame(this.onFrame);
  }

  private applyCommand(command: RunnerCommand): boolean {
    const result = dispatch(this.state, command);
    if (!result.accepted) return false;
    this.acceptResult(result, true);
    return true;
  }

  private acceptResult(result: CommandResult, notify: boolean): void {
    this.previousState = this.state;
    this.state = result.state;
    this.lastEvents = [...result.events];
    this.pendingRenderEvents.push(...result.events);
    this.adapters.audio.play(result.events);
    if (
      this.state.status === "running" &&
      this.state.runner.grounded &&
      this.state.runner.slideTicksRemaining === 0
    ) {
      this.adapters.audio.footstep(this.state.tick, this.state.speed);
    }
    if (this.state.status !== "running") this.accumulatorMs = 0;
    if (notify) this.notify();
  }

  private replaceState(
    state: RunnerState,
    events: readonly RunnerEvent[],
    render: boolean,
    previousState = state,
  ): void {
    this.previousState = previousState;
    this.state = state;
    this.lastEvents = [...events];
    this.pendingRenderEvents = [...events];
    this.accumulatorMs = 0;
    this.input?.clear();
    if (render) this.forceRender(0, 1);
    this.notify();
  }

  private forceRender(deltaMs: number, alpha = 0): void {
    if (!this.initialized) return;
    const events = this.pendingRenderEvents;
    this.pendingRenderEvents = [];
    this.adapters.renderer.render(
      this.previousState,
      this.state,
      alpha,
      events,
      deltaMs,
    );
  }

  private notify(): void {
    if (this.destroyed) return;
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  private simulationQaSnapshot(): SimulationQaSnapshot {
    return {
      state: structuredClone(this.state),
      previousState: structuredClone(this.previousState),
      events: structuredClone(this.lastEvents),
      hash: hashState(this.state),
      frozen: this.frozen,
      accumulatorMs: this.accumulatorMs,
    };
  }

  private installQaApi(): void {
    const windowTarget = this.adapters.windowTarget;
    if (!windowTarget || !import.meta.env.DEV) return;
    const api: TideRelayQaApi = {
      scenarioNames: QA_SCENARIO_NAMES,
      setSeed: (seed) => {
        const state = createInitialState(seed);
        this.options = { ...this.options, seed: state.seed };
        this.frozen = true;
        this.replaceState(state, [], true);
        return this.simulationQaSnapshot();
      },
      loadScenario: (name) => {
        const scenario = createQaScenario(name, this.options.seed);
        this.frozen = true;
        this.replaceState(
          scenario.state,
          scenario.events,
          true,
          scenario.previousState,
        );
        return this.simulationQaSnapshot();
      },
      freeze: (frozen = true) => {
        this.frozen = frozen;
        this.accumulatorMs = 0;
        this.lastFrameTime = this.adapters.clock.now();
        this.forceRender(0, 1);
        this.notify();
        return this.simulationQaSnapshot();
      },
      advanceTicks: (count) => {
        if (!Number.isInteger(count) || count < 0 || count > 20_000) {
          throw new RangeError("advanceTicks count must be an integer between 0 and 20000");
        }
        for (let index = 0; index < count && this.state.status === "running"; index += 1) {
          const result = dispatch(this.state, { type: "Tick" });
          if (!result.accepted) break;
          this.acceptResult(result, false);
        }
        this.accumulatorMs = 0;
        this.forceRender(0, 1);
        this.notify();
        return this.simulationQaSnapshot();
      },
      setTurnProgress: (progress) => {
        if (progress === null) this.adapters.renderer.clearTurnProgressOverride();
        else {
          if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
            throw new RangeError("turn progress must be null or a finite number from 0 to 1");
          }
          this.adapters.renderer.setTurnProgress(progress);
        }
        this.forceRender(0, 1);
        return this.initialized ? this.adapters.renderer.getSnapshot() : null;
      },
      getSimulationSnapshot: () => this.simulationQaSnapshot(),
      getRenderSnapshot: () =>
        this.initialized ? this.adapters.renderer.getSnapshot() : null,
      benchmarkFrames: (iterations = 120) => {
        if (!this.initialized) return null;
        if (!Number.isInteger(iterations) || iterations < 1 || iterations > 600) {
          throw new RangeError("benchmark iterations must be an integer between 1 and 600");
        }
        return this.adapters.renderer.benchmark(this.state, iterations);
      },
    };
    this.qaApi = api;
    windowTarget.__TIDE_RELAY_QA__ = api;
  }

  private uninstallQaApi(): void {
    const windowTarget = this.adapters.windowTarget;
    if (windowTarget && windowTarget.__TIDE_RELAY_QA__ === this.qaApi) {
      delete windowTarget.__TIDE_RELAY_QA__;
    }
    this.qaApi = null;
  }

  private destroyResources(): void {
    if (this.resourcesDestroyed) return;
    this.resourcesDestroyed = true;
    this.adapters.audio.destroy();
    this.adapters.renderer.destroy();
  }
}
