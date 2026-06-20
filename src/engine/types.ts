// Core data model for the Driftbox engine. Pure, framework-agnostic, shared by
// the web client, the Fastify server, and the offline solver/verifier.

export type Dir = 'up' | 'down' | 'left' | 'right';

export const DIRS: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** A serialized move: a plain direction (push/walk) or `@dir` for a grab/pull.
 *  Used in the move log, stored solutions, and server replay. */
export type MoveToken = Dir | `@${Dir}`;

/**
 * Crate / goal colors. `natural` is the uncolored crate and the "any" goal that
 * accepts a crate of any color. The remaining four are a muted, hand-picked
 * palette used for color-matching levels.
 */
export type Color = 'natural' | 'rose' | 'sage' | 'slate' | 'amber';

export const COLORS: Color[] = ['natural', 'rose', 'sage', 'slate', 'amber'];

export type Terrain = 'wall' | 'floor' | 'ice' | 'pit';

export interface Cell {
  terrain: Terrain;
  /** null = not a goal; 'natural' = accepts any crate; a color = needs that color. */
  goal: Color | null;
  /** Pressure plate group id, or null. A plate is "pressed" when a weight rests on it. */
  plateGroup: string | null;
  /** Gate group id, or null. Gate is closed (blocks) unless its group is satisfied. */
  gateGroup: string | null;
  /** Portal pair id, or null. Player-only: stepping onto a portal warps to its
   *  partner; crates treat portals as walls. */
  portal: string | null;
  /** One-way arrow: a cell can only be entered when moving in this direction. */
  arrow: Dir | null;
  /** Cracked floor: collapses into a pit once the player steps off it. */
  cracked: boolean;
  /** Key group: stepping here collects the key, opening locks of the same group. */
  key: string | null;
  /** Lock group: blocks like a wall until the matching key has been collected. */
  lock: string | null;
}

export interface Crate {
  id: number;
  x: number;
  y: number;
  color: Color;
}

/** Immutable, per-level static data. Never mutated during play. */
export interface Level {
  id: string;
  name: string;
  subtitle: string;
  /** One-line teaching blurb shown the first time a mechanic appears. */
  intro: string;
  width: number;
  height: number;
  cells: Cell[]; // row-major, length === width * height
  /** Initial player position. */
  start: { x: number; y: number };
  /** Initial crates. */
  crates: Crate[];
  /** Gate opens when pressed-plate count in the group >= threshold (default = #plates in group). */
  gateThreshold: Record<string, number>;
  /** For each cell index, the partner portal cell index, or -1 if not a portal. */
  portalPartner: number[];
  /** Optimal push count, filled in by the solver / cached. */
  par?: number;
  /** A pre-verified solution (generated levels carry one so tests need not re-solve).
   *  Tokens, so hand-authored pull/grab levels can encode `@dir` moves. */
  solution?: MoveToken[];
}

/** Mutable game state. Kept deliberately small so undo snapshots are cheap. */
export interface GameState {
  playerX: number;
  playerY: number;
  crates: Crate[];
  /** Cell indices of pits (incl. collapsed cracked floor) filled by a sacrificed crate. */
  filled: number[];
  /** Cell indices of cracked floor that has collapsed into a pit. */
  collapsed: number[];
  /** Key groups the player has collected. */
  keys: string[];
  moves: number;
  pushes: number;
}

/** Describes what a single move did, so the UI can animate it precisely. */
export interface MoveEffect {
  dir: Dir;
  player: { from: { x: number; y: number }; to: { x: number; y: number } };
  /** True when the player stepped through a portal (render should warp, not slide). */
  teleported?: boolean;
  crate?: {
    id: number;
    from: { x: number; y: number };
    to: { x: number; y: number };
    /** True when the crate slid across ice (longer travel than one cell). */
    slid: boolean;
    /** True when the crate fell into a pit and was consumed. */
    sank: boolean;
  };
  /** Cell index of a pit filled by this move, if any. */
  filledPit?: number;
  /** Cell index of cracked floor that collapsed this move, if any. */
  collapsed?: number;
  /** True when this was a pull/grab: the player backed away dragging the crate
   *  behind it (so the avatar should face opposite its travel direction). */
  pulled?: boolean;
}

export interface MoveResult {
  changed: boolean;
  state: GameState;
  effect?: MoveEffect;
}

export const idx = (level: Pick<Level, 'width'>, x: number, y: number): number =>
  y * level.width + x;
