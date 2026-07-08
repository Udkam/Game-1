import { describe, expect, it } from "vitest";
import { Move } from "./commands";
import { hashState } from "./hash";
import { replayCommands } from "./replay";
import { createStage4PlayableCoreState } from "./systems";
import { createStage3BSimulationState } from "./worldGraph";

describe("command replay", () => {
  it("replays command arrays into the expected deterministic final hash", () => {
    const result = replayCommands(createStage3BSimulationState(), [
      Move("right"),
      Move("right"),
      Move("right"),
      Move("right"),
    ]);

    expect(result.acceptedCount).toBe(4);
    expect(result.finalHash).toBe(hashState(createStage4PlayableCoreState()));
  });
});
