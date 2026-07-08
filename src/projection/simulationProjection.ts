import { getContainerComponent, getPosition, getVisualComponent } from "../core/components";
import { createStage4PlayableCoreState } from "../core/systems";
import type { SimulationState } from "../core/types";
import { createStage3BSimulationState, getEntitiesInWorld } from "../core/worldGraph";
import type { PrototypeEntity, PrototypeWorldGraph, WorldProjection } from "./types";
import { projectWorldGraph } from "./worldProjection";

export function createProjectionFromSimulationState(state: SimulationState, maxDepth = 2): WorldProjection {
  return projectWorldGraph(createPrototypeWorldGraphFromSimulationState(state), state.rootWorldId, maxDepth);
}

export function createStage3BSimulationProjection(maxDepth = 2): WorldProjection {
  return createProjectionFromSimulationState(createStage3BSimulationState(), maxDepth);
}

export function createStage4PlayableCoreProjection(maxDepth = 2): WorldProjection {
  return createProjectionFromSimulationState(createStage4PlayableCoreState(), maxDepth);
}

export function createPrototypeWorldGraphFromSimulationState(state: SimulationState): PrototypeWorldGraph {
  const entities: PrototypeEntity[] = Object.keys(state.worlds).sort().flatMap((worldId) =>
    getEntitiesInWorld(state, worldId).flatMap((entity) => {
      const position = getPosition(state, entity.id);
      const visual = getVisualComponent(state, entity.id);

      if (!position || !visual) {
        return [];
      }

      const container = getContainerComponent(state, entity.id);

      return [
        {
          id: entity.id,
          kind: visual.kind,
          worldId: position.worldId,
          bounds: {
            x: position.x,
            y: position.y,
            width: 1,
            height: 1,
          },
          innerWorldId: container?.innerWorldId,
        },
      ];
    }),
  );

  return {
    rootWorldId: state.rootWorldId,
    worlds: Object.fromEntries(
      Object.entries(state.worlds).map(([worldId, world]) => [
        worldId,
        {
          id: world.id,
          paletteId: world.paletteId,
          size: world.size,
        },
      ]),
    ),
    entities,
  };
}
