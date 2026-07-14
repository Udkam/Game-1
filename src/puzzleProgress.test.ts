import { describe, expect, it } from 'vitest';
import { createInitialState, dispatch } from './game/core';
import {
  CAMPAIGN_LEVELS,
  defaultPuzzleProgress,
  isPuzzleUnlocked,
  parsePuzzleProgress,
  recordCanonicalPuzzleCompletion,
} from './puzzleProgress';

describe('T3 puzzle campaign presentation data', () => {
  it('binds the six accepted IDs, names, difficulties, and flat campaign indices', () => {
    expect(CAMPAIGN_LEVELS.map((level) => [level.id, level.name, level.difficulty, level.index, level.total])).toEqual([
      ['t3r-shaft-01', '三井初鸣', 4, 1, 6],
      ['t3r-shaft-02', '四井错拍', 5, 2, 6],
      ['t3r-shaft-03', '偏置立柱', 5, 3, 6],
      ['t3r-shaft-04', '五井精裁', 6, 4, 6],
      ['t3r-cascade-05', '左岸级联', 7, 5, 6],
      ['t3r-cascade-06', '右岸回流', 8, 6, 6],
    ]);
  });

  it('fails closed to only level one for malformed, obsolete, and unknown storage', () => {
    for (const raw of [null, '{', '[]', '{"version":0,"nextUnlockedLevelId":"t3r-shaft-06"}', '{"version":1,"nextUnlockedLevelId":"offset-01"}']) {
      const progress = parsePuzzleProgress(raw);
      expect(progress).toEqual(defaultPuzzleProgress());
      expect(isPuzzleUnlocked(progress, 't3r-shaft-01')).toBe(true);
      expect(isPuzzleUnlocked(progress, 't3r-shaft-02')).toBe(false);
    }
  });

  it('advances only from a real canonical completion and never from failures or a locked run', () => {
    let state = createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01');
    for (const command of [
      { type: 'start' as const }, { type: 'rotate' as const, direction: -1 as const }, { type: 'hard-drop' as const },
      { type: 'tick' as const }, { type: 'tick' as const }, { type: 'tick' as const },
      { type: 'move' as const, dx: -1 as const }, { type: 'move' as const, dx: -1 as const }, { type: 'move' as const, dx: -1 as const },
      { type: 'rotate' as const, direction: -1 as const }, { type: 'move' as const, dx: -1 as const }, { type: 'hard-drop' as const },
      { type: 'tick' as const }, { type: 'tick' as const }, { type: 'tick' as const },
      { type: 'move' as const, dx: 1 as const }, { type: 'move' as const, dx: 1 as const }, { type: 'move' as const, dx: 1 as const },
      { type: 'rotate' as const, direction: 1 as const }, { type: 'move' as const, dx: 1 as const }, { type: 'hard-drop' as const },
      ...Array.from({ length: 12 }, () => ({ type: 'tick' as const })),
    ]) state = dispatch(state, command).state;

    const progressed = recordCanonicalPuzzleCompletion(defaultPuzzleProgress(), state);
    expect(progressed.nextUnlockedLevelId).toBe('t3r-shaft-02');
    expect(recordCanonicalPuzzleCompletion(progressed, { ...state, puzzleCompletion: 'failed-budget' })).toBe(progressed);
    expect(recordCanonicalPuzzleCompletion(defaultPuzzleProgress(), { ...state, completedLevelId: 't3r-shaft-04', nextUnlockedLevelId: 't3r-cascade-05' })).toEqual(defaultPuzzleProgress());
  });
});
