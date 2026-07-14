import { describe, expect, it } from 'vitest';
import { approachPresentationPoint, lineClearCellProgress, nextPreviewPiece } from './presentation';
import { createInitialState, dispatch } from '../core';

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

  it('collapses a clear from the center out', () => {
    const center = lineClearCellProgress(0.4, 4, 10);
    const edge = lineClearCellProgress(0.4, 0, 10);
    expect(center).toBeGreaterThan(edge);
    expect(lineClearCellProgress(1, 0, 10)).toBe(1);
    expect(lineClearCellProgress(1, 9, 10)).toBe(1);
  });

  it('uses exactly the authored canonical next item for Puzzle and no terminal preview', () => {
    const ready = createInitialState(9, 'puzzle', 't3r-cascade-06');
    const playing = dispatch(ready, { type: 'start' }).state;
    expect(nextPreviewPiece(playing)).toBe('I');

    const afterFirstLock = dispatch(playing, { type: 'hard-drop' }).state;
    expect(nextPreviewPiece(afterFirstLock)).toBe('I');
    expect(nextPreviewPiece({ ...afterFirstLock, status: 'finished' })).toBeNull();
  });
});
