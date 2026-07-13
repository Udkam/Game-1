import { describe, expect, it } from "vitest";
import {
  advanceOneTick,
  createInitialState,
  dispatch,
  getCurrentSection,
  isTurnWindow,
} from "./index";
import type { RunnerState, TurnDirection } from "./types";

function inTurnWindow(): RunnerState {
  const state = dispatch(createInitialState(707), { type: "Start" }).state;
  const section = getCurrentSection(state);
  return { ...state, sectionDistance: section.turnInputStart + 0.01 };
}

function commandFor(direction: TurnDirection): { type: "StepLeft" | "StepRight" } {
  return { type: direction === "left" ? "StepLeft" : "StepRight" };
}

function opposite(direction: TurnDirection): TurnDirection {
  return direction === "left" ? "right" : "left";
}

describe("turn-window priority and outcomes", () => {
  it("queues the matching turn without changing lane state", () => {
    const state = inTurnWindow();
    const section = getCurrentSection(state);
    expect(isTurnWindow(state)).toBe(true);
    const result = dispatch(state, commandFor(section.requiredTurn));

    expect(result.accepted).toBe(true);
    expect(result.state.queuedTurn).toBe(section.requiredTurn);
    expect(result.state.runner).toBe(state.runner);
    expect(result.events).toEqual([
      {
        type: "turn-queued",
        tick: state.tick,
        sectionId: section.id,
        direction: section.requiredTurn,
      },
    ]);

    const repeated = dispatch(result.state, commandFor(section.requiredTurn));
    expect(repeated.rejection).toBe("turn-already-queued");
    expect(repeated.state).toBe(result.state);
  });

  it("fails immediately with wrong-turn for the first wrong input", () => {
    const state = inTurnWindow();
    const section = getCurrentSection(state);
    const received = opposite(section.requiredTurn);
    const result = dispatch(state, commandFor(received));

    expect(result.accepted).toBe(true);
    expect(result.state.status).toBe("game-over");
    expect(result.state.failureReason).toEqual({
      kind: "wrong-turn",
      sectionId: section.id,
      expected: section.requiredTurn,
      received,
    });
    expect(result.state.runner).toBe(state.runner);
  });

  it("fails with missed-turn when crossing the section end unqueued", () => {
    const state = inTurnWindow();
    const section = getCurrentSection(state);
    const atEdge = { ...state, sectionDistance: section.length - 0.01 };
    const result = advanceOneTick(atEdge);

    expect(result.state.status).toBe("game-over");
    expect(result.state.sectionIndex).toBe(section.index);
    expect(result.state.sectionDistance).toBe(section.length);
    expect(result.state.failureReason).toEqual({
      kind: "missed-turn",
      sectionId: section.id,
      expected: section.requiredTurn,
    });
    expect(result.events.filter((event) => event.type === "turned")).toHaveLength(0);
  });

  it("advances exactly once and emits one turn event after a queued match", () => {
    const state = inTurnWindow();
    const section = getCurrentSection(state);
    const queued = dispatch(state, commandFor(section.requiredTurn)).state;
    const atEdge = { ...queued, sectionDistance: section.length - 0.01 };
    const result = advanceOneTick(atEdge);

    expect(result.state.status).toBe("running");
    expect(result.state.sectionIndex).toBe(section.index + 1);
    expect(result.state.sectionDistance).toBeGreaterThanOrEqual(0);
    expect(result.state.sectionDistance).toBeLessThan(1);
    expect(result.state.queuedTurn).toBeNull();
    const turnEvents = result.events.filter((event) => event.type === "turned");
    expect(turnEvents).toHaveLength(1);
    expect(turnEvents[0]).toMatchObject({
      fromSectionId: section.id,
      direction: section.requiredTurn,
    });
  });

  it("uses ordinary lane movement immediately before, but never inside, the window", () => {
    const state = inTurnWindow();
    const section = getCurrentSection(state);
    const before = { ...state, sectionDistance: section.turnInputStart - 0.01 };
    const result = dispatch(before, { type: "StepLeft" });
    expect(result.state.queuedTurn).toBeNull();
    expect(result.state.runner.targetLane).toBe(-1);
  });
});
