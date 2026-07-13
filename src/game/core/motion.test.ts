import { describe, expect, it } from "vitest";
import {
  LANE_TRANSITION_TICKS,
  MAX_SPEED,
  SLIDE_TICKS,
  advanceOneTick,
  createInitialState,
  dispatch,
  hashState,
  speedForDistance,
} from "./index";
import type { RunnerState } from "./types";

function started(seed = 12): RunnerState {
  return dispatch(createInitialState(seed), { type: "Start" }).state;
}

describe("runner motion, timing, and lifecycle", () => {
  it("moves between lanes continuously for exactly ten simulation ticks", () => {
    let state = dispatch(started(), { type: "StepRight" }).state;
    const positions: number[] = [];
    for (let tick = 1; tick <= LANE_TRANSITION_TICKS; tick += 1) {
      state = advanceOneTick(state).state;
      positions.push(state.runner.lanePosition);
    }

    expect(positions[0]).toBeCloseTo(0.1, 12);
    expect(positions[8]).toBeCloseTo(0.9, 12);
    expect(positions[9]).toBe(1);
    expect(state.runner.laneTransition).toBeNull();
    const atBoundary = dispatch(state, { type: "StepRight" });
    expect(atBoundary.accepted).toBe(false);
    expect(atBoundary.state).toBe(state);
  });

  it("runs one deterministic grounded jump arc and clamps landing exactly", () => {
    let state = dispatch(started(), { type: "Jump" }).state;
    let maximumHeight = 0;
    let landingTick = -1;
    for (let tick = 1; tick <= 90; tick += 1) {
      const result = advanceOneTick(state);
      state = result.state;
      maximumHeight = Math.max(maximumHeight, state.runner.height);
      if (result.events.some((event) => event.type === "landed")) {
        landingTick = tick;
        break;
      }
    }

    expect(maximumHeight).toBeGreaterThan(1.8);
    expect(landingTick).toBeGreaterThanOrEqual(38);
    expect(landingTick).toBeLessThanOrEqual(42);
    expect(state.runner).toMatchObject({
      height: 0,
      verticalVelocity: 0,
      grounded: true,
    });
  });

  it("keeps slide active for exactly 31 ticks without extension", () => {
    let state = dispatch(started(), { type: "Slide" }).state;
    expect(state.runner.slideTicksRemaining).toBe(SLIDE_TICKS);
    const redundant = dispatch(state, { type: "Slide" });
    expect(redundant.accepted).toBe(false);
    expect(redundant.state).toBe(state);

    for (let tick = 1; tick < SLIDE_TICKS; tick += 1) {
      state = advanceOneTick(state).state;
    }
    expect(state.runner.slideTicksRemaining).toBe(1);
    state = advanceOneTick(state).state;
    expect(state.runner.slideTicksRemaining).toBe(0);
  });

  it("allows an airborne slide but rejects a jump while sliding", () => {
    let state = dispatch(started(), { type: "Jump" }).state;
    state = advanceOneTick(state).state;
    const slide = dispatch(state, { type: "Slide" });
    expect(slide.accepted).toBe(true);
    expect(slide.state.runner.grounded).toBe(false);
    expect(dispatch(slide.state, { type: "Jump" }).rejection).toBe("sliding");
  });

  it("freezes paused ticks and rebuilds a clean deterministic restart", () => {
    let state = started(444);
    state = dispatch(state, { type: "StepLeft" }).state;
    state = advanceOneTick(state).state;
    const paused = dispatch(state, { type: "Pause" }).state;
    const pausedHash = hashState(paused);
    const frozen = dispatch(paused, { type: "Tick" });

    expect(frozen.accepted).toBe(false);
    expect(frozen.state).toBe(paused);
    expect(hashState(frozen.state)).toBe(pausedHash);

    const restarted = dispatch(paused, { type: "Restart" }).state;
    expect(restarted).toMatchObject({
      seed: 444,
      status: "running",
      tick: 0,
      elapsedTicks: 0,
      distance: 0,
      score: 0,
      shards: 0,
      sectionIndex: 0,
      sectionDistance: 0,
      resolvedEventIds: [],
      consumedEventIds: [],
    });
    expect(restarted.course).toEqual(createInitialState(444).course);
  });

  it("does not let a running restart bypass the public lifecycle contract", () => {
    const state = started(445);
    const result = dispatch(state, { type: "Restart" });
    expect(result.accepted).toBe(false);
    expect(result.rejection).toBe("restart-not-allowed");
    expect(result.state).toBe(state);
  });

  it("accelerates monotonically from 9 m/s and never exceeds 19 m/s", () => {
    expect(speedForDistance(0)).toBe(9);
    expect(speedForDistance(500)).toBeGreaterThan(speedForDistance(250));
    expect(speedForDistance(10_000)).toBe(MAX_SPEED);

    const highDistance = {
      ...started(),
      distance: 100_000,
      speed: MAX_SPEED,
    };
    const ticked = advanceOneTick(highDistance).state;
    expect(ticked.speed).toBe(MAX_SPEED);
    expect(ticked.multiplier).toBe(5);
  });
});
