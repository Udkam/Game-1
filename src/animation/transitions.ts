import type { PublicCommand } from "../core/commands";
import type {
  CellAddress,
  Direction,
  EntityMovedEvent,
  EntityOccurrenceAddress,
  EntityTransferredEvent,
  PortOccurrenceAddress,
  SemanticEvent,
  WorldAddress,
} from "../core/types";
import { sameEntityOccurrence, sameWorldAddress } from "../projection/types";

export type AnimationDirection = "forward" | "reverse";
export type EntityMotionKind = "move" | "push";
export type AudioCueKind = "move" | "push" | "blocked" | "enter" | "exit" | "success";
export type CameraCueKind = "follow" | "impact" | "enter" | "exit";

export interface EntityMotion {
  readonly kind: EntityMotionKind;
  readonly occurrence: EntityOccurrenceAddress;
  readonly from: CellAddress;
  readonly to: CellAddress;
  readonly durationMs: number;
  readonly anticipationMs?: number;
  readonly settleMs?: number;
  readonly facing?: Direction;
}

export interface BlockedImpact {
  /** No actor occurrence is public on a rejected Step in I1. */
  readonly actorId?: string;
  readonly direction?: Direction;
  readonly durationMs: number;
}

export interface CameraCue {
  readonly kind: CameraCueKind;
  readonly occurrence?: EntityOccurrenceAddress;
  readonly world?: WorldAddress;
  readonly portal?: PortalTransition;
  readonly direction?: Direction;
  readonly strength?: number;
  readonly durationMs: number;
}

/** Explicit portal bridge; actor occurrences intentionally differ across a traversal. */
export interface PortalTransition {
  readonly mode: "enter" | "exit";
  readonly actorBefore: EntityOccurrenceAddress;
  readonly actorAfter: EntityOccurrenceAddress;
  readonly port: PortOccurrenceAddress;
  readonly from: CellAddress;
  readonly to: CellAddress;
}

/**
 * One addressed payload crossing.  This deliberately stays separate from
 * EntityMotion: the two endpoint occurrences belong to different worlds and
 * must be bridged by their complete paths rather than by an entity-id key.
 */
export interface TransferTransition {
  readonly mode: "push-in" | "push-out";
  readonly direction: AnimationDirection;
  readonly entityBefore: EntityOccurrenceAddress;
  readonly entityAfter: EntityOccurrenceAddress;
  readonly from: CellAddress;
  readonly to: CellAddress;
  readonly via: PortOccurrenceAddress;
  readonly carriedSubtree: EntityTransferredEvent["carriedSubtree"];
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
  readonly portalTransitions: readonly PortalTransition[];
  /** Optional so the read-only AnimationSystem plan fixtures remain valid. */
  readonly transferTransitions?: readonly TransferTransition[];
  readonly audioCues: readonly AudioCue[];
}

const DURATION = {
  move: 140,
  push: 190,
  blocked: 95,
  enter: 560,
  exit: 500,
  transfer: 360,
} as const;

export function createAnimationPlan(
  events: readonly SemanticEvent[],
  command?: PublicCommand,
): AnimationPlan {
  // Semantic events have already been bound to their playback direction by
  // the public core. In particular, Undo provides reversed event order and
  // swapped endpoints, so preserve that direction but never transform the
  // event array or endpoints a second time.
  const direction = events[0]?.direction ?? "forward";
  const entityMotions: EntityMotion[] = [];
  const blockedImpacts: BlockedImpact[] = [];
  const cameraCues: CameraCue[] = [];
  const portalTransitions: PortalTransition[] = [];
  const transferTransitions: TransferTransition[] = [];
  const audioCues: AudioCue[] = [];

  for (const event of events) {
    if (event.type === "entity-moved") {
      if (isCoveredByPushResolution(event, events)) {
        continue;
      }

      const isAggregatePushActor = isPushResolvedActor(event, events);
      addEntityMotion(entityMotions, event, isAggregatePushActor ? "move" : event.cause === "push" ? "push" : "move");
      if (event.cause === "walk") {
        cameraCues.push({ kind: "follow", occurrence: event.occurrence, durationMs: DURATION.move });
        audioCues.push({ kind: "move", volume: 0.45 });
      }
      continue;
    }

    if (event.type === "push-resolved") {
      for (const moved of event.moved) {
        addEntityMotion(entityMotions, moved, "push", event.directionMoved);
      }
      cameraCues.push({ kind: "impact", direction: event.directionMoved, strength: 7, durationMs: 80 });
      audioCues.push({ kind: "push", volume: 0.56 });
      continue;
    }

    if (event.type === "entity-transferred") {
      transferTransitions.push(transferTransitionFromEvent(event));
      continue;
    }

    if (event.type === "command-blocked") {
      const blockedDirection = command?.type === "step" ? command.direction : undefined;
      blockedImpacts.push({
        direction: blockedDirection,
        durationMs: DURATION.blocked,
      });
      cameraCues.push({
        kind: "impact",
        direction: blockedDirection,
        strength: 9,
        durationMs: DURATION.blocked,
      });
      audioCues.push({ kind: "blocked", volume: 0.32 });
      continue;
    }

    if (event.type === "portal-traversed") {
      const durationMs = event.mode === "enter" ? DURATION.enter : DURATION.exit;
      const portal: PortalTransition = {
        mode: event.mode,
        actorBefore: event.actorBefore,
        actorAfter: event.actorAfter,
        port: event.port,
        from: event.from,
        to: event.to,
      };
      portalTransitions.push(portal);
      cameraCues.push({
        kind: event.mode,
        world: event.mode === "enter" ? event.actorAfter.world : event.actorBefore.world,
        portal,
        durationMs,
      });
      audioCues.push({ kind: event.mode, volume: event.mode === "enter" ? 0.5 : 0.48 });
      continue;
    }

    if (event.type === "reset") {
      // Reset is a state replacement, not a solved-state confirmation.
      continue;
    }

    if (event.type === "win-changed" && event.solved) {
      audioCues.push({ kind: "success", volume: 0.5 });
    }
  }

  return {
    direction,
    durationMs: getPlanDuration(entityMotions, blockedImpacts, cameraCues, transferTransitions),
    entityMotions,
    blockedImpacts,
    cameraCues,
    portalTransitions,
    transferTransitions,
    audioCues,
  };
}

function transferTransitionFromEvent(event: EntityTransferredEvent): TransferTransition {
  return {
    mode: event.mode,
    direction: event.direction,
    entityBefore: event.entityBefore,
    entityAfter: event.entityAfter,
    from: event.from,
    to: event.to,
    via: event.via,
    carriedSubtree: event.carriedSubtree,
    durationMs: DURATION.transfer,
  };
}

function addEntityMotion(
  motions: EntityMotion[],
  event: EntityMovedEvent,
  kind: EntityMotionKind,
  facing: Direction | undefined = directionFromAddresses(event.from, event.to),
) {
  motions.push({
    kind,
    occurrence: event.occurrence,
    from: event.from,
    to: event.to,
    durationMs: kind === "push" ? DURATION.push : DURATION.move,
    ...(kind === "push" ? { anticipationMs: 34, settleMs: 42 } : {}),
    facing,
  });
}

function isCoveredByPushResolution(event: EntityMovedEvent, events: readonly SemanticEvent[]) {
  return event.cause === "push" && events.some((candidate) =>
    candidate.type === "push-resolved" && candidate.moved.some((moved) => sameEntityMotion(moved, event)),
  );
}

function isPushResolvedActor(event: EntityMovedEvent, events: readonly SemanticEvent[]) {
  return event.cause === "push" && events.some((candidate) =>
    candidate.type === "push-resolved" && sameOccurrenceAddress(candidate.actor, event.occurrence),
  );
}

function sameEntityMotion(left: EntityMovedEvent, right: EntityMovedEvent) {
  return sameEntityOccurrence(left.occurrence, right.occurrence) &&
    sameCellAddress(left.from, right.from) &&
    sameCellAddress(left.to, right.to);
}

function sameOccurrenceAddress(left: EntityOccurrenceAddress, right: EntityOccurrenceAddress) {
  return sameEntityOccurrence(left, right);
}

function sameCellAddress(left: CellAddress, right: CellAddress) {
  return left.x === right.x && left.y === right.y && sameWorldAddress(left.world, right.world);
}

function getPlanDuration(
  motions: readonly EntityMotion[],
  impacts: readonly BlockedImpact[],
  cameraCues: readonly CameraCue[],
  transfers: readonly TransferTransition[] = [],
) {
  if (motions.length === 0 && impacts.length === 0 && cameraCues.length === 0 && transfers.length === 0) {
    return 0;
  }
  return Math.max(
    0,
    ...motions.map((motion) => motion.durationMs),
    ...impacts.map((impact) => impact.durationMs),
    ...cameraCues.map((cue) => cue.durationMs),
    ...transfers.map((transfer) => transfer.durationMs),
  );
}

function directionFromAddresses(from: CellAddress, to: CellAddress): Direction | undefined {
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
