// Thin stateful wrapper over the pure engine: holds the current level, the live
// state, an undo stack of snapshots, and the move log (for server validation).

import type { Dir, GameState, Level, MoveResult } from '../engine/types.js';
import { initialState } from '../engine/level.js';
import { applyMove, isSolved } from '../engine/rules.js';

export class Game {
  readonly level: Level;
  state: GameState;
  solved: boolean;
  private undoStack: GameState[] = [];
  /** Effective move directions taken (kept in sync with undo). For server replay. */
  readonly log: Dir[] = [];

  constructor(level: Level) {
    this.level = level;
    this.state = initialState(level);
    this.solved = isSolved(level, this.state);
  }

  /** Attempt a move. Returns the MoveResult if something changed, else null. */
  move(dir: Dir): MoveResult | null {
    if (this.solved) return null;
    const res = applyMove(this.level, this.state, dir);
    if (!res.changed) return null;
    this.undoStack.push(this.state);
    this.log.push(dir);
    this.state = res.state;
    this.solved = isSolved(this.level, this.state);
    return res;
  }

  undo(): boolean {
    const prev = this.undoStack.pop();
    if (!prev) return false;
    this.state = prev;
    this.log.pop();
    this.solved = false;
    return true;
  }

  restart(): void {
    this.undoStack = [];
    this.log.length = 0;
    this.state = initialState(this.level);
    this.solved = false;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }
  get moves(): number {
    return this.state.moves;
  }
  get pushes(): number {
    return this.state.pushes;
  }
}
