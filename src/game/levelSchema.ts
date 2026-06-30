import type {
  Entity,
  GameCoreState,
  LevelDefinition,
  World,
} from "./types";

export function validateLevelDefinition(level: LevelDefinition): string[] {
  const errors: string[] = [];
  const worldIds = new Set<string>();
  const entityIds = new Set<string>();

  for (const world of level.worlds) {
    if (worldIds.has(world.id)) {
      errors.push(`Duplicate world id: ${world.id}`);
    }
    worldIds.add(world.id);
    if (world.width <= 0 || world.height <= 0) {
      errors.push(`World ${world.id} must have positive dimensions`);
    }
  }

  if (level.worlds.length === 0) {
    errors.push("A level must include at least one world");
  }

  for (const world of level.worlds) {
    if (world.parent) {
      if (!worldIds.has(world.parent.worldId)) {
        errors.push(`World ${world.id} references missing parent world`);
      }
    }
  }

  for (const entity of level.entities) {
    if (entityIds.has(entity.id)) {
      errors.push(`Duplicate entity id: ${entity.id}`);
    }
    entityIds.add(entity.id);
    if (!worldIds.has(entity.position.worldId)) {
      errors.push(`Entity ${entity.id} references missing world`);
    }
    const world = level.worlds.find((item) => item.id === entity.position.worldId);
    if (
      world &&
      (entity.position.x < 0 ||
        entity.position.y < 0 ||
        entity.position.x >= world.width ||
        entity.position.y >= world.height)
    ) {
      errors.push(`Entity ${entity.id} is outside world ${world.id}`);
    }
    if (entity.type === "box" && entity.innerWorldId && !worldIds.has(entity.innerWorldId)) {
      errors.push(`Box ${entity.id} references missing inner world`);
    }
  }

  if (!entityIds.has(level.playerId)) {
    errors.push(`Missing player entity: ${level.playerId}`);
  }

  const activeWorldId = level.activeWorldId ?? level.worlds[0]?.id;
  if (activeWorldId && !worldIds.has(activeWorldId)) {
    errors.push(`Missing active world: ${activeWorldId}`);
  }

  for (const world of level.worlds) {
    if (world.parent && !entityIds.has(world.parent.boxId)) {
      errors.push(`World ${world.id} references missing parent box`);
    }
  }

  return errors;
}

export function normalizeLevel(level: LevelDefinition): GameCoreState {
  const errors = validateLevelDefinition(level);
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  const worlds = Object.fromEntries(
    level.worlds.map((world): [string, World] => [world.id, { ...world }]),
  );
  const entities = Object.fromEntries(
    level.entities.map((entity): [string, Entity] => [
      entity.id,
      { ...entity, position: { ...entity.position } },
    ]),
  );
  const player = entities[level.playerId];

  return {
    levelId: level.id,
    title: level.title,
    worlds,
    entities,
    playerId: level.playerId,
    activeWorldId: level.activeWorldId ?? player.position.worldId,
    moves: 0,
    won: false,
  };
}
