import { describe, expect, it, vi } from 'vitest';
import { GameRuntime } from './GameRuntime';

describe('GameRuntime public state boundary', () => {
  it('starts from a deterministic ready state without browser mounting', () => {
    const onState = vi.fn();
    const runtime = new GameRuntime({ seed: 123, onState });
    expect(runtime.getState().status).toBe('ready');
    expect(runtime.getState().queue).toHaveLength(5);
    expect(runtime.getState().active).not.toBeNull();
    expect(onState).not.toHaveBeenCalled();
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
    expect(state.puzzleQueue).toEqual(['I', 'I', 'O', 'I', 'O']);
    expect(state.puzzleCompletion).toBe('active');
  });
});
