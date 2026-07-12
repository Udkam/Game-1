import { describe, expect, it } from "vitest";
import { createStage3BSimulationState } from "../core/worldGraph";
import { EventPipeline } from "../runtime/EventPipeline";
import { parseR2QaQuery } from "../runtime/r2QaScenario";
import { createProjectionFromSimulationState } from "./simulationProjection";

describe("simulation projection handoff", () => {
  it("projects the injected simulation snapshot with a complete root-plus-path address", () => {
    const projection = createProjectionFromSimulationState(createStage3BSimulationState());
    const recursiveContainer = projection.entities.find((entity) => entity.entity.kind === "recursive-container");
    const player = projection.entities.find((entity) => entity.occurrence.entityId === "player-a");

    expect(projection.address).toEqual({ rootWorldId: "world-a", containerPath: [] });
    expect(projection.activeAddress).toEqual({ rootWorldId: "world-a", containerPath: [] });
    expect(projection.projectionId).toBe('["world-a"]');
    expect(player?.occurrence).toEqual({ world: projection.address, entityId: "player-a" });
    expect(recursiveContainer?.childWorld?.address).toEqual({ rootWorldId: "world-a", containerPath: [recursiveContainer?.occurrence.entityId] });
  });

  it("copies canonical focus into every recursive projection rather than inferring it from draw order", () => {
    const base = createStage3BSimulationState();
    const receiverEntry = Object.entries(base.components.containers)[0];
    if (!receiverEntry) throw new Error("Expected a recursive container in the injected snapshot.");
    const [receiverId, receiver] = receiverEntry;
    const focused = { ...base, activeWorldId: receiver.innerWorldId, focusPath: [receiverId] };
    const projection = createProjectionFromSimulationState(focused);
    const child = projection.entities.find((entity) => entity.occurrence.entityId === receiverId)?.childWorld;
    expect(projection.activeAddress).toEqual({ rootWorldId: "world-a", containerPath: [receiverId] });
    expect(child?.activeAddress).toEqual(projection.activeAddress);
  });

  it("keeps before and after transfer payload occurrences address-distinct for renderer continuity", () => {
    const scenario = parseR2QaQuery("?qa=r2&case=push-in&progress=0.5", true);
    if (scenario.kind !== "scenario") throw new Error("Expected R2 scenario.");
    const handoff = new EventPipeline().dispatch(scenario.session, scenario.commands[0]);
    const before = handoff.previousProjection.entities.find((entity) => entity.occurrence.entityId === "r2-payload");
    const receiver = handoff.nextProjection.entities.find((entity) => entity.occurrence.entityId === "r2-receiver");
    const after = receiver?.childWorld?.entities.find((entity) => entity.occurrence.entityId === "r2-payload");
    expect(before?.occurrence).toEqual({ world: { rootWorldId: "r2-root", containerPath: [] }, entityId: "r2-payload" });
    expect(after?.occurrence).toEqual({ world: { rootWorldId: "r2-root", containerPath: ["r2-receiver"] }, entityId: "r2-payload" });
    expect(before?.childWorld?.address).toEqual({ rootWorldId: "r2-root", containerPath: ["r2-payload"] });
    expect(after?.childWorld?.address).toEqual({ rootWorldId: "r2-root", containerPath: ["r2-receiver", "r2-payload"] });
  });
});
