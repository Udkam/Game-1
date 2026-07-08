import { describe, expect, it } from "vitest";
import { AnimationSystem } from "./AnimationSystem";
import type { AnimationPlan } from "./transitions";

describe("AnimationSystem", () => {
  it("advances entity progress and completes a timeline", () => {
    const system = new AnimationSystem();
    const first = system.start({
      direction: "forward",
      durationMs: 120,
      entityMotions: [
        {
          kind: "move",
          entityId: "player-a",
          from: { worldId: "world-a", x: 2, y: 2 },
          to: { worldId: "world-a", x: 3, y: 2 },
          durationMs: 120,
          facing: "right",
        },
      ],
      blockedImpacts: [],
      cameraCues: [],
      audioCues: [],
    });

    expect(first.running).toBe(true);
    expect(first.entityProgress["player-a"]).toBe(0);

    const middle = system.step(60);
    expect(middle.running).toBe(true);
    expect(middle.entityProgress["player-a"]).toBeGreaterThan(0);
    expect(middle.entityProgress["player-a"]).toBeLessThan(1);

    const done = system.step(60);
    expect(done.running).toBe(false);
    expect(done.complete).toBe(true);
    expect(done.entityProgress["player-a"]).toBe(1);
  });

  it("cancels the active plan and clears transient impact progress", () => {
    const system = new AnimationSystem();
    const plan: AnimationPlan = {
      direction: "forward",
      durationMs: 100,
      entityMotions: [],
      blockedImpacts: [{ actorId: "player-a", direction: "up", durationMs: 90 }],
      cameraCues: [{ kind: "impact", direction: "up", strength: 10, durationMs: 90 }],
      audioCues: [],
    };

    system.start(plan);
    expect(system.step(20).blockedImpact).toBeGreaterThan(0);

    const cancelled = system.cancel();
    expect(cancelled.running).toBe(false);
    expect(cancelled.complete).toBe(false);
    expect(cancelled.blockedImpact).toBe(0);
  });
});
