import type { Rect2D } from "../../projection/types";
import { SHADOW_OFFSET, WALL_THICKNESS, scaleMetric } from "../metrics";

export interface WorldMaterialMetrics {
  wallThickness: number;
  shadowOffset: number;
  shellRadius: number;
  trayRadius: number;
  shellInset: number;
  bevel: number;
  interiorRadius: number;
}

export function getWorldMaterialMetrics(_rect: Rect2D, depth = 0): WorldMaterialMetrics {
  const wallThickness = scaleMetric(WALL_THICKNESS, depth);
  const shadowOffset = scaleMetric(SHADOW_OFFSET, depth);

  return {
    wallThickness,
    shadowOffset,
    shellRadius: wallThickness * 0.32,
    trayRadius: wallThickness * 0.72,
    shellInset: wallThickness,
    bevel: wallThickness * 0.42,
    interiorRadius: wallThickness * 0.18,
  };
}

export function getInteriorRect(rect: Rect2D, _metrics: WorldMaterialMetrics): Rect2D {
  return {
    x: 0,
    y: 0,
    width: rect.width,
    height: rect.height,
  };
}
