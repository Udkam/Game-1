import { Application, Graphics } from "pixi.js";
import { AnimationSystem, type AnimationFrameState } from "../animation/AnimationSystem";
import { lerp } from "../animation/easing";
import type { AnimationPlan, CameraCue } from "../animation/transitions";
import type { Direction } from "../core/types";
import type { EntityProjection, Rect2D, Size2D, WorldProjection } from "../projection/types";
import { createRecursiveInteractionProjection } from "../projection/worldProjection";
import { Camera2D } from "./Camera2D";
import { createRenderLayers, type RenderLayers } from "./layers";
import { getPalette, type RenderPalette } from "./palette";
import {
  createBoxPrimitive,
  createGoalPrimitive,
  createPlayerPrimitive,
  createRecursiveContainerPrimitive,
} from "./primitives/entityPrimitives";
import {
  getAlignedEntityRect,
  getContainerPreviewRect,
  getNestedWorldRect,
  getWorldCameraBounds,
  getWorldRenderRect,
} from "./metrics";
import { createWorldFrame } from "./primitives/worldFrame";
import { RecursiveTransitionRenderer, type RecursiveTransitionGeometry } from "./RecursiveTransitionRenderer";

export class PixiApp {
  private readonly host: HTMLElement;
  private readonly camera = new Camera2D();
  private readonly animationSystem = new AnimationSystem();
  private app: Application | null = null;
  private layers: RenderLayers | null = null;
  private transitionRenderer: RecursiveTransitionRenderer | null = null;
  private transitionGeometry: RecursiveTransitionGeometry | null = null;
  private animatedProjection:
    | {
        from: WorldProjection;
        to: WorldProjection;
        plan: AnimationPlan;
        onComplete?: () => void;
      }
    | null = null;
  private projection: WorldProjection = createRecursiveInteractionProjection();
  private rootWorldBounds: Rect2D = getWorldRenderRect(this.projection.world.size);
  private lastViewport: Size2D = { width: 0, height: 0 };
  private wantsInnerView = false;
  private readonly facingByEntity = new Map<string, Direction>();
  private readonly tick = () => {
    const app = this.app;
    if (!app) {
      return;
    }

    const viewport = { width: app.screen.width, height: app.screen.height };
    const resized = viewport.width !== this.lastViewport.width || viewport.height !== this.lastViewport.height;

    if (resized) {
      this.draw();
    }

    if (this.animatedProjection) {
      const frame = this.animationSystem.step(app.ticker.deltaMS);
      this.camera.stepTransition(app.ticker.deltaMS);
      this.draw(frame);

      if (!frame.running) {
        const completed = this.animatedProjection;
        this.projection = completed.to;
        this.animatedProjection = null;
        this.draw();
        completed.onComplete?.();
      }
      return;
    }

    if (this.transitionRenderer?.isTransitioning && this.transitionGeometry) {
      this.transitionRenderer.update(app.ticker.deltaMS, this.transitionGeometry);
    }
  };

  constructor(host: HTMLElement) {
    this.host = host;
  }

  async init() {
    const app = new Application();

    await app.init({
      background: "#020409",
      resizeTo: this.host,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      preference: "webgl",
    });

    this.app = app;
    this.layers = createRenderLayers(app.stage);
    this.transitionRenderer = new RecursiveTransitionRenderer(
      this.camera,
      this.layers.cameraRoot,
      this.layers.effectLayer,
    );

    app.canvas.setAttribute("data-testid", "pixi-canvas");
    app.canvas.setAttribute("aria-label", "PixiJS recursive transition prototype");
    this.host.appendChild(app.canvas);
    app.ticker.add(this.tick);

    this.draw();
  }

  render(projection: WorldProjection) {
    this.animationSystem.cancel();
    this.animatedProjection = null;
    this.projection = projection;
    this.rootWorldBounds = getWorldRenderRect(projection.world.size);
    this.draw();
  }

  get isAnimating() {
    return this.animatedProjection !== null;
  }

  renderWithAnimation(
    fromProjection: WorldProjection,
    toProjection: WorldProjection,
    plan: AnimationPlan,
    onComplete?: () => void,
  ) {
    this.animationSystem.cancel();
    this.animatedProjection = {
      from: fromProjection,
      to: toProjection,
      plan,
      onComplete,
    };
    this.projection = toProjection;
    this.rememberFacing(plan);
    this.applyCameraCues(plan.cameraCues);
    const frame = this.animationSystem.start(plan);
    this.draw(frame);

    if (plan.durationMs <= 0) {
      this.animatedProjection = null;
      this.draw();
      onComplete?.();
    }
  }

  toggleRecursiveTransition() {
    if (!this.transitionRenderer || !this.transitionGeometry) {
      return;
    }

    this.startRecursiveTransition(this.wantsInnerView ? "exit" : "enter");
  }

  destroy() {
    if (!this.app) {
      return;
    }

    this.app.ticker.remove(this.tick);
    this.animationSystem.cancel();
    this.animatedProjection = null;
    this.transitionRenderer?.cancel();
    this.app.destroy({ removeView: true }, { children: true });
    this.app = null;
    this.layers = null;
    this.transitionRenderer = null;
    this.transitionGeometry = null;
  }

  private draw(animationFrame?: AnimationFrameState) {
    const app = this.app;
    const layers = this.layers;
    if (!app || !layers) {
      return;
    }

    const viewport = { width: app.screen.width, height: app.screen.height };
    this.lastViewport = viewport;
    this.transitionGeometry = null;
    layers.backgroundLayer.removeChildren();
    layers.recursiveWorldLayer.removeChildren();
    layers.effectLayer.removeChildren();
    layers.overlayLayer.removeChildren();
    this.transitionRenderer?.setLayers(layers.cameraRoot, layers.effectLayer);

    this.drawVoid(layers.backgroundLayer, viewport);

    const projection = animationFrame && this.animatedProjection
      ? this.interpolateProjection(this.animatedProjection.from, this.animatedProjection.to, animationFrame)
      : this.projection;
    const rootWorldBounds = getWorldRenderRect(projection.world.size, projection.depth);
    const cameraBounds = getWorldCameraBounds(rootWorldBounds, projection.depth);

    this.rootWorldBounds = rootWorldBounds;
    this.renderWorldProjection(projection, rootWorldBounds, layers.recursiveWorldLayer, animationFrame);

    if (this.transitionRenderer && this.transitionGeometry) {
      if (this.transitionRenderer.isTransitioning) {
        this.transitionRenderer.update(0, this.transitionGeometry);
      } else {
        this.transitionRenderer.applyRestingCamera(this.transitionGeometry);
      }
    } else if (this.camera.hasActiveEffects) {
      this.camera.applyTo(layers.cameraRoot);
    } else {
      this.camera.fitWorld(viewport, cameraBounds, {
        margin: Math.max(44, Math.min(viewport.width, viewport.height) * 0.08),
        maxScale: 1.05,
      });
      this.camera.applyTo(layers.cameraRoot);
    }
  }

  private drawVoid(layer: RenderLayers["backgroundLayer"], viewport: Size2D) {
    const palette = getPalette("void-lab");
    const backdrop = new Graphics();

    backdrop.rect(0, 0, viewport.width, viewport.height).fill(palette.voidBackground);

    for (let i = 0; i < 48; i += 1) {
      const size = i % 5 === 0 ? 18 : i % 3 === 0 ? 10 : 5;
      const x = (i * 181 + 73) % Math.max(1, viewport.width + 80) - 40;
      const y = (i * 113 + 29) % Math.max(1, viewport.height + 80) - 40;
      backdrop.rect(x, y, size, size).fill({
        color: palette.voidParticle,
        alpha: palette.voidParticleAlpha * (i % 4 === 0 ? 0.75 : 0.45),
      });
    }

    layer.addChild(backdrop);
  }

  private renderWorldProjection(
    projection: WorldProjection,
    rect: Rect2D,
    parent: RenderLayers["recursiveWorldLayer"],
    animationFrame?: AnimationFrameState,
  ) {
    const palette = getPalette(projection.world.paletteId);
    const worldFrame = createWorldFrame(rect, palette, projection.depth);

    parent.addChild(worldFrame.container);

    for (const entityProjection of projection.entities) {
      const entityRect = this.applyEntityFeedback(
        entityProjection,
        getAlignedEntityRect(
          entityProjection.entity.kind,
          entityProjection.entity.bounds,
          projection.world.size,
          worldFrame.interiorRect,
          projection.depth,
        ),
        projection.world.size,
        worldFrame.interiorRect,
        animationFrame,
      );

      if (entityProjection.entity.kind === "player") {
        worldFrame.contentLayer.addChild(
          createPlayerPrimitive(entityRect, palette, this.facingByEntity.get(entityProjection.entity.id), projection.depth),
        );
        continue;
      }

      if (entityProjection.entity.kind === "box") {
        worldFrame.contentLayer.addChild(createBoxPrimitive(entityRect, palette, projection.depth));
        continue;
      }

      if (entityProjection.entity.kind === "goal") {
        worldFrame.contentLayer.addChild(createGoalPrimitive(entityRect, palette, projection.depth));
        continue;
      }

      if (entityProjection.entity.kind === "recursive-container") {
        this.renderRecursiveContainer(
          entityProjection.childWorld,
          entityProjection.entity.id,
          projection.depth,
          entityRect,
          palette,
          worldFrame.contentLayer,
          animationFrame,
        );
      }
    }
  }

  private renderRecursiveContainer(
    childWorld: WorldProjection | undefined,
    entityId: string,
    projectionDepth: number,
    rect: Rect2D,
    palette: RenderPalette,
    parent: RenderLayers["recursiveWorldLayer"],
    animationFrame?: AnimationFrameState,
  ) {
    const primitive = createRecursiveContainerPrimitive(rect, palette, projectionDepth);
    parent.addChild(primitive.container);

    if (projectionDepth === 0 && entityId === "container-b") {
      this.transitionGeometry = {
        viewport: this.lastViewport,
        outerWorldBounds: getWorldCameraBounds(this.rootWorldBounds),
        containerBounds: rect,
        apertureBounds: primitive.previewRect,
      };
    }

    if (childWorld) {
      this.renderWorldProjection(
        childWorld,
        getNestedWorldRect(childWorld.world.size, childWorld.depth, primitive.previewRect),
        primitive.previewLayer,
        animationFrame,
      );
    }
  }

  private interpolateProjection(
    fromProjection: WorldProjection,
    toProjection: WorldProjection,
    frame: AnimationFrameState,
  ): WorldProjection {
    const fromEntities = mapProjectionEntities(fromProjection);

    return {
      ...toProjection,
      entities: toProjection.entities.map((entityProjection) => {
        const fromEntity = fromEntities.get(entityProjection.entity.id);
        const progress = frame.entityProgress[entityProjection.entity.id];
        const entity = fromEntity && progress !== undefined
          ? {
              ...entityProjection.entity,
              bounds: interpolateRect(fromEntity.entity.bounds, entityProjection.entity.bounds, progress),
            }
          : entityProjection.entity;

        return {
          entity,
          childWorld:
            fromEntity?.childWorld && entityProjection.childWorld
              ? this.interpolateProjection(fromEntity.childWorld, entityProjection.childWorld, frame)
              : entityProjection.childWorld,
        };
      }),
    };
  }

  private applyEntityFeedback(
    entityProjection: EntityProjection,
    rect: Rect2D,
    worldSize: Size2D,
    interiorRect: Rect2D,
    animationFrame?: AnimationFrameState,
  ): Rect2D {
    const activePlan = this.animatedProjection?.plan;
    if (!animationFrame || !activePlan) {
      return rect;
    }

    const blocked = activePlan.blockedImpacts.find((impact) => impact.actorId === entityProjection.entity.id);
    if (blocked && animationFrame.blockedImpact > 0) {
      const gridNudge = directionVector(blocked.direction);
      const xUnit = interiorRect.width / worldSize.width;
      const yUnit = interiorRect.height / worldSize.height;
      return {
        ...rect,
        x: rect.x + gridNudge.x * xUnit * 0.16 * animationFrame.blockedImpact,
        y: rect.y + gridNudge.y * yUnit * 0.16 * animationFrame.blockedImpact,
      };
    }

    const motion = activePlan.entityMotions.find((candidate) => candidate.entityId === entityProjection.entity.id);
    if (motion?.kind === "push") {
      const progress = animationFrame.entityProgress[motion.entityId] ?? 0;
      const settle = Math.sin(Math.min(1, progress) * Math.PI);
      const insetX = rect.width * 0.035 * settle;
      const insetY = rect.height * 0.035 * settle;
      return {
        x: rect.x - insetX,
        y: rect.y - insetY,
        width: rect.width + insetX * 2,
        height: rect.height + insetY * 2,
      };
    }

    return rect;
  }

  private applyCameraCues(cues: readonly CameraCue[]) {
    const enterExitCue = cues.find((cue) => cue.kind === "enter" || cue.kind === "exit");
    if (enterExitCue) {
      this.startRecursiveTransition(enterExitCue.kind === "enter" ? "enter" : "exit");
      return;
    }

    const impactCue = cues.find((cue) => cue.kind === "impact");
    if (impactCue) {
      const vector = directionVector(impactCue.direction);
      this.camera.beginImpact(vector.x * (impactCue.strength ?? 6), vector.y * (impactCue.strength ?? 6), impactCue.durationMs);
      return;
    }

    const followCue = cues.find((cue) => cue.kind === "follow");
    if (followCue) {
      const target = this.findEntityRect(this.projection, followCue.entityId);
      if (!target) {
        return;
      }

      this.camera.beginFollowTransition(
        this.camera.getFollowState(this.lastViewport, getWorldCameraBounds(this.rootWorldBounds), target, {
          margin: Math.max(44, Math.min(this.lastViewport.width, this.lastViewport.height) * 0.08),
          maxScale: 1.05,
          followStrength: 0.16,
        }),
        followCue.durationMs,
      );
    }
  }

  private startRecursiveTransition(direction: "enter" | "exit") {
    if (!this.transitionRenderer || !this.transitionGeometry) {
      return;
    }

    this.wantsInnerView = direction === "enter";
    this.transitionRenderer.start(direction, this.transitionGeometry);
  }

  private rememberFacing(plan: AnimationPlan) {
    for (const motion of plan.entityMotions) {
      if (motion.facing) {
        this.facingByEntity.set(motion.entityId, motion.facing);
      }
    }
  }

  private findEntityRect(
    projection: WorldProjection,
    entityId: string | undefined,
    worldRect: Rect2D = getWorldRenderRect(projection.world.size, projection.depth),
  ): Rect2D | null {
    if (!entityId) {
      return null;
    }

    const interiorRect = {
      x: worldRect.x,
      y: worldRect.y,
      width: worldRect.width,
      height: worldRect.height,
    };
    const match = projection.entities.find((entityProjection) => entityProjection.entity.id === entityId);
    if (match) {
      return getAlignedEntityRect(
        match.entity.kind,
        match.entity.bounds,
        projection.world.size,
        interiorRect,
        projection.depth,
      );
    }

    for (const entityProjection of projection.entities) {
      if (entityProjection.childWorld) {
        const containerRect = getAlignedEntityRect(
          entityProjection.entity.kind,
          entityProjection.entity.bounds,
          projection.world.size,
          interiorRect,
          projection.depth,
        );
        const childAperture = getContainerPreviewRect(containerRect, projection.depth);
        const childWorldRect = getNestedWorldRect(
          entityProjection.childWorld.world.size,
          entityProjection.childWorld.depth,
          childAperture,
        );
        const childMatch = this.findEntityRect(entityProjection.childWorld, entityId, childWorldRect);
        if (childMatch) {
          return childMatch;
        }
      }
    }

    return null;
  }
}

function mapProjectionEntities(projection: WorldProjection) {
  const map = new Map<string, EntityProjection>();
  collectEntityProjections(projection, map);
  return map;
}

function collectEntityProjections(projection: WorldProjection, map: Map<string, EntityProjection>) {
  for (const entityProjection of projection.entities) {
    map.set(entityProjection.entity.id, entityProjection);
    if (entityProjection.childWorld) {
      collectEntityProjections(entityProjection.childWorld, map);
    }
  }
}

function interpolateRect(from: Rect2D, to: Rect2D, progress: number): Rect2D {
  return {
    x: lerp(from.x, to.x, progress),
    y: lerp(from.y, to.y, progress),
    width: lerp(from.width, to.width, progress),
    height: lerp(from.height, to.height, progress),
  };
}

function directionVector(direction: Direction | undefined) {
  if (direction === "left") {
    return { x: -1, y: 0 };
  }
  if (direction === "right") {
    return { x: 1, y: 0 };
  }
  if (direction === "up") {
    return { x: 0, y: -1 };
  }
  if (direction === "down") {
    return { x: 0, y: 1 };
  }
  return { x: 0, y: 0 };
}
