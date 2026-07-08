import { describe, expect, it } from "vitest";
import { Move, Undo } from "../core/commands";
import { createSimulationSession } from "../core/history";
import { createStage3BSimulationState } from "../core/worldGraph";
import { EventPipeline } from "./EventPipeline";

describe("EventPipeline", () => {
  it("dispatches simulation events into animation plans and projections", () => {
    const pipeline = new EventPipeline();
    const session = createSimulationSession(createStage3BSimulationState());
    const result = pipeline.dispatch(session, Move("right"));

    expect(result.accepted).toBe(true);
    expect(result.events.map((event) => event.type)).toEqual(["move"]);
    expect(result.animationPlan.entityMotions.map((motion) => motion.entityId)).toEqual(["player-a"]);
    expect(result.previousProjection.projectionId).toBe("world-a");
    expect(result.nextProjection.projectionId).toBe("world-a");
    expect(result.previousHash).not.toBe(result.nextHash);
  });

  it("turns undo into a reverse animation timeline using the last history record", () => {
    const pipeline = new EventPipeline();
    const session = createSimulationSession(createStage3BSimulationState());
    const moved = pipeline.dispatch(session, Move("right"));
    const undone = pipeline.dispatch(moved.session, Undo());

    expect(undone.accepted).toBe(true);
    expect(undone.animationPlan.direction).toBe("reverse");
    expect(undone.animationPlan.entityMotions[0]).toMatchObject({
      entityId: "player-a",
      from: { worldId: "world-a", x: 3, y: 2 },
      to: { worldId: "world-a", x: 2, y: 2 },
    });
  });
});
