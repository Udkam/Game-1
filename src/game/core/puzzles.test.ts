import { describe, expect, it } from 'vitest';
import accepted from '../../../docs/workstreams/tetris-t3-rules/levels.json';
import { createInitialState, dispatch, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, getPuzzleDefinition, validatePuzzleDefinition, type PuzzleDefinition } from './puzzles';
import type { PieceType, PuzzleId } from './types';

type AcceptedLevel = {
  id: PuzzleId;
  name: string;
  difficulty: number;
  boardRows: string[];
  queue: PieceType[];
  pieceBudget: number;
};

const acceptedLevels = accepted as unknown as { levels: AcceptedLevel[] };

function invalid(definition: PuzzleDefinition, patch: Partial<PuzzleDefinition>): PuzzleDefinition {
  return { ...definition, ...patch };
}

describe('T3 campaign definitions', () => {
  it('matches the accepted six-level contract exactly', () => {
    expect(PUZZLE_DEFINITIONS).toHaveLength(6);
    expect(PUZZLE_DEFINITIONS.map((definition) => ({
      id: definition.id,
      name: definition.name,
      difficulty: definition.difficulty,
      boardRows: definition.boardRows,
      queue: definition.queue,
      pieceBudget: definition.pieceBudget,
    }))).toEqual(acceptedLevels.levels.map((level) => ({
      id: level.id,
      name: level.name,
      difficulty: level.difficulty,
      boardRows: level.boardRows,
      queue: level.queue,
      pieceBudget: level.pieceBudget,
    })));
    for (const definition of PUZZLE_DEFINITIONS) expect(() => validatePuzzleDefinition(definition)).not.toThrow();
  });

  it('fails closed for malformed rows, unsupported cells, empty/full boards, hidden cells, queues, and budgets', () => {
    const first = getPuzzleDefinition('t3r-shaft-01');
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: first.boardRows.slice(1) }))).toThrow(/exactly/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), '.........'] }))).toThrow(/malformed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), 'QJJJ.JJJJ.'] }))).toThrow(/illegal/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: Array.from({ length: 20 }, () => '..........') }))).toThrow(/non-empty/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), 'JJJJJJJJJJ'] }))).toThrow(/full visible row/i);
    expect(() => validatePuzzleDefinition(invalid(first, { hiddenCells: [{ x: 0, y: 0, type: 'J' }] }))).toThrow(/hidden buffer/i);
    expect(() => validatePuzzleDefinition(invalid(first, { queue: [] }))).toThrow(/non-empty queue/i);
    expect(() => validatePuzzleDefinition(invalid(first, { queue: ['Q'] as unknown as PieceType[] }))).toThrow(/illegal queue/i);
    expect(() => validatePuzzleDefinition(invalid(first, { pieceBudget: first.queue.length - 1 }))).toThrow(/budget/i);
  });
});

describe('T3 puzzle canonical initialization', () => {
  it('keeps the authored queue immutable and advances its index only after successful spawns', () => {
    const ready = createInitialState(7, 'puzzle', 't3r-shaft-02');
    expect(ready.status).toBe('ready');
    expect(ready.active).toBeNull();
    expect(ready.puzzleQueueIndex).toBe(0);
    expect(ready.queue).toEqual(['I', 'I', 'I', 'I']);
    expect(ready.puzzleQueue).toEqual(['I', 'I', 'I', 'I']);
    expect(ready.puzzleGoal).toBe('canonical-board-empty');
    expect(ready.puzzleCompletion).toBe('active');
    expect(ready.puzzleTargetLines).toBeNull();

    const playing = dispatch(ready, { type: 'start' }).state;
    expect(playing.active?.type).toBe('I');
    expect(playing.puzzleQueueIndex).toBe(1);
    expect(playing.queue).toEqual(['I', 'I', 'I']);
    expect(playing.puzzleQueue).toEqual(ready.puzzleQueue);
  });

  it('has no automatic puzzle gravity and hashes campaign-only facts', () => {
    const started = dispatch(createInitialState(7, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
    let afterTicks = started;
    for (let index = 0; index < 180; index += 1) afterTicks = dispatch(afterTicks, { type: 'tick' }).state;
    expect(afterTicks.active?.y).toBe(started.active?.y);
    expect(stateHash(started)).not.toBe(stateHash({ ...started, puzzleQueueIndex: 2 }));
    expect(stateHash(started)).not.toBe(stateHash({ ...started, puzzleCompletion: 'failed-budget' }));
  });

  it('restarts the exact authored ready state without retaining completion or unlock data', () => {
    const initial = createInitialState(0x0ff5e7, 'puzzle', 't3r-cascade-05');
    const started = dispatch(initial, { type: 'start' }).state;
    const restarted = dispatch(started, { type: 'restart' }).state;
    expect(stateHash(restarted)).toBe(stateHash(initial));
    expect(restarted.active).toBeNull();
    expect(restarted.puzzleQueueIndex).toBe(0);
    expect(restarted.completedLevelId).toBeNull();
    expect(restarted.nextUnlockedLevelId).toBeNull();
  });
});
