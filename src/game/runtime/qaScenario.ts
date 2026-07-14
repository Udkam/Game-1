import {
  VISIBLE_START_ROW,
  createInitialState,
  dispatch,
  stateHash,
  type GameCommand,
  type GameState,
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

/**
 * Produces a deterministic, command-only Race completion replay. The planner reads
 * normal simulation states to choose public movement, rotation, hard-drop, and tick
 * commands; it never creates or mutates a canonical board.
 */
export function createRaceCompletionReplay(seed = 0x51a1f00d): readonly GameCommand[] {
  let state = dispatch(createInitialState(seed, 'race'), { type: 'start' }).state;
  const commands: GameCommand[] = [{ type: 'start' }];

  for (let piece = 0; piece < 180 && state.status === 'playing'; piece += 1) {
    const options = reachableLandings(state);
    if (options.length === 0) throw new Error('Race replay planner found no legal landing.');
    let selected = options[0]!;
    let selectedCost = boardCost(selected.state, selected.state.lines - state.lines);
    for (const candidate of options.slice(1)) {
      const candidateCost = boardCost(candidate.state, candidate.state.lines - state.lines);
      if (candidateCost > selectedCost) {
        selected = candidate;
        selectedCost = candidateCost;
      }
    }
    commands.push(...selected.commands);
    state = selected.state;
  }

  if (state.status !== 'finished') {
    throw new Error(`Race replay did not finish: ${state.status} after ${state.lines} lines.`);
  }
  return commands;
}

export function replayRaceCompletion(seed = 0x51a1f00d): { commands: readonly GameCommand[]; state: GameState } {
  const commands = createRaceCompletionReplay(seed);
  let state = createInitialState(seed, 'race');
  for (const command of commands) state = dispatch(state, command).state;
  return { commands, state };
}

/** A public-command-only T3 route with ordinary delayed line resolution. */
export function replayPuzzleRotation(seed = 0x51a1f00d): { commands: readonly GameCommand[]; state: GameState; hash: string } {
  const commands: readonly GameCommand[] = [
    { type: 'start' },
    { type: 'rotate', direction: -1 },
    { type: 'hard-drop' },
    { type: 'tick' }, { type: 'tick' }, { type: 'tick' },
    { type: 'move', dx: -1 }, { type: 'move', dx: -1 }, { type: 'move', dx: -1 },
    { type: 'rotate', direction: -1 }, { type: 'move', dx: -1 },
    { type: 'hard-drop' },
    { type: 'tick' }, { type: 'tick' }, { type: 'tick' },
    { type: 'move', dx: 1 }, { type: 'move', dx: 1 }, { type: 'move', dx: 1 },
    { type: 'rotate', direction: 1 }, { type: 'move', dx: 1 },
    { type: 'hard-drop' },
    { type: 'tick' }, { type: 'tick' }, { type: 'tick' }, { type: 'tick' },
    { type: 'tick' }, { type: 'tick' }, { type: 'tick' }, { type: 'tick' },
    { type: 'tick' }, { type: 'tick' }, { type: 'tick' }, { type: 'tick' },
  ];
  let state = createInitialState(seed, 'puzzle', 't3r-shaft-01');
  for (const command of commands) state = dispatch(state, command).state;
  if (state.status !== 'finished' || state.lines !== 4 || state.pieceCount !== 3 || state.puzzleCompletion !== 'finished') {
    throw new Error(`Puzzle rotation replay did not finish: ${state.status}, ${state.lines} lines, ${state.pieceCount} pieces.`);
  }
  return { commands, state, hash: stateHash(state) };
}
