import { describe, expect, it } from "vitest";
import { advanceOneTick, createInitialState, dispatch, getCurrentSection } from "./index";
import type { CourseEvent, RunnerBodyState, RunnerState } from "./types";

function scenario(
  events: readonly CourseEvent[],
  runner: Partial<RunnerBodyState> = {},
  sectionDistance = 0,
): RunnerState {
  const started = dispatch(createInitialState(9001), { type: "Start" }).state;
  const current = getCurrentSection(started);
  const replacement = { ...current, events };
  return {
    ...started,
    sectionDistance,
    runner: { ...started.runner, ...runner },
    course: {
      ...started.course,
      sections: started.course.sections.map((section) =>
        section.index === current.index ? replacement : section,
      ),
    },
    resolvedEventIds: [],
    consumedEventIds: [],
  };
}

function event(
  id: string,
  kind: CourseEvent["kind"],
  lane: CourseEvent["lane"] = 0,
  at = 0.1,
  length = kind === "gap" ? 4 : 1,
): CourseEvent {
  return { id, kind, lane, at, length };
}

describe("course event collision semantics", () => {
  it("requires jump height for beams and resolves the event exactly once", () => {
    const grounded = advanceOneTick(scenario([event("beam", "beam", "all")])).state;
    expect(grounded.status).toBe("game-over");
    expect(grounded.failureReason).toMatchObject({
      kind: "hazard-collision",
      hazard: "beam",
      eventId: "beam",
    });

    let jumping = scenario([event("beam", "beam", "all")], {
      height: 1.2,
      grounded: false,
      verticalVelocity: 0,
    });
    jumping = advanceOneTick(jumping).state;
    expect(jumping.status).toBe("running");
    expect(jumping.resolvedEventIds).toEqual(["beam"]);
    const rewound = { ...jumping, sectionDistance: 0 };
    expect(advanceOneTick(rewound).state.resolvedEventIds).toEqual(["beam"]);
  });

  it("requires active slide posture for a ring", () => {
    const upright = advanceOneTick(scenario([event("ring", "ring", "all")])).state;
    expect(upright.status).toBe("game-over");

    const slidingCommand = dispatch(scenario([event("ring", "ring", "all")]), {
      type: "Slide",
    });
    const sliding = advanceOneTick(slidingCommand.state).state;
    expect(sliding.status).toBe("running");
    expect(sliding.resolvedEventIds).toContain("ring");
  });

  it("treats columns as lane-only blockers regardless of posture", () => {
    const hit = advanceOneTick(
      scenario([event("column", "column", 0)], {
        height: 2,
        grounded: false,
        verticalVelocity: 0,
        slideTicksRemaining: 10,
      }),
    ).state;
    expect(hit.status).toBe("game-over");

    const avoided = advanceOneTick(
      scenario([event("column", "column", 0)], {
        lanePosition: 1,
        targetLane: 1,
      }),
    ).state;
    expect(avoided.status).toBe("running");
    expect(avoided.resolvedEventIds).toContain("column");
  });

  it("checks a gap across its full length and resolves it only at the far lip", () => {
    const gap = event("gap", "gap", "all", 0, 4);
    const enteringHigh = advanceOneTick(
      scenario([gap], {
        height: 1.4,
        grounded: false,
        verticalVelocity: 0,
      }),
    ).state;
    expect(enteringHigh.status).toBe("running");
    expect(enteringHigh.resolvedEventIds).not.toContain("gap");

    const landingInside = advanceOneTick(
      scenario(
        [gap],
        {
          height: 0.55,
          grounded: false,
          verticalVelocity: -2,
        },
        1,
      ),
    ).state;
    expect(landingInside.status).toBe("game-over");
    expect(landingInside.failureReason?.kind).toBe("gap-fall");

    const clearingLip = advanceOneTick(
      scenario(
        [gap],
        {
          height: 1.2,
          grounded: false,
          verticalVelocity: 0,
        },
        3.9,
      ),
    ).state;
    expect(clearingLip.status).toBe("running");
    expect(clearingLip.resolvedEventIds).toContain("gap");
  });

  it("collects shards once and does not award a missed lane", () => {
    let collected = advanceOneTick(scenario([event("shard", "shard", 0)])).state;
    expect(collected.shards).toBe(1);
    expect(collected.consumedEventIds).toEqual(["shard"]);
    collected = advanceOneTick({ ...collected, sectionDistance: 0 }).state;
    expect(collected.shards).toBe(1);

    const missed = advanceOneTick(
      scenario([event("missed", "shard", -1)], {
        lanePosition: 1,
        targetLane: 1,
      }),
    ).state;
    expect(missed.shards).toBe(0);
    expect(missed.resolvedEventIds).toContain("missed");
    expect(missed.consumedEventIds).not.toContain("missed");
  });

  it("collects one shield, absorbs exactly one hazard, then fails on the next", () => {
    const shieldThenColumn = advanceOneTick(
      scenario([
        event("shield", "shield", 0, 0.05),
        event("first-column", "column", 0, 0.1),
      ]),
    );
    expect(shieldThenColumn.state.status).toBe("running");
    expect(shieldThenColumn.state.runner.shieldCharges).toBe(0);
    expect(shieldThenColumn.events.filter((item) => item.type === "shield-broken")).toHaveLength(1);
    expect(shieldThenColumn.state.consumedEventIds).toEqual(["shield", "first-column"]);

    const twoHazards = advanceOneTick(
      scenario(
        [
          event("first", "column", 0, 0.08),
          event("second", "column", 0, 0.12),
        ],
        { shieldCharges: 1 },
      ),
    );
    expect(twoHazards.events.filter((item) => item.type === "shield-broken")).toHaveLength(1);
    expect(twoHazards.events.filter((item) => item.type === "collision")).toHaveLength(1);
    expect(twoHazards.state.status).toBe("game-over");
    expect(twoHazards.state.failureReason).toMatchObject({ eventId: "second" });
  });
});
