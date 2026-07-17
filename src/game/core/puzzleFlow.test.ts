import { describe, expect, it } from 'vitest';
import { ENTRY_DELAY_TICKS, LOCK_DELAY_TICKS } from './constants';
import { createInitialState, dispatch } from './engine';
import type { GameState, PieceType } from './types';

function advance(state: GameState, ticks: number): GameState {
  let next = state;
  for (let index = 0; index < ticks; index += 1) next = dispatch(next, { type: 'tick' }).state;
  return next;
}

function resolveToActive(state: GameState): GameState {
  let next = state;
  for (let guard = 0; next.status === 'playing' && (!next.active || next.phase !== 'active') && guard < 64; guard += 1) {
    next = dispatch(next, { type: 'tick' }).state;
  }
  return next;
}

describe('T5 Puzzle ordinary consecutive-piece flow', () => {
  it('applies automatic gravity, shared grounded lock delay, and ordinary entry', () => {
    let state = dispatch(createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
    const spawnY = state.active!.y;
    state = advance(state, 48);
    expect(state.active?.y).toBe(spawnY + 1);

    while (true) {
      const beforeY = state.active?.y;
      const moved = dispatch(state, { type: 'soft-drop' }).state;
      if (moved.active?.y === beforeY) break;
      state = moved;
    }

    const expectedNext = state.queue[0];
    state = advance(state, LOCK_DELAY_TICKS - 1);
    expect(state.pieceCount).toBe(0);
    expect(state.active).not.toBeNull();

    state = advance(state, 1);
    expect(state.pieceCount).toBe(1);
    expect(state.active).toBeNull();
    expect(['entry', 'line-clear']).toContain(state.phase);

    const phaseAtLock = state.phase;
    state = resolveToActive(state);
    expect(state.status).toBe('playing');
    expect(state.active?.type).toBe(expectedNext);
    expect(state.queue).toHaveLength(5);
    expect(state.puzzleQueue).toEqual(state.queue);
    expect(state.puzzleQueueIndex).toBe(0);
    if (phaseAtLock === 'entry') expect(state.elapsedTicks).toBeGreaterThanOrEqual(48 + LOCK_DELAY_TICKS + ENTRY_DELAY_TICKS);
  });

  it('keeps replenishing after multiple public hard-drop locks without a queue or budget stop', () => {
    let state = dispatch(createInitialState(1, 'puzzle', 't5r-horizon-15'), { type: 'start' }).state;
    const lockedTypes: PieceType[] = [];

    for (let lock = 0; lock < 3; lock += 1) {
      expect(state.status).toBe('playing');
      expect(state.active).not.toBeNull();
      lockedTypes.push(state.active!.type);
      state = dispatch(state, { type: 'hard-drop' }).state;
      state = resolveToActive(state);
    }

    expect(lockedTypes).toHaveLength(3);
    expect(state.pieceCount).toBe(3);
    expect(state.status).toBe('playing');
    expect(state.active).not.toBeNull();
    expect(state.queue).toHaveLength(5);
    expect(state.puzzlePieceBudget).toBeNull();
    expect(state.puzzleCompletion).toBe('active');
  });
});
