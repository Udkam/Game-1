import { describe, expect, it } from "vitest";
import { Camera2D } from "./Camera2D";

describe("Camera2D game-feel extensions", () => {
  it("smoothly follows a target and reaches the requested state", () => {
    const camera = new Camera2D();
    const target = camera.getFollowState(
      { width: 1000, height: 800 },
      { x: 0, y: 0, width: 960, height: 768 },
      { x: 520, y: 350, width: 90, height: 90 },
      { margin: 72, followStrength: 0.55, maxScale: 1.2 },
    );

    camera.beginFollowTransition(target, 100);
    expect(camera.isTransitioning).toBe(true);
    camera.stepTransition(50);
    expect(camera.current.x).not.toBe(target.x);
    camera.stepTransition(50);
    expect(camera.current).toEqual(target);
  });

  it("cancels camera transition and impact response together", () => {
    const camera = new Camera2D();

    camera.beginZoomTransition({ x: 10, y: 20, scale: 1.5 }, 120);
    camera.beginImpact(12, -4, 90);
    expect(camera.hasActiveEffects).toBe(true);

    camera.cancelTransition();

    expect(camera.isTransitioning).toBe(false);
    expect(camera.hasActiveEffects).toBe(false);
  });
});
