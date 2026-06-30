import { normalizeLevel } from "./levelSchema";
import type { Entity, GameCoreState, GameState, LevelDefinition, World } from "./types";

export function cloneCore(state: GameCoreState): GameCoreState {
  const worlds = Object.fromEntries(
    Object.values(state.worlds).map((world): [string, World] => [
      world.id,
      {
        ...world,
        parent: world.parent ? { ...world.parent } : undefined,
        entry: world.entry ? { ...world.entry } : undefined,
      },
    ]),
  );
  const entities = Object.fromEntries(
    Object.values(state.entities).map((entity): [string, Entity] => [
      entity.id,
      { ...entity, position: { ...entity.position } },
    ]),
  );

  return {
    ...state,
    worlds,
    entities,
  };
}

export function createGameState(level: LevelDefinition): GameState {
  const initial = normalizeLevel(level);
  return {
    ...cloneCore(initial),
    initial: cloneCore(initial),
    history: [],
  };
}

export function toCore(state: GameState): GameCoreState {
  return cloneCore({
    levelId: state.levelId,
    title: state.title,
    worlds: state.worlds,
    entities: state.entities,
    playerId: state.playerId,
    activeWorldId: state.activeWorldId,
    moves: state.moves,
    won: state.won,
    lastAction: state.lastAction,
  });
}

export function withHistory(previous: GameState, nextCore: GameCoreState): GameState {
  return {
    ...cloneCore(nextCore),
    initial: cloneCore(previous.initial),
    history: [...previous.history, toCore(previous)],
  };
}

export function undo(state: GameState): GameState {
  const previous = state.history.at(-1);
  if (!previous) {
    return state;
  }

  return {
    ...cloneCore(previous),
    initial: cloneCore(state.initial),
    history: state.history.slice(0, -1),
  };
}

export function reset(state: GameState): GameState {
  return {
    ...cloneCore(state.initial),
    initial: cloneCore(state.initial),
    history: [],
  };
}
