import { describe, expect, it } from 'vitest';
import { BEDROCK_CELL, BOARD_WIDTH, TICKS_PER_SECOND, stateHash, survivalIntervalSeconds } from '../core';
import { replayPuzzleChallenge, replaySurvivalBedrock } from './qaScenario';

describe('Survival bedrock browser QA replay', () => {
  it('reaches the first deterministic timed rise through ordinary gravity and public commands only', () => {
    const first = replaySurvivalBedrock(0x51a1f00d);
    const second = replaySurvivalBedrock(0x51a1f00d);

    expect(first.replay.commands[0]).toEqual({ type: 'start' });
    expect(first.replay.commands.some((command) => command.type === 'move')).toBe(true);
    expect(first.replay.commands.some((command) => command.type === 'hard-drop')).toBe(true);
    expect(first.replay.commands.some((command) => command.type === 'tick')).toBe(true);
    expect(first.replay.firstRiseCommandCount).toBeLessThan(first.replay.removalCommandCount);
    expect(first.state.mode).toBe('race');
    expect(first.state.status).toBe('playing');
    expect(first.riseState.elapsedTicks).toBeGreaterThanOrEqual(40 * TICKS_PER_SECOND);
    expect(first.riseState.survivalBedrockRows).toBe(1);
    expect(first.riseState.lines).toBeLessThan(5);
    expect(first.riseState.board.at(-1)).toEqual(Array.from({ length: BOARD_WIDTH }, () => BEDROCK_CELL));
    expect(first.state.active).not.toBeNull();
    expect(first.state.lines).toBeGreaterThanOrEqual(5);
    expect(first.state.survivalBedrockRows).toBe(0);
    expect(first.state.survivalPressureTicks).toBe(0);
    expect(survivalIntervalSeconds(first.state.lines)).toBe(38);
    expect(stateHash(first.state)).toBe(stateHash(second.state));
    expect(first.replay).toEqual(second.replay);
  });
});

describe('T5 puzzle browser QA replay', () => {
  it('completes the full first challenge through public commands only', () => {
    const first = replayPuzzleChallenge(0x51a1f00d);
    const second = replayPuzzleChallenge(0x51a1f00d);

    expect(first.commands[0]).toEqual({ type: 'start' });
    expect(first.commands.some((command) => command.type === 'rotate')).toBe(true);
    expect(first.commands.filter((command) => command.type === 'hard-drop')).toHaveLength(35);
    expect(first.state.status).toBe('finished');
    expect(first.state.puzzleId).toBe('t3r-shaft-01');
    expect(first.state.puzzleCompletion).toBe('finished');
    expect(first.state.completedLevelId).toBe('t3r-shaft-01');
    expect(first.state.nextUnlockedLevelId).toBe('t3r-shaft-02');
    expect(first.state.pieceCount).toBe(35);
    expect(first.state.lines).toBe(22);
    expect(first.hash).toBe(second.hash);
    expect(first.commands).toEqual(second.commands);
  });
});
