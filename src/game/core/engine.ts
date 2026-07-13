import {
  BEAM_CLEARANCE_HEIGHT,
  COLLISION_LANE_TOLERANCE,
  FIXED_TICK_SECONDS,
  GAP_CLEARANCE_HEIGHT,
  JUMP_GRAVITY,
  JUMP_INITIAL_VELOCITY,
  LANE_TRANSITION_TICKS,
  PICKUP_LANE_TOLERANCE,
  SHIELD_SPEED_FACTOR,
  SHIELD_SPEED_PENALTY_TICKS,
  SLIDE_TICKS,
  multiplierForDistance,
  scoreFor,
  speedForDistance,
} from "./constants";
import { createCourse, ensureCourseWindow } from "./generator";
import { getCurrentSection, isTurnWindow } from "./path";
import { normalizeSeed } from "./random";
import type {
  CommandRejection,
  CommandResult,
  CourseEvent,
  CourseSection,
  FailureReason,
  HazardKind,
  Lane,
  RunnerBodyState,
  RunnerCommand,
  RunnerEvent,
  RunnerState,
  TurnDirection,
} from "./types";

const DEFAULT_SEED = 0x54494445;

function initialBody(): RunnerBodyState {
  return {
    lanePosition: 0,
    targetLane: 0,
    laneTransition: null,
    height: 0,
    verticalVelocity: 0,
    grounded: true,
    slideTicksRemaining: 0,
    shieldCharges: 0,
    speedPenaltyTicks: 0,
  };
}

export function createInitialState(seed = DEFAULT_SEED): RunnerState {
  const normalizedSeed = normalizeSeed(seed);
  return {
    version: 1,
    seed: normalizedSeed,
    status: "ready",
    tick: 0,
    elapsedTicks: 0,
    distance: 0,
    sectionIndex: 0,
    sectionDistance: 0,
    speed: speedForDistance(0),
    score: 0,
    shards: 0,
    multiplier: 1,
    queuedTurn: null,
    failureReason: null,
    runner: initialBody(),
    course: createCourse(normalizedSeed),
    resolvedEventIds: [],
    consumedEventIds: [],
  };
}

function rejected(state: RunnerState, rejection: CommandRejection): CommandResult {
  return { state, events: [], accepted: false, rejection };
}

function accepted(state: RunnerState, events: readonly RunnerEvent[] = []): CommandResult {
  return { state, events, accepted: true, rejection: null };
}

function failTurn(
  state: RunnerState,
  section: CourseSection,
  received: TurnDirection,
): CommandResult {
  const reason: FailureReason = {
    kind: "wrong-turn",
    sectionId: section.id,
    expected: section.requiredTurn,
    received,
  };
  const failedState: RunnerState = {
    ...state,
    status: "game-over",
    failureReason: reason,
  };
  return accepted(failedState, [
    { type: "run-failed", tick: state.tick, reason },
  ]);
}

function directionToLaneDelta(direction: TurnDirection): -1 | 1 {
  return direction === "left" ? -1 : 1;
}

function applyHorizontalCommand(state: RunnerState, direction: TurnDirection): CommandResult {
  if (state.status !== "running") {
    return rejected(state, "not-running");
  }
  const section = getCurrentSection(state);
  if (isTurnWindow(state)) {
    if (state.queuedTurn !== null) {
      return rejected(state, "turn-already-queued");
    }
    if (section.requiredTurn !== direction) {
      return failTurn(state, section, direction);
    }
    const nextState: RunnerState = { ...state, queuedTurn: direction };
    return accepted(nextState, [
      {
        type: "turn-queued",
        tick: state.tick,
        sectionId: section.id,
        direction,
      },
    ]);
  }

  const target = state.runner.targetLane + directionToLaneDelta(direction);
  if (target < -1 || target > 1) {
    return rejected(state, "lane-boundary");
  }
  const targetLane = target as Lane;
  const runner: RunnerBodyState = {
    ...state.runner,
    targetLane,
    laneTransition: {
      from: state.runner.lanePosition,
      to: targetLane,
      elapsedTicks: 0,
      durationTicks: LANE_TRANSITION_TICKS,
    },
  };
  return accepted(
    { ...state, runner },
    [
      {
        type: "lane-shifted",
        tick: state.tick,
        from: state.runner.lanePosition,
        to: targetLane,
      },
    ],
  );
}

function applyJump(state: RunnerState): CommandResult {
  if (state.status !== "running") {
    return rejected(state, "not-running");
  }
  if (state.runner.slideTicksRemaining > 0) {
    return rejected(state, "sliding");
  }
  if (!state.runner.grounded) {
    return rejected(state, "airborne");
  }
  return accepted(
    {
      ...state,
      runner: {
        ...state.runner,
        grounded: false,
        verticalVelocity: JUMP_INITIAL_VELOCITY,
      },
    },
    [{ type: "jump-started", tick: state.tick }],
  );
}

function applySlide(state: RunnerState): CommandResult {
  if (state.status !== "running") {
    return rejected(state, "not-running");
  }
  if (state.runner.slideTicksRemaining > 0) {
    return rejected(state, "already-sliding");
  }
  return accepted(
    {
      ...state,
      runner: { ...state.runner, slideTicksRemaining: SLIDE_TICKS },
    },
    [{ type: "slide-started", tick: state.tick }],
  );
}

function updateMotion(runner: RunnerBodyState, nextTick: number): {
  readonly runner: RunnerBodyState;
  readonly events: readonly RunnerEvent[];
} {
  let lanePosition = runner.lanePosition;
  let laneTransition = runner.laneTransition;
  if (laneTransition) {
    const elapsedTicks = Math.min(laneTransition.durationTicks, laneTransition.elapsedTicks + 1);
    const progress = elapsedTicks / laneTransition.durationTicks;
    lanePosition =
      laneTransition.from + (laneTransition.to - laneTransition.from) * progress;
    laneTransition =
      elapsedTicks >= laneTransition.durationTicks
        ? null
        : { ...laneTransition, elapsedTicks };
    if (laneTransition === null) {
      lanePosition = runner.targetLane;
    }
  }

  let height = runner.height;
  let verticalVelocity = runner.verticalVelocity;
  let grounded = runner.grounded;
  const events: RunnerEvent[] = [];
  if (!grounded) {
    verticalVelocity += JUMP_GRAVITY * FIXED_TICK_SECONDS;
    height += verticalVelocity * FIXED_TICK_SECONDS;
    if (height <= 0) {
      height = 0;
      verticalVelocity = 0;
      grounded = true;
      events.push({ type: "landed", tick: nextTick });
    }
  }

  return {
    runner: {
      ...runner,
      lanePosition,
      laneTransition,
      height,
      verticalVelocity,
      grounded,
    },
    events,
  };
}

function laneMatches(event: CourseEvent, lanePosition: number, tolerance: number): boolean {
  return event.lane === "all" || Math.abs(lanePosition - event.lane) <= tolerance;
}

function pointCrossed(event: CourseEvent, from: number, to: number): boolean {
  return from <= event.at && to >= event.at;
}

function gapOverlaps(event: CourseEvent, from: number, to: number): boolean {
  return to >= event.at && from <= event.at + event.length;
}

function isHazard(event: CourseEvent): event is CourseEvent & { kind: HazardKind } {
  return (
    event.kind === "beam" ||
    event.kind === "ring" ||
    event.kind === "column" ||
    event.kind === "gap"
  );
}

function eventPriority(event: CourseEvent): number {
  if (event.kind === "shield") return 0;
  if (event.kind === "shard") return 1;
  return 2;
}

interface EventResolution {
  readonly runner: RunnerBodyState;
  readonly shards: number;
  readonly resolvedEventIds: readonly string[];
  readonly consumedEventIds: readonly string[];
  readonly events: readonly RunnerEvent[];
  readonly failureReason: FailureReason | null;
}

function collisionFailure(
  section: CourseSection,
  event: CourseEvent & { kind: HazardKind },
): FailureReason {
  if (event.kind === "gap") {
    return { kind: "gap-fall", sectionId: section.id, eventId: event.id };
  }
  return {
    kind: "hazard-collision",
    sectionId: section.id,
    eventId: event.id,
    hazard: event.kind,
  };
}

function resolveCourseEvents(
  state: RunnerState,
  section: CourseSection,
  runnerAtCollision: RunnerBodyState,
  from: number,
  to: number,
  nextTick: number,
): EventResolution {
  let runner = runnerAtCollision;
  let shards = state.shards;
  const resolved = new Set(state.resolvedEventIds);
  const consumed = new Set(state.consumedEventIds);
  const events: RunnerEvent[] = [];
  let failureReason: FailureReason | null = null;
  const candidates = section.events
    .filter((event) => !resolved.has(event.id))
    .filter((event) =>
      event.kind === "gap" ? gapOverlaps(event, from, to) : pointCrossed(event, from, to),
    )
    .slice()
    .sort((left, right) => {
      return (
        left.at - right.at ||
        eventPriority(left) - eventPriority(right) ||
        (left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
      );
    });

  for (const courseEvent of candidates) {
    if (failureReason) break;

    if (courseEvent.kind === "shard" || courseEvent.kind === "shield") {
      resolved.add(courseEvent.id);
      if (laneMatches(courseEvent, runner.lanePosition, PICKUP_LANE_TOLERANCE)) {
        if (courseEvent.kind === "shard") {
          shards += 1;
          consumed.add(courseEvent.id);
          events.push({
            type: "pickup-collected",
            tick: nextTick,
            sectionId: section.id,
            eventId: courseEvent.id,
            pickup: "shard",
          });
        } else if (runner.shieldCharges === 0) {
          runner = { ...runner, shieldCharges: 1 };
          consumed.add(courseEvent.id);
          events.push({
            type: "pickup-collected",
            tick: nextTick,
            sectionId: section.id,
            eventId: courseEvent.id,
            pickup: "shield",
          });
        }
      }
      continue;
    }

    if (!isHazard(courseEvent)) continue;
    const laneCollision = laneMatches(
      courseEvent,
      runner.lanePosition,
      COLLISION_LANE_TOLERANCE,
    );
    let collides = false;
    if (laneCollision) {
      switch (courseEvent.kind) {
        case "beam":
          collides = runner.height < BEAM_CLEARANCE_HEIGHT;
          break;
        case "ring":
          collides = runner.slideTicksRemaining <= 0;
          break;
        case "column":
          collides = true;
          break;
        case "gap":
          collides = runner.height < GAP_CLEARANCE_HEIGHT;
          break;
      }
    }

    const gapComplete =
      courseEvent.kind !== "gap" ||
      !laneCollision ||
      to >= courseEvent.at + courseEvent.length;
    if (collides || gapComplete || courseEvent.kind !== "gap") {
      resolved.add(courseEvent.id);
    }
    if (!collides) continue;

    if (runner.shieldCharges > 0) {
      runner = {
        ...runner,
        shieldCharges: 0,
        speedPenaltyTicks: SHIELD_SPEED_PENALTY_TICKS,
      };
      consumed.add(courseEvent.id);
      events.push({
        type: "shield-broken",
        tick: nextTick,
        sectionId: section.id,
        eventId: courseEvent.id,
        hazard: courseEvent.kind,
      });
      continue;
    }

    failureReason = collisionFailure(section, courseEvent);
    events.push({
      type: "collision",
      tick: nextTick,
      sectionId: section.id,
      eventId: courseEvent.id,
      hazard: courseEvent.kind,
    });
    events.push({ type: "run-failed", tick: nextTick, reason: failureReason });
  }

  return {
    runner,
    shards,
    resolvedEventIds: [...resolved],
    consumedEventIds: [...consumed],
    events,
    failureReason,
  };
}

export function advanceOneTick(state: RunnerState): CommandResult {
  if (state.status !== "running") {
    return rejected(state, "not-running");
  }

  const nextTick = state.tick + 1;
  const motion = updateMotion(state.runner, nextTick);
  const baseSpeed = speedForDistance(state.distance);
  const speed =
    state.runner.speedPenaltyTicks > 0
      ? Math.max(0, baseSpeed * SHIELD_SPEED_FACTOR)
      : baseSpeed;
  const travel = speed * FIXED_TICK_SECONDS;
  const section = getCurrentSection(state);
  const from = state.sectionDistance;
  const to = from + travel;
  const resolution = resolveCourseEvents(state, section, motion.runner, from, to, nextTick);
  const tickEvents: RunnerEvent[] = [...motion.events, ...resolution.events];

  let status: RunnerState["status"] = resolution.failureReason ? "game-over" : state.status;
  let failureReason = resolution.failureReason;
  let sectionIndex = state.sectionIndex;
  let sectionDistance = to;
  let queuedTurn = state.queuedTurn;
  let course = state.course;

  if (!failureReason && to >= section.length) {
    if (queuedTurn !== section.requiredTurn) {
      failureReason = {
        kind: "missed-turn",
        sectionId: section.id,
        expected: section.requiredTurn,
      };
      status = "game-over";
      sectionDistance = section.length;
      tickEvents.push({ type: "run-failed", tick: nextTick, reason: failureReason });
    } else {
      sectionIndex += 1;
      sectionDistance = to - section.length;
      queuedTurn = null;
      course = ensureCourseWindow(course, sectionIndex);
      const nextSection = course.sections.find((candidate) => candidate.index === sectionIndex);
      if (!nextSection) {
        throw new Error(`Generator did not provide section ${sectionIndex}`);
      }
      tickEvents.push({
        type: "turned",
        tick: nextTick,
        fromSectionId: section.id,
        toSectionId: nextSection.id,
        direction: section.requiredTurn,
      });
    }
  }

  const distance = state.distance + travel;
  const multiplier = multiplierForDistance(distance);
  let runner: RunnerBodyState = {
    ...resolution.runner,
    slideTicksRemaining: Math.max(0, resolution.runner.slideTicksRemaining - 1),
    speedPenaltyTicks: Math.max(0, resolution.runner.speedPenaltyTicks - 1),
  };
  const finalBaseSpeed = speedForDistance(distance);
  const finalSpeed =
    runner.speedPenaltyTicks > 0 ? finalBaseSpeed * SHIELD_SPEED_FACTOR : finalBaseSpeed;

  const nextState: RunnerState = {
    ...state,
    status,
    tick: nextTick,
    elapsedTicks: state.elapsedTicks + 1,
    distance,
    sectionIndex,
    sectionDistance,
    speed: finalSpeed,
    score: scoreFor(distance, resolution.shards, multiplier),
    shards: resolution.shards,
    multiplier,
    queuedTurn,
    failureReason,
    runner,
    course,
    resolvedEventIds: resolution.resolvedEventIds,
    consumedEventIds: resolution.consumedEventIds,
  };

  return accepted(nextState, tickEvents);
}

export function dispatch(state: RunnerState, command: RunnerCommand): CommandResult {
  switch (command.type) {
    case "Start":
      if (state.status !== "ready") return rejected(state, "not-ready");
      return accepted(
        { ...state, status: "running" },
        [{ type: "run-started", tick: state.tick }],
      );
    case "StepLeft":
      return applyHorizontalCommand(state, "left");
    case "StepRight":
      return applyHorizontalCommand(state, "right");
    case "Jump":
      return applyJump(state);
    case "Slide":
      return applySlide(state);
    case "Pause":
      if (state.status !== "running") return rejected(state, "not-running");
      return accepted(
        { ...state, status: "paused" },
        [{ type: "paused", tick: state.tick }],
      );
    case "Resume":
      if (state.status !== "paused") return rejected(state, "not-paused");
      return accepted(
        { ...state, status: "running" },
        [{ type: "resumed", tick: state.tick }],
      );
    case "Restart": {
      if (state.status === "running") {
        return rejected(state, "restart-not-allowed");
      }
      const seed = command.seed === undefined ? state.seed : normalizeSeed(command.seed);
      const restarted = { ...createInitialState(seed), status: "running" as const };
      return accepted(restarted, [{ type: "restarted", tick: 0, seed }]);
    }
    case "Tick":
      return advanceOneTick(state);
  }
}
