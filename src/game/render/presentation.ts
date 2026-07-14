export interface PresentationPoint {
  x: number;
  y: number;
}

export function approachPresentationPoint(
  current: PresentationPoint,
  target: PresentationPoint,
  deltaMs: number,
  settleMs: number,
): PresentationPoint {
  if (settleMs <= 0 || deltaMs <= 0) return deltaMs <= 0 ? current : target;
  const boundedDelta = Math.min(50, deltaMs);
  const factor = 1 - Math.exp((-3 * boundedDelta) / settleMs);
  const x = current.x + (target.x - current.x) * factor;
  const y = current.y + (target.y - current.y) * factor;
  return {
    x: Math.abs(target.x - x) < 0.001 ? target.x : x,
    y: Math.abs(target.y - y) < 0.001 ? target.y : y,
  };
}

export function lineClearCellProgress(phaseProgress: number, column: number, width: number): number {
  if (width <= 1) return Math.max(0, Math.min(1, phaseProgress));
  const centerDistance = Math.abs(column - (width - 1) / 2) / ((width - 1) / 2);
  return Math.max(0, Math.min(1, phaseProgress * 1.5 - centerDistance * 0.5));
}

/** The renderer has one preview surface; Puzzle reads its authored canonical queue. */
export function nextPreviewPiece(state: GameState): PieceType | null {
  if (state.status === 'ready' || state.status === 'finished' || state.status === 'game-over') return null;
  if (state.mode === 'puzzle') return state.puzzleQueue?.[state.puzzleQueueIndex] ?? null;
  return state.queue[0] ?? null;
}
import type { GameState, PieceType } from '../core';
