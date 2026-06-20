// The single source of truth for game rules. Used by the client (play), the
// server (authoritative replay/validation), and the solver (verification).
//
// Design choices that keep the rules deterministic and unambiguous:
//  - Only crates slide on ice; the player walks normally ("heavy crates, you
//    wear grippy boots"). This preserves the strategic core of ice — committing
//    a crate to a trajectory you can't take back — without navigation frustration.
//  - The player can never step into an unfilled pit (it acts as a wall for the
//    player); a crate pushed into a pit fills it permanently and is consumed.
//  - Gate openness is evaluated from the state at the *start* of a move and held
//    constant for the whole move resolution, then recomputed for the next move.

import type { Cell, Crate, Dir, GameState, Level, MoveEffect, MoveResult } from './types.js';
import { DIRS, OPPOSITE, idx } from './types.js';

export function cellAt(level: Level, x: number, y: number): Cell | null {
  if (x < 0 || y < 0 || x >= level.width || y >= level.height) return null;
  return level.cells[idx(level, x, y)] ?? null;
}

export function crateAt(state: GameState, x: number, y: number): Crate | undefined {
  return state.crates.find((c) => c.x === x && c.y === y);
}

/** How many plates of a group are currently weighed down (by player or a crate). */
export function pressedPlateCount(level: Level, state: GameState, group: string): number {
  let n = 0;
  for (let i = 0; i < level.cells.length; i++) {
    if (level.cells[i]!.plateGroup !== group) continue;
    const x = i % level.width;
    const y = Math.floor(i / level.width);
    const weighed =
      (state.playerX === x && state.playerY === y) ||
      state.crates.some((c) => c.x === x && c.y === y);
    if (weighed) n++;
  }
  return n;
}

export function computeOpenGates(level: Level, state: GameState): Set<string> {
  const open = new Set<string>();
  for (const group of Object.keys(level.gateThreshold)) {
    if (pressedPlateCount(level, state, group) >= level.gateThreshold[group]!) open.add(group);
  }
  return open;
}

function isFilled(state: GameState, index: number): boolean {
  return state.filled.includes(index);
}

/** A "hole" a crate can fall into / fill and the player can't cross: an unfilled
 *  pit, or cracked floor that has collapsed (and isn't yet filled). */
function isHole(level: Level, state: GameState, x: number, y: number): boolean {
  const i = idx(level, x, y);
  if (isFilled(state, i)) return false;
  const cell = cellAt(level, x, y);
  if (!cell) return false;
  if (cell.terrain === 'pit') return true;
  if (cell.cracked && state.collapsed.includes(i)) return true;
  return false;
}

function locked(state: GameState, cell: Cell): boolean {
  return !!cell.lock && !state.keys.includes(cell.lock);
}

/** Can the player step onto (x, y)? Crates block; pushing is handled separately. */
export function playerCanEnter(
  level: Level,
  state: GameState,
  x: number,
  y: number,
  openGates: Set<string>,
): boolean {
  const cell = cellAt(level, x, y);
  if (!cell || cell.terrain === 'wall') return false;
  if (isHole(level, state, x, y)) return false;
  if (cell.gateGroup && !openGates.has(cell.gateGroup)) return false;
  if (locked(state, cell)) return false;
  if (crateAt(state, x, y)) return false;
  return true;
}

/** Can a crate (other than the one moving) occupy (x, y)? Holes are enterable (they get filled). */
function crateCanEnter(
  level: Level,
  state: GameState,
  x: number,
  y: number,
  openGates: Set<string>,
  movingId: number,
): boolean {
  const cell = cellAt(level, x, y);
  if (!cell || cell.terrain === 'wall') return false;
  if (cell.portal) return false; // crates can't enter portals (player-only)
  if (cell.gateGroup && !openGates.has(cell.gateGroup)) return false;
  if (locked(state, cell)) return false;
  const other = state.crates.find((c) => c.x === x && c.y === y && c.id !== movingId);
  if (other) return false;
  return true;
}

interface PushOutcome {
  moved: boolean;
  sank: boolean;
  to: { x: number; y: number };
  fillIndex?: number;
}

/** Resolve a crate being pushed in `dir`, including any slide across ice. */
function resolveCratePush(
  level: Level,
  state: GameState,
  crate: Crate,
  dir: Dir,
  openGates: Set<string>,
): PushOutcome {
  const { dx, dy } = DIRS[dir];
  // A crate may enter (x,y) if it's not blocked AND a one-way arrow there permits `dir`.
  const mayEnter = (x: number, y: number): boolean => {
    const cell = cellAt(level, x, y);
    if (!cell) return false;
    if (cell.arrow && cell.arrow !== dir) return false;
    return crateCanEnter(level, state, x, y, openGates, crate.id);
  };

  let nx = crate.x + dx;
  let ny = crate.y + dy;
  if (!mayEnter(nx, ny)) {
    return { moved: false, sank: false, to: { x: crate.x, y: crate.y } };
  }

  let cx = crate.x;
  let cy = crate.y;
  // Step the crate forward; keep sliding while it lands on ice and the way is clear.
  for (;;) {
    if (isHole(level, state, nx, ny)) {
      return { moved: true, sank: true, to: { x: nx, y: ny }, fillIndex: idx(level, nx, ny) };
    }
    cx = nx;
    cy = ny;
    if (cellAt(level, cx, cy)!.terrain !== 'ice') break; // landed on solid ground -> stop
    const px = cx + dx;
    const py = cy + dy;
    if (!mayEnter(px, py)) break; // blocked -> stop on ice
    nx = px;
    ny = py;
  }
  return { moved: true, sank: false, to: { x: cx, y: cy } };
}

const manhattan = (a: { x: number; y: number }, b: { x: number; y: number }): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

/** Parse a serialized move token (`up` / `@up`) into a direction + pull flag. */
export function parseToken(token: string): { dir: Dir; pull: boolean } | null {
  const pull = token.startsWith('@');
  const d = (pull ? token.slice(1) : token) as Dir;
  if (d !== 'up' && d !== 'down' && d !== 'left' && d !== 'right') return null;
  return { dir: d, pull };
}

/** Apply a serialized token (push/walk or `@`-prefixed pull). Used by replay. */
export function applyToken(level: Level, state: GameState, token: string): MoveResult {
  const p = parseToken(token);
  if (!p) return { changed: false, state };
  return applyMove(level, state, p.dir, p.pull);
}

/** Grab/pull: the player steps in `dir` and drags the crate directly behind it
 *  into its old cell — overturning the push-only rule. One cell, no ice slide
 *  (deterministic): the crate is set down on the cell the player just vacated. */
function applyPull(level: Level, state: GameState, dir: Dir, openGates: Set<string>): MoveResult {
  const { dx, dy } = DIRS[dir];
  const from = { x: state.playerX, y: state.playerY };
  const tx = from.x + dx;
  const ty = from.y + dy;
  const bx = from.x - dx;
  const by = from.y - dy;

  // The player must be able to step forward (arrows/gates/locks/holes/crates apply).
  const destCell = cellAt(level, tx, ty);
  if (destCell?.arrow && destCell.arrow !== dir) return { changed: false, state };
  if (destCell?.portal) return { changed: false, state }; // no portal-pull
  if (!playerCanEnter(level, state, tx, ty, openGates)) return { changed: false, state };

  // There must be a crate directly behind to drag into the player's old cell.
  const dragged = crateAt(state, bx, by);
  if (!dragged) return { changed: false, state };
  const pCell = cellAt(level, from.x, from.y)!;
  if (pCell.arrow && pCell.arrow !== dir) return { changed: false, state };
  if (!crateCanEnter(level, state, from.x, from.y, openGates, dragged.id)) return { changed: false, state };

  const crates = state.crates.map((c) =>
    c.id === dragged.id ? { ...c, x: from.x, y: from.y } : c,
  );
  // Cracked floor under `from` does NOT collapse: the dragged crate now rests on
  // it (a weight holds cracked floor). Key pickup still applies at the destination.
  let keys = state.keys;
  if (destCell?.key && !keys.includes(destCell.key)) keys = [...keys, destCell.key];

  const next: GameState = {
    playerX: tx,
    playerY: ty,
    crates,
    filled: state.filled,
    collapsed: state.collapsed,
    keys,
    moves: state.moves + 1,
    pushes: state.pushes + 1,
  };
  const effect: MoveEffect = {
    dir,
    player: { from, to: { x: tx, y: ty } },
    crate: { id: dragged.id, from: { x: bx, y: by }, to: { x: from.x, y: from.y }, slid: false, sank: false },
    pulled: true,
  };
  return { changed: true, state: next, effect };
}

/** Gravity tilt: every crate and the player slide maximally in `dir` until
 *  blocked by a wall, a hole, the board edge, or an already-settled piece (the
 *  player is a solid blocker). Leading pieces resolve first so they stack. */
function applyTilt(level: Level, state: GameState, dir: Dir): MoveResult {
  const { dx, dy } = DIRS[dir];
  const proj = (x: number, y: number) => x * dx + y * dy;
  interface Piece { x: number; y: number; player: boolean; id: number }
  const pieces: Piece[] = state.crates.map((c) => ({ x: c.x, y: c.y, player: false, id: c.id }));
  pieces.push({ x: state.playerX, y: state.playerY, player: true, id: -1 });
  // Resolve the leading edge first (largest projection along the tilt).
  pieces.sort((a, b) => proj(b.x, b.y) - proj(a.x, a.y));

  const occupied = new Set<number>();
  const settled = new Map<number, { x: number; y: number }>();
  for (const p of pieces) {
    let x = p.x;
    let y = p.y;
    for (;;) {
      const nx = x + dx;
      const ny = y + dy;
      const cell = cellAt(level, nx, ny);
      if (!cell || cell.terrain === 'wall') break;
      if (occupied.has(idx(level, nx, ny))) break;
      if (isHole(level, state, nx, ny)) break; // gravity levels avoid holes; stop at the edge
      x = nx;
      y = ny;
    }
    occupied.add(idx(level, x, y));
    settled.set(p.id, { x, y });
  }

  let moved = false;
  const crates = state.crates.map((c) => {
    const s = settled.get(c.id)!;
    if (s.x !== c.x || s.y !== c.y) moved = true;
    return { ...c, x: s.x, y: s.y };
  });
  const ps = settled.get(-1)!;
  if (ps.x !== state.playerX || ps.y !== state.playerY) moved = true;
  if (!moved) return { changed: false, state };

  const from = { x: state.playerX, y: state.playerY };
  const next: GameState = {
    ...state,
    playerX: ps.x,
    playerY: ps.y,
    crates,
    moves: state.moves + 1,
  };
  const effect: MoveEffect = { dir, player: { from, to: { x: ps.x, y: ps.y } }, tilted: true };
  return { changed: true, state: next, effect };
}

/** Apply one move. Returns a brand-new immutable state (or the same one if blocked). */
export function applyMove(level: Level, state: GameState, dir: Dir, pull = false): MoveResult {
  const openGates = computeOpenGates(level, state);
  if (level.gravity) return applyTilt(level, state, dir);
  // Mirror tile: while standing on one, left/right intent is reversed. Derived
  // from the current cell, so replay/solver stay deterministic (log keeps the
  // pressed direction; the effect uses the actually-travelled one).
  const here = cellAt(level, state.playerX, state.playerY);
  if (here?.mirror && (dir === 'left' || dir === 'right')) dir = OPPOSITE[dir];
  const { dx, dy } = DIRS[dir];
  if (pull) return applyPull(level, state, dir, openGates);
  const tx = state.playerX + dx;
  const ty = state.playerY + dy;
  const from = { x: state.playerX, y: state.playerY };
  const targetCell = cellAt(level, tx, ty);

  // A one-way arrow gates entry into (tx,ty) for the player too.
  if (targetCell?.arrow && targetCell.arrow !== dir) return { changed: false, state };

  const target = crateAt(state, tx, ty);
  let destX = tx;
  let destY = ty;
  let teleported = false;
  let crates = state.crates;
  let filled = state.filled;
  let pushes = state.pushes;
  let effectCrate: MoveEffect['crate'] | undefined;
  let filledPit: number | undefined;

  if (target) {
    const push = resolveCratePush(level, state, target, dir, openGates);
    if (!push.moved) return { changed: false, state };
    const slid = !push.sank && manhattan({ x: target.x, y: target.y }, push.to) > 1;
    if (push.sank) {
      crates = state.crates.filter((c) => c.id !== target.id);
      filled = [...state.filled, push.fillIndex!];
      filledPit = push.fillIndex!;
    } else {
      crates = state.crates.map((c) =>
        c.id === target.id ? { ...c, x: push.to.x, y: push.to.y } : c,
      );
    }
    pushes = state.pushes + 1;
    effectCrate = { id: target.id, from: { x: target.x, y: target.y }, to: push.to, slid, sank: push.sank };
  } else if (targetCell?.portal) {
    // Stepping onto a portal warps the player to its partner cell.
    const partner = level.portalPartner[idx(level, tx, ty)] ?? -1;
    if (partner < 0) return { changed: false, state };
    const wx = partner % level.width;
    const wy = Math.floor(partner / level.width);
    if (!playerCanEnter(level, state, wx, wy, openGates)) return { changed: false, state };
    destX = wx;
    destY = wy;
    teleported = true;
  } else if (!playerCanEnter(level, state, tx, ty, openGates)) {
    return { changed: false, state };
  }

  // Cracked floor under the player collapses into a pit once they step off it.
  let collapsed = state.collapsed;
  let collapsedNow: number | undefined;
  const fromCell = cellAt(level, from.x, from.y);
  if (fromCell?.cracked) {
    const fi = idx(level, from.x, from.y);
    if (!collapsed.includes(fi)) {
      collapsed = [...collapsed, fi];
      collapsedNow = fi;
    }
  }

  // Collect a key on the destination cell.
  let keys = state.keys;
  const destCell = cellAt(level, destX, destY);
  if (destCell?.key && !keys.includes(destCell.key)) keys = [...keys, destCell.key];

  const next: GameState = {
    playerX: destX,
    playerY: destY,
    crates,
    filled,
    collapsed,
    keys,
    moves: state.moves + 1,
    pushes,
  };
  const effect: MoveEffect = { dir, player: { from, to: { x: destX, y: destY } } };
  if (effectCrate) effect.crate = effectCrate;
  if (filledPit !== undefined) effect.filledPit = filledPit;
  if (collapsedNow !== undefined) effect.collapsed = collapsedNow;
  if (teleported) effect.teleported = true;
  return { changed: true, state: next, effect };
}

/** Every goal covered by a crate of the right color? */
export function isSolved(level: Level, state: GameState): boolean {
  for (let i = 0; i < level.cells.length; i++) {
    const goal = level.cells[i]!.goal;
    if (!goal) continue;
    const x = i % level.width;
    const y = Math.floor(i / level.width);
    const crate = crateAt(state, x, y);
    if (!crate) return false;
    if (goal !== 'natural' && crate.color !== goal) return false;
  }
  return true;
}

/** Canonical key for solver/dedup. Crates are sorted so identical layouts collapse. */
export function stateKey(state: GameState): string {
  const cr = state.crates
    .map((c) => `${c.x},${c.y},${c.color}`)
    .sort()
    .join('|');
  const fl = [...state.filled].sort((a, b) => a - b).join(',');
  const co = [...state.collapsed].sort((a, b) => a - b).join(',');
  const ky = [...state.keys].sort().join(',');
  return `${state.playerX},${state.playerY};${cr};${fl};${co};${ky}`;
}
