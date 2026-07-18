import type { GameMode } from './types';

export const BOARD_WIDTH = 10;
export const VISIBLE_HEIGHT = 20;
export const BUFFER_HEIGHT = 20;
export const BOARD_HEIGHT = VISIBLE_HEIGHT + BUFFER_HEIGHT;
export const VISIBLE_START_ROW = BUFFER_HEIGHT;

export const LOCK_DELAY_TICKS = 18;
export const MAX_LOCK_RESETS = 15;
export const ENTRY_DELAY_TICKS = 3;
export const LINE_CLEAR_DELAY_TICKS = 12;

export const NEXT_QUEUE_SIZE = 5;

export const GRAVITY_TICKS = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6,
  5, 5, 5,
  4, 4, 4,
  3, 3, 3,
] as const;

/**
 * Race speed advances through two deterministic signals: locked pieces and
 * cleared lines. The final entry is the intentional speed cap: gravity never
 * becomes faster than 2 ticks per row, preserving one deterministic
 * input/render tick between falls.
 */
export const RACE_PIECES_PER_SPEED_STEP = 5;
export const RACE_LINES_PER_SPEED_STEP = 4;
/** @deprecated T5 Race has no line target. Retained until the frontend slice migrates its copy. */
export const RACE_TARGET_LINES = 20;
export const RACE_GRAVITY_TICKS = [
  42, 36, 30, 25, 21, 18, 15, 13, 11, 9, 8, 7, 6, 5, 4, 3, 2,
] as const;
export const RACE_MIN_GRAVITY_TICKS = RACE_GRAVITY_TICKS[RACE_GRAVITY_TICKS.length - 1];

export function gravityForLevel(level: number): number {
  if (level < GRAVITY_TICKS.length) {
    return GRAVITY_TICKS[Math.max(0, level)] ?? 48;
  }
  if (level <= 28) return 2;
  return 1;
}

export function raceSpeedTier(pieceCount: number, lines: number): number {
  const lockedPieces = Math.max(0, Math.floor(pieceCount));
  const clearedLines = Math.max(0, Math.floor(lines));
  const step = Math.floor(lockedPieces / RACE_PIECES_PER_SPEED_STEP)
    + Math.floor(clearedLines / RACE_LINES_PER_SPEED_STEP);
  return Math.min(step, RACE_GRAVITY_TICKS.length - 1);
}

export function gravityForRace(pieceCount: number, lines: number): number {
  return RACE_GRAVITY_TICKS[raceSpeedTier(pieceCount, lines)] ?? RACE_MIN_GRAVITY_TICKS;
}

export function gravityForMode(mode: GameMode, level: number, pieceCount: number, lines: number): number {
  if (mode === 'race') return gravityForRace(pieceCount, lines);
  return gravityForLevel(level);
}

export const LINE_CLEAR_BASE_SCORE = [0, 40, 100, 300, 1200] as const;
