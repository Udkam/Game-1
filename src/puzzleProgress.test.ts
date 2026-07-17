import { describe, expect, it } from 'vitest';
import referencesFile from '../docs/workstreams/tetris-t5-core/puzzle-references.json';
import { createInitialState, dispatch, type GameCommand, type GameState, type PuzzleId, type Rotation } from './game/core';
import {
  CAMPAIGN_LEVELS,
  defaultPuzzleProgress,
  isPuzzleComplete,
  migrateLegacyPuzzleProgress,
  parsePuzzleProgress,
  recordCanonicalPuzzleCompletion,
} from './puzzleProgress';

type PuzzleProgressFixture = {
  id: PuzzleId;
  name: string;
  routes: Array<{ placements: Array<{ rotation: Rotation; x: number }> }>;
};

const t5Levels = (referencesFile as unknown as { levels: PuzzleProgressFixture[] }).levels;

function rotationCommands(rotation: Rotation): GameCommand[] {
  if (rotation === 1) return [{ type: 'rotate', direction: 1 }];
  if (rotation === 2) return [{ type: 'rotate', direction: 1 }, { type: 'rotate', direction: 1 }];
  if (rotation === 3) return [{ type: 'rotate', direction: -1 }];
  return [];
}

function completeFirstT5Puzzle(): GameState {
  const reference = t5Levels[0]!;
  let state = createInitialState(0x51a1f00d, 'puzzle', reference.id);
  state = dispatch(state, { type: 'start' }).state;
  for (const placement of reference.routes[0]!.placements) {
    for (const command of rotationCommands(placement.rotation)) state = dispatch(state, command).state;
    while (state.active && state.active.x !== placement.x) {
      state = dispatch(state, { type: 'move', dx: placement.x < state.active.x ? -1 : 1 }).state;
    }
    state = dispatch(state, { type: 'hard-drop' }).state;
    while (state.status === 'playing' && (!state.active || state.phase !== 'active')) {
      state = dispatch(state, { type: 'tick' }).state;
    }
  }
  return state;
}

describe('T5 puzzle completion presentation data', () => {
  it('binds all fifteen T5 levels without difficulty or availability gates', () => {
    expect(CAMPAIGN_LEVELS.map((level) => [level.id, level.name, level.index, level.total])).toEqual(
      t5Levels.map((level, index) => [level.id, level.name, index + 1, t5Levels.length]),
    );
    expect(CAMPAIGN_LEVELS).toHaveLength(15);
    expect(CAMPAIGN_LEVELS.every((level) => !('difficulty' in level))).toBe(true);
  });

  it('reads completion-only v2 data in campaign order and fails closed on malformed entries', () => {
    expect(parsePuzzleProgress('{"version":2,"completedLevelIds":["t3r-shaft-03","t3r-shaft-01","t3r-shaft-03"]}')).toEqual({
      version: 2,
      completedLevelIds: ['t3r-shaft-01', 't3r-shaft-03'],
    });
    for (const raw of [null, '{', '[]', '{"version":1,"completedLevelIds":[]}', '{"version":2,"completedLevelIds":["offset-01"]}']) {
      expect(parsePuzzleProgress(raw)).toEqual(defaultPuzzleProgress());
    }
  });

  it('safely migrates the old highest-unlocked marker into prior completions only', () => {
    expect(migrateLegacyPuzzleProgress('{"version":1,"nextUnlockedLevelId":"t3r-shaft-04"}')).toEqual({
      version: 2,
      completedLevelIds: ['t3r-shaft-01', 't3r-shaft-02', 't3r-shaft-03'],
    });
    expect(migrateLegacyPuzzleProgress('{"version":1,"nextUnlockedLevelId":"offset-01"}')).toEqual(defaultPuzzleProgress());
  });

  it('records a real canonical completion once and ignores non-success states', () => {
    const state = completeFirstT5Puzzle();
    const progressed = recordCanonicalPuzzleCompletion(defaultPuzzleProgress(), state);
    expect(isPuzzleComplete(progressed, 't3r-shaft-01')).toBe(true);
    expect(recordCanonicalPuzzleCompletion(progressed, state)).toBe(progressed);
    expect(recordCanonicalPuzzleCompletion(defaultPuzzleProgress(), { ...state, puzzleCompletion: 'failed-top-out' })).toEqual(defaultPuzzleProgress());
  });
});
