import {
  FIXED_TICK_SECONDS,
  createInitialState,
  dispatch,
  getCurrentSection,
  type CourseEvent,
  type RunnerCommand,
  type RunnerEvent,
  type RunnerState,
} from "../core";

export const QA_SCENARIO_NAMES = [
  "ready",
  "running",
  "lane-mid",
  "jump-apex",
  "slide-mid",
  "turn-mid",
  "collision",
] as const;

export type QaScenarioName = (typeof QA_SCENARIO_NAMES)[number];

export interface QaScenario {
  readonly name: QaScenarioName;
  readonly previousState: RunnerState;
  readonly state: RunnerState;
  readonly events: readonly RunnerEvent[];
}

function accepted(state: RunnerState, command: RunnerCommand): {
  readonly state: RunnerState;
  readonly events: readonly RunnerEvent[];
} {
  const result = dispatch(state, command);
  if (!result.accepted) {
    throw new Error(`QA scenario command ${command.type} was rejected: ${result.rejection}`);
  }
  return result;
}

function running(seed: number): RunnerState {
  return accepted(createInitialState(seed), { type: "Start" }).state;
}

function advance(
  initial: RunnerState,
  ticks: number,
): { readonly previousState: RunnerState; readonly state: RunnerState; readonly events: RunnerEvent[] } {
  let previousState = initial;
  let state = initial;
  const events: RunnerEvent[] = [];
  for (let index = 0; index < ticks; index += 1) {
    previousState = state;
    const result = accepted(state, { type: "Tick" });
    state = result.state;
    events.push(...result.events);
    if (state.status !== "running") break;
  }
  return { previousState, state, events };
}

function actionThenAdvance(
  state: RunnerState,
  command: RunnerCommand,
  ticks: number,
): { readonly previousState: RunnerState; readonly state: RunnerState; readonly events: RunnerEvent[] } {
  const action = accepted(state, command);
  const advanced = advance(action.state, ticks);
  return {
    previousState: advanced.previousState,
    state: advanced.state,
    events: [...action.events, ...advanced.events],
  };
}

function turnScenario(seed: number): QaScenario {
  const initial = running(seed);
  const section = getCurrentSection(initial);
  const distanceBeforeEnd = Math.max(0.01, initial.speed * FIXED_TICK_SECONDS * 0.25);
  const before: RunnerState = {
    ...initial,
    distance: section.length - distanceBeforeEnd,
    sectionDistance: section.length - distanceBeforeEnd,
    queuedTurn: section.requiredTurn,
    resolvedEventIds: section.events.map((event) => event.id),
  };
  const result = accepted(before, { type: "Tick" });
  const turnEvents = result.events.filter((event) => event.type === "turned");
  if (turnEvents.length !== 1) {
    throw new Error("Turn QA scenario did not produce exactly one turn event");
  }
  return {
    name: "turn-mid",
    previousState: before,
    state: result.state,
    events: result.events,
  };
}

function firstCollidableEvent(state: RunnerState): {
  readonly sectionIndex: number;
  readonly event: CourseEvent;
} {
  for (const section of state.course.sections) {
    const event = section.events.find((candidate) =>
      candidate.kind === "column" ||
      candidate.kind === "beam" ||
      candidate.kind === "ring" ||
      candidate.kind === "gap",
    );
    if (event) return { sectionIndex: section.index, event };
  }
  throw new Error("Generated QA course contains no collidable event");
}

function collisionScenario(seed: number): QaScenario {
  const initial = running(seed);
  const target = firstCollidableEvent(initial);
  const section = initial.course.sections.find((candidate) => candidate.index === target.sectionIndex);
  if (!section) throw new Error("Collision QA section is missing");
  const beforeDistance = Math.max(0, target.event.at - initial.speed * FIXED_TICK_SECONDS * 0.5);
  const lane = target.event.lane === "all" ? 0 : target.event.lane;
  const before: RunnerState = {
    ...initial,
    sectionIndex: section.index,
    sectionDistance: beforeDistance,
    distance: beforeDistance,
    runner: {
      ...initial.runner,
      lanePosition: lane,
      targetLane: lane,
      laneTransition: null,
      grounded: true,
      height: 0,
      verticalVelocity: 0,
      slideTicksRemaining: 0,
      shieldCharges: 0,
    },
    resolvedEventIds: [],
    consumedEventIds: [],
  };
  const result = accepted(before, { type: "Tick" });
  if (result.state.status !== "game-over") {
    throw new Error(`Collision QA event ${target.event.kind} did not fail the run`);
  }
  return {
    name: "collision",
    previousState: before,
    state: result.state,
    events: result.events,
  };
}

export function createQaScenario(name: QaScenarioName, seed: number): QaScenario {
  switch (name) {
    case "ready": {
      const state = createInitialState(seed);
      return { name, previousState: state, state, events: [] };
    }
    case "running": {
      const state = running(seed);
      return { name, previousState: state, state, events: [] };
    }
    case "lane-mid": {
      const value = actionThenAdvance(running(seed), { type: "StepRight" }, 5);
      return { name, ...value };
    }
    case "jump-apex": {
      const jump = accepted(running(seed), { type: "Jump" });
      let previousState = jump.state;
      let state = jump.state;
      const events: RunnerEvent[] = [...jump.events];
      for (let index = 0; index < 90 && state.runner.verticalVelocity > 0; index += 1) {
        previousState = state;
        const result = accepted(state, { type: "Tick" });
        state = result.state;
        events.push(...result.events);
      }
      if (state.runner.height <= 0 || state.runner.grounded) {
        throw new Error("Jump QA scenario did not reach an airborne apex");
      }
      return { name, previousState, state, events };
    }
    case "slide-mid": {
      const value = actionThenAdvance(running(seed), { type: "Slide" }, 15);
      return { name, ...value };
    }
    case "turn-mid":
      return turnScenario(seed);
    case "collision":
      return collisionScenario(seed);
  }
}
