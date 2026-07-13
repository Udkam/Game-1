import { describe, expect, it, vi } from "vitest";
import type { RunnerEvent, RunnerState } from "../core";
import type { RunnerAction } from "../input/InputController";
import type { RenderOptions, RenderSnapshot } from "../render/WorldRenderer";
import {
  GameRuntime,
  type RuntimeAdapters,
  type RuntimeAudio,
  type RuntimeClock,
  type RuntimeInput,
  type RuntimeRenderer,
} from "./GameRuntime";

class ManualClock implements RuntimeClock {
  private nextId = 1;
  private callbacks = new Map<number, FrameRequestCallback>();
  time = 0;

  now(): number {
    return this.time;
  }

  requestFrame(callback: FrameRequestCallback): number {
    const id = this.nextId++;
    this.callbacks.set(id, callback);
    return id;
  }

  cancelFrame(handle: number): void {
    this.callbacks.delete(handle);
  }

  step(time: number): void {
    this.time = time;
    const callbacks = [...this.callbacks.values()];
    this.callbacks.clear();
    for (const callback of callbacks) callback(time);
  }

  get pending(): number {
    return this.callbacks.size;
  }
}

class FakeRenderer implements RuntimeRenderer {
  readonly canvas = null;
  initCount = 0;
  destroyCount = 0;
  options: Partial<RenderOptions> = {};
  renders: Array<{
    previous: RunnerState;
    state: RunnerState;
    alpha: number;
    events: readonly RunnerEvent[];
    deltaMs: number;
  }> = [];
  turnProgress: number | null = null;

  async init(): Promise<void> {
    this.initCount += 1;
  }

  setOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
  }

  render(
    previous: RunnerState,
    state: RunnerState,
    alpha: number,
    events: readonly RunnerEvent[],
    deltaMs: number,
  ): void {
    this.renders.push({ previous, state, alpha, events: [...events], deltaMs });
  }

  setTurnProgress(progress: number): void {
    this.turnProgress = progress;
  }

  clearTurnProgressOverride(): void {
    this.turnProgress = null;
  }

  getSnapshot(): RenderSnapshot {
    const state = this.renders.at(-1)?.state;
    const alpha = this.renders.at(-1)?.alpha ?? 1;
    return {
      canvas: { width: 1440, height: 900, resolution: 1 },
      options: { highContrast: false, reducedMotion: false },
      presentationAlpha: alpha,
      presentedDistance: state?.distance ?? 0,
      presentedLanePosition: state?.runner.lanePosition ?? 0,
      runnerWorld: { x: 0, y: state?.runner.height ?? 0, z: 0, yaw: 0 },
      runnerScreen: { x: 720, y: 612, visible: true },
      camera: { x: 0, y: 4, z: 7, fov: 47, yaw: 0 },
      lanePosition: state?.runner.lanePosition ?? 0,
      posture: state?.runner.slideTicksRemaining
        ? "slide"
        : state?.runner.grounded === false
          ? "jump"
          : "run",
      visibleSectionIds: state ? [state.course.sections[0]?.id ?? ""] : [],
      visibleObstacleCount: 0,
      drawCalls: 12,
      triangles: 2_000,
      turnProgress: this.turnProgress,
      contextLossCount: 0,
    };
  }

  benchmark(_state: RunnerState, iterations = 120) {
    return { meanMs: iterations / 1_000, p95Ms: 0.3, maxMs: 0.5 };
  }

  destroy(): void {
    this.destroyCount += 1;
  }
}

class FakeAudio implements RuntimeAudio {
  enabled = true;
  primeCount = 0;
  suspendCount = 0;
  destroyCount = 0;
  played: RunnerEvent[][] = [];

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  async prime(): Promise<void> {
    this.primeCount += 1;
  }

  play(events: readonly RunnerEvent[]): void {
    this.played.push([...events]);
  }

  footstep(): void {}

  suspend(): void {
    this.suspendCount += 1;
  }

  destroy(): void {
    this.destroyCount += 1;
  }
}

class FakeInput implements RuntimeInput {
  clearCount = 0;
  destroyCount = 0;

  clear(): void {
    this.clearCount += 1;
  }

  destroy(): void {
    this.destroyCount += 1;
  }
}

class FakeDocument extends EventTarget {
  visibilityState: DocumentVisibilityState = "visible";

  hide(): void {
    this.visibilityState = "hidden";
    this.dispatchEvent(new Event("visibilitychange"));
  }
}

function createHarness(): {
  runtime: GameRuntime;
  renderer: FakeRenderer;
  audio: FakeAudio;
  input: FakeInput;
  clock: ManualClock;
  documentTarget: FakeDocument;
  windowTarget: Window;
  emitAction: (action: RunnerAction) => void;
  suspend: () => void;
} {
  const renderer = new FakeRenderer();
  const audio = new FakeAudio();
  const input = new FakeInput();
  const clock = new ManualClock();
  const documentTarget = new FakeDocument();
  const windowTarget = {} as Window;
  let emitAction = (_action: RunnerAction): void => undefined;
  let suspend = (): void => undefined;
  const adapters: Partial<RuntimeAdapters> = {
    renderer,
    audio,
    clock,
    documentTarget: documentTarget as unknown as Document,
    windowTarget,
    createInput: (emit, _canvas, onSuspend) => {
      emitAction = emit;
      suspend = onSuspend;
      return input;
    },
  };
  const runtime = new GameRuntime({ seed: 0x1234 }, adapters);
  return {
    runtime,
    renderer,
    audio,
    input,
    clock,
    documentTarget,
    windowTarget,
    get emitAction() {
      return emitAction;
    },
    get suspend() {
      return suspend;
    },
  };
}

describe("GameRuntime", () => {
  it("initializes once, publishes snapshots, and disposes each owned adapter once", async () => {
    const harness = createHarness();
    const listener = vi.fn();
    const unsubscribe = harness.runtime.subscribe(listener);
    const firstInit = harness.runtime.init({} as HTMLElement);
    const secondInit = harness.runtime.init({} as HTMLElement);
    expect(firstInit).toBe(secondInit);
    await firstInit;

    expect(harness.renderer.initCount).toBe(1);
    expect(harness.renderer.renders).toHaveLength(1);
    expect(listener).toHaveBeenCalled();
    expect(harness.clock.pending).toBe(1);

    unsubscribe();
    harness.runtime.destroy();
    harness.runtime.destroy();
    expect(harness.input.destroyCount).toBe(1);
    expect(harness.audio.destroyCount).toBe(1);
    expect(harness.renderer.destroyCount).toBe(1);
    expect(harness.clock.pending).toBe(0);
  });

  it("advances at 60 Hz and drops excess backlog after five catch-up ticks", async () => {
    const harness = createHarness();
    await harness.runtime.init({} as HTMLElement);
    harness.runtime.start();

    harness.clock.step(1_000);
    expect(harness.runtime.getSnapshot().state.tick).toBe(5);
    expect(harness.renderer.renders.at(-1)?.alpha).toBeGreaterThanOrEqual(0);
    expect(harness.renderer.renders.at(-1)?.alpha).toBeLessThan(1);

    harness.clock.step(1_000 + 1000 / 60 + 0.01);
    expect(harness.runtime.getSnapshot().state.tick).toBe(6);
    harness.runtime.destroy();
  });

  it("maps input, freezes paused state, and does not auto-resume after hiding", async () => {
    const harness = createHarness();
    await harness.runtime.init({} as HTMLElement);
    harness.runtime.start();
    harness.emitAction("right");
    expect(harness.runtime.getSnapshot().state.runner.targetLane).toBe(1);

    harness.documentTarget.hide();
    expect(harness.runtime.getSnapshot().state.status).toBe("paused");
    const pausedHash = harness.windowTarget.__TIDE_RELAY_QA__?.getSimulationSnapshot().hash;
    harness.clock.step(400);
    expect(harness.windowTarget.__TIDE_RELAY_QA__?.getSimulationSnapshot().hash).toBe(pausedHash);
    expect(harness.audio.suspendCount).toBe(1);
    expect(harness.input.clearCount).toBeGreaterThan(0);
    harness.runtime.destroy();
  });

  it("exposes deterministic dev QA scenarios, turn control, and bounded benchmarks", async () => {
    const first = createHarness();
    const second = createHarness();
    await first.runtime.init({} as HTMLElement);
    await second.runtime.init({} as HTMLElement);
    const firstQa = first.windowTarget.__TIDE_RELAY_QA__;
    const secondQa = second.windowTarget.__TIDE_RELAY_QA__;
    expect(firstQa).toBeDefined();
    expect(secondQa).toBeDefined();

    const firstJump = firstQa?.loadScenario("jump-apex");
    const secondJump = secondQa?.loadScenario("jump-apex");
    expect(firstJump?.hash).toBe(secondJump?.hash);
    expect(firstJump?.state.runner.grounded).toBe(false);
    expect(firstJump?.state.runner.height).toBeGreaterThan(0);
    first.clock.step(16);
    expect(first.renderer.renders.at(-1)?.alpha).toBe(1);

    firstQa?.loadScenario("turn-mid");
    const turn = firstQa?.setTurnProgress(0.5);
    expect(turn?.turnProgress).toBe(0.5);
    expect(firstQa?.benchmarkFrames(20)?.p95Ms).toBe(0.3);
    expect(() => firstQa?.advanceTicks(-1)).toThrow(RangeError);

    first.runtime.destroy();
    second.runtime.destroy();
    expect(first.windowTarget.__TIDE_RELAY_QA__).toBeUndefined();
  });

  it("routes blur suspension through the same safe pause path", async () => {
    const harness = createHarness();
    await harness.runtime.init({} as HTMLElement);
    harness.runtime.start();
    harness.suspend();
    expect(harness.runtime.getSnapshot().state.status).toBe("paused");
    harness.suspend();
    expect(harness.audio.suspendCount).toBe(1);
    harness.runtime.destroy();
  });
});
