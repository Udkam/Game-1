import { PUZZLE_DEFINITIONS, type GameState, type PuzzleId } from './game/core';

export const PUZZLE_PROGRESS_KEY = 'tetris:puzzle-progress:v1';
const PROGRESS_VERSION = 1;

export interface PuzzleProgress {
  version: typeof PROGRESS_VERSION;
  /** The highest campaign level the player can select. */
  nextUnlockedLevelId: PuzzleId;
}

export interface CampaignLevel {
  id: PuzzleId;
  name: string;
  difficulty: number;
  index: number;
  total: number;
}

export const CAMPAIGN_LEVELS: readonly CampaignLevel[] = Object.freeze(
  PUZZLE_DEFINITIONS.map((level, index) => Object.freeze({
    id: level.id,
    name: level.name,
    difficulty: level.difficulty,
    index: index + 1,
    total: PUZZLE_DEFINITIONS.length,
  })),
);

export function defaultPuzzleProgress(): PuzzleProgress {
  return { version: PROGRESS_VERSION, nextUnlockedLevelId: CAMPAIGN_LEVELS[0]!.id };
}

function levelIndex(id: PuzzleId): number {
  return CAMPAIGN_LEVELS.findIndex((level) => level.id === id);
}

export function parsePuzzleProgress(raw: string | null): PuzzleProgress {
  if (raw === null) return defaultPuzzleProgress();
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultPuzzleProgress();
    const candidate = value as { version?: unknown; nextUnlockedLevelId?: unknown };
    if (candidate.version !== PROGRESS_VERSION || typeof candidate.nextUnlockedLevelId !== 'string') {
      return defaultPuzzleProgress();
    }
    if (!CAMPAIGN_LEVELS.some((level) => level.id === candidate.nextUnlockedLevelId)) return defaultPuzzleProgress();
    return { version: PROGRESS_VERSION, nextUnlockedLevelId: candidate.nextUnlockedLevelId as PuzzleId };
  } catch {
    return defaultPuzzleProgress();
  }
}

export function isPuzzleUnlocked(progress: PuzzleProgress, levelId: PuzzleId): boolean {
  return levelIndex(levelId) <= levelIndex(progress.nextUnlockedLevelId);
}

/**
 * Persists no inferred win state. Only a canonical success can advance exactly
 * to the core-reported next level, and a run from a locked level never grants
 * a progression shortcut.
 */
export function recordCanonicalPuzzleCompletion(progress: PuzzleProgress, state: GameState): PuzzleProgress {
  if (
    state.mode !== 'puzzle'
    || state.puzzleCompletion !== 'finished'
    || state.completedLevelId === null
    || !isPuzzleUnlocked(progress, state.completedLevelId)
  ) return progress;

  const currentIndex = levelIndex(progress.nextUnlockedLevelId);
  const completedIndex = levelIndex(state.completedLevelId);
  const reportedNext = state.nextUnlockedLevelId;
  if (reportedNext === null) return progress;
  const nextIndex = levelIndex(reportedNext);
  if (completedIndex !== nextIndex - 1 || nextIndex <= currentIndex) return progress;
  return { version: PROGRESS_VERSION, nextUnlockedLevelId: reportedNext };
}
