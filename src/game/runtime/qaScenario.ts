import {
  VISIBLE_START_ROW,
  createInitialState,
  dispatch,
  stateHash,
  type GameCommand,
  type GameState,
  type PieceType,
  type Rotation,
} from '../core';

interface Route {
  state: GameState;
  commands: GameCommand[];
}

const PLANNER_COMMANDS: readonly GameCommand[] = [
  { type: 'move', dx: -1 },
  { type: 'move', dx: 1 },
  { type: 'rotate', direction: 1 },
  { type: 'rotate', direction: -1 },
];

function activeSignature(state: GameState): string {
  const active = state.active;
  return active ? `${active.type}:${active.rotation}:${active.x}:${active.y}:${state.lockResets}` : 'none';
}

function resolveLock(state: GameState): Route {
  let next = state;
  const commands: GameCommand[] = [];
  while (next.status === 'playing' && next.phase !== 'active') {
    const command: GameCommand = { type: 'tick' };
    next = dispatch(next, command).state;
    commands.push(command);
  }
  return { state: next, commands };
}

function boardCost(state: GameState, cleared: number): number {
  const heights: number[] = [];
  let holes = 0;
  for (let x = 0; x < state.board[0]!.length; x += 1) {
    let top = state.board.length;
    for (let y = VISIBLE_START_ROW; y < state.board.length; y += 1) {
      if (state.board[y]?.[x]) {
        top = y;
        break;
      }
    }
    heights.push(state.board.length - top);
    let filled = false;
    for (let y = VISIBLE_START_ROW; y < state.board.length; y += 1) {
      if (state.board[y]?.[x]) filled = true;
      else if (filled) holes += 1;
    }
  }
  const aggregate = heights.reduce((total, height) => total + height, 0);
  const bumpiness = heights.slice(1).reduce((total, height, index) => total + Math.abs(height - heights[index]!), 0);
  const maximum = Math.max(...heights);
  return cleared * 100_000 - holes * 180 - aggregate * 5 - bumpiness * 11 - maximum * 23;
}

function reachableLandings(state: GameState): Route[] {
  const queue: Route[] = [{ state, commands: [] }];
  const seen = new Set<string>([activeSignature(state)]);
  const landings: Route[] = [];

  for (let index = 0; index < queue.length; index += 1) {
    const route = queue[index]!;
    const locked = dispatch(route.state, { type: 'hard-drop' });
    const resolved = resolveLock(locked.state);
    if (resolved.state.status !== 'game-over') {
      landings.push({
        state: resolved.state,
        commands: [...route.commands, { type: 'hard-drop' }, ...resolved.commands],
      });
    }

    for (const command of PLANNER_COMMANDS) {
      const transition = dispatch(route.state, command);
      if (transition.state === route.state) continue;
      const signature = activeSignature(transition.state);
      if (seen.has(signature)) continue;
      seen.add(signature);
      queue.push({ state: transition.state, commands: [...route.commands, command] });
    }
  }
  return landings;
}

function settleLandingWithGravity(state: GameState, planned: Route): Route {
  let next = state;
  const commands: GameCommand[] = [];
  const startingPieceCount = state.pieceCount;

  for (const command of planned.commands) {
    if (command.type === 'hard-drop') break;
    next = dispatch(next, command).state;
    commands.push(command);
  }

  for (let guard = 0; guard < 5_000 && next.status === 'playing'; guard += 1) {
    if (next.pieceCount > startingPieceCount && next.phase === 'active' && next.active) break;
    const tick: GameCommand = { type: 'tick' };
    next = dispatch(next, tick).state;
    commands.push(tick);
  }
  return { state: next, commands };
}

export interface SurvivalBedrockQaReplay {
  commands: readonly GameCommand[];
  firstRiseCommandCount: number;
  removalCommandCount: number;
}

/** Builds public-command milestones for the first timed rise and five-line removal. */
export function createSurvivalBedrockQaReplay(seed = 0x51a1f00d): SurvivalBedrockQaReplay {
  let state = dispatch(createInitialState(seed, 'race'), { type: 'start' }).state;
  const commands: GameCommand[] = [{ type: 'start' }];
  let firstRiseCommandCount = 0;
  let removalCommandCount = 0;

  for (let piece = 0; piece < 120 && state.status === 'playing' && removalCommandCount === 0; piece += 1) {
    const options = reachableLandings(state);
    if (options.length === 0) throw new Error('Survival replay planner found no legal landing.');
    let selected = options[0]!;
    let selectedCost = boardCost(selected.state, selected.state.lines - state.lines);
    for (const candidate of options.slice(1)) {
      const candidateCost = boardCost(candidate.state, candidate.state.lines - state.lines);
      if (candidateCost > selectedCost) {
        selected = candidate;
        selectedCost = candidateCost;
      }
    }
    const previousRows = state.survivalBedrockRows;
    const settled = firstRiseCommandCount === 0
      ? settleLandingWithGravity(state, selected)
      : selected;
    commands.push(...settled.commands);
    state = settled.state;
    if (firstRiseCommandCount === 0 && state.survivalBedrockRows > previousRows) {
      firstRiseCommandCount = commands.length;
    } else if (firstRiseCommandCount > 0 && state.survivalBedrockRows < previousRows && state.lines >= 5) {
      removalCommandCount = commands.length;
    }
  }

  if (state.status !== 'playing' || firstRiseCommandCount === 0 || removalCommandCount === 0) {
    throw new Error(`Survival timed replay missed rise/removal: ${state.status}, ${state.lines} lines, ${state.survivalBedrockRows} rows.`);
  }
  return { commands, firstRiseCommandCount, removalCommandCount };
}

export function createSurvivalBedrockReplay(seed = 0x51a1f00d): readonly GameCommand[] {
  return createSurvivalBedrockQaReplay(seed).commands;
}

export function replaySurvivalBedrock(seed = 0x51a1f00d): {
  replay: SurvivalBedrockQaReplay;
  riseState: GameState;
  state: GameState;
} {
  const replay = createSurvivalBedrockQaReplay(seed);
  let state = createInitialState(seed, 'race');
  let riseState = state;
  replay.commands.forEach((command, index) => {
    state = dispatch(state, command).state;
    if (index + 1 === replay.firstRiseCommandCount) riseState = state;
  });
  return { replay, riseState, state };
}

interface PuzzleQaPlacement {
  type: PieceType;
  rotation: Rotation;
  x: number;
}

const PUZZLE_CHALLENGE_QA_ROUTE: readonly PuzzleQaPlacement[] = [
  { type: 'S', rotation: 1, x: 2 },
  { type: 'L', rotation: 0, x: 4 },
  { type: 'O', rotation: 0, x: 4 },
  { type: 'T', rotation: 2, x: 7 },
  { type: 'J', rotation: 2, x: 4 },
  { type: 'I', rotation: 1, x: -1 },
  { type: 'Z', rotation: 1, x: 1 },
  { type: 'I', rotation: 1, x: -2 },
  { type: 'S', rotation: 1, x: 6 },
  { type: 'J', rotation: 1, x: 1 },
  { type: 'T', rotation: 3, x: 8 },
  { type: 'Z', rotation: 1, x: 4 },
  { type: 'O', rotation: 0, x: 3 },
  { type: 'L', rotation: 1, x: 3 },
  { type: 'Z', rotation: 1, x: 1 },
  { type: 'T', rotation: 1, x: 6 },
  { type: 'O', rotation: 0, x: 0 },
  { type: 'L', rotation: 1, x: 7 },
  { type: 'S', rotation: 1, x: 4 },
  { type: 'J', rotation: 0, x: 0 },
  { type: 'I', rotation: 1, x: 7 },
  { type: 'O', rotation: 0, x: 2 },
  { type: 'L', rotation: 1, x: 3 },
  { type: 'Z', rotation: 1, x: 7 },
  { type: 'T', rotation: 3, x: 6 },
  { type: 'S', rotation: 1, x: 4 },
  { type: 'I', rotation: 1, x: -1 },
  { type: 'J', rotation: 1, x: -1 },
  { type: 'Z', rotation: 1, x: 7 },
  { type: 'S', rotation: 1, x: 5 },
  { type: 'O', rotation: 0, x: 2 },
  { type: 'I', rotation: 0, x: 1 },
  { type: 'T', rotation: 2, x: 6 },
  { type: 'J', rotation: 2, x: 3 },
  { type: 'L', rotation: 2, x: 0 },
];

function qaRotationCommands(rotation: Rotation): readonly GameCommand[] {
  if (rotation === 1) return [{ type: 'rotate', direction: 1 }];
  if (rotation === 2) return [{ type: 'rotate', direction: 1 }, { type: 'rotate', direction: 1 }];
  if (rotation === 3) return [{ type: 'rotate', direction: -1 }];
  return [];
}

/** A complete public-command-only normal-play Puzzle route with ordinary delayed resolution. */
export function replayPuzzleChallenge(seed = 0x51a1f00d): { commands: readonly GameCommand[]; state: GameState; hash: string } {
  let state = createInitialState(seed, 'puzzle', 't3r-shaft-01');
  const commands: GameCommand[] = [];
  const apply = (command: GameCommand): void => {
    commands.push(command);
    state = dispatch(state, command).state;
  };

  apply({ type: 'start' });
  for (const placement of PUZZLE_CHALLENGE_QA_ROUTE) {
    if (!state.active || state.active.type !== placement.type) {
      throw new Error(`Puzzle challenge QA route expected ${placement.type}, received ${state.active?.type ?? 'none'}.`);
    }
    for (const command of qaRotationCommands(placement.rotation)) apply(command);
    while (state.active && state.active.x !== placement.x) {
      const beforeX: number = state.active.x;
      apply({ type: 'move', dx: placement.x < beforeX ? -1 : 1 });
      if (state.active?.x === beforeX) throw new Error(`Puzzle challenge QA route could not reach x=${placement.x}.`);
    }
    apply({ type: 'hard-drop' });
    for (let guard = 0; state.status === 'playing' && (!state.active || state.phase !== 'active') && guard < 64; guard += 1) {
      apply({ type: 'tick' });
    }
  }

  if (state.status !== 'finished' || state.lines !== 22 || state.pieceCount !== 35 || state.puzzleCompletion !== 'finished') {
    throw new Error(`Puzzle challenge replay did not finish: ${state.status}, ${state.lines} lines, ${state.pieceCount} pieces.`);
  }
  return { commands, state, hash: stateHash(state) };
}
