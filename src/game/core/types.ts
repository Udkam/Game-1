export const PIECE_TYPES = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'] as const;

export type PieceType = (typeof PIECE_TYPES)[number];
export type Rotation = 0 | 1 | 2 | 3;

export interface Cell {
  x: number;
  y: number;
}

export interface ActivePiece {
  type: PieceType;
  rotation: Rotation;
  x: number;
  y: number;
}

export type BoardCell = PieceType | null;
export type Board = BoardCell[][];

export interface RandomizerState {
  seed: number;
  bag: PieceType[];
}

export type GameStatus = 'ready' | 'playing' | 'paused' | 'game-over' | 'finished';
export type GamePhase = 'active' | 'entry' | 'line-clear';
export type GameMode = 'marathon' | 'race' | 'puzzle';
export type PuzzleId =
  | 't3r-shaft-01'
  | 't3r-shaft-02'
  | 't3r-shaft-03'
  | 't3r-shaft-04'
  | 't3r-cascade-05'
  | 't3r-cascade-06';

export type PuzzleGoal = 'canonical-board-empty';
export type PuzzleCompletion =
  | 'active'
  | 'finished'
  | 'failed-top-out'
  | 'failed-invalid-spawn'
  | 'failed-budget';

export interface GameState {
  board: Board;
  active: ActivePiece | null;
  queue: PieceType[];
  score: number;
  lines: number;
  level: number;
  mode: GameMode;
  puzzleId: PuzzleId | null;
  /**
   * Temporary presentation bridge for the frozen T2 shell. Puzzle core rules
   * never read this field: T3 success is exclusively canonical-board-empty.
   * @deprecated Remove when the presentation shell consumes puzzleGoal.
   */
  puzzleTargetLines: number | null;
  puzzlePieceBudget: number | null;
  /** Immutable authored visible board source; the mutable canonical board is above. */
  puzzleBoardRows: readonly string[] | null;
  /** Immutable full authored sequence, including the currently active item. */
  puzzleQueue: readonly PieceType[] | null;
  /** Number of authored items successfully spawned into active play. */
  puzzleQueueIndex: number;
  puzzleGoal: PuzzleGoal | null;
  puzzleCompletion: PuzzleCompletion | null;
  completedLevelId: PuzzleId | null;
  nextUnlockedLevelId: PuzzleId | null;
  pieceCount: number;
  status: GameStatus;
  phase: GamePhase;
  phaseTicks: number;
  pendingClearRows: number[];
  gravityTicks: number;
  lockTicks: number;
  lockResets: number;
  elapsedTicks: number;
  randomizer: RandomizerState;
  seed: number;
}

export type GameCommand =
  | { type: 'start' }
  | { type: 'tick' }
  | { type: 'move'; dx: -1 | 1 }
  | { type: 'soft-drop' }
  | { type: 'hard-drop' }
  | { type: 'rotate'; direction: -1 | 1 }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'restart'; seed?: number; mode?: GameMode; puzzleId?: PuzzleId };

export type GameEvent =
  | { type: 'started' }
  | { type: 'restarted' }
  | { type: 'paused' }
  | { type: 'resumed' }
  | { type: 'piece-moved'; piece: PieceType; dx: number; dy: number; cause: 'move' | 'gravity' | 'soft-drop' }
  | { type: 'piece-rotated'; piece: PieceType; direction: -1 | 1 }
  | { type: 'hard-dropped'; piece: PieceType; distance: number }
  | { type: 'piece-locked'; piece: PieceType; cells: Cell[] }
  | { type: 'clear-started'; rows: number[] }
  | { type: 'lines-cleared'; rows: number[]; count: number; score: number }
  | { type: 'level-up'; level: number }
  | { type: 'finished'; completionTicks: number }
  | { type: 'game-over'; reason: 'block-out' | 'lock-out' | 'puzzle-budget' | 'puzzle-invalid-spawn' | 'invalid-state' };

export interface GameTransition {
  state: GameState;
  events: GameEvent[];
}
