import {
  BOARD_HEIGHT,
  ENTRY_DELAY_TICKS,
  LINE_CLEAR_BASE_SCORE,
  LINE_CLEAR_DELAY_TICKS,
  LOCK_DELAY_TICKS,
  MAX_LOCK_RESETS,
  NEXT_QUEUE_SIZE,
  RACE_TARGET_LINES,
  VISIBLE_START_ROW,
  gravityForMode,
} from './constants';
import { canPlace, clearRows, createBoard, fullRows, isGrounded, mergePiece } from './board';
import { cellsForPiece, createSpawnPiece, nextRotation } from './pieces';
import { createPuzzleBoard, defaultPuzzleId, getPuzzleDefinition, nextPuzzleId } from './puzzles';
import { createRandomizer, drawPiece } from './random';
import { kickTests } from './rotation';
import type { ActivePiece, GameCommand, GameEvent, GameMode, GameState, GameTransition, PieceType, PuzzleCompletion, PuzzleId } from './types';

function refillQueue(state: GameState, minimum = NEXT_QUEUE_SIZE + 1): GameState {
  if (state.mode === 'puzzle') return state;
  const queue = [...state.queue];
  let randomizer = state.randomizer;
  while (queue.length < minimum) {
    const draw = drawPiece(randomizer);
    queue.push(draw.piece);
    randomizer = draw.randomizer;
  }
  return { ...state, queue, randomizer };
}

function puzzleFailure(
  state: GameState,
  completion: Exclude<PuzzleCompletion, 'active' | 'finished'>,
  reason: Extract<GameEvent, { type: 'game-over' }>['reason'],
): GameTransition {
  return {
    state: {
      ...state,
      active: null,
      status: 'game-over',
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
      puzzleCompletion: completion,
      completedLevelId: null,
      nextUnlockedLevelId: null,
    },
    events: [{ type: 'game-over', reason }],
  };
}

function hasHiddenOccupancy(state: GameState): boolean {
  return state.board.slice(0, VISIBLE_START_ROW).some((row) => row.some((cell) => cell !== null));
}

function canonicalOccupiedCount(state: GameState): number {
  return state.board.flat().filter((cell) => cell !== null).length;
}

function spawnPuzzlePiece(state: GameState): GameTransition {
  const queue = state.puzzleQueue;
  const queueIndex = state.puzzleQueueIndex;
  if (!queue || state.puzzleGoal !== 'canonical-board-empty' || state.puzzlePieceBudget !== queue.length) {
    return invalidState(state);
  }
  const pieceType = queue[queueIndex];
  if (!pieceType) return puzzleFailure(state, 'failed-budget', 'puzzle-budget');
  const active = createSpawnPiece(pieceType);
  if (!canPlace(state.board, active)) return puzzleFailure(state, 'failed-invalid-spawn', 'puzzle-invalid-spawn');
  return {
    state: {
      ...state,
      active,
      queue: queue.slice(queueIndex + 1),
      puzzleQueueIndex: queueIndex + 1,
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
    },
    events: [],
  };
}

function spawnPiece(state: GameState, type?: PieceType): GameTransition {
  if (state.mode === 'puzzle') {
    if (type) return invalidState(state);
    return spawnPuzzlePiece(state);
  }
  let next = refillQueue(state, type ? NEXT_QUEUE_SIZE : NEXT_QUEUE_SIZE + 1);
  const queue = [...next.queue];
  const pieceType = type ?? queue.shift();
  if (!pieceType) return invalidState(next);
  next = refillQueue({ ...next, queue }, NEXT_QUEUE_SIZE);
  const active = createSpawnPiece(pieceType);
  if (!canPlace(next.board, active)) {
    return {
      state: { ...next, active: null, status: 'game-over', phase: 'active' },
      events: [{ type: 'game-over', reason: 'block-out' }],
    };
  }
  return {
    state: {
      ...next,
      active,
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
    },
    events: [],
  };
}

export function createInitialState(seed = 0x51a1f00d, mode: GameMode = 'marathon', puzzleId?: PuzzleId): GameState {
  const selectedPuzzle = mode === 'puzzle' ? getPuzzleDefinition(puzzleId ?? defaultPuzzleId()) : null;
  const base: GameState = {
    board: selectedPuzzle ? createPuzzleBoard(selectedPuzzle) : createBoard(),
    active: null,
    queue: selectedPuzzle ? [...selectedPuzzle.queue] : [],
    score: 0,
    lines: 0,
    level: 0,
    mode,
    puzzleId: selectedPuzzle?.id ?? null,
    puzzleTargetLines: null,
    puzzlePieceBudget: selectedPuzzle?.pieceBudget ?? null,
    puzzleBoardRows: selectedPuzzle?.boardRows ?? null,
    puzzleQueue: selectedPuzzle?.queue ?? null,
    puzzleQueueIndex: 0,
    puzzleGoal: selectedPuzzle ? 'canonical-board-empty' : null,
    puzzleCompletion: selectedPuzzle ? 'active' : null,
    completedLevelId: null,
    nextUnlockedLevelId: null,
    pieceCount: 0,
    status: 'ready',
    phase: 'active',
    phaseTicks: 0,
    pendingClearRows: [],
    gravityTicks: 0,
    lockTicks: 0,
    lockResets: 0,
    elapsedTicks: 0,
    randomizer: createRandomizer(seed),
    seed,
  };
  if (selectedPuzzle) return base;
  return { ...spawnPiece(base).state, status: 'ready' };
}

function invalidState(state: GameState): GameTransition {
  if (state.mode === 'puzzle') return puzzleFailure(state, 'failed-top-out', 'invalid-state');
  return {
    state: { ...state, active: null, status: 'game-over' },
    events: [{ type: 'game-over', reason: 'invalid-state' }],
  };
}

function finishPuzzleSuccess(state: GameState): GameTransition {
  const levelId = state.puzzleId;
  if (!levelId) return invalidState(state);
  return {
    state: {
      ...state,
      active: null,
      status: 'finished',
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
      puzzleCompletion: 'finished',
      completedLevelId: levelId,
      nextUnlockedLevelId: nextPuzzleId(levelId),
    },
    events: [{ type: 'finished', completionTicks: state.elapsedTicks }],
  };
}

/** Puzzle-only post-lock resolution after shared merge and ordinary line clearing. */
function resolvePuzzleAfterLock(state: GameState, spawnImmediately: boolean): GameTransition {
  const queue = state.puzzleQueue;
  if (!queue || state.puzzleGoal !== 'canonical-board-empty' || state.puzzlePieceBudget !== queue.length) {
    return invalidState(state);
  }
  if (hasHiddenOccupancy(state)) return puzzleFailure(state, 'failed-top-out', 'lock-out');
  if (canonicalOccupiedCount(state) === 0) return finishPuzzleSuccess(state);
  if (state.pieceCount >= state.puzzlePieceBudget || state.puzzleQueueIndex >= queue.length) {
    return puzzleFailure(state, 'failed-budget', 'puzzle-budget');
  }
  if (spawnImmediately) return spawnPiece(state);
  return {
    state: {
      ...state,
      active: null,
      phase: 'entry',
      phaseTicks: 0,
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
    },
    events: [],
  };
}

function withActive(state: GameState): state is GameState & { active: ActivePiece } {
  return state.active !== null;
}

function moveActive(state: GameState, dx: number, dy: number, cause: 'move' | 'gravity' | 'soft-drop'): GameTransition {
  if (!withActive(state)) return { state, events: [] };
  const candidate = { ...state.active, x: state.active.x + dx, y: state.active.y + dy };
  if (!canPlace(state.board, candidate)) return { state, events: [] };

  const wasGrounded = isGrounded(state.board, state.active);
  const remainsGrounded = isGrounded(state.board, candidate);
  const canReset = cause === 'move' && wasGrounded && state.lockResets < MAX_LOCK_RESETS;

  return {
    state: {
      ...state,
      active: candidate,
      gravityTicks: dy > 0 ? 0 : state.gravityTicks,
      lockTicks: remainsGrounded ? (canReset ? 0 : state.lockTicks) : 0,
      lockResets: canReset ? state.lockResets + 1 : state.lockResets,
      score: cause === 'soft-drop' ? state.score + 1 : state.score,
    },
    events: [{ type: 'piece-moved', piece: candidate.type, dx, dy, cause }],
  };
}

function lockActive(state: GameState, extraEvents: GameEvent[] = []): GameTransition {
  if (!withActive(state)) return { state, events: extraEvents };
  const cells = cellsForPiece(state.active);
  if (cells.some((cell) => cell.y < 0 || cell.y >= BOARD_HEIGHT)) return invalidState(state);
  const board = mergePiece(state.board, state.active);
  const pieceCount = state.pieceCount + 1;
  const lockedEvent: GameEvent = { type: 'piece-locked', piece: state.active.type, cells };
  const rows = fullRows(board);
  const lockOut = cells.every((cell) => cell.y < VISIBLE_START_ROW) && rows.length === 0;

  if (lockOut) {
    if (state.mode === 'puzzle') {
      const failed = puzzleFailure({ ...state, board, active: null, pieceCount }, 'failed-top-out', 'lock-out');
      return { state: failed.state, events: [...extraEvents, lockedEvent, ...failed.events] };
    }
    return {
      state: { ...state, board, active: null, status: 'game-over', pieceCount },
      events: [...extraEvents, lockedEvent, { type: 'game-over', reason: 'lock-out' }],
    };
  }

  if (rows.length > 0) {
    const clearing: GameState = {
      ...state,
      board,
      pieceCount,
      active: null,
      phase: 'line-clear',
      phaseTicks: 0,
      pendingClearRows: rows,
      gravityTicks: 0,
      lockTicks: 0,
    };
    return { state: clearing, events: [...extraEvents, lockedEvent, { type: 'clear-started', rows }] };
  }

  if (state.mode === 'puzzle') {
    const resolved = resolvePuzzleAfterLock({
      ...state,
      board,
      active: null,
      pieceCount,
      phase: 'active',
      phaseTicks: 0,
      pendingClearRows: [],
      gravityTicks: 0,
      lockTicks: 0,
      lockResets: 0,
    }, false);
    return { state: resolved.state, events: [...extraEvents, lockedEvent, ...resolved.events] };
  }

  return {
    state: {
      ...state,
      board,
      pieceCount,
      active: null,
      phase: 'entry',
      phaseTicks: 0,
      gravityTicks: 0,
      lockTicks: 0,
    },
    events: [...extraEvents, lockedEvent],
  };
}

function hardDrop(state: GameState): GameTransition {
  if (!withActive(state)) return { state, events: [] };
  let distance = 0;
  let candidate = state.active;
  while (canPlace(state.board, { ...candidate, y: candidate.y + 1 })) {
    candidate = { ...candidate, y: candidate.y + 1 };
    distance += 1;
  }
  const next = { ...state, active: candidate, score: state.score + distance * 2 };
  return lockActive(next, [{ type: 'hard-dropped', piece: candidate.type, distance }]);
}

function rotate(state: GameState, direction: -1 | 1): GameTransition {
  if (!withActive(state)) return { state, events: [] };
  const target = nextRotation(state.active.rotation, direction);
  const wasGrounded = isGrounded(state.board, state.active);
  for (const kick of kickTests(state.active, target)) {
    const candidate: ActivePiece = {
      ...state.active,
      rotation: target,
      x: state.active.x + kick.x,
      y: state.active.y + kick.y,
    };
    if (!canPlace(state.board, candidate)) continue;
    const remainsGrounded = isGrounded(state.board, candidate);
    const canReset = wasGrounded && state.lockResets < MAX_LOCK_RESETS;
    return {
      state: {
        ...state,
        active: candidate,
        lockTicks: remainsGrounded ? (canReset ? 0 : state.lockTicks) : 0,
        lockResets: canReset ? state.lockResets + 1 : state.lockResets,
      },
      events: [{ type: 'piece-rotated', piece: candidate.type, direction }],
    };
  }
  return { state, events: [] };
}

function finishLineClear(state: GameState): GameTransition {
  const rows = [...state.pendingClearRows];
  const count = rows.length;
  const lines = state.lines + count;
  const level = Math.floor(lines / 10);
  const clearScore = (LINE_CLEAR_BASE_SCORE[count] ?? 0) * (level + 1);
  const cleared: GameState = {
    ...state,
    board: clearRows(state.board, rows),
    score: state.score + clearScore,
    lines,
    level,
    pendingClearRows: [],
    phaseTicks: 0,
  };
  const events: GameEvent[] = [{ type: 'lines-cleared', rows, count, score: clearScore }];
  if (level > state.level) events.push({ type: 'level-up', level });
  if (cleared.mode === 'race' && lines >= RACE_TARGET_LINES) {
    return {
      state: {
        ...cleared,
        active: null,
        phase: 'active',
        status: 'finished',
        gravityTicks: 0,
        lockTicks: 0,
        lockResets: 0,
      },
      events: [...events, { type: 'finished', completionTicks: cleared.elapsedTicks }],
    };
  }
  if (cleared.mode === 'puzzle') {
    const resolved = resolvePuzzleAfterLock(cleared, true);
    return { state: resolved.state, events: [...events, ...resolved.events] };
  }
  const spawned = spawnPiece(cleared);
  return { state: spawned.state, events: [...events, ...spawned.events] };
}

function tick(state: GameState): GameTransition {
  if (state.status !== 'playing') return { state, events: [] };
  let next: GameState = { ...state, elapsedTicks: state.elapsedTicks + 1 };

  if (next.phase === 'entry') {
    const phaseTicks = next.phaseTicks + 1;
    if (phaseTicks >= ENTRY_DELAY_TICKS) {
      const spawned = spawnPiece({ ...next, phaseTicks: 0 });
      return spawned;
    }
    return { state: { ...next, phaseTicks }, events: [] };
  }

  if (next.phase === 'line-clear') {
    const phaseTicks = next.phaseTicks + 1;
    if (phaseTicks >= LINE_CLEAR_DELAY_TICKS) return finishLineClear(next);
    return { state: { ...next, phaseTicks }, events: [] };
  }

  if (!withActive(next)) return invalidState(next);

  // Puzzle gravity is intentionally disabled. Fixed ticks still advance elapsed
  // deterministic time, but only a public hard-drop command may lock a piece.
  if (next.mode === 'puzzle') return { state: next, events: [] };

  if (isGrounded(next.board, next.active)) {
    next = { ...next, lockTicks: next.lockTicks + 1 };
    if (next.lockTicks >= LOCK_DELAY_TICKS) return lockActive(next);
  } else if (next.lockTicks !== 0) {
    next = { ...next, lockTicks: 0 };
  }

  const gravityTicks = next.gravityTicks + 1;
  if (gravityTicks >= gravityForMode(next.mode, next.level, next.pieceCount)) {
    const moved = moveActive({ ...next, gravityTicks: 0 }, 0, 1, 'gravity');
    return moved;
  }
  return { state: { ...next, gravityTicks }, events: [] };
}

export function dispatch(state: GameState, command: GameCommand): GameTransition {
  if (command.type === 'restart') {
    return {
      state: createInitialState(command.seed ?? state.seed, command.mode ?? state.mode, command.puzzleId ?? state.puzzleId ?? undefined),
      events: [{ type: 'restarted' }],
    };
  }
  if (command.type === 'start' && state.status === 'ready') {
    if (state.mode === 'puzzle') {
      const spawned = spawnPiece({ ...state, status: 'playing' });
      return { state: spawned.state, events: [{ type: 'started' }, ...spawned.events] };
    }
    return { state: { ...state, status: 'playing' }, events: [{ type: 'started' }] };
  }
  if (command.type === 'pause' && state.status === 'playing') {
    return { state: { ...state, status: 'paused' }, events: [{ type: 'paused' }] };
  }
  if (command.type === 'resume' && state.status === 'paused') {
    return { state: { ...state, status: 'playing' }, events: [{ type: 'resumed' }] };
  }
  if (command.type === 'tick') return tick(state);
  if (state.status !== 'playing' || state.phase !== 'active') return { state, events: [] };

  switch (command.type) {
    case 'move':
      return moveActive(state, command.dx, 0, 'move');
    case 'soft-drop':
      return moveActive(state, 0, 1, 'soft-drop');
    case 'hard-drop':
      return hardDrop(state);
    case 'rotate':
      return rotate(state, command.direction);
    default:
      return { state, events: [] };
  }
}

export function dropDistance(state: GameState): number {
  if (!withActive(state)) return 0;
  let distance = 0;
  while (canPlace(state.board, { ...state.active, y: state.active.y + distance + 1 })) distance += 1;
  return distance;
}

export function replay(seed: number, commands: readonly GameCommand[], mode: GameMode = 'marathon', puzzleId?: PuzzleId): GameState {
  return commands.reduce((state, command) => dispatch(state, command).state, createInitialState(seed, mode, puzzleId));
}

export function stateHash(state: GameState): string {
  // T3-only fields are irrelevant to Marathon/Race and intentionally omitted
  // there so their established replay hashes remain stable. Puzzle state hashes
  // include the entire authored campaign payload and outcome fields.
  const canonicalState = state.mode === 'puzzle'
    ? state
    : (() => {
      const {
        puzzleBoardRows: _puzzleBoardRows,
        puzzleQueue: _puzzleQueue,
        puzzleQueueIndex: _puzzleQueueIndex,
        puzzleGoal: _puzzleGoal,
        puzzleCompletion: _puzzleCompletion,
        completedLevelId: _completedLevelId,
        nextUnlockedLevelId: _nextUnlockedLevelId,
        ...legacyState
      } = state;
      return legacyState;
    })();
  const canonical = JSON.stringify(canonicalState);
  let hash = 2166136261;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
