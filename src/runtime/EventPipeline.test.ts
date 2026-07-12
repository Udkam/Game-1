import { describe, expect, it } from "vitest";
import { Redo, Reset, Step, Undo } from "../core/commands";
import { createSimulationSession } from "../core/history";
import type { SimulationState } from "../core/types";
import { createSimulationState, createStage3BSimulationState } from "../core/worldGraph";
import { EventPipeline } from "./EventPipeline";
import { parseR2QaQuery } from "./r2QaScenario";

describe("EventPipeline", () => {
  it("forwards an accepted public Step transaction without reinterpretation", () => {
    const pipeline = new EventPipeline();
    const session = createSimulationSession(createStage3BSimulationState());
    const result = pipeline.dispatch(session, Step("right"));

    expect(result.accepted).toBe(true);
    expect(result.rejectionCode).toBeUndefined();
    expect(result.result.kind).toBe("accepted");
    if (result.result.kind !== "accepted") {
      throw new Error("Expected an accepted public result.");
    }
    expect(result.events).toBe(result.result.transaction.events);
    expect(result.events.map((event) => event.type)).toEqual(["entity-moved"]);
    const event = result.events[0];
    if (!event || event.type !== "entity-moved") {
      throw new Error("Expected an entity movement event.");
    }
    expect(result.animationPlan.entityMotions[0]?.occurrence).toEqual(event.occurrence);
    expect(result.previousHash).toBe(result.result.transaction.stateHashBefore);
    expect(result.nextHash).toBe(result.result.transaction.stateHashAfter);
    expect(result.previousProjection).not.toBe(result.nextProjection);
  });

  it("forwards a rejected public Step event and rejection code without state mutation", () => {
    const pipeline = new EventPipeline();
    const session = createSimulationSession(withBlockingTarget(createStage3BSimulationState()));
    const result = pipeline.dispatch(session, Step("right"));

    expect(result.accepted).toBe(false);
    expect(result.rejectionCode).toBe("target-solid-not-pushable");
    expect(result.session).toBe(session);
    expect(result.result.kind).toBe("rejected");
    if (result.result.kind !== "rejected") {
      throw new Error("Expected a rejected public result.");
    }
    expect(result.events).toBe(result.result.events);
    expect(result.events).toEqual([
      expect.objectContaining({
        type: "command-blocked",
        rejection: { code: "target-solid-not-pushable", reason: { kind: "target" }, rule: "push", attemptedCell: expect.any(Object) },
      }),
    ]);
    expect(result.previousHash).toBe(result.result.stateHashBefore);
    expect(result.nextHash).toBe(result.result.stateHashAfter);
    expect(result.previousHash).toBe(result.nextHash);
  });

  it("forwards public Undo, Redo, and Reset transaction events exactly once", () => {
    const pipeline = new EventPipeline();
    const initial = createSimulationSession(createStage3BSimulationState());
    const stepped = pipeline.dispatch(initial, Step("right"));
    const undone = pipeline.dispatch(stepped.session, Undo());
    const redone = pipeline.dispatch(undone.session, Redo());
    const reset = pipeline.dispatch(redone.session, Reset());

    for (const [result, command] of [
      [undone, "undo"],
      [redone, "redo"],
      [reset, "reset"],
    ] as const) {
      expect(result.accepted).toBe(true);
      expect(result.result.kind).toBe("accepted");
      if (result.result.kind !== "accepted") {
        throw new Error("Expected an accepted public history result.");
      }
      expect(result.result.command.type).toBe(command);
      expect(result.events).toBe(result.result.transaction.events);
      expect(result.previousHash).toBe(result.result.transaction.stateHashBefore);
      expect(result.nextHash).toBe(result.result.transaction.stateHashAfter);
    }

    expect(undone.events[0]).toMatchObject({
      type: "entity-moved",
      direction: "reverse",
      from: { x: 3, y: 2 },
      to: { x: 2, y: 2 },
    });
    expect(undone.animationPlan.direction).toBe("reverse");
    expect(undone.animationPlan.entityMotions[0]).toMatchObject({
      from: { x: 3, y: 2 },
      to: { x: 2, y: 2 },
    });
    expect(redone.events[0]).toMatchObject({ type: "entity-moved", direction: "forward" });
    expect(reset.events).toEqual([expect.objectContaining({ type: "reset", direction: "forward" })]);
  });

  it("forwards an additive addressed transfer event by reference without reconstructing its subtree roots", () => {
    const scenario = parseR2QaQuery("?qa=r2&case=push-in&progress=0.5", true);
    if (scenario.kind !== "scenario") throw new Error("Expected R2 QA scenario.");
    const result = new EventPipeline().dispatch(scenario.session, scenario.commands[0]);
    expect(result.result.kind).toBe("accepted");
    if (result.result.kind !== "accepted") throw new Error("Expected accepted transfer.");
    expect(result.events).toBe(result.result.transaction.events);
    const transfer = result.events.find((event) => event.type === "entity-transferred");
    expect(transfer).toMatchObject({
      mode: "push-in",
      entityBefore: { world: { rootWorldId: "r2-root", containerPath: [] }, entityId: "r2-payload" },
      entityAfter: { world: { rootWorldId: "r2-root", containerPath: ["r2-receiver"] }, entityId: "r2-payload" },
      carriedSubtree: {
        beforeRoot: { rootWorldId: "r2-root", containerPath: ["r2-payload"] },
        afterRoot: { rootWorldId: "r2-root", containerPath: ["r2-receiver", "r2-payload"] },
      },
    });
    expect(result.animationPlan.transferTransitions?.[0]).toMatchObject({ entityBefore: transfer && transfer.type === "entity-transferred" ? transfer.entityBefore : undefined });
  });
});

function withBlockingTarget(state: SimulationState): SimulationState {
  const actorPosition = state.components.positions[state.playerId];
  if (!actorPosition) {
    throw new Error("Expected an active actor position.");
  }

  return createSimulationState({
    ...state,
    entities: {
      ...state.entities,
      obstacle: { id: "obstacle" },
    },
    components: {
      ...state.components,
      positions: {
        ...state.components.positions,
        obstacle: { worldId: actorPosition.worldId, x: actorPosition.x + 1, y: actorPosition.y },
      },
      solids: {
        ...state.components.solids,
        obstacle: { blocksMovement: true },
      },
    },
  });
}
