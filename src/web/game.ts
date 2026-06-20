// Thin stateful wrapper over the pure engine: holds the current level, the live
// state, an undo stack of snapshots, and the move log (for server validation).

import type { Dir, GameState, Level, MoveResult, MoveToken } from '../engine/types.js';
import { OPPOSITE } from '../engine/types.js';
import { initialState } from '../engine/level.js';
import { applyMove, isSolved } from '../engine/rules.js';

export class Game {
  readonly level: Level;
  state: GameState;
  solved: boolean;
  private undoStack: GameState[] = [];
  private undos = 0; // count of undo presses this run (for the "clean run" challenge)
  /** Effective move tokens taken (kept in sync with undo). For server replay. */
  readonly log: MoveToken[] = [];

  constructor(level: Level) {
    this.level = level;
    this.state = initialState(level);
    this.solved = isSolved(level, this.state);
  }

  /** Attempt a move (or a pull/grab when `pull` is set). Returns the MoveResult
   *  if something changed, else null. */
  move(dir: Dir, pull = false): MoveResult | null {
    if (this.solved) return null;
    const res = applyMove(this.level, this.state, dir, pull);
    if (!res.changed) return null;
    this.undoStack.push(this.state);
    this.log.push(pull ? `@${dir}` : dir);
    this.state = res.state;
    this.solved = isSolved(this.level, this.state);
    return res;
  }

  undo(): boolean {
    const prev = this.undoStack.pop();
    if (!prev) return false;
    this.state = prev;
    this.log.pop();
    this.undos++;
    this.solved = false;
    return true;
  }

  restart(): void {
    this.undoStack = [];
    this.log.length = 0;
    this.undos = 0;
    this.state = initialState(this.level);
    this.solved = false;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  /** True if any undo was used since the last restart — for the clean-run medal. */
  get usedUndo(): boolean {
    return this.undos > 0;
  }
  get moves(): number {
    return this.state.moves;
  }
  get pushes(): number {
    return this.state.pushes;
  }
}

/** Two boards played in parallel by one input (a diptych). Snapshots are kept for
 *  the pair together so undo always reverts both in lockstep — even when one
 *  board was blocked while the other moved. Solved only when BOTH are solved. */
export class DiptychGame {
  readonly level: Level; // the "left" level; carries .twin
  readonly twin: Level;
  a: GameState;
  b: GameState;
  readonly log: MoveToken[] = [];
  private stack: { a: GameState; b: GameState }[] = [];
  private undos = 0;
  private solvedA = false;
  private solvedB = false;

  constructor(level: Level) {
    this.level = level;
    this.twin = level.twin!;
    this.a = initialState(level);
    this.b = initialState(this.twin);
    this.refresh();
  }

  private twinDir(dir: Dir): Dir {
    return this.level.mirrorTwin && (dir === 'left' || dir === 'right') ? OPPOSITE[dir] : dir;
  }

  /** Apply one input to both boards. Returns each board's MoveResult, or null if
   *  neither board changed. */
  move(dir: Dir, pull = false): { a: MoveResult; b: MoveResult } | null {
    if (this.solved) return null;
    const aRes = applyMove(this.level, this.a, dir, pull);
    const bRes = applyMove(this.twin, this.b, this.twinDir(dir), pull);
    if (!aRes.changed && !bRes.changed) return null;
    this.stack.push({ a: this.a, b: this.b });
    this.a = aRes.state;
    this.b = bRes.state;
    this.log.push(pull ? `@${dir}` : dir);
    this.refresh();
    return { a: aRes, b: bRes };
  }

  undo(): boolean {
    const prev = this.stack.pop();
    if (!prev) return false;
    this.a = prev.a;
    this.b = prev.b;
    this.log.pop();
    this.undos++;
    this.refresh();
    return true;
  }

  restart(): void {
    this.a = initialState(this.level);
    this.b = initialState(this.twin);
    this.stack = [];
    this.log.length = 0;
    this.undos = 0;
    this.refresh();
  }

  private refresh(): void {
    this.solvedA = isSolved(this.level, this.a);
    this.solvedB = isSolved(this.twin, this.b);
  }

  get canUndo(): boolean {
    return this.stack.length > 0;
  }
  get usedUndo(): boolean {
    return this.undos > 0;
  }
  get moves(): number {
    return this.log.length;
  }
  get pushes(): number {
    return this.a.pushes + this.b.pushes;
  }
  get solved(): boolean {
    return this.solvedA && this.solvedB;
  }
}
