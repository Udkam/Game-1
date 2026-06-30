import { describe, expect, it } from "vitest";
import { applyMove, createGameState, validateLevelDefinition } from "../game";
import { tutorialLevels, tutorialSolutions } from "./tutorial";

describe("tutorial levels", () => {
  it("defines ten original tutorial levels", () => {
    expect(tutorialLevels).toHaveLength(10);
    expect(new Set(tutorialLevels.map((level) => level.id)).size).toBe(10);
  });

  it("passes schema validation", () => {
    for (const level of tutorialLevels) {
      expect(validateLevelDefinition(level)).toEqual([]);
    }
  });

  it("includes a winning path for every tutorial level", () => {
    for (const level of tutorialLevels) {
      const solution = tutorialSolutions[level.id];
      expect(solution, level.id).toBeDefined();
      const finalState = solution.reduce(
        (state, direction) => applyMove(state, direction),
        createGameState(level),
      );
      expect(finalState.won, level.id).toBe(true);
    }
  });
});
