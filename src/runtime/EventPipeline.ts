import { createAnimationPlan, type AnimationPlan, type AnimationDirection } from "../animation/transitions";
import type { SimulationCommand } from "../core/commands";
import { hashState } from "../core/hash";
import type { SimulationSession, HistoryRecord } from "../core/history";
import { dispatchCommand } from "../core/reducer";
import type { TransitionEvent } from "../core/types";
import { createProjectionFromSimulationState } from "../projection/simulationProjection";
import type { WorldProjection } from "../projection/types";

export interface EventPipelineResult {
  readonly accepted: boolean;
  readonly reason?: string;
  readonly session: SimulationSession;
  readonly events: readonly TransitionEvent[];
  readonly animationPlan: AnimationPlan;
  readonly previousHash: string;
  readonly nextHash: string;
  readonly previousProjection: WorldProjection;
  readonly nextProjection: WorldProjection;
}

export class EventPipeline {
  dispatch(session: SimulationSession, command: SimulationCommand): EventPipelineResult {
    const previousState = session.present;
    const historyRecord = getHistoryRecordForCommand(session, command);
    const coreResult = dispatchCommand(session, command);
    const animationDirection = getAnimationDirection(command);
    const events = getEventsForAnimation(coreResult.events, historyRecord, animationDirection);
    const animationPlan = createAnimationPlan(events, { direction: animationDirection });

    return {
      accepted: coreResult.accepted,
      reason: coreResult.reason,
      session: coreResult.session,
      events,
      animationPlan,
      previousHash: hashState(previousState),
      nextHash: hashState(coreResult.session.present),
      previousProjection: createProjectionFromSimulationState(previousState),
      nextProjection: createProjectionFromSimulationState(coreResult.session.present),
    };
  }
}

function getHistoryRecordForCommand(
  session: SimulationSession,
  command: SimulationCommand,
): HistoryRecord | undefined {
  if (command.type === "undo") {
    return session.history.past.at(-1);
  }
  if (command.type === "redo") {
    return session.history.future[0];
  }
  return undefined;
}

function getAnimationDirection(command: SimulationCommand): AnimationDirection {
  return command.type === "undo" ? "reverse" : "forward";
}

function getEventsForAnimation(
  events: readonly TransitionEvent[],
  historyRecord: HistoryRecord | undefined,
  direction: AnimationDirection,
) {
  if (direction === "reverse") {
    return historyRecord?.transitionEvents ?? events;
  }

  return events.length > 0 ? events : (historyRecord?.transitionEvents ?? events);
}
