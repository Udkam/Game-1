// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from './GameRuntime';

const rendererSetOptions = vi.hoisted(() => vi.fn());
const inputClearHeld = vi.hoisted(() => vi.fn());
const inputHarness = vi.hoisted(() => ({ emit: null as ((action: string) => void) | null }));

vi.mock('../audio/AudioEngine', () => ({
  AudioEngine: class {
    setEnabled(): void {}
    async prime(): Promise<void> {}
    play(): void {}
    suspend(): void {}
    destroy(): void {}
  },
}));

vi.mock('../input/InputController', () => ({
  InputController: class {
    constructor(emit: (action: string) => void) { inputHarness.emit = emit; }
    press(action: string): void { inputHarness.emit?.(action); }
    release(): void {}
    step(): void {}
    clearHeld(): void { inputClearHeld(); }
    destroy(): void {}
  },
}));

vi.mock('../render/TetrisRenderer', () => ({
  TetrisRenderer: class {
    async init(): Promise<void> {}
    setOptions(options: unknown): void { rendererSetOptions(options); }
    setFrameCallback(): void {}
    render(): void {}
    destroy(): void {}
    getSnapshot(): Record<string, never> { return {}; }
    benchmark(): { meanMs: number; p95Ms: number; maxMs: number } {
      return { meanMs: 0, p95Ms: 0, maxMs: 0 };
    }
  },
}));

describe('GameRuntime public state boundary', () => {
  it('starts from a deterministic ready state without browser mounting', () => {
    const onState = vi.fn();
    const runtime = new GameRuntime({ seed: 123, onState });
    expect(runtime.getState().status).toBe('ready');
    expect(runtime.getState().queue).toHaveLength(5);
    expect(runtime.getState().active).not.toBeNull();
    expect(onState).not.toHaveBeenCalled();
  });

  it('gates public start, touch input, QA actions, and pause until input is enabled', async () => {
    const onState = vi.fn();
    const runtime = new GameRuntime({ seed: 123, onState, audioEnabled: false, inputEnabled: false });
    await runtime.mount(document.createElement('div'));
    onState.mockClear();
    inputClearHeld.mockClear();
    const ready = structuredClone(runtime.getState());

    runtime.start();
    runtime.press('left');
    runtime.togglePause();
    window.__SIGNAL_FOUNDRY_QA__?.action('hard-drop');
    window.__SIGNAL_FOUNDRY_QA__?.advanceTicks(180);

    expect(runtime.getState()).toEqual(ready);
    expect(onState).not.toHaveBeenCalled();
    expect(inputClearHeld).not.toHaveBeenCalled();

    runtime.setInputEnabled(true);
    expect(inputClearHeld).toHaveBeenCalledTimes(1);
    runtime.setInputEnabled(true);
    expect(inputClearHeld).toHaveBeenCalledTimes(1);
    runtime.start();

    expect(runtime.getState().status).toBe('playing');
    expect(onState).toHaveBeenCalledTimes(1);
    expect(onState.mock.calls[0]?.[1]).toEqual([{ type: 'started' }]);

    runtime.setInputEnabled(false);
    expect(inputClearHeld).toHaveBeenCalledTimes(2);
    runtime.destroy();
  });

  it('coalesces ordinary simulation ticks before publishing React-facing state', () => {
    const onState = vi.fn();
    const runtime = new GameRuntime({ seed: 123, onState, audioEnabled: false });
    runtime.start();
    expect(onState).toHaveBeenCalledTimes(1);
    onState.mockClear();

    const internals = runtime as unknown as {
      fixedStep: () => void;
      frame: (deltaMs: number) => void;
    };
    for (let tick = 0; tick < 5; tick += 1) internals.fixedStep();
    expect(onState).not.toHaveBeenCalled();

    internals.frame(99);
    expect(onState).not.toHaveBeenCalled();
    internals.frame(1);
    expect(onState).toHaveBeenCalledTimes(1);
    expect(onState.mock.calls[0]?.[0].elapsedTicks).toBeGreaterThanOrEqual(5);
  });

  it('selects a real authored Puzzle level only through the restart boundary', () => {
    const runtime = new GameRuntime({ seed: 123, audioEnabled: false });
    runtime.selectPuzzle('t3r-cascade-06');

    const state = runtime.getState();
    expect(state.status).toBe('ready');
    expect(state.mode).toBe('puzzle');
    expect(state.puzzleId).toBe('t3r-cascade-06');
    expect(state.puzzleQueue).toEqual(state.queue);
    expect(state.queue).toHaveLength(5);
    expect(state.puzzlePieceBudget).toBeNull();
    expect(state.puzzleCompletion).toBe('active');
  });

  it('updates reduced motion in place without rebuilding runtime state', () => {
    const runtime = new GameRuntime({ seed: 123, audioEnabled: false });
    const before = runtime.getState();
    rendererSetOptions.mockClear();

    runtime.setReducedMotion(true);

    expect(rendererSetOptions).toHaveBeenCalledWith({ reducedMotion: true });
    expect(runtime.getState()).toBe(before);
  });

  it('mounts a read-only QA state view without replay or state-replacement hooks', async () => {
    const runtime = new GameRuntime({ seed: 123, audioEnabled: false });
    await runtime.mount(document.createElement('div'));

    const qaSurface = window.__SIGNAL_FOUNDRY_QA__;
    expect(qaSurface).toBeDefined();
    expect(qaSurface).not.toHaveProperty('replayScenario');
    expect(qaSurface).not.toHaveProperty('setState');
    expect(qaSurface).not.toHaveProperty('replaceState');

    const exposedState = qaSurface!.getState();
    exposedState.status = 'finished';
    expect(runtime.getState().status).toBe('ready');

    runtime.destroy();
    expect(window.__SIGNAL_FOUNDRY_QA__).toBeUndefined();
  });
});
