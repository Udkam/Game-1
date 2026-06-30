import type {
  BoxEntity,
  Direction,
  Entity,
  GameCoreState,
  GoalEntity,
  Position,
  Vec2,
  World,
  WorldId,
} from "./types";

type OpenBoxEntity = BoxEntity & {
  open: true;
  innerWorldId: WorldId;
};

export const DIR_VECTORS: Record<Direction, Vec2> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function movePosition(position: Position, dir: Direction): Position {
  const vector = DIR_VECTORS[dir];
  return {
    worldId: position.worldId,
    x: position.x + vector.x,
    y: position.y + vector.y,
  };
}

export function isInsideWorld(world: World, position: Pick<Position, "x" | "y">) {
  return (
    position.x >= 0 &&
    position.y >= 0 &&
    position.x < world.width &&
    position.y < world.height
  );
}

export function getEntitiesAt(
  state: GameCoreState,
  worldId: WorldId,
  x: number,
  y: number,
): Entity[] {
  return Object.values(state.entities).filter(
    (entity) =>
      entity.position.worldId === worldId &&
      entity.position.x === x &&
      entity.position.y === y,
  );
}

export function isBlockingEntity(entity: Entity): boolean {
  return entity.type === "wall" || entity.type === "box" || entity.type === "player";
}

export function getBlockingEntityAt(
  state: GameCoreState,
  worldId: WorldId,
  x: number,
  y: number,
  ignoreId?: string,
): Entity | undefined {
  return getEntitiesAt(state, worldId, x, y).find(
    (entity) => entity.id !== ignoreId && isBlockingEntity(entity),
  );
}

export function isPushable(entity: Entity): entity is BoxEntity {
  return entity.type === "box" && entity.pushable !== false;
}

export function isOpenBox(entity: Entity): entity is OpenBoxEntity {
  return entity.type === "box" && entity.open === true && Boolean(entity.innerWorldId);
}

export function getEntryPosition(world: World): Vec2 {
  return (
    world.entry ?? {
      x: Math.floor(world.width / 2),
      y: Math.floor(world.height / 2),
    }
  );
}

export function isGoalSatisfied(state: GameCoreState, goal: GoalEntity): boolean {
  const occupants = getEntitiesAt(
    state,
    goal.position.worldId,
    goal.position.x,
    goal.position.y,
  );
  return occupants.some((entity) => {
    if (entity.id === goal.id || entity.type === "goal" || entity.type === "wall") {
      return false;
    }
    if (goal.target === "any") {
      return true;
    }
    return entity.type === goal.target;
  });
}

export function checkWin(state: GameCoreState): boolean {
  const requiredGoals = Object.values(state.entities).filter(
    (entity): entity is GoalEntity =>
      entity.type === "goal" && entity.required !== false,
  );
  return requiredGoals.length > 0 && requiredGoals.every((goal) => isGoalSatisfied(state, goal));
}

export function getWorldPath(state: GameCoreState, worldId: WorldId): World[] {
  const path: World[] = [];
  let cursor: World | undefined = state.worlds[worldId];
  const seen = new Set<WorldId>();

  while (cursor && !seen.has(cursor.id)) {
    path.unshift(cursor);
    seen.add(cursor.id);
    cursor = cursor.parent ? state.worlds[cursor.parent.worldId] : undefined;
  }

  return path;
}

export function isDescendantWorld(
  state: GameCoreState,
  possibleDescendantId: WorldId,
  ancestorWorldId: WorldId,
): boolean {
  let cursor = state.worlds[possibleDescendantId];
  const seen = new Set<WorldId>();

  while (cursor?.parent && !seen.has(cursor.id)) {
    seen.add(cursor.id);
    if (cursor.parent.worldId === ancestorWorldId) {
      return true;
    }
    cursor = state.worlds[cursor.parent.worldId];
  }

  return false;
}

export function wouldCreateRecursiveContainment(
  state: GameCoreState,
  movingEntity: Entity,
  destinationBox: BoxEntity,
): boolean {
  if (movingEntity.type !== "box") {
    return false;
  }
  if (movingEntity.id === destinationBox.id) {
    return true;
  }
  if (!movingEntity.innerWorldId) {
    return false;
  }

  return (
    destinationBox.position.worldId === movingEntity.innerWorldId ||
    isDescendantWorld(state, destinationBox.position.worldId, movingEntity.innerWorldId)
  );
}
