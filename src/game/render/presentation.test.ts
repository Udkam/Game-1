import { describe, expect, it } from 'vitest';
import {
  approachPresentationPoint,
  exposedCellEdges,
  internalCellSeams,
  lineClearCellProgress,
  lineClearPresentationProgress,
  nextPreviewPiece,
  orthogonalCellComponents,
} from './presentation';
import { createInitialState, dispatch, PIECE_SHAPES, PIECE_TYPES, type Cell } from '../core';

describe('presentation interpolation', () => {
  it('approaches repeated soft-drop targets continuously without overshooting them', () => {
    let point = { x: 4, y: 0 };
    const samples: number[] = [];
    for (let targetY = 1; targetY <= 8; targetY += 1) {
      point = approachPresentationPoint(point, { x: 4, y: targetY }, 1000 / 60, 26);
      samples.push(point.y);
      expect(point.y).toBeGreaterThan(targetY - 1);
      expect(point.y).toBeLessThanOrEqual(targetY);
    }
    expect(samples.every((value, index) => index === 0 || value > samples[index - 1]!)).toBe(true);
  });

  it('snaps only when motion is disabled and otherwise remains bounded after a long frame', () => {
    expect(approachPresentationPoint({ x: 0, y: 0 }, { x: 1, y: 1 }, 16, 0)).toEqual({ x: 1, y: 1 });
    const point = approachPresentationPoint({ x: 0, y: 0 }, { x: 1, y: 1 }, 200, 80);
    expect(point.x).toBeGreaterThan(0);
    expect(point.x).toBeLessThan(1);
    expect(point.y).toBe(point.x);
  });

  it('caps the ordinary clear sweep at nine ticks and removes it for reduced motion', () => {
    expect(lineClearPresentationProgress(0, false)).toBe(0);
    expect(lineClearPresentationProgress(9, false)).toBe(1);
    expect(lineClearPresentationProgress(12, false)).toBe(1);
    expect(lineClearPresentationProgress(6, true)).toBe(0);

    const center = lineClearCellProgress(0.4, 4, 10);
    const edge = lineClearCellProgress(0.4, 0, 10);
    expect(center).toBeGreaterThan(edge);
    expect(lineClearCellProgress(1, 0, 10)).toBe(1);
    expect(lineClearCellProgress(1, 9, 10)).toBe(1);
  });

  it('groups every canonical tetromino, preserves its outer perimeter, and enumerates each inner seam once', () => {
    const expectedPerimeters = { I: 10, O: 8, T: 10, S: 10, Z: 10, J: 10, L: 10 } as const;
    const expectedSeams = { I: 3, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3 } as const;
    const opposite = { top: 'bottom', right: 'left', bottom: 'top', left: 'right' } as const;
    const offsets = {
      top: { x: 0, y: -1 },
      right: { x: 1, y: 0 },
      bottom: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
    } as const;

    for (const type of PIECE_TYPES) {
      const cells = PIECE_SHAPES[type][0];
      const ordered = cells.slice().sort((a, b) => a.y - b.y || a.x - b.x);
      expect(orthogonalCellComponents(cells)).toEqual([ordered]);
      const perimeter = exposedCellEdges(cells);
      expect(perimeter.flatMap(({ exposed }) => Object.values(exposed)).filter(Boolean)).toHaveLength(expectedPerimeters[type]);
      const seams = internalCellSeams(cells);
      expect(seams).toHaveLength(expectedSeams[type]);
      expect(new Set(seams.map(({ start, end }) => `${start.x},${start.y}:${end.x},${end.y}`)).size).toBe(seams.length);

      const byCell = new Map(perimeter.map((entry) => [`${entry.cell.x},${entry.cell.y}`, entry]));
      for (const { cell, exposed } of perimeter) {
        for (const edge of Object.keys(offsets) as Array<keyof typeof offsets>) {
          const offset = offsets[edge];
          const neighbour = byCell.get(`${cell.x + offset.x},${cell.y + offset.y}`);
          if (!neighbour) continue;
          expect(exposed[edge]).toBe(false);
          expect(neighbour.exposed[opposite[edge]]).toBe(false);
        }
      }
    }
  });

  it('splits post-clear fragments without inventing internal Ghost boxes', () => {
    const fragments: Cell[] = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 3, y: 0 }];
    expect(orthogonalCellComponents(fragments).map((component) => component.length)).toEqual([2, 1]);
    const joined = exposedCellEdges(fragments.slice(0, 2));
    expect(joined[0]?.exposed.right).toBe(false);
    expect(joined[1]?.exposed.left).toBe(false);
    expect(joined.flatMap(({ exposed }) => Object.values(exposed)).filter(Boolean)).toHaveLength(6);
    expect(internalCellSeams(fragments)).toEqual([
      {
        orientation: 'vertical',
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 },
      },
    ]);
  });

  it('uses the generated shared next item for Puzzle and no terminal preview', () => {
    const ready = createInitialState(9, 'puzzle', 't3r-cascade-06');
    const playing = dispatch(ready, { type: 'start' }).state;
    expect(nextPreviewPiece(playing)).toBe(playing.queue[0]);

    let afterFirstLock = dispatch(playing, { type: 'hard-drop' }).state;
    for (let guard = 0; afterFirstLock.status === 'playing' && (!afterFirstLock.active || afterFirstLock.phase !== 'active') && guard < 64; guard += 1) {
      afterFirstLock = dispatch(afterFirstLock, { type: 'tick' }).state;
    }
    expect(nextPreviewPiece(afterFirstLock)).toBe(afterFirstLock.queue[0]);
    expect(nextPreviewPiece({ ...afterFirstLock, status: 'finished' })).toBeNull();
  });
});
