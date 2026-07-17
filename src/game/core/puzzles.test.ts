import { describe, expect, it } from 'vitest';
import referencesFile from '../../../docs/workstreams/tetris-t5-core/puzzle-references.json';
import { createInitialState, dispatch, stateHash } from './engine';
import { PUZZLE_DEFINITIONS, getPuzzleDefinition, validatePuzzleDefinition, type PuzzleDefinition } from './puzzles';
import { createRandomizer, drawPiece } from './random';
import { PIECE_TYPES, type PieceType, type PuzzleId } from './types';

type T5Level = {
  id: PuzzleId;
  name: string;
  seed: number;
  boardRows: string[];
  first84: PieceType[];
};

const t5Levels = (referencesFile as unknown as { levels: T5Level[] }).levels;

const LEGACY_OCCUPANCY_MASKS = [
  { id: 't3r-shaft-01', top: 10, rows: [
    'JJ.J.JJJ..', 'JJJ.J..JJJ', '.JJ..JJJJJ', 'JJJ.JJJJJ.', 'JJJ..JJJJJ', 'JJ..JJJJJJ', 'JJJJJJJJJ.', 'JJJJJJ.JJJ', 'JJJJJ.JJJJ', '.JJJJJJJJJ',
  ] },
  { id: 't3r-shaft-02', top: 10, rows: [
    'JJJ.J..JJ.', 'J...JJJJJJ', 'J..JJJJJ.J', 'JJJJ.JJJJ.', 'JJJJJ.JJ.J', 'JJ..JJJJJJ', 'JJ.JJJJJJJ', 'JJJJ.JJJJJ', '.JJJJJJJJJ', 'JJJJJJJJJ.',
  ] },
  { id: 't3r-shaft-03', top: 10, rows: [
    'JJ...JJJ.J', 'JJJ...JJJJ', 'JJ.JJJJJ..', 'J.JJJ.JJJJ', 'J.JJJJ.JJJ', 'JJJJ..JJJJ', 'JJJJJJJ.JJ', 'JJJJJJJJJ.', 'JJJJJJJJ.J', 'J.JJJJJJJJ',
  ] },
  { id: 't3r-shaft-04', top: 12, rows: [
    '..JJJ.JJ.J', 'JJ.JJJ.J.J', '...JJJJJJJ', 'J.JJJJJJ.J', 'JJJJJJJJJ.', 'JJJJJ.JJJJ', 'J.JJJJJJJJ', 'JJJ.JJJJJJ',
  ] },
  { id: 't3r-cascade-05', top: 12, rows: [
    'J.J...JJJJ', '.JJJJJ.J.J', '.J.JJJJ.JJ', '.JJJ.JJJJJ', '.JJJJJJJJJ', 'J.JJJJJJJJ', 'JJJJJ.JJJJ', 'JJJJ.JJJJJ',
  ] },
  { id: 't3r-cascade-06', top: 10, rows: [
    'JJJJJ...J.', '.JJ..JJJJJ', 'JJJ.JJ..JJ', 'J.JJJJJJJ.', '..JJJJJJJJ', 'JJJ.J.JJJJ', 'J.JJJJJJJJ', 'JJJJJ.JJJJ', 'JJJ.JJJJJJ', 'JJJJJJJJ.J',
  ] },
] as const;

function invalid(definition: PuzzleDefinition, patch: Partial<PuzzleDefinition>): PuzzleDefinition {
  return { ...definition, ...patch };
}

function generatedPieces(seed: number, count: number): PieceType[] {
  let randomizer = createRandomizer(seed);
  const pieces: PieceType[] = [];
  for (let index = 0; index < count; index += 1) {
    const draw = drawPiece(randomizer);
    pieces.push(draw.piece);
    randomizer = draw.randomizer;
  }
  return pieces;
}

function occupancyRow(row: string): string {
  return [...row].map((cell) => cell === '.' ? '.' : '#').join('');
}

function topology(definition: PuzzleDefinition) {
  const nonEmptyRows = definition.boardRows.filter((row) => row !== '..........');
  const densities = nonEmptyRows.map((row) => [...row].filter((cell) => cell !== '.').length);
  const colors = new Set(definition.boardRows.flatMap((row) => [...row].filter((cell) => cell !== '.')));
  const top = definition.boardRows.findIndex((row) => row !== '..........');
  const coveredColumns = new Set<number>();
  let buriedHoles = 0;
  for (let x = 0; x < 10; x += 1) {
    for (let y = Math.max(0, top + 1); y < 19; y += 1) {
      if (definition.boardRows[y]![x] !== '.') continue;
      const hasFilledAbove = definition.boardRows.slice(top, y).some((row) => row[x] !== '.');
      const hasFilledBelow = definition.boardRows.slice(y + 1).some((row) => row[x] !== '.');
      if (hasFilledAbove) coveredColumns.add(x);
      if (hasFilledAbove && hasFilledBelow) buriedHoles += 1;
    }
  }
  return {
    nonEmptyRows,
    occupancyShapes: new Set(nonEmptyRows.map(occupancyRow)).size,
    densityClasses: new Set(densities).size,
    coveredColumns: coveredColumns.size,
    buriedHoles,
    colors,
  };
}

describe('T5 normal-play Puzzle definitions', () => {
  it('matches the fifteen-level fixture and enforces normalized authored topology', () => {
    expect(PUZZLE_DEFINITIONS).toHaveLength(15);
    expect(t5Levels).toHaveLength(15);
    expect(PUZZLE_DEFINITIONS.map(({ id, name, seed, boardRows }) => ({ id, name, seed, boardRows })))
      .toEqual(t5Levels.map(({ id, name, seed, boardRows }) => ({ id, name, seed, boardRows })));
    expect(new Set(PUZZLE_DEFINITIONS.map(({ id }) => id)).size).toBe(15);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ seed }) => seed)).size).toBe(15);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ name }) => name)).size).toBe(15);
    expect(new Set(PUZZLE_DEFINITIONS.map(({ boardRows }) => boardRows.map(occupancyRow).join('/'))).size).toBe(15);
    expect(PUZZLE_DEFINITIONS.slice(0, 6).map(({ id, seed }) => [id, seed])).toEqual([
      ['t3r-shaft-01', 0x75c0b101],
      ['t3r-shaft-02', 0x75c0b202],
      ['t3r-shaft-03', 0x75c0b303],
      ['t3r-shaft-04', 0x75c0b404],
      ['t3r-cascade-05', 0x75c0b505],
      ['t3r-cascade-06', 0x75c0b606],
    ]);
    expect(PUZZLE_DEFINITIONS.slice(0, 6).map((definition) => ({
      id: definition.id,
      top: definition.boardRows.findIndex((row) => row !== '..........'),
      rows: definition.boardRows.filter((row) => row !== '..........')
        .map((row) => row.replace(/[IOTSZJL]/g, 'J')),
    }))).toEqual(LEGACY_OCCUPANCY_MASKS);

    const campaignColors = new Set<string>();
    for (const [index, definition] of PUZZLE_DEFINITIONS.entries()) {
      expect(() => validatePuzzleDefinition(definition)).not.toThrow();
      expect('difficulty' in definition).toBe(false);
      expect('queue' in definition).toBe(false);
      expect('pieceBudget' in definition).toBe(false);
      const metrics = topology(definition);
      expect(metrics.nonEmptyRows.length).toBeGreaterThanOrEqual(index < 6 ? 8 : 9);
      expect(metrics.nonEmptyRows.length).toBeLessThanOrEqual(12);
      expect(metrics.occupancyShapes).toBeGreaterThanOrEqual(6);
      expect(metrics.densityClasses).toBeGreaterThanOrEqual(4);
      expect(metrics.coveredColumns).toBeGreaterThanOrEqual(5);
      expect(metrics.buriedHoles).toBeGreaterThanOrEqual(8);
      expect(metrics.colors.size).toBeGreaterThanOrEqual(5);
      for (const color of metrics.colors) campaignColors.add(color);
    }
    expect(campaignColors).toEqual(new Set(PIECE_TYPES));
  });

  it('proves twelve consecutive complete seven-bags per stable level seed', () => {
    for (const level of t5Levels) {
      const generated = generatedPieces(level.seed, 91);
      const first84 = generated.slice(0, 84);
      expect(first84).toEqual(level.first84);
      for (let bagIndex = 0; bagIndex < 12; bagIndex += 1) {
        const bag = first84.slice(bagIndex * 7, bagIndex * 7 + 7);
        expect(new Set(bag)).toEqual(new Set(PIECE_TYPES));
      }
      expect(new Set(generated.slice(84))).toEqual(new Set(PIECE_TYPES));
    }
  });

  it('fails closed for malformed, shallow, color-faked, template-like, monochrome, or hidden authored content', () => {
    const first = getPuzzleDefinition('t3r-shaft-01');
    expect(() => validatePuzzleDefinition(invalid(first, { seed: 0 }))).toThrow(/seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { seed: getPuzzleDefinition('t3r-shaft-02').seed }))).toThrow(/stable level seed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: first.boardRows.slice(1) }))).toThrow(/exactly/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), '.........'] }))).toThrow(/malformed/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), 'QJJJ.JJJJ.'] }))).toThrow(/illegal/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: Array.from({ length: 20 }, () => '..........') }))).toThrow(/non-empty/i);
    expect(() => validatePuzzleDefinition(invalid(first, { boardRows: [...first.boardRows.slice(0, 19), 'JJJJJJJJJJ'] }))).toThrow(/full visible row/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...Array.from({ length: 14 }, () => '..........'), ...Array.from({ length: 6 }, () => 'J.........')],
    }))).toThrow(/8-12/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...Array.from({ length: 12 }, () => '..........'), ...Array.from({ length: 8 }, () => 'J.........')],
    }))).toThrow(/six distinct occupancy/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...Array.from({ length: 11 }, () => '..........'),
        '.IOTSZJLI.', '.OTSZJLIO.', '.TSZJLIOT.', '.SZJLIOTS.', '.ZJLIOTSZ.',
        '.JLIOTSZJ.', '.LIOTSZJL.', '.IOTSZJLI.', '.OTSZJLIO.'],
    }))).toThrow(/six distinct occupancy/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: [...Array.from({ length: 12 }, () => '..........'), ...Array.from({ length: 8 }, (_, index) => (
        'J'.repeat(index) + '.' + 'J'.repeat(9 - index)
      ))],
    }))).toThrow(/floor templates/i);
    expect(() => validatePuzzleDefinition(invalid(first, {
      boardRows: first.boardRows.map((row) => row.replace(/[IOTSZJL]/g, 'J')),
    }))).toThrow(/five deterministic starting-board colors/i);
    const newLevel = getPuzzleDefinition('t5r-delta-07');
    const firstOccupiedRow = newLevel.boardRows.findIndex((row) => row !== '..........');
    expect(() => validatePuzzleDefinition(invalid(newLevel, {
      boardRows: newLevel.boardRows.map((row, index) => (
        index === firstOccupiedRow || index === firstOccupiedRow + 1 ? '..........' : row
      )),
    }))).toThrow(/9-12/i);
    expect(() => validatePuzzleDefinition(invalid(first, { hiddenCells: [{ x: 0, y: 0, type: 'J' }] }))).toThrow(/hidden buffer/i);
  });
});
describe('T5 Puzzle deterministic initialization', () => {
  it('uses every level seed for gameplay without consuming it during board colorization', () => {
    for (const definition of PUZZLE_DEFINITIONS) {
      const ready = createInitialState(7, 'puzzle', definition.id);
      const expected = generatedPieces(definition.seed, 6);

      expect(ready.status).toBe('ready');
      expect(ready.seed).toBe(definition.seed);
      expect(ready.active?.type).toBe(expected[0]);
      expect(ready.queue).toEqual(expected.slice(1));
      expect(ready.puzzleQueue).toEqual(ready.queue);
      expect(ready.puzzleQueueIndex).toBe(0);
      expect(ready.puzzlePieceBudget).toBeNull();
      expect(ready.puzzleGoal).toBe('canonical-board-empty');
      expect(ready.puzzleCompletion).toBe('active');
      expect(ready.puzzleTargetLines).toBeNull();

      const playing = dispatch(ready, { type: 'start' }).state;
      expect(playing.active).toEqual(ready.active);
      expect(playing.queue).toEqual(ready.queue);
    }
  });

  it('shares Marathon gravity instead of freezing the active piece', () => {
    let state = dispatch(createInitialState(7, 'puzzle', 't3r-shaft-01'), { type: 'start' }).state;
    const spawnY = state.active?.y;
    for (let index = 0; index < 47; index += 1) state = dispatch(state, { type: 'tick' }).state;
    expect(state.active?.y).toBe(spawnY);
    state = dispatch(state, { type: 'tick' }).state;
    expect(state.active?.y).toBe((spawnY ?? 0) + 1);
  });

  it('restarts the exact authored board, seed, randomizer, active piece, and hash', () => {
    const initial = createInitialState(0x0ff5e7, 'puzzle', 't3r-cascade-05');
    let changed = dispatch(initial, { type: 'start' }).state;
    changed = dispatch(changed, { type: 'move', dx: -1 }).state;
    changed = dispatch(changed, { type: 'hard-drop' }).state;

    const restarted = dispatch(changed, { type: 'restart', seed: 123 }).state;
    expect(stateHash(restarted)).toBe(stateHash(initial));
    expect(restarted.seed).toBe(getPuzzleDefinition('t3r-cascade-05').seed);
    expect(restarted.active).toEqual(initial.active);
    expect(restarted.randomizer).toEqual(initial.randomizer);
    expect(restarted.board).toEqual(initial.board);
    expect(restarted.completedLevelId).toBeNull();
    expect(restarted.nextUnlockedLevelId).toBeNull();
  });
});
