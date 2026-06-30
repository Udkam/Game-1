import { describe, expect, it } from "vitest";
import { completeLevel, emptyProgress, setCurrentLevel } from "./storage";

describe("progress helpers", () => {
  it("sets the current level id", () => {
    expect(setCurrentLevel(emptyProgress, "tutorial-01-first-push").currentLevelId).toBe(
      "tutorial-01-first-push",
    );
  });

  it("records completed levels and best move counts", () => {
    const first = completeLevel(emptyProgress, "level-a", 7);
    const worse = completeLevel(first, "level-a", 9);
    const better = completeLevel(worse, "level-a", 5);

    expect(first.completedLevelIds).toEqual(["level-a"]);
    expect(worse.bestMoves["level-a"]).toBe(7);
    expect(better.bestMoves["level-a"]).toBe(5);
  });
});
