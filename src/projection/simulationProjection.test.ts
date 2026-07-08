import { describe, expect, it } from "vitest";
import { createStage4PlayableCoreState } from "../core/systems";
import { createProjectionFromSimulationState, createStage4PlayableCoreProjection } from "./simulationProjection";

describe("simulation projection handoff", () => {
  it("projects a simulation snapshot for the existing renderer", () => {
    const projection = createProjectionFromSimulationState(createStage4PlayableCoreState());
    const recursiveContainer = projection.entities.find((entity) => entity.entity.id === "container-b");
    const player = projection.entities.find((entity) => entity.entity.id === "player-a");
    const pushedBox = projection.entities.find((entity) => entity.entity.id === "box-a");

    expect(projection.world.id).toBe("world-a");
    expect(player?.entity.bounds).toMatchObject({ x: 6, y: 2, width: 1, height: 1 });
    expect(pushedBox?.entity.bounds).toMatchObject({ x: 7, y: 2, width: 1, height: 1 });
    expect(recursiveContainer?.childWorld?.world.id).toBe("world-c");
  });

  it("creates the Stage 4 playable core projection", () => {
    expect(createStage4PlayableCoreProjection().projectionId).toBe("world-a");
  });
});
