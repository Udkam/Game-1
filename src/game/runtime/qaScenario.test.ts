import { describe, expect, it } from 'vitest';
import { BEDROCK_CELL, BOARD_WIDTH, SURVIVAL_LINES_PER_BEDROCK, stateHash } from '../core';
import { SURVIVAL_BEDROCK_QA_LINES, replayPuzzleChallenge, replaySurvivalBedrock } from './qaScenario';

describe('Survival bedrock browser QA replay', () => {
  it('reaches a deterministic live bedrock milestone from public commands only', () => {
    const first = replaySurvivalBedrock(0x51a1f00d);
    const second = replaySurvivalBedrock(0x51a1f00d);

    expect(first.commands[0]).toEqual({ type: 'start' });
    expect(first.commands.some((command) => command.type === 'hard-drop')).toBe(true);
    expect(first.commands.some((command) => command.type === 'tick')).toBe(true);
    expect(first.state.mode).toBe('race');
    expect(first.state.status).toBe('playing');
    expect(first.state.lines).toBeGreaterThanOrEqual(SURVIVAL_BEDROCK_QA_LINES);
    expect(first.state.active).not.toBeNull();
    expect(first.state.survivalBedrockRows).toBeGreaterThanOrEqual(1);
    expect(first.state.survivalBedrockRows).toBe(Math.floor(first.state.lines / SURVIVAL_LINES_PER_BEDROCK));
    expect(first.state.board.at(-1)).toEqual(Array.from({ length: BOARD_WIDTH }, () => BEDROCK_CELL));
    expect(stateHash(first.state)).toBe(stateHash(second.state));
    expect(first.commands).toEqual(second.commands);
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
