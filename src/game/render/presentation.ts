import type { Cell, GameState, PieceType } from '../core';

export interface PresentationPoint {
  x: number;
  y: number;
}

export type CellEdge = 'top' | 'right' | 'bottom' | 'left';

export interface ExposedCellEdges {
  cell: Cell;
  exposed: Record<CellEdge, boolean>;
}

export const LINE_CLEAR_SWEEP_TICKS = 9;

const EDGE_OFFSETS: ReadonlyArray<{ edge: CellEdge; dx: number; dy: number }> = [
  { edge: 'top', dx: 0, dy: -1 },
  { edge: 'right', dx: 1, dy: 0 },
  { edge: 'bottom', dx: 0, dy: 1 },
  { edge: 'left', dx: -1, dy: 0 },
];

const cellKey = (cell: Cell): string => `${cell.x},${cell.y}`;

const orderedCells = (cells: readonly Cell[]): Cell[] => (
  [...new Map(cells.map((cell) => [cellKey(cell), cell])).values()]
    .sort((a, b) => a.y - b.y || a.x - b.x)
);

/** Groups cells by presentation-only orthogonal adjacency; it never adds Core ownership. */
export function orthogonalCellComponents(cells: readonly Cell[]): Cell[][] {
  const remaining = new Map(orderedCells(cells).map((cell) => [cellKey(cell), cell]));
  const components: Cell[][] = [];

  while (remaining.size) {
    const seed = remaining.values().next().value as Cell;
    const queue = [seed];
    const component: Cell[] = [];
    remaining.delete(cellKey(seed));

    for (let index = 0; index < queue.length; index += 1) {
      const cell = queue[index]!;
      component.push(cell);
      for (const { dx, dy } of EDGE_OFFSETS) {
        const key = `${cell.x + dx},${cell.y + dy}`;
        const neighbour = remaining.get(key);
        if (!neighbour) continue;
        remaining.delete(key);
        queue.push(neighbour);
      }
    }

    components.push(component.sort((a, b) => a.y - b.y || a.x - b.x));
  }

  return components;
}

/** Returns only component-perimeter edges, suppressing every shared internal cell edge. */
export function exposedCellEdges(cells: readonly Cell[]): ExposedCellEdges[] {
  const ordered = orderedCells(cells);
  const occupied = new Set(ordered.map(cellKey));
  return ordered.map((cell) => ({
    cell,
    exposed: Object.fromEntries(EDGE_OFFSETS.map(({ edge, dx, dy }) => (
      [edge, !occupied.has(`${cell.x + dx},${cell.y + dy}`)]
    ))) as Record<CellEdge, boolean>,
  }));
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

/** Caps the visual sweep at nine 60 Hz ticks (150 ms) without changing Core timing. */
export function lineClearPresentationProgress(phaseTicks: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return Math.max(0, Math.min(1, phaseTicks / LINE_CLEAR_SWEEP_TICKS));
}

/** Every mode previews the same continuously generated canonical queue. */
export function nextPreviewPiece(state: GameState): PieceType | null {
  if (state.status === 'ready' || state.status === 'finished' || state.status === 'game-over') return null;
  return state.queue[0] ?? null;
}
