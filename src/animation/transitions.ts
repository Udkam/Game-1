import type { Direction, GridPosition, TransitionEvent } from "../core/types";

export type AnimationDirection = "forward" | "reverse";
export type EntityMotionKind = "move" | "push";
export type AudioCueKind = "move" | "push" | "blocked" | "enter" | "exit" | "success";
export type CameraCueKind = "follow" | "impact" | "enter" | "exit";

export interface EntityMotion {
  readonly kind: EntityMotionKind;
  readonly entityId: string;
  readonly from: GridPosition;
  readonly to: GridPosition;
  readonly durationMs: number;
  readonly anticipationMs?: number;
  readonly settleMs?: number;
  readonly facing?: Direction;
}

export interface BlockedImpact {
  readonly actorId: string;
  readonly direction?: Direction;
  readonly durationMs: number;
}

export interface CameraCue {
  readonly kind: CameraCueKind;
  readonly entityId?: string;
  readonly direction?: Direction;
  readonly strength?: number;
  readonly durationMs: number;
}

export interface AudioCue {
  readonly kind: AudioCueKind;
  readonly volume: number;
}

export interface AnimationPlan {
  readonly direction: AnimationDirection;
  readonly durationMs: number;
  readonly entityMotions: readonly EntityMotion[];
  readonly blockedImpacts: readonly BlockedImpact[];
  readonly cameraCues: readonly CameraCue[];
  readonly audioCues: readonly AudioCue[];
}

export interface AnimationPlanOptions {
  readonly direction?: AnimationDirection;
}

const DURATION = {
  move: 140,
  push: 190,
  blocked: 95,
  enter: 560,
  exit: 500,
  reset: 140,
} as const;

export function createAnimationPlan(
  events: readonly TransitionEvent[],
  options: AnimationPlanOptions = {},
): AnimationPlan {
  const direction = options.direction ?? "forward";
  const sourceEvents = direction === "reverse" ? [...events].reverse() : events;
  const entityMotions: EntityMotion[] = [];
  const blockedImpacts: BlockedImpact[] = [];
  const cameraCues: CameraCue[] = [];
  const audioCues: AudioCue[] = [];

  for (const event of sourceEvents) {
    if (event.type === "move") {
      entityMotions.push({
        kind: "move",
        entityId: event.entityId,
        from: direction === "reverse" ? event.to : event.from,
        to: direction === "reverse" ? event.from : event.to,
        durationMs: DURATION.move,
        facing: directionFromPositions(event.from, event.to),
      });
      cameraCues.push({ kind: "follow", entityId: event.entityId, durationMs: DURATION.move });
      audioCues.push({ kind: "move", volume: 0.45 });
      continue;
    }

    if (event.type === "push") {
      for (const pushed of event.pushed) {
        entityMotions.push({
          kind: "push",
          entityId: pushed.entityId,
          from: direction === "reverse" ? pushed.to : pushed.from,
          to: direction === "reverse" ? pushed.from : pushed.to,
          durationMs: DURATION.push,
          anticipationMs: 34,
          settleMs: 42,
          facing: event.direction,
        });
      }
      cameraCues.push({ kind: "impact", direction: event.direction, strength: 7, durationMs: 80 });
      audioCues.push({ kind: "push", volume: 0.56 });
      continue;
    }

    if (event.type === "blocked") {
      blockedImpacts.push({
        actorId: event.actorId,
        direction: event.direction,
        durationMs: DURATION.blocked,
      });
      cameraCues.push({
        kind: "impact",
        direction: event.direction,
        strength: 9,
        durationMs: DURATION.blocked,
      });
      audioCues.push({ kind: "blocked", volume: 0.32 });
      continue;
    }

    if (event.type === "enterWorld") {
      cameraCues.push({ kind: direction === "reverse" ? "exit" : "enter", durationMs: DURATION.enter });
      audioCues.push({ kind: direction === "reverse" ? "exit" : "enter", volume: 0.5 });
      continue;
    }

    if (event.type === "exitWorld") {
      cameraCues.push({ kind: direction === "reverse" ? "enter" : "exit", durationMs: DURATION.exit });
      audioCues.push({ kind: direction === "reverse" ? "enter" : "exit", volume: 0.48 });
      continue;
    }

    if (event.type === "reset") {
      audioCues.push({ kind: "success", volume: 0.25 });
    }
  }

  return {
    direction,
    durationMs: getPlanDuration(entityMotions, blockedImpacts, cameraCues),
    entityMotions,
    blockedImpacts,
    cameraCues,
    audioCues,
  };
}

function getPlanDuration(
  motions: readonly EntityMotion[],
  impacts: readonly BlockedImpact[],
  cameraCues: readonly CameraCue[],
) {
  return Math.max(
    DURATION.move,
    ...motions.map((motion) => motion.durationMs),
    ...impacts.map((impact) => impact.durationMs),
    ...cameraCues.map((cue) => cue.durationMs),
  );
}

function directionFromPositions(from: GridPosition, to: GridPosition): Direction | undefined {
  if (to.x > from.x) {
    return "right";
  }
  if (to.x < from.x) {
    return "left";
  }
  if (to.y > from.y) {
    return "down";
  }
  if (to.y < from.y) {
    return "up";
  }
  return undefined;
}
