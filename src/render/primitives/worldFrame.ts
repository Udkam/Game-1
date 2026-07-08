import { Container, Graphics } from "pixi.js";
import type { Rect2D } from "../../projection/types";
import { getInteriorRect, getWorldMaterialMetrics } from "../materials";
import type { RenderPalette } from "../palette";

export interface WorldFramePrimitive {
  container: Container;
  contentLayer: Container;
  interiorRect: Rect2D;
}

export function createWorldFrame(rect: Rect2D, palette: RenderPalette, depth: number): WorldFramePrimitive {
  const container = new Container();
  container.label = `world-frame-depth-${depth}`;
  container.position.set(rect.x, rect.y);

  const frame = new Graphics();
  const contentLayer = new Container();
  const mask = new Graphics();

  const metrics = getWorldMaterialMetrics(rect, depth);
  const wall = metrics.wallThickness;
  const outerX = -wall;
  const outerY = -wall;
  const outerWidth = rect.width + wall * 2;
  const outerHeight = rect.height + wall * 2;
  const interiorRect = getInteriorRect(rect, metrics);

  frame
    .roundRect(
      outerX + metrics.shadowOffset,
      outerY + metrics.shadowOffset * 1.15,
      outerWidth,
      outerHeight,
      metrics.shellRadius,
    )
    .fill({ color: palette.shellShadow, alpha: 0.62 });
  frame.roundRect(outerX, outerY, outerWidth, outerHeight, metrics.shellRadius).fill(palette.shell);
  frame
    .roundRect(-wall * 0.52, -wall * 0.52, rect.width + wall * 1.04, rect.height + wall * 1.04, metrics.trayRadius)
    .fill(palette.shellDark);
  frame
    .poly([
      outerX,
      outerY,
      outerX + outerWidth,
      outerY,
      rect.width,
      0,
      0,
      0,
    ])
    .fill(palette.rim);
  frame
    .poly([
      rect.width,
      0,
      outerX + outerWidth,
      outerY,
      outerX + outerWidth,
      outerY + outerHeight,
      rect.width,
      rect.height,
    ])
    .fill(palette.rimBright);
  frame
    .poly([
      0,
      rect.height,
      rect.width,
      rect.height,
      outerX + outerWidth,
      outerY + outerHeight,
      outerX,
      outerY + outerHeight,
    ])
    .fill(palette.rimBright);
  frame
    .roundRect(interiorRect.x, interiorRect.y, interiorRect.width, interiorRect.height, metrics.interiorRadius)
    .fill(palette.interior);
  frame
    .roundRect(interiorRect.x, interiorRect.y, interiorRect.width, interiorRect.height * 0.38, metrics.interiorRadius)
    .fill({ color: palette.interiorShade, alpha: 0.2 });

  mask
    .roundRect(interiorRect.x, interiorRect.y, interiorRect.width, interiorRect.height, metrics.interiorRadius)
    .fill(0xffffff);
  mask.alpha = 0;
  contentLayer.mask = mask;

  container.addChild(frame, contentLayer, mask);

  return {
    container,
    contentLayer,
    interiorRect,
  };
}
