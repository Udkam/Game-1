import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import * as core from '../../../../src/game/core';
import type { GameCommand, GameEvent, GameState, PieceType, PuzzleId } from '../../../../src/game/core';

type Level = {
  id: PuzzleId;
  name: string;
  difficulty: number;
  boardRows: string[];
  queue: PieceType[];
  pieceBudget: number;
  expectedClearedLines: number;
  intendedMechanic: string;
};

type ReferenceReplay = {
  levelId: PuzzleId;
  commands: GameCommand[];
  commandCount: number;
  lockedPieces: number;
  clearedLines: number;
  consumedQueueCount: number;
  effectiveRotations: number;
  landingXs: number[];
  distinctLandingXs: number;
  finalFullBoardOccupiedCells: number;
  proposedFinalOutcome: 'finished';
  /** Historical design-adapter evidence, not production hash authority. */
  currentAdapterInitialHash: string;
  /** Historical design-adapter evidence, not production hash authority. */
  currentAdapterFinalHash: string;
  commandDigest: string;
  /** Historical design-adapter evidence, not production event authority. */
  eventDigest: string;
};

const seed = 0x73a30001;
const cellTypes = new Set<PieceType>(['I', 'O', 'T', 'S', 'Z', 'J', 'L']);
const campaign = JSON.parse(readFileSync(new URL('../levels.json', import.meta.url), 'utf8')) as { levels: Level[] };
const references = JSON.parse(readFileSync(new URL('../REFERENCE_REPLAYS.json', import.meta.url), 'utf8')) as { replays: ReferenceReplay[] };

function digest(value: unknown): string {
  const canonical = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function fullBoardOccupied(state: GameState): number {
  return state.board.flat().filter((cell) => cell !== null).length;
}

/** This validates design data only. It never builds or mutates a GameState. */
function validateDesignLevel(level: Level): void {
  if (!/^t3r-(shaft|cascade)-0[1-6]$/.test(level.id)) throw new Error(`Invalid level ID: ${level.id}`);
  if (!level.name || !level.intendedMechanic) throw new Error(`${level.id}: missing authored metadata`);
  if (!Number.isInteger(level.difficulty) || level.difficulty < 1) throw new Error(`${level.id}: invalid difficulty`);
  if (level.boardRows.length !== 20) throw new Error(`${level.id}: board must have exactly 20 rows`);
  let occupied = 0;
  for (const row of level.boardRows) {
    if (row.length !== 10) throw new Error(`${level.id}: row width must be exactly 10`);
    if (![...row].every((cell) => cell === '.' || cellTypes.has(cell as PieceType))) throw new Error(`${level.id}: illegal board cell`);
    if (![...row].includes('.')) throw new Error(`${level.id}: authored board contains an already-complete row`);
    occupied += [...row].filter((cell) => cell !== '.').length;
  }
  if (occupied === 0) throw new Error(`${level.id}: initially empty board`);
  if (level.queue.length === 0 || !level.queue.every((piece) => cellTypes.has(piece))) throw new Error(`${level.id}: invalid queue`);
  if (!Number.isInteger(level.pieceBudget) || level.pieceBudget !== level.queue.length) {
    throw new Error(`${level.id}: piece budget must exactly equal queue length`);
  }
  if (!Number.isInteger(level.expectedClearedLines) || level.expectedClearedLines <= 0) {
    throw new Error(`${level.id}: invalid expected cleared lines`);
  }
}

function definitionFor(level: Level) {
  const definition = core.getPuzzleDefinition(level.id);
  expect({
    id: definition.id,
    name: definition.name,
    difficulty: definition.difficulty,
    boardRows: definition.boardRows,
    queue: definition.queue,
    pieceBudget: definition.pieceBudget,
  }).toEqual({
    id: level.id,
    name: level.name,
    difficulty: level.difficulty,
    boardRows: level.boardRows,
    queue: level.queue,
    pieceBudget: level.pieceBudget,
  });
  return definition;
}

function referenceFor(id: PuzzleId): ReferenceReplay {
  const reference = references.replays.find((candidate) => candidate.levelId === id);
  if (!reference) throw new Error(`Missing reference replay for ${id}`);
  return reference;
}

function requireAcceptedPhase(before: GameState, command: GameCommand, index: number): void {
  if (index === 0) {
    if (command.type !== 'start') throw new Error('start must be the first and only accepted command');
    return;
  }
  if (command.type === 'start' || command.type === 'restart' || command.type === 'pause' || command.type === 'resume') {
    throw new Error(`forbidden accepted replay command: ${command.type}`);
  }
  if (command.type === 'tick') {
    if (before.status !== 'playing' || before.phase !== 'entry') throw new Error('accepted tick is only valid during entry');
    return;
  }
  if (before.status !== 'playing' || before.phase !== 'active' || before.active === null) {
    throw new Error(`${command.type} is invalid outside an active piece phase`);
  }
}

type ProductionRun = {
  state: GameState;
  initialHash: string;
  finalHash: string;
  eventDigest: string;
  locks: number;
  clears: number;
  effectiveRotations: number;
  landingXs: number[];
  initialOccupied: number;
  generatedLineClearTicks: number;
};

/**
 * Starts from the real C1 authored initializer. All gameplay and delayed-line
 * progression uses public dispatch; no adapter state is built or injected.
 */
function executeProductionReplay(level: Level, reference: ReferenceReplay): ProductionRun {
  let state = core.createInitialState(seed, 'puzzle', level.id);
  const initialHash = core.stateHash(state);
  const initialOccupied = fullBoardOccupied(state);
  const records: Array<{ command: GameCommand; events: readonly GameEvent[]; accepted: boolean }> = [];
  const landingXs: number[] = [];
  let locks = 0;
  let clears = 0;
  let effectiveRotations = 0;
  let generatedLineClearTicks = 0;
  let terminal = false;

  const apply = (command: GameCommand, accepted: boolean): void => {
    if (terminal) throw new Error('terminal tail command');
    const before = state;
    if (command.type === 'hard-drop') landingXs.push(before.active?.x ?? Number.NaN);
    const transition = core.dispatch(before, command);
    state = transition.state;
    if (command.type === 'rotate' && transition.events.some((event) => event.type === 'piece-rotated')) effectiveRotations += 1;
    locks += transition.events.filter((event) => event.type === 'piece-locked').length;
    clears += transition.events.filter((event) => event.type === 'lines-cleared').reduce((total, event) => total + event.count, 0);
    records.push({ command, events: transition.events, accepted });
    terminal = state.status === 'finished' || state.status === 'game-over';
  };

  for (let index = 0; index < reference.commands.length; index += 1) {
    const command = reference.commands[index]!;
    requireAcceptedPhase(state, command, index);
    apply(command, true);
    while (!terminal && state.phase === 'line-clear') {
      apply({ type: 'tick' }, false);
      generatedLineClearTicks += 1;
    }
  }

  if (!terminal) throw new Error('accepted replay did not reach a production terminal outcome');
  if (state.status !== 'finished') throw new Error(`accepted replay ended ${state.status}`);
  if (reference.commands.at(-1)?.type !== 'hard-drop') throw new Error('last accepted command must be the locking hard drop');

  return {
    state,
    initialHash,
    finalHash: core.stateHash(state),
    eventDigest: digest(records),
    locks,
    clears,
    effectiveRotations,
    landingXs,
    initialOccupied,
    generatedLineClearTicks,
  };
}

function verifyReference(level: Level, reference: ReferenceReplay): ProductionRun {
  validateDesignLevel(level);
  definitionFor(level);
  if (reference.commands.length !== reference.commandCount) throw new Error(`${level.id}: command count mismatch`);
  if (digest(reference.commands) !== reference.commandDigest) throw new Error(`${level.id}: historical command digest malformed`);
  for (const historical of [reference.currentAdapterInitialHash, reference.currentAdapterFinalHash, reference.eventDigest]) {
    if (!/^[0-9a-f]{8}$/.test(historical)) throw new Error(`${level.id}: malformed historical adapter evidence`);
  }

  const first = executeProductionReplay(level, reference);
  const second = executeProductionReplay(level, reference);
  if (first.initialHash !== second.initialHash || first.finalHash !== second.finalHash || first.eventDigest !== second.eventDigest) {
    throw new Error(`${level.id}: production replay is not deterministic`);
  }
  if (first.locks !== reference.lockedPieces || first.locks !== level.queue.length || first.locks !== level.pieceBudget) {
    throw new Error(`${level.id}: fixed queue or budget was not exactly consumed`);
  }
  if (first.clears !== reference.clearedLines || first.clears !== level.expectedClearedLines) {
    throw new Error(`${level.id}: cleared-line fact drifted`);
  }
  if (first.effectiveRotations !== reference.effectiveRotations) throw new Error(`${level.id}: effective rotation fact drifted`);
  if (JSON.stringify(first.landingXs) !== JSON.stringify(reference.landingXs) || new Set(first.landingXs).size !== reference.distinctLandingXs) {
    throw new Error(`${level.id}: landing fact drifted`);
  }
  if (first.initialOccupied + 4 * first.locks !== 10 * first.clears + fullBoardOccupied(first.state)) {
    throw new Error(`${level.id}: cell conservation failed`);
  }
  if (fullBoardOccupied(first.state) !== 0 || first.state.active !== null || first.state.pendingClearRows.length !== 0) {
    throw new Error(`${level.id}: canonical board was not empty at completion`);
  }
  if (first.state.queue.length !== 0 || first.state.puzzleQueueIndex !== level.queue.length || first.state.pieceCount !== level.pieceBudget) {
    throw new Error(`${level.id}: authored queue index drifted`);
  }
  const campaignIndex = campaign.levels.findIndex((candidate) => candidate.id === level.id);
  const expectedUnlock = campaign.levels[campaignIndex + 1]?.id ?? null;
  if (first.state.puzzleCompletion !== 'finished' || first.state.completedLevelId !== level.id || first.state.nextUnlockedLevelId !== expectedUnlock) {
    throw new Error(`${level.id}: production outcome or unlock drifted`);
  }
  const tail = core.dispatch(first.state, { type: 'hard-drop' });
  if (tail.events.length !== 0 || core.stateHash(tail.state) !== first.finalHash) throw new Error(`${level.id}: terminal command was not inert`);
  return first;
}

describe('TETRIS-T3R six-level production campaign verifier', () => {
  it('validates six unique non-empty 20x10 boards and historical-adapter evidence shape', () => {
    expect(campaign.levels).toHaveLength(6);
    expect(references.replays).toHaveLength(6);
    expect(new Set(campaign.levels.map((level) => level.id)).size).toBe(6);
    expect(new Set(campaign.levels.map((level) => level.boardRows.join('\n'))).size).toBe(6);
    for (const level of campaign.levels) validateDesignLevel(level);
    for (const reference of references.replays) {
      expect(reference.levelId).toMatch(/^t3r-(shaft|cascade)-0[1-6]$/);
      expect(reference.currentAdapterInitialHash).toMatch(/^[0-9a-f]{8}$/);
      expect(reference.currentAdapterFinalHash).toMatch(/^[0-9a-f]{8}$/);
      expect(reference.eventDigest).toMatch(/^[0-9a-f]{8}$/);
    }
  });

  it.each(references.replays)('$levelId reaches first-terminal production success with exactly its authored queue', (reference) => {
    const level = campaign.levels.find((candidate) => candidate.id === reference.levelId);
    if (!level) throw new Error(`Missing level for ${reference.levelId}`);
    const verified = verifyReference(level, reference);
    expect(verified.state.status).toBe('finished');
  });

  it.each(references.replays.slice(3))('$levelId preserves high-difficulty locked-piece, rotation, and landing facts', (reference) => {
    expect(reference.lockedPieces).toBeGreaterThanOrEqual(5);
    expect(reference.effectiveRotations).toBeGreaterThan(2);
    expect(reference.distinctLandingXs).toBeGreaterThanOrEqual(3);
  });

  it('rejects data-only malformed authored fixtures without creating a canonical state', () => {
    const base = campaign.levels[0]!;
    expect(() => validateDesignLevel({ ...base, boardRows: Array.from({ length: 20 }, () => '..........') })).toThrow(/initially empty/);
    expect(() => validateDesignLevel({ ...base, boardRows: [...base.boardRows.slice(0, 19), 'JJJJJJJJJJ'] })).toThrow(/already-complete/);
    expect(() => validateDesignLevel({ ...base, boardRows: [...base.boardRows.slice(0, 19), 'QJJJ.JJJJ.'] })).toThrow(/illegal board cell/);
    expect(() => validateDesignLevel({ ...base, queue: ['Q'] as unknown as PieceType[], pieceBudget: 1 })).toThrow(/invalid queue/);
    expect(() => validateDesignLevel({ ...base, pieceBudget: base.queue.length - 1 })).toThrow(/exactly equal/);
  });

  it('fails closed when production definitions or accepted replay facts drift', () => {
    const reference = referenceFor('t3r-shaft-01');
    const level = campaign.levels[0]!;
    expect(() => verifyReference({ ...level, queue: ['O', 'I', 'I'], pieceBudget: 3 }, reference)).toThrow();
    expect(() => verifyReference(level, { ...reference, commandDigest: '00000000' })).toThrow(/digest/);
    expect(() => verifyReference(level, { ...reference, landingXs: [0, 0, 0] })).toThrow(/landing fact/);
  });
});
