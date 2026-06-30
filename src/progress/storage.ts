export interface ProgressState {
  currentLevelId?: string;
  completedLevelIds: string[];
  bestMoves: Record<string, number>;
}

const STORAGE_KEY = "recursive-box-lab-progress-v1";

export const emptyProgress: ProgressState = {
  completedLevelIds: [],
  bestMoves: {},
};

export function readProgress(): ProgressState {
  if (typeof window === "undefined") {
    return emptyProgress;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyProgress;
    }
    return normalizeProgress(JSON.parse(raw));
  } catch {
    return emptyProgress;
  }
}

export function writeProgress(progress: ProgressState) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
}

export function setCurrentLevel(progress: ProgressState, levelId: string): ProgressState {
  return normalizeProgress({
    ...progress,
    currentLevelId: levelId,
  });
}

export function completeLevel(
  progress: ProgressState,
  levelId: string,
  moves: number,
): ProgressState {
  const completed = new Set(progress.completedLevelIds);
  completed.add(levelId);

  const previousBest = progress.bestMoves[levelId];
  const bestMoves =
    previousBest === undefined || moves < previousBest
      ? { ...progress.bestMoves, [levelId]: moves }
      : { ...progress.bestMoves };

  return normalizeProgress({
    ...progress,
    currentLevelId: levelId,
    completedLevelIds: [...completed],
    bestMoves,
  });
}

function normalizeProgress(value: unknown): ProgressState {
  if (!value || typeof value !== "object") {
    return emptyProgress;
  }

  const candidate = value as Partial<ProgressState>;
  return {
    currentLevelId:
      typeof candidate.currentLevelId === "string" ? candidate.currentLevelId : undefined,
    completedLevelIds: Array.isArray(candidate.completedLevelIds)
      ? [...new Set(candidate.completedLevelIds.filter((id): id is string => typeof id === "string"))]
      : [],
    bestMoves:
      candidate.bestMoves && typeof candidate.bestMoves === "object"
        ? Object.fromEntries(
            Object.entries(candidate.bestMoves).filter(
              ([key, moves]) => typeof key === "string" && typeof moves === "number",
            ),
          )
        : {},
  };
}
