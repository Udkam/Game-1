import { BOARD_WIDTH, VISIBLE_HEIGHT, VISIBLE_START_ROW } from './constants';
import { createBoard } from './board';
import { PIECE_TYPES, type Board, type PieceType, type PuzzleId } from './types';

export interface PuzzleCell {
  x: number;
  /** Visible-board coordinate, where 0 is the top and 19 is the floor. */
  y: number;
  type: PieceType;
}

export interface PuzzleDefinition {
  id: PuzzleId;
  name: string;
  difficulty: number;
  /** Exactly twenty rows, each with the visible board width. */
  boardRows: readonly string[];
  /** Always empty for T3 authored levels; makes hidden-buffer validation explicit. */
  hiddenCells: readonly PuzzleCell[];
  queue: readonly PieceType[];
  pieceBudget: number;
}

const EMPTY_ROW = '.'.repeat(BOARD_WIDTH);
const EMPTY_HIDDEN_CELLS: readonly PuzzleCell[] = Object.freeze([]);

function rowsWithFloor(row: string): readonly string[] {
  return Object.freeze([...Array.from({ length: VISIBLE_HEIGHT - 4 }, () => EMPTY_ROW), row, row, row, row]);
}

function definition(
  id: PuzzleId,
  name: string,
  difficulty: number,
  floor: string,
  queue: readonly PieceType[],
): PuzzleDefinition {
  return Object.freeze({
    id,
    name,
    difficulty,
    boardRows: rowsWithFloor(floor),
    hiddenCells: EMPTY_HIDDEN_CELLS,
    queue: Object.freeze([...queue]),
    pieceBudget: queue.length,
  });
}

/** Six clean-room T3 campaign boards. Each sequence is finite and authored. */
export const PUZZLE_DEFINITIONS: readonly PuzzleDefinition[] = [
  definition('t3r-shaft-01', '三井初鸣', 4, '.JJJ.JJJJ.', ['I', 'I', 'I']),
  definition('t3r-shaft-02', '四井错拍', 5, '.J.JJ.JJJ.', ['I', 'I', 'I', 'I']),
  definition('t3r-shaft-03', '偏置立柱', 5, 'J.J.JJ.J.J', ['I', 'I', 'I', 'I']),
  definition('t3r-shaft-04', '五井精裁', 6, '.J.J.J.JJ.', ['I', 'I', 'I', 'I', 'I']),
  definition('t3r-cascade-05', '左岸级联', 7, '.....JJJJJ', ['I', 'I', 'I', 'O', 'O']),
  definition('t3r-cascade-06', '右岸回流', 8, 'JJJJJ.....', ['I', 'I', 'O', 'I', 'O']),
] as const;

const PIECE_TYPE_SET = new Set<string>(PIECE_TYPES);
const PUZZLE_ID_SET = new Set<string>(PUZZLE_DEFINITIONS.map((definition) => definition.id));

export function validatePuzzleDefinition(definition: PuzzleDefinition): void {
  if (!PUZZLE_ID_SET.has(definition.id)) throw new Error(`Unknown puzzle id: ${definition.id}`);
  if (!Number.isSafeInteger(definition.difficulty) || definition.difficulty < 1) {
    throw new Error(`Puzzle ${definition.id} has an invalid difficulty.`);
  }
  if (!Array.isArray(definition.boardRows) || definition.boardRows.length !== VISIBLE_HEIGHT) {
    throw new Error(`Puzzle ${definition.id} requires exactly ${VISIBLE_HEIGHT} visible board rows.`);
  }
  if (!Array.isArray(definition.hiddenCells) || definition.hiddenCells.length !== 0) {
    throw new Error(`Puzzle ${definition.id} must begin with an empty hidden buffer.`);
  }
  if (!Array.isArray(definition.queue) || definition.queue.length === 0) {
    throw new Error(`Puzzle ${definition.id} requires a non-empty queue.`);
  }
  if (definition.queue.some((type) => !PIECE_TYPE_SET.has(type))) {
    throw new Error(`Puzzle ${definition.id} contains an illegal queue piece.`);
  }
  if (!Number.isSafeInteger(definition.pieceBudget) || definition.pieceBudget <= 0 || definition.pieceBudget !== definition.queue.length) {
    throw new Error(`Puzzle ${definition.id} has an invalid piece budget.`);
  }
  let occupied = 0;
  for (const row of definition.boardRows) {
    if (typeof row !== 'string' || row.length !== BOARD_WIDTH) {
      throw new Error(`Puzzle ${definition.id} contains a malformed board row.`);
    }
    if ([...row].some((cell) => cell !== '.' && !PIECE_TYPE_SET.has(cell))) {
      throw new Error(`Puzzle ${definition.id} contains an illegal board cell.`);
    }
    if (![...row].includes('.')) throw new Error(`Puzzle ${definition.id} contains an initially full visible row.`);
    occupied += [...row].filter((cell) => cell !== '.').length;
  }
  if (occupied === 0) throw new Error(`Puzzle ${definition.id} requires a non-empty authored board.`);
}

export function getPuzzleDefinition(id: PuzzleId): PuzzleDefinition {
  const definition = PUZZLE_DEFINITIONS.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown puzzle id: ${id}`);
  validatePuzzleDefinition(definition);
  return definition;
}

export function createPuzzleBoard(definition: PuzzleDefinition): Board {
  validatePuzzleDefinition(definition);
  const board = createBoard();
  for (let y = 0; y < definition.boardRows.length; y += 1) {
    const row = definition.boardRows[y]!;
    for (let x = 0; x < row.length; x += 1) {
      const type = row[x]!;
      if (type !== '.') board[VISIBLE_START_ROW + y]![x] = type as PieceType;
    }
  }
  return board;
}

export function defaultPuzzleId(): PuzzleId {
  return PUZZLE_DEFINITIONS[0].id;
}

export function nextPuzzleId(id: PuzzleId): PuzzleId | null {
  const index = PUZZLE_DEFINITIONS.findIndex((definition) => definition.id === id);
  return index >= 0 ? PUZZLE_DEFINITIONS[index + 1]?.id ?? null : null;
}
