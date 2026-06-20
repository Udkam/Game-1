// Thin stateful wrapper over the pure engine: holds the current level, the live
// state, an undo stack of snapshots, and the move log (for server validation).

import type { Dir, GameState, Level, MoveResult, MoveToken } from '../engine/types.js';
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
