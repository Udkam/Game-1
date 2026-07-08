import { describe, expect, it } from "vitest";
import type { TransitionEvent } from "../core/types";
import { createAnimationPlan } from "./transitions";

describe("animation event mapping", () => {
  it("maps movement and push events into entity, audio, and camera cues", () => {
    const events: TransitionEvent[] = [
      {
        type: "push",
        actorId: "player-a",
        direction: "right",
        pushed: [
          {
            entityId: "box-a",
            from: { worldId: "world-a", x: 3, y: 2 },
            to: { worldId: "world-a", x: 4, y: 2 },
          },
        ],
      },
      {
        type: "move",
        entityId: "player-a",
        from: { worldId: "world-a", x: 2, y: 2 },
        to: { worldId: "world-a", x: 3, y: 2 },
      },
    ];

    const plan = createAnimationPlan(events);

    expect(plan.direction).toBe("forward");
    expect(plan.entityMotions.map((motion) => [motion.entityId, motion.kind])).toEqual([
      ["box-a", "push"],
      ["player-a", "move"],
    ]);
    expect(plan.entityMotions[0]).toMatchObject({
      anticipationMs: expect.any(Number),
      settleMs: expect.any(Number),
      facing: "right",
    });
    expect(plan.audioCues.map((cue) => cue.kind)).toEqual(["push", "move"]);
    expect(plan.cameraCues.map((cue) => cue.kind)).toContain("impact");
  });

  it("maps blocked events into impact feedback without entity motion", () => {
    const plan = createAnimationPlan([
      {
        type: "blocked",
        actorId: "player-a",
        direction: "left",
        attemptedPosition: { worldId: "world-a", x: 1, y: 2 },
        reason: "target-solid-not-pushable",
      },
    ]);

    expect(plan.entityMotions).toEqual([]);
    expect(plan.blockedImpacts).toEqual([
      {
        actorId: "player-a",
        direction: "left",
        durationMs: expect.any(Number),
      },
    ]);
    expect(plan.audioCues.map((cue) => cue.kind)).toEqual(["blocked"]);
  });

  it("can reverse a movement event for undo timelines", () => {
    const plan = createAnimationPlan(
      [
        {
          type: "move",
          entityId: "player-a",
          from: { worldId: "world-a", x: 2, y: 2 },
          to: { worldId: "world-a", x: 3, y: 2 },
        },
      ],
      { direction: "reverse" },
    );

    expect(plan.direction).toBe("reverse");
    expect(plan.entityMotions[0]).toMatchObject({
      entityId: "player-a",
      from: { worldId: "world-a", x: 3, y: 2 },
      to: { worldId: "world-a", x: 2, y: 2 },
    });
  });
});
