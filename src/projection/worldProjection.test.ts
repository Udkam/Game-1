import { describe, expect, it } from "vitest";
import { createStage3BSimulationState } from "../core/worldGraph";
import { EventPipeline } from "../runtime/EventPipeline";
import { parseR2QaQuery } from "../runtime/r2QaScenario";
import { entityOccurrenceKey, worldAddressKey, type EntityProjection, type WorldProjection } from "./types";
import { projectWorldOccurrence } from "./worldProjection";

describe("world occurrence projection", () => {
  it("keeps repeated canonical worlds and delimiter-like IDs structurally distinct", () => {
    const base = createStage3BSimulationState();
    const state = {
      ...base,
      entities: { ...base.entities, "container--b": { id: "container--b" }, nested: { id: "nested" } },
      worlds: { ...base.worlds, "world-d": { id: "world-d", paletteId: "inner-mint" as const, size: { width: 3, height: 3 } } },
      components: {
        ...base.components,
        positions: {
          ...base.components.positions,
          "container--b": { worldId: "world-a", x: 7, y: 4 },
          nested: { worldId: "world-c", x: 3, y: 4 },
        },
        containers: {
          ...base.components.containers,
          "container--b": { innerWorldId: "world-c" },
          nested: { innerWorldId: "world-d" },
        },
        solids: { ...base.components.solids, "container--b": { blocksMovement: true as const }, nested: { blocksMovement: true as const } },
        pushables: { ...base.components.pushables, "container--b": { pushable: true as const }, nested: { pushable: true as const } },
        visuals: {
          ...base.components.visuals,
          "container--b": { kind: "recursive-container" as const, width: 1, height: 1 },
          nested: { kind: "recursive-container" as const, width: 1, height: 1 },
        },
      },
    };
    const projection = projectWorldOccurrence(state, { rootWorldId: "world-a", containerPath: [] }, 0, 3);
    const firstContainer = projection.entities.find((entity) => entity.childWorld && entity.occurrence.entityId !== "container--b");
    const first = firstContainer?.childWorld;
    const second = projection.entities.find((entity) => entity.occurrence.entityId === "container--b")?.childWorld;
    const nested = first?.entities.find((entity) => entity.occurrence.entityId === "nested")?.childWorld;
    if (!first || !second || !nested) throw new Error("Expected addressed nested projections.");

    expect(first.world.id).toBe(second.world.id);
    expect(first.projectionId).not.toBe(second.projectionId);
    expect(worldAddressKey(first.address)).toBe(JSON.stringify(["world-a", firstContainer.occurrence.entityId]));
    expect(worldAddressKey(second.address)).toBe('["world-a","container--b"]');
    expect(nested.address).toEqual({ rootWorldId: "world-a", containerPath: [...first.address.containerPath, "nested"] });

    const map = projectionEntityMap(projection);
    const aliases = [...map.values()].filter((entry) => entry.occurrence.entityId === "box-c");
    expect(aliases).toHaveLength(2);
    expect(new Set(aliases.map((entry) => entityOccurrenceKey(entry.occurrence))).size).toBe(2);
  });

  it("projects the carried subtree at its rebased full path after a world-bearing transfer", () => {
    const scenario = parseR2QaQuery("?qa=r2&case=push-in&progress=0.5", true);
    if (scenario.kind !== "scenario") throw new Error("Expected R2 scenario.");
    const handoff = new EventPipeline().dispatch(scenario.session, scenario.commands[0]);
    const projection = projectWorldOccurrence(handoff.session.present, { rootWorldId: "r2-root", containerPath: [] }, 0, 3);
    const receiver = projection.entities.find((entity) => entity.occurrence.entityId === "r2-receiver");
    const payload = receiver?.childWorld?.entities.find((entity) => entity.occurrence.entityId === "r2-payload");
    expect(payload?.occurrence.world).toEqual({ rootWorldId: "r2-root", containerPath: ["r2-receiver"] });
    expect(payload?.childWorld?.address).toEqual({ rootWorldId: "r2-root", containerPath: ["r2-receiver", "r2-payload"] });
    expect(worldAddressKey(payload?.childWorld?.address ?? { rootWorldId: "missing", containerPath: [] })).toBe('["r2-root","r2-receiver","r2-payload"]');
  });
});

function projectionEntityMap(projection: WorldProjection) {
  const map = new Map<string, EntityProjection>();
  const visit = (world: WorldProjection) => {
    for (const entity of world.entities) {
      map.set(entityOccurrenceKey(entity.occurrence), entity);
      if (entity.childWorld) visit(entity.childWorld);
    }
  };
  visit(projection);
  return map;
}
