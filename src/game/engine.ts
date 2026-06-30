import { cloneCore, toCore, withHistory } from "./history";
import {
  checkWin,
  getBlockingEntityAt,
  getEntryPosition,
  isInsideWorld,
  isOpenBox,
  isPushable,
  movePosition,
  wouldCreateRecursiveContainment,
} from "./rules";
import type {
  BoxEntity,
  Direction,
  Entity,
  EntityId,
  GameCoreState,
  GameState,
  MoveResult,
} from "./types";

const MAX_PUSH_DEPTH = 32;

export function applyMove(state: GameState, dir: Direction): GameState {
  const core = toCore(state);
  const result = moveEntity(core, core.playerId, dir, 0);

  if (!result.changed) {
    return state;
  }

  core.moves += 1;
  core.won = checkWin(core);
  core.lastAction = `move:${dir}`;
  return withHistory(state, core);
}

export function canMove(state: GameState, entityId: EntityId, dir: Direction): boolean {
  const core = toCore(state);
  return moveEntity(core, entityId, dir, 0).changed;
}

export function pushEntity(state: GameState, entityId: EntityId, dir: Direction): GameState {
  const core = toCore(state);
  const result = pushEntityCore(core, entityId, dir, 0);
  if (!result.changed) {
    return state;
  }
  core.won = checkWin(core);
  core.lastAction = `push:${entityId}:${dir}`;
  return withHistory(state, core);
}

export function enterBox(state: GameState, entityId: EntityId, boxId: EntityId): GameState {
  const core = toCore(state);
  const result = enterBoxCore(core, entityId, boxId);
  if (!result.changed) {
    return state;
  }
  core.won = checkWin(core);
  core.lastAction = `enter:${entityId}:${boxId}`;
  return withHistory(state, core);
}

export function exitBox(state: GameState, entityId: EntityId, dir: Direction): GameState {
  const core = toCore(state);
  const result = exitBoxCore(core, entityId, dir, 0);
  if (!result.changed) {
    return state;
  }
  core.won = checkWin(core);
  core.lastAction = `exit:${entityId}:${dir}`;
  return withHistory(state, core);
}

function moveEntity(
  state: GameCoreState,
  entityId: EntityId,
  dir: Direction,
  depth: number,
): MoveResult {
  if (depth > MAX_PUSH_DEPTH) {
    return { changed: false, reason: "push-depth-exceeded" };
  }

  const entity = state.entities[entityId];
  if (!entity) {
    return { changed: false, reason: "missing-entity" };
  }

  const world = state.worlds[entity.position.worldId];
  const next = movePosition(entity.position, dir);

  if (!isInsideWorld(world, next)) {
    return exitBoxCore(state, entityId, dir, depth + 1);
  }

  const blocker = getBlockingEntityAt(state, next.worldId, next.x, next.y, entityId);

  if (!blocker) {
    setEntityPosition(state, entity, next);
    return { changed: true };
  }

  if (blocker.type === "wall") {
    return { changed: false, reason: "wall" };
  }

  if (isOpenBox(blocker) && entity.type === "player") {
    return enterBoxCore(state, entity.id, blocker.id);
  }

  if (!isPushable(blocker)) {
    return { changed: false, reason: "blocked" };
  }

  const pushed = pushEntityCore(state, blocker.id, dir, depth + 1);
  if (!pushed.changed) {
    return pushed;
  }

  setEntityPosition(state, entity, next);
  return { changed: true };
}

function pushEntityCore(
  state: GameCoreState,
  entityId: EntityId,
  dir: Direction,
  depth: number,
): MoveResult {
  if (depth > MAX_PUSH_DEPTH) {
    return { changed: false, reason: "push-depth-exceeded" };
  }

  const entity = state.entities[entityId];
  if (!entity || !isPushable(entity)) {
    return { changed: false, reason: "not-pushable" };
  }

  const world = state.worlds[entity.position.worldId];
  const next = movePosition(entity.position, dir);

  if (!isInsideWorld(world, next)) {
    return exitBoxCore(state, entityId, dir, depth + 1);
  }

  const blocker = getBlockingEntityAt(state, next.worldId, next.x, next.y, entityId);

  if (!blocker) {
    setEntityPosition(state, entity, next);
    return { changed: true };
  }

  if (isOpenBox(blocker)) {
    return enterBoxCore(state, entity.id, blocker.id);
  }

  if (!isPushable(blocker)) {
    return { changed: false, reason: "blocked" };
  }

  const pushed = pushEntityCore(state, blocker.id, dir, depth + 1);
  if (!pushed.changed) {
    return pushed;
  }

  setEntityPosition(state, entity, next);
  return { changed: true };
}

function enterBoxCore(
  state: GameCoreState,
  entityId: EntityId,
  boxId: EntityId,
): MoveResult {
  const entity = state.entities[entityId];
  const box = state.entities[boxId];

  if (!entity || !box || !isOpenBox(box)) {
    return { changed: false, reason: "box-not-open" };
  }

  if (wouldCreateRecursiveContainment(state, entity, box)) {
    return { changed: false, reason: "recursive-containment" };
  }

  const innerWorld = state.worlds[box.innerWorldId as string];
  const entry = getEntryPosition(innerWorld);
  const blocker = getBlockingEntityAt(state, innerWorld.id, entry.x, entry.y, entityId);

  if (blocker) {
    return { changed: false, reason: "entry-blocked" };
  }

  setEntityPosition(state, entity, {
    worldId: innerWorld.id,
    x: entry.x,
    y: entry.y,
  });

  if (entity.type === "player") {
    state.activeWorldId = innerWorld.id;
  }

  return { changed: true };
}

function exitBoxCore(
  state: GameCoreState,
  entityId: EntityId,
  dir: Direction,
  depth: number,
): MoveResult {
  if (depth > MAX_PUSH_DEPTH) {
    return { changed: false, reason: "push-depth-exceeded" };
  }

  const entity = state.entities[entityId];
  if (!entity) {
    return { changed: false, reason: "missing-entity" };
  }

  const world = state.worlds[entity.position.worldId];
  if (!world.parent) {
    return { changed: false, reason: "no-parent-world" };
  }

  const parentWorld = state.worlds[world.parent.worldId];
  const parentBox = state.entities[world.parent.boxId] as BoxEntity | undefined;
  if (!parentWorld || !parentBox) {
    return { changed: false, reason: "missing-parent" };
  }

  const exitPosition = movePosition(parentBox.position, dir);
  if (!isInsideWorld(parentWorld, exitPosition)) {
    return { changed: false, reason: "parent-exit-outside" };
  }

  const blocker = getBlockingEntityAt(
    state,
    parentWorld.id,
    exitPosition.x,
    exitPosition.y,
    entityId,
  );

  if (blocker) {
    if (isOpenBox(blocker)) {
      return enterBoxCore(state, entity.id, blocker.id);
    }
    if (!isPushable(blocker)) {
      return { changed: false, reason: "parent-exit-blocked" };
    }
    const pushed = pushEntityCore(state, blocker.id, dir, depth + 1);
    if (!pushed.changed) {
      return pushed;
    }
  }

  setEntityPosition(state, entity, {
    worldId: parentWorld.id,
    x: exitPosition.x,
    y: exitPosition.y,
  });

  if (entity.type === "player") {
    state.activeWorldId = parentWorld.id;
  }

  return { changed: true };
}

function setEntityPosition(state: GameCoreState, entity: Entity, position: Entity["position"]) {
  state.entities[entity.id] = {
    ...entity,
    position: { ...position },
  } as Entity;
}

export function previewMove(state: GameState, entityId: EntityId, dir: Direction): GameCoreState {
  const core = cloneCore(toCore(state));
  moveEntity(core, entityId, dir, 0);
  core.won = checkWin(core);
  return core;
}
