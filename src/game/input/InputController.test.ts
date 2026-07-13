import { describe, expect, it } from 'vitest';
import { classifySwipe } from './InputController';

describe('classifySwipe', () => {
  it('maps dominant CSS-pixel swipes independent of DPR', () => {
    expect(classifySwipe({ dx: 80, dy: 8, durationMs: 120, viewportMin: 390 })).toBe('right');
    expect(classifySwipe({ dx: -80, dy: 8, durationMs: 120, viewportMin: 390 })).toBe('left');
    expect(classifySwipe({ dx: 4, dy: -70, durationMs: 120, viewportMin: 390 })).toBe('jump');
    expect(classifySwipe({ dx: 4, dy: 70, durationMs: 120, viewportMin: 390 })).toBe('slide');
  });

  it('rejects taps, ambiguous diagonals, and stale gestures', () => {
    expect(classifySwipe({ dx: 12, dy: 4, durationMs: 80, viewportMin: 390 })).toBeNull();
    expect(classifySwipe({ dx: 50, dy: 48, durationMs: 80, viewportMin: 390 })).toBeNull();
    expect(classifySwipe({ dx: 100, dy: 0, durationMs: 1100, viewportMin: 390 })).toBeNull();
    expect(classifySwipe({ dx: 60, dy: 0, durationMs: 900, viewportMin: 390 })).toBeNull();
  });
});
