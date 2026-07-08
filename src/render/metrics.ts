import type { PrototypeEntityKind, Rect2D, Size2D } from "../projection/types";

export const CELL_SIZE = 96;
export const ENTITY_SIZE = 76;
export const BOX_SIZE = 84;
export const WALL_THICKNESS = 44;
export const GOAL_SIZE = 72;
export const SHADOW_OFFSET = 9;
export const RECURSIVE_SCALE_FACTOR = 0.1;

export function getDepthScale(depth: number) {
  return RECURSIVE_SCALE_FACTOR ** Math.max(0, depth);
}

export function scaleMetric(value: number, depth: number) {
  return value * getDepthScale(depth);
}

export function getWorldRenderRect(worldSize: Size2D, depth = 0, origin = { x: 0, y: 0 }): Rect2D {
  const scale = getDepthScale(depth);

  return {
    x: origin.x,
    y: origin.y,
    width: worldSize.width * CELL_SIZE * scale,
    height: worldSize.height * CELL_SIZE * scale,
  };
}

export function getWorldCameraBounds(worldRect: Rect2D, depth = 0): Rect2D {
  const padding = scaleMetric(WALL_THICKNESS + SHADOW_OFFSET * 1.5, depth);

  return {
    x: worldRect.x - padding,
    y: worldRect.y - padding,
    width: worldRect.width + padding * 2,
    height: worldRect.height + padding * 2,
  };
}

export function getCellRect(cellBounds: Rect2D, worldSize: Size2D, interiorRect: Rect2D): Rect2D {
  const cellWidth = interiorRect.width / worldSize.width;
  const cellHeight = interiorRect.height / worldSize.height;

  return {
    x: interiorRect.x + cellBounds.x * cellWidth,
    y: interiorRect.y + cellBounds.y * cellHeight,
    width: cellBounds.width * cellWidth,
    height: cellBounds.height * cellHeight,
  };
}

export function getAlignedEntityRect(
  kind: PrototypeEntityKind,
  cellBounds: Rect2D,
  worldSize: Size2D,
  interiorRect: Rect2D,
  depth: number,
): Rect2D {
  const cellRect = getCellRect(cellBounds, worldSize, interiorRect);
  const visualSize = getEntityVisualSize(kind, depth);

  return {
    x: cellRect.x + (cellRect.width - visualSize.width) / 2,
    y: cellRect.y + (cellRect.height - visualSize.height) / 2,
    width: visualSize.width,
    height: visualSize.height,
  };
}

export function getNestedWorldRect(worldSize: Size2D, depth: number, apertureRect: Rect2D): Rect2D {
  const nested = getWorldRenderRect(worldSize, depth);

  return {
    x: apertureRect.x + (apertureRect.width - nested.width) / 2,
    y: apertureRect.y + (apertureRect.height - nested.height) / 2,
    width: nested.width,
    height: nested.height,
  };
}

export function getContainerPreviewRect(rect: Rect2D, depth: number): Rect2D {
  const inset = scaleMetric(WALL_THICKNESS * 0.3, depth);
  const guard = scaleMetric(WALL_THICKNESS * 0.02, depth);

  return {
    x: rect.x + inset,
    y: rect.y + inset,
    width: Math.max(guard, rect.width - inset * 2),
    height: Math.max(guard, rect.height - inset * 2),
  };
}

export function getPrimitiveShadowOffset(depth: number) {
  return scaleMetric(SHADOW_OFFSET, depth);
}

function getEntityVisualSize(kind: PrototypeEntityKind, depth: number): Size2D {
  const scale = getDepthScale(depth);
  const size = kind === "player" ? ENTITY_SIZE : kind === "goal" ? GOAL_SIZE : BOX_SIZE;

  return {
    width: size * scale,
    height: size * scale,
  };
}
