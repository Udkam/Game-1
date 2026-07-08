import { Container, Graphics } from "pixi.js";
import type { Direction } from "../../core/types";
import type { Rect2D } from "../../projection/types";
import {
  ENTITY_SIZE,
  GOAL_SIZE,
  WALL_THICKNESS,
  getContainerPreviewRect,
  getPrimitiveShadowOffset,
  scaleMetric,
} from "../metrics";
import type { RenderPalette } from "../palette";

export interface RecursiveContainerPrimitive {
  container: Container;
  previewLayer: Container;
  previewRect: Rect2D;
}

export function createPlayerPrimitive(rect: Rect2D, palette: RenderPalette, facing: Direction = "down", depth = 0) {
  const container = new Container();
  container.label = "player-primitive";

  const body = new Graphics();
  const shadowOffset = getPrimitiveShadowOffset(depth);
  const radius = scaleMetric(WALL_THICKNESS * 0.18, depth);
  const eyeRadius = scaleMetric(ENTITY_SIZE * 0.075, depth);

  body.roundRect(rect.x + shadowOffset * 0.7, rect.y + shadowOffset * 0.85, rect.width, rect.height, radius).fill({
    color: palette.shellShadow,
    alpha: 0.65,
  });
  body.roundRect(rect.x, rect.y, rect.width, rect.height, radius).fill(palette.player);
  body.roundRect(rect.x, rect.y, rect.width, rect.height * 0.22, radius).fill({ color: 0xffffff, alpha: 0.12 });
  body.rect(rect.x + rect.width * 0.45, rect.y + rect.height * 0.78, rect.width * 0.1, rect.height * 0.15).fill({
    color: palette.playerAccent,
    alpha: 0.28,
  });
  body.circle(rect.x + rect.width * 0.32, rect.y + rect.height * 0.43, eyeRadius).fill(palette.playerAccent);
  body.circle(rect.x + rect.width * 0.68, rect.y + rect.height * 0.43, eyeRadius).fill(palette.playerAccent);
  body.poly(createFacingTriangle(rect, facing)).fill({ color: palette.playerAccent, alpha: 0.35 });

  container.addChild(body);
  return container;
}

function createFacingTriangle(rect: Rect2D, facing: Direction) {
  const centerX = rect.x + rect.width * 0.5;
  const centerY = rect.y + rect.height * 0.68;
  const tip = rect.width * 0.13;
  const base = rect.width * 0.1;

  if (facing === "up") {
    return [centerX, centerY - tip, centerX + base, centerY + base, centerX - base, centerY + base];
  }
  if (facing === "left") {
    return [centerX - tip, centerY, centerX + base, centerY - base, centerX + base, centerY + base];
  }
  if (facing === "right") {
    return [centerX + tip, centerY, centerX - base, centerY - base, centerX - base, centerY + base];
  }

  return [centerX, centerY + tip, centerX + base, centerY - base, centerX - base, centerY - base];
}

export function createBoxPrimitive(rect: Rect2D, palette: RenderPalette, depth = 0) {
  const container = new Container();
  container.label = "box-primitive";

  const body = new Graphics();
  const shadowOffset = getPrimitiveShadowOffset(depth);
  const tab = scaleMetric(WALL_THICKNESS * 0.24, depth);
  const radius = scaleMetric(WALL_THICKNESS * 0.1, depth);

  body.roundRect(rect.x + shadowOffset * 0.75, rect.y + shadowOffset * 0.75, rect.width, rect.height, radius).fill({
    color: palette.shellShadow,
    alpha: 0.6,
  });
  body.roundRect(rect.x - tab, rect.y + rect.height * 0.38, tab * 1.4, rect.height * 0.24, radius).fill(palette.boxSide);
  body.roundRect(rect.x + rect.width - tab * 0.4, rect.y + rect.height * 0.38, tab * 1.4, rect.height * 0.24, radius).fill(palette.boxSide);
  body.roundRect(rect.x + rect.width * 0.35, rect.y + rect.height - tab * 0.35, rect.width * 0.3, tab * 1.35, radius).fill(
    palette.boxSide,
  );
  body.roundRect(rect.x, rect.y, rect.width, rect.height, radius).fill(palette.box);
  body.rect(rect.x, rect.y, rect.width, rect.height * 0.08).fill({ color: 0xffffff, alpha: 0.17 });
  body.rect(rect.x + rect.width * 0.08, rect.y + rect.height * 0.84, rect.width * 0.84, rect.height * 0.08).fill({
    color: palette.boxSide,
    alpha: 0.22,
  });

  container.addChild(body);
  return container;
}

export function createGoalPrimitive(rect: Rect2D, palette: RenderPalette, depth = 0) {
  const container = new Container();
  container.label = "goal-primitive";

  const goal = new Graphics();
  const strokeWidth = scaleMetric(WALL_THICKNESS * 0.13, depth);
  const dotRadius = scaleMetric(GOAL_SIZE * 0.1, depth);
  const radius = scaleMetric(WALL_THICKNESS * 0.08, depth);
  const innerSizeGuard = scaleMetric(WALL_THICKNESS * 0.02, depth);

  goal.roundRect(rect.x, rect.y, rect.width, rect.height, radius).stroke({
    color: palette.goal,
    width: strokeWidth,
    alpha: 0.95,
  });
  goal
    .roundRect(
      rect.x + strokeWidth * 1.4,
      rect.y + strokeWidth * 1.4,
      Math.max(innerSizeGuard, rect.width - strokeWidth * 2.8),
      Math.max(innerSizeGuard, rect.height - strokeWidth * 2.8),
      radius,
    )
    .fill({
      color: palette.shellShadow,
      alpha: 0.18,
    });
  goal.circle(rect.x + rect.width * 0.28, rect.y + rect.height * 0.55, dotRadius).fill(palette.goalDot);
  goal.circle(rect.x + rect.width * 0.72, rect.y + rect.height * 0.55, dotRadius).fill(palette.goalDot);

  container.addChild(goal);
  return container;
}

export function createRecursiveContainerPrimitive(
  rect: Rect2D,
  palette: RenderPalette,
  depth = 0,
): RecursiveContainerPrimitive {
  const container = new Container();
  container.label = "recursive-container-primitive";

  const body = new Graphics();
  const previewLayer = new Container();
  const mask = new Graphics();
  const previewRect = getContainerPreviewRect(rect, depth);
  const shadowOffset = getPrimitiveShadowOffset(depth);
  const tab = scaleMetric(WALL_THICKNESS * 0.28, depth);
  const radius = scaleMetric(WALL_THICKNESS * 0.12, depth);
  const rimWidth = scaleMetric(WALL_THICKNESS * 0.08, depth);

  body.roundRect(rect.x + shadowOffset * 0.85, rect.y + shadowOffset, rect.width, rect.height, radius).fill({
    color: palette.shellShadow,
    alpha: 0.65,
  });
  body.roundRect(rect.x - tab, rect.y + rect.height * 0.38, tab * 1.4, rect.height * 0.24, radius).fill({
    color: palette.containerWindow,
    alpha: 0.9,
  });
  body.roundRect(rect.x + rect.width - tab * 0.4, rect.y + rect.height * 0.38, tab * 1.4, rect.height * 0.24, radius).fill({
    color: palette.containerWindow,
    alpha: 0.9,
  });
  body.roundRect(rect.x, rect.y, rect.width, rect.height, radius).fill(palette.container);
  body.roundRect(rect.x, rect.y, rect.width, rect.height * 0.16, radius).fill({ color: 0xffffff, alpha: 0.12 });
  body.roundRect(previewRect.x, previewRect.y, previewRect.width, previewRect.height, radius * 0.5).fill(palette.containerWindow);
  body.roundRect(previewRect.x, previewRect.y, previewRect.width, previewRect.height, radius * 0.5).stroke({
    color: palette.rimBright,
    width: rimWidth,
  });

  mask.roundRect(previewRect.x, previewRect.y, previewRect.width, previewRect.height, radius * 0.5).fill(0xffffff);
  mask.alpha = 0;
  previewLayer.mask = mask;

  container.addChild(body, previewLayer, mask);

  return {
    container,
    previewLayer,
    previewRect,
  };
}
