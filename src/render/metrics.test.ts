import { describe, expect, it } from "vitest";
import type { Rect2D, Size2D } from "../projection/types";
import {
  BOX_SIZE,
  CELL_SIZE,
  ENTITY_SIZE,
  GOAL_SIZE,
  RECURSIVE_SCALE_FACTOR,
  WALL_THICKNESS,
  getAlignedEntityRect,
  getCellRect,
  getDepthScale,
  getNestedWorldRect,
  getWorldRenderRect,
} from "./metrics";

describe("render metrics", () => {
  const worldSize: Size2D = { width: 10, height: 8 };
  const rootInterior: Rect2D = { x: WALL_THICKNESS, y: WALL_THICKNESS, width: 10 * CELL_SIZE, height: 8 * CELL_SIZE };

  it("defines one canonical root cell scale", () => {
    expect(CELL_SIZE).toBeGreaterThan(0);
    expect(getWorldRenderRect(worldSize, 0)).toEqual({ x: 0, y: 0, width: 960, height: 768 });
  });

  it("scales recursive depth from the same factor", () => {
    expect(getDepthScale(0)).toBe(1);
    expect(getDepthScale(1)).toBe(RECURSIVE_SCALE_FACTOR);
    expect(getDepthScale(2)).toBeCloseTo(RECURSIVE_SCALE_FACTOR * RECURSIVE_SCALE_FACTOR);
  });

  it("projects cell-space bounds into world-space consistently", () => {
    const rect = getCellRect({ x: 2, y: 3, width: 1, height: 1 }, worldSize, rootInterior);

    expect(rect).toEqual({
      x: WALL_THICKNESS + 2 * CELL_SIZE,
      y: WALL_THICKNESS + 3 * CELL_SIZE,
      width: CELL_SIZE,
      height: CELL_SIZE,
    });
  });

  it("centers entity kinds inside the same projected cell", () => {
    const player = getAlignedEntityRect("player", { x: 2, y: 3, width: 1, height: 1 }, worldSize, rootInterior, 0);
    const box = getAlignedEntityRect("box", { x: 2, y: 3, width: 1, height: 1 }, worldSize, rootInterior, 0);
    const goal = getAlignedEntityRect("goal", { x: 2, y: 3, width: 1, height: 1 }, worldSize, rootInterior, 0);

    expect(player.width).toBe(ENTITY_SIZE);
    expect(box.width).toBe(BOX_SIZE);
    expect(goal.width).toBe(GOAL_SIZE);
    expect(player.x + player.width / 2).toBe(box.x + box.width / 2);
    expect(player.y + player.height / 2).toBe(goal.y + goal.height / 2);
  });

  it("uses depth-scaled world rectangles for recursive previews", () => {
    const aperture = { x: 300, y: 250, width: 120, height: 120 };
    const nested = getNestedWorldRect({ width: 8, height: 6 }, 1, aperture);

    expect(nested.width).toBeCloseTo(8 * CELL_SIZE * RECURSIVE_SCALE_FACTOR);
    expect(nested.height).toBeCloseTo(6 * CELL_SIZE * RECURSIVE_SCALE_FACTOR);
    expect(nested.x + nested.width / 2).toBe(aperture.x + aperture.width / 2);
    expect(nested.y + nested.height / 2).toBe(aperture.y + aperture.height / 2);
  });
});
