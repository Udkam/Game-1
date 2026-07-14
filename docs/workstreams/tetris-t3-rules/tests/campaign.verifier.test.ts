import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as core from '../../../../src/game/core';
import type { GameCommand, GameEvent, GameState, PieceType } from '../../../../src/game/core';

type Level = {
  id: string;
  name: string;
  difficulty: number;
  boardRows: string[];
  queue: PieceType[];
  pieceBudget: number;
  expectedClearedLines: number;
  intendedMechanic: string;
};

type ReferenceReplay = {
  levelId: string;
  commands: GameCommand[];
  commandCount: number;
  lockedPieces: number;
  clearedLines: number;
  finalOccupiedCells: number;
  finalState: 'finished';
  currentEngineStateHash: string;
};

const seed = 0x73a30001;
const cellTypes = new Set<PieceType>(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
const campaign = JSON.parse(readFileSync(new URL('../levels.json', import.meta.url), 'utf8')) as { levels: Level[] };
const references = JSON.parse(readFileSync(new URL('../REFERENCE_REPLAYS.json', import.meta.url), 'utf8')) as { replays: ReferenceReplay[] };

function visibleOccupied(state: GameState): number {
  return state.board.slice(core.VISIBLE_START_ROW).flat().filter((cell) => cell !== null).length;
}

function validateLevel(level: Level): void {
  expect(level.id).toMatch(/^t3r-(shaft|well)-\d{2}$/);
  expect(level.name.length).toBeGreaterThan(0);
  expect(Number.isInteger(level.difficulty)).toBe(true);
  expect(level.boardRows).toHaveLength(20);
  for (const row of level.boardRows) {
    expect(row).toHaveLength(10);
    expect([...row].every((cell) => cell === '.' || cellTypes.has(cell as PieceType))).toBe(true);
  }
  expect(level.boardRows.join('').replaceAll('.', '').length).toBeGreaterThan(0);
  expect(level.queue.length).toBeGreaterThan(0);
  expect(level.queue.every((piece) => cellTypes.has(piece))).toBe(true);
  expect(Number.isInteger(level.pieceBudget)).toBe(true);
  expect(level.pieceBudget).toBeGreaterThan(0);
  expect(level.pieceBudget).toBeLessThanOrEqual(level.queue.length);
  expect(level.expectedClearedLines).toBeGreaterThan(0);
}

/**
 * This is an initialization adapter, not a gameplay mutation. Once it returns,
 * runReplay uses only core.dispatch public commands and observes core output.
 */
function authoredInitial(level: Level): GameState {
  validateLevel(level);
  const base = core.createInitialState(seed, 'puzzle', 'offset-01');
  const board = core.createBoard();
  for (let y = 0; y < level.boardRows.length; y += 1) {
    for (let x = 0; x < level.boardRows[y]!.length; x += 1) {
      const cell = level.boardRows[y]![x]!;
      if (cell !== '.') board[core.VISIBLE_START_ROW + y]![x] = cell as PieceType;
    }
  }
  const [first, ...queue] = level.queue;
  if (!first) throw new Error(`Level ${level.id} has an empty queue.`);
  const active = core.createSpawnPiece(first);
  if (!core.canPlace(board, active)) throw new Error(`Level ${level.id} has an invalid spawn / top-out board.`);
  return {
    ...base,
    board,
    active,
    queue,
    mode: 'puzzle',
    // Existing core only accepts these legacy fields. expectedClearedLines is
    // adapter compatibility metadata; the oracle below still rejects residual
    // cells rather than treating this line count as a goal.
    puzzleId: 'offset-01',
    puzzleTargetLines: level.expectedClearedLines,
    puzzlePieceBudget: level.pieceBudget,
    pieceCount: 0,
    status: 'ready',
    phase: 'active',
    phaseTicks: 0,
    pendingClearRows: [],
    gravityTicks: 0,
    lockTicks: 0,
    lockResets: 0,
    elapsedTicks: 0,
  };
}

function proposedOutcome(state: GameState, events: readonly GameEvent[], level: Level): 'playing' | 'finished' | 'failed-top-out' | 'failed-budget' | 'residual-finish' {
  const topOut = events.some((event) => event.type === 'game-over' && (event.reason === 'block-out' || event.reason === 'lock-out' || event.reason === 'invalid-state'));
  if (topOut) return 'failed-top-out';
  if (visibleOccupied(state) === 0) return 'finished';
  if (state.status === 'finished') return 'residual-finish';
  if (state.status === 'game-over' || state.pieceCount >= level.pieceBudget) return 'failed-budget';
  return 'playing';
}

function runReplay(level: Level, commands: readonly GameCommand[]) {
  let state = authoredInitial(level);
  let locks = 0;
  let clearedLines = 0;
  let outcome: ReturnType<typeof proposedOutcome> = 'playing';
  for (const command of commands) {
    const transition = core.dispatch(state, command);
    state = transition.state;
    locks += transition.events.filter((event) => event.type === 'piece-locked').length;
    clearedLines += transition.events.filter((event) => event.type === 'lines-cleared').reduce((total, event) => total + event.count, 0);
    outcome = proposedOutcome(state, transition.events, level);
  }
  return { state, locks, clearedLines, outcome, occupied: visibleOccupied(state) };
}

function levelFor(reference: ReferenceReplay): Level {
  const level = campaign.levels.find((candidate) => candidate.id === reference.levelId);
  if (!level) throw new Error(`Missing level for ${reference.levelId}.`);
  return level;
}

describe('TETRIS-T3R six-level canonical campaign verifier', () => {
  it('validates six unique, non-empty authored boards before replay', () => {
    expect(campaign.levels).toHaveLength(6);
    expect(new Set(campaign.levels.map((level) => level.id)).size).toBe(6);
    expect(new Set(campaign.levels.map((level) => level.boardRows.join('\n'))).size).toBe(6);
    campaign.levels.forEach(validateLevel);
  });

  it.each(references.replays)('$levelId reaches empty-board completion through public commands', (reference) => {
    const result = runReplay(levelFor(reference), reference.commands);
    expect(reference.commands).toHaveLength(reference.commandCount);
    expect(result.locks).toBe(reference.lockedPieces);
    expect(result.locks).toBeGreaterThanOrEqual(3);
    expect(result.clearedLines).toBe(reference.clearedLines);
    expect(result.occupied).toBe(0);
    expect(result.outcome).toBe(reference.finalState);
    expect(result.state.status).toBe('finished');
    expect(core.stateHash(result.state)).toBe(reference.currentEngineStateHash);
    expect(reference.commands.some((command) => command.type === 'move' || command.type === 'rotate')).toBe(true);
  });

  it('rejects an initially empty fake level', () => {
    const fake = { ...campaign.levels[0]!, boardRows: Array.from({ length: 20 }, () => '..........') };
    expect(() => authoredInitial(fake)).toThrow();
  });

  it('rejects a replay when its queue is changed', () => {
    const reference = references.replays[0]!;
    const level = levelFor(reference);
    const mismatch = { ...level, queue: ['O', 'I', 'I'] as PieceType[] };
    const result = runReplay(mismatch, reference.commands);
    expect(core.stateHash(result.state)).not.toBe(reference.currentEngineStateHash);
  });

  it('rejects an invalid spawn / top-out board', () => {
    const level = campaign.levels[0]!;
    const rows = [...level.boardRows];
    rows[0] = '...J......';
    expect(() => authoredInitial({ ...level, boardRows: rows })).toThrow(/invalid spawn \/ top-out/);
  });

  it('rejects exhausted budget while visible cells remain', () => {
    const rows = Array.from({ length: 20 }, () => '..........');
    rows[19] = 'J.........';
    const level: Level = { ...campaign.levels[0]!, id: 't3r-shaft-99', boardRows: rows, queue: ['I'], pieceBudget: 1, expectedClearedLines: 1 };
    const result = runReplay(level, [{ type: 'start' }, { type: 'hard-drop' }]);
    expect(result.occupied).toBeGreaterThan(0);
    expect(result.outcome).toBe('failed-budget');
  });

  it('rejects a stale final hash', () => {
    const reference = { ...references.replays[0]!, currentEngineStateHash: '00000000' };
    const result = runReplay(levelFor(reference), reference.commands);
    expect(core.stateHash(result.state)).not.toBe(reference.currentEngineStateHash);
  });

  it('rejects legacy line-target completion with residual cells', () => {
    const rows = Array.from({ length: 20 }, () => '..........');
    rows[18] = '.........J';
    rows[19] = '....JJJJJJ';
    const level: Level = { ...campaign.levels[0]!, id: 't3r-shaft-98', boardRows: rows, queue: ['I'], pieceBudget: 1, expectedClearedLines: 1 };
    const result = runReplay(level, [{ type: 'start' }, { type: 'move', dx: -1 }, { type: 'move', dx: -1 }, { type: 'move', dx: -1 }, { type: 'hard-drop' }]);
    expect(result.state.status).toBe('finished');
    expect(result.occupied).toBeGreaterThan(0);
    expect(result.outcome).toBe('residual-finish');
  });
});
