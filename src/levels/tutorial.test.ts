import { describe, expect, it } from "vitest";
import { applyMove, createGameState } from "../game";
import { validateTutorialLevel } from "./levelValidation";
import { tutorialLevels, tutorialSolutions } from "./tutorial";

describe("tutorial levels", () => {
  it("defines ten curated tutorial levels", () => {
    expect(tutorialLevels).toHaveLength(10);
    expect(new Set(tutorialLevels.map((level) => level.id)).size).toBe(10);
  });

  it("passes schema and metadata validation", () => {
    for (const level of tutorialLevels) {
      expect(validateTutorialLevel(level)).toEqual([]);
    }
  });

  it("includes a winning scripted path for every tutorial level", () => {
    for (const level of tutorialLevels) {
      const solution = tutorialSolutions[level.id];
      expect(solution, level.id).toBeDefined();
      const finalState = solution.reduce(
        (state, direction) => applyMove(state, direction),
        createGameState(level),
      );
      expect(finalState.won, level.id).toBe(true);
      expect(solution.length, level.id).toBeLessThanOrEqual(level.targetMoves);
    }
  });

  it("covers the required first-five teaching arc", () => {
    expect(tutorialLevels.slice(0, 5).map((level) => level.mechanicTags)).toEqual([
      ["push", "dock"],
      ["enter", "recursive-room"],
      ["push-out", "edge-exit"],
      ["push-into", "container"],
      ["push-out", "container", "parent-update"],
    ]);
  });
});
