import { describe, expect, it } from 'vitest';
import referencesFile from '../../../docs/workstreams/tetris-t3-rules/REFERENCE_REPLAYS.json';
import { LINE_CLEAR_DELAY_TICKS, VISIBLE_START_ROW } from './constants';
import { createInitialState, dispatch, replay, stateHash } from './engine';
import { PUZZLE_DEFINITIONS } from './puzzles';
import type { GameCommand, GameEvent, GameState, PieceType, PuzzleId } from './types';

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
  commandDigest: string;
};

const references = referencesFile as unknown as { replays: ReferenceReplay[] };

const CANONICAL_REPLAY_EVIDENCE: Record<PuzzleId, {
  initialHash: string;
  finalHash: string;
  eventDigest: string;
  commandCount: number;
}> = {
  't3r-shaft-01': { initialHash: 'c89dc01f', finalHash: 'de7d2dbd', eventDigest: 'd2458632', commandCount: 33 },
  't3r-shaft-02': { initialHash: '4bb38d6d', finalHash: '760c710d', eventDigest: '3ba2fcc3', commandCount: 40 },
  't3r-shaft-03': { initialHash: '292f6170', finalHash: '2f1d9bf4', eventDigest: 'cd5268c3', commandCount: 38 },
  't3r-shaft-04': { initialHash: 'e48e7910', finalHash: '73cbfcf0', eventDigest: 'b4a17a3e', commandCount: 46 },
  't3r-cascade-05': { initialHash: 'e6891ccb', finalHash: '29e0146c', eventDigest: '551998e2', commandCount: 53 },
  't3r-cascade-06': { initialHash: '6757837c', finalHash: '404ab9ea', eventDigest: '7818aa50', commandCount: 53 },
};

function digest(value: unknown): string {
  const canonical = JSON.stringify(value);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function occupied(state: GameState): number {
  return state.board.flat().filter((cell) => cell !== null).length;
}

function referenceFor(id: PuzzleId): ReferenceReplay {
  const reference = references.replays.find((candidate) => candidate.levelId === id);
  if (!reference) throw new Error(`Missing reference replay for ${id}`);
  return reference;
}

function completedCommands(reference: ReferenceReplay): GameCommand[] {
  // Preserve each accepted input in order. Add public ticks only when the
  // accepted T3 contract now requires the existing shared delayed clear phase.
  let state = createInitialState(0x73a30001, 'puzzle', reference.levelId);
  const commands: GameCommand[] = [];
  const resolveClear = (): void => {
    while (state.status === 'playing' && state.phase === 'line-clear') {
      commands.push({ type: 'tick' });
      state = dispatch(state, { type: 'tick' }).state;
    }
  };
  for (const command of reference.commands) {
    commands.push(command);
    state = dispatch(state, command).state;
    resolveClear();
  }
  return commands;
}

function execute(reference: ReferenceReplay, state = createInitialState(0x73a30001, 'puzzle', reference.levelId)) {
  const initialHash = stateHash(state);
  const initialOccupied = occupied(state);
  const events: Array<{ command: GameCommand; events: GameEvent[] }> = [];
  const landingXs: number[] = [];
  let effectiveRotations = 0;
  let lockedPieces = 0;
  let clearedLines = 0;
  let firstTerminal = -1;
  const commands = completedCommands(reference);

  for (let index = 0; index < commands.length; index += 1) {
    const command = commands[index]!;
    const before = state;
    if (command.type === 'hard-drop') landingXs.push(before.active?.x ?? Number.NaN);
    const transition = dispatch(before, command);
    state = transition.state;
    if (command.type === 'rotate' && transition.events.some((event) => event.type === 'piece-rotated')) effectiveRotations += 1;
    lockedPieces += transition.events.filter((event) => event.type === 'piece-locked').length;
    clearedLines += transition.events.filter((event) => event.type === 'lines-cleared').reduce((sum, event) => sum + event.count, 0);
    events.push({ command, events: transition.events });
    if (firstTerminal === -1 && (state.status === 'finished' || state.status === 'game-over')) firstTerminal = index;
  }

  return {
    state,
    initialHash,
    initialOccupied,
    landingXs,
    effectiveRotations,
    lockedPieces,
    clearedLines,
    firstTerminal,
    eventDigest: digest(events),
    finalHash: stateHash(state),
  };
}

describe('T3 six-level production campaign', () => {
  it.each(PUZZLE_DEFINITIONS)('$id completes its accepted public route through delayed line resolution', (definition) => {
    const reference = referenceFor(definition.id);
    expect(reference.commands).toHaveLength(reference.commandCount);
    expect(digest(reference.commands)).toBe(reference.commandDigest);

    const first = execute(reference);
    const second = execute(reference);
    const expected = CANONICAL_REPLAY_EVIDENCE[definition.id];
    expect(completedCommands(reference)).toHaveLength(expected.commandCount);
    expect(first.initialHash).toBe(expected.initialHash);
    expect(first.finalHash).toBe(expected.finalHash);
    expect(first.eventDigest).toBe(expected.eventDigest);
    expect(first.firstTerminal).toBe(completedCommands(reference).length - 1);
    expect(first.state.status).toBe('finished');
    expect(first.state.puzzleCompletion).toBe('finished');
    expect(first.state.completedLevelId).toBe(definition.id);
    expect(first.state.nextUnlockedLevelId).toBe(PUZZLE_DEFINITIONS[PUZZLE_DEFINITIONS.indexOf(definition) + 1]?.id ?? null);
    expect(first.state.active).toBeNull();
    expect(first.state.pendingClearRows).toEqual([]);
    expect(first.state.queue).toEqual([]);
    expect(first.state.puzzleQueueIndex).toBe(definition.queue.length);
    expect(first.lockedPieces).toBe(reference.lockedPieces);
    expect(first.lockedPieces).toBe(definition.queue.length);
    expect(first.state.pieceCount).toBe(definition.pieceBudget);
    expect(first.clearedLines).toBe(reference.clearedLines);
    expect(first.effectiveRotations).toBe(reference.effectiveRotations);
    expect(first.landingXs).toEqual(reference.landingXs);
    expect(new Set(first.landingXs).size).toBe(reference.distinctLandingXs);
    expect(occupied(first.state)).toBe(0);
    expect(first.initialOccupied + first.lockedPieces * 4).toBe(first.clearedLines * 10 + occupied(first.state));
    expect(first.initialHash).toBe(second.initialHash);
    expect(first.finalHash).toBe(second.finalHash);
    expect(first.eventDigest).toBe(second.eventDigest);

    const terminalHash = stateHash(first.state);
    const tail = dispatch(first.state, { type: 'hard-drop' });
    expect(tail.events).toEqual([]);
    expect(stateHash(tail.state)).toBe(terminalHash);
  });

  it.each(PUZZLE_DEFINITIONS.slice(3))('$id preserves the high-difficulty proof thresholds', (definition) => {
    const result = execute(referenceFor(definition.id));
    expect(result.lockedPieces).toBeGreaterThanOrEqual(5);
    expect(result.effectiveRotations).toBeGreaterThan(2);
    expect(new Set(result.landingXs).size).toBeGreaterThanOrEqual(3);
  });

  it('fails an invalid initial spawn without advancing the queue index', () => {
    const ready = createInitialState(9, 'puzzle', 't3r-shaft-01');
    const blocked = {
      ...ready,
      board: ready.board.map((row) => [...row]),
    };
    // Spawn I at x=3..6, y=20. This fixture is only a malformed-state negative gate.
    blocked.board[20]![4] = 'J';
    const transition = dispatch(blocked, { type: 'start' });
    expect(transition.state.status).toBe('game-over');
    expect(transition.state.puzzleCompletion).toBe('failed-invalid-spawn');
    expect(transition.state.puzzleQueueIndex).toBe(0);
    expect(transition.events).toContainEqual({ type: 'game-over', reason: 'puzzle-invalid-spawn' });
  });

  it('fails hidden-buffer occupancy as top-out after a public lock', () => {
    const reference = referenceFor('t3r-shaft-01');
    const ready = createInitialState(11, 'puzzle', reference.levelId);
    const board = ready.board.map((row) => [...row]);
    board[VISIBLE_START_ROW - 1]![0] = 'J';
    const started = dispatch({ ...ready, board }, { type: 'start' }).state;
    const ended = dispatch(started, { type: 'hard-drop' });
    expect(ended.state.status).toBe('game-over');
    expect(ended.state.puzzleCompletion).toBe('failed-top-out');
    expect(ended.events).toContainEqual({ type: 'game-over', reason: 'lock-out' });
  });

  it('does not accept residual cells merely because a line total was reached', () => {
    const reference = referenceFor('t3r-shaft-01');
    const ready = createInitialState(13, 'puzzle', reference.levelId);
    const board = ready.board.map((row) => [...row]);
    board[VISIBLE_START_ROW + 10]![0] = 'J';
    const result = execute(reference, { ...ready, board });
    expect(result.state.status).toBe('game-over');
    expect(result.state.puzzleCompletion).toBe('failed-budget');
    expect(occupied(result.state)).toBeGreaterThan(0);
  });

  it('keeps final-piece board-empty success ahead of budget exhaustion and replay drift detectable', () => {
    const reference = referenceFor('t3r-shaft-04');
    const completed = execute(reference);
    expect(completed.state.pieceCount).toBe(completed.state.puzzlePieceBudget);
    expect(completed.state.puzzleQueueIndex).toBe(completed.state.puzzleQueue?.length);
    expect(completed.state.status).toBe('finished');

    const altered = [...completedCommands(reference)];
    altered[1] = { type: 'move', dx: -1 };
    expect(stateHash(replay(0x73a30001, altered, 'puzzle', reference.levelId))).not.toBe(completed.finalHash);
  });

  it('leaves Marathon and Race behavior and legacy hash payloads unchanged', () => {
    const marathonCommands: GameCommand[] = [{ type: 'start' }, { type: 'move', dx: -1 }, { type: 'hard-drop' }];
    const raceCommands: GameCommand[] = [{ type: 'start' }, { type: 'rotate', direction: 1 }, { type: 'hard-drop' }];
    const hashes: string[] = [];
    for (const [mode, commands] of [['marathon', marathonCommands], ['race', raceCommands]] as const) {
      const first = replay(1234, commands, mode);
      const second = replay(1234, commands, mode);
      expect(stateHash(first)).toBe(stateHash(second));
      hashes.push(stateHash(first));
      expect(first.puzzleGoal).toBeNull();
      expect(first.puzzleQueue).toBeNull();
      expect(first.puzzleCompletion).toBeNull();
    }
    expect(hashes).toEqual(['8a7176be', '2a7c6265']);
  });

});
