import { validateLevelDefinition, type Entity } from "../game";
import type { TutorialLevel as RecursiveTutorialLevel } from "./tutorial";

const tagChecks: Record<string, (level: RecursiveTutorialLevel) => boolean> = {
  enter: (level) => level.entities.some((entity) => entity.type === "box" && entity.open && entity.innerWorldId),
  "recursive-room": (level) => level.worlds.length > 1,
  "push-out": (level) => level.worlds.some((world) => Boolean(world.parent)),
  "edge-exit": (level) => level.worlds.some((world) => Boolean(world.parent)),
  "push-into": (level) => level.entities.some((entity) => entity.type === "box" && entity.open && entity.innerWorldId),
  container: (level) => level.entities.some((entity) => entity.type === "box" && entity.innerWorldId),
  "parent-update": (level) => level.entities.some((entity) => entity.type === "box" && entity.innerWorldId && !entity.open),
  "two-layer": (level) => level.worlds.length >= 3,
  "cross-world": (level) => new Set(level.entities.filter(isGoal).map((goal) => goal.position.worldId)).size >= 2,
  "multi-goal": (level) => level.entities.filter(isGoal).length >= 2,
  sequence: (level) => level.scriptedSolution.length > 1,
  "nested-box": (level) => level.worlds.length >= 3 && level.entities.filter((entity) => entity.type === "box" && entity.innerWorldId).length >= 2,
  composite: (level) => level.mechanicTags.length >= 3,
  push: (level) => level.entities.some((entity) => entity.type === "box"),
  dock: (level) => level.entities.some(isGoal),
};

export function validateTutorialLevel(level: RecursiveTutorialLevel): string[] {
  const errors = [...validateLevelDefinition(level)];
  const goals = level.entities.filter(isGoal);

  if (!level.subtitle) {
    errors.push(`${level.id} missing subtitle`);
  }
  if (!level.designIntent) {
    errors.push(`${level.id} missing designIntent`);
  }
  if (!Array.isArray(level.mechanicTags) || level.mechanicTags.length === 0) {
    errors.push(`${level.id} missing mechanicTags`);
  }
  if (!Number.isFinite(level.parMoves) || level.parMoves <= 0) {
    errors.push(`${level.id} missing positive parMoves`);
  }
  if (!Number.isFinite(level.targetMoves) || level.targetMoves <= 0) {
    errors.push(`${level.id} missing positive targetMoves`);
  }
  if (!Array.isArray(level.scriptedSolution) || level.scriptedSolution.length === 0) {
    errors.push(`${level.id} missing scriptedSolution`);
  }
  if (goals.length === 0) {
    errors.push(`${level.id} must include at least one goal`);
  }

  for (const tag of level.mechanicTags) {
    const check = tagChecks[tag];
    if (check && !check(level)) {
      errors.push(`${level.id} tag ${tag} is not supported by level entities/worlds`);
    }
  }

  return errors;
}

function isGoal(entity: Entity): entity is Extract<Entity, { type: "goal" }> {
  return entity.type === "goal";
}
