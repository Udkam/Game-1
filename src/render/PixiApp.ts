import { Application, Container, Graphics } from "pixi.js";
import { AnimationSystem, type AnimationFrameState } from "../animation/AnimationSystem";
import { lerp } from "../animation/easing";
import type { AnimationPlan, CameraCue, PortalTransition, TransferTransition } from "../animation/transitions";
import type { Direction, EntityOccurrenceAddress, PortOccurrenceAddress, WorldAddress } from "../core/types";
import {
  entityOccurrenceKey,
  sameEntityOccurrence,
  sameWorldAddress,
  type EntityProjection,
  type Rect2D,
  type Size2D,
  type WorldProjection,
} from "../projection/types";
import { VisualTransactionController } from "../runtime/VisualTransactionController";
import { Camera2D } from "./Camera2D";
import { createRenderLayers, type RenderLayers } from "./layers";
import {
  WALL_THICKNESS,
  getAlignedEntityRect,
  getNestedWorldRect,
  getWorldCameraBounds,
  getWorldRenderRect,
  scaleMetric,
} from "./metrics";
import { getPalette, type RenderPalette } from "./palette";
import {
  createBoxPrimitive,
  createGoalPrimitive,
  createPlayerPrimitive,
  createRecursiveContainerPrimitive,
} from "./primitives/entityPrimitives";
import { createWorldFrame } from "./primitives/worldFrame";
import { RecursiveTransitionRenderer, sampleTransferCamera, unionTransferBounds, type RecursiveTransitionGeometry, type TransferCameraGeometry, type TransferTransitionGeometry } from "./RecursiveTransitionRenderer";

export interface PixiAppOptions {
  readonly manualProgress?: boolean;
}

interface AncestorClip {
  readonly container: EntityOccurrenceAddress;
  readonly rootBounds: Rect2D;
}

interface TraversalContext {
  /** Root-space origin of the container that owns this world's draw bounds. */
  readonly parentRootOrigin: { readonly x: number; readonly y: number };
  readonly ancestorClips: readonly AncestorClip[];
}

interface RenderedWorldContext {
  readonly worldRootOrigin: { readonly x: number; readonly y: number };
  readonly worldRootBounds: Rect2D;
  readonly ancestorClips: readonly AncestorClip[];
}

interface FrameWorld {
  readonly address: WorldAddress;
  readonly depth: number;
  readonly localBounds: Rect2D;
  readonly rootBounds: Rect2D;
  readonly ancestorClips: readonly AncestorClip[];
}

interface FrameEntity {
  readonly occurrence: EntityOccurrenceAddress;
  readonly localBounds: Rect2D;
  readonly rootBounds: Rect2D;
  readonly alpha: number;
  readonly renderable: boolean;
  readonly ancestorClips: readonly AncestorClip[];
}

interface FrameAperture {
  readonly port?: PortOccurrenceAddress;
  readonly container: EntityOccurrenceAddress;
  readonly depth: number;
  readonly rootBounds: Rect2D;
  readonly renderable: boolean;
  readonly ancestorClips: readonly AncestorClip[];
}

export interface TransferBridge {
  readonly transfer: TransferTransition;
  readonly source: EntityProjection;
  readonly destination: EntityProjection;
  /** The exact validated semantic-event port. It is never rebased to an alias. */
  readonly eventPort: PortOccurrenceAddress;
  /** Presentation-only alias aperture used for geometry sampling. */
  readonly apertureContainer: EntityOccurrenceAddress;
}

interface RawTransferDiagnostic {
  readonly eventPort: PortOccurrenceAddress;
  readonly apertureContainer: EntityOccurrenceAddress;
  readonly eventPortRenderable: boolean;
  readonly source: FrameEntity;
  readonly destination: FrameEntity;
  readonly carrierRootBounds: Rect2D;
  readonly carriedWorldRootBounds?: Rect2D;
  readonly carriedBeforeRoot?: WorldAddress;
  readonly carriedAfterRoot?: WorldAddress;
  readonly progress: number;
}

interface ScreenRect extends Rect2D {}

/** Pixi owns retained drawing; controller owns command admission and progress. */
export class PixiApp {
  private readonly camera = new Camera2D();
  private readonly animationSystem = new AnimationSystem();
  private app: Application | null = null;
  private layers: RenderLayers | null = null;
  private transitionRenderer: RecursiveTransitionRenderer | null = null;
  private transitionGeometry: RecursiveTransitionGeometry | null = null;
  private animatedProjection:
    | { readonly from: WorldProjection; readonly to: WorldProjection; readonly plan: AnimationPlan; readonly onComplete?: () => void }
    | null = null;
  private projection: WorldProjection;
  private lastViewport: Size2D = { width: 0, height: 0 };
  private transitionPortal: PortalTransition | null = null;
  /** Retained only as current-frame addressed diagnostics, never camera focus. */
  private diagnosticPortal: PortalTransition | null = null;
  private readonly facingByOccurrence = new Map<string, Direction>();
  private frameWorlds: FrameWorld[] = [];
  private frameEntities: FrameEntity[] = [];
  private frameApertures: FrameAperture[] = [];
  private activeTransferBridges: readonly TransferBridge[] = [];
  private rawTransferDiagnostics: readonly RawTransferDiagnostic[] = [];
  /** The transfer renderer reports the number it actually appended this frame. */
  private transferCarrierCount = 0;
  private transferImpactCount = 0;
  private transferEventPortReady = false;
  private settledTransferEventPortReady = false;
  /** A push-resolved impact stays singular when its plan also has a transfer. */
  private transferHasAggregateImpact = false;
  /** Data-only settled handoff for QA; it never retains a display object or clock. */
  private settledTransferDiagnostics: readonly object[] = [];
  private renderRevision = 0;
  private explicitRenderRevision = 0;
  private readonly tick = () => {
    const app = this.app;
    if (!app) return;
    const viewport = { width: app.screen.width, height: app.screen.height };
    const resized = viewport.width !== this.lastViewport.width || viewport.height !== this.lastViewport.height;
    if (resized) {
      const frame = this.animatedProjection
        ? this.animationSystem.frame(this.animatedProjection.plan, this.controller.progress, this.controller.isActive)
        : undefined;
      this.draw(frame);
    }
    if (this.animatedProjection && !this.options.manualProgress) this.controller.advance(app.ticker.deltaMS);
  };

  constructor(
    private readonly host: HTMLElement,
    initialProjection: WorldProjection,
    private readonly controller: VisualTransactionController,
    private readonly options: PixiAppOptions = {},
  ) {
    this.projection = initialProjection;
  }

  async init() {
    const app = new Application();
    await app.init({
      background: "#020409",
      resizeTo: this.host,
      antialias: true,
      autoDensity: true,
      autoStart: !this.options.manualProgress,
      resolution: this.options.manualProgress ? 1 : window.devicePixelRatio || 1,
      preference: "webgl",
    });
    if (this.options.manualProgress) app.ticker.stop();
    this.app = app;
    this.layers = createRenderLayers(app.stage);
    this.transitionRenderer = new RecursiveTransitionRenderer(this.camera, this.layers.cameraRoot, this.layers.effectLayer);
    app.canvas.setAttribute("data-testid", "pixi-canvas");
    app.canvas.setAttribute("aria-label", "PixiJS recursive transition prototype");
    this.host.appendChild(app.canvas);
    if (!this.options.manualProgress) app.ticker.add(this.tick);
    this.draw();
  }

  render(projection: WorldProjection) {
    this.animatedProjection = null;
    this.transitionPortal = null;
    this.diagnosticPortal = null;
    this.activeTransferBridges = [];
    this.settledTransferDiagnostics = [];
    this.transferCarrierCount = 0;
    this.transferImpactCount = 0;
    this.transferHasAggregateImpact = false;
    this.transferEventPortReady = false;
    this.settledTransferEventPortReady = false;
    this.projection = projection;
    this.draw();
  }

  get isAnimating() {
    return this.controller.isActive;
  }

  renderWithAnimation(fromProjection: WorldProjection, toProjection: WorldProjection, plan: AnimationPlan, onComplete?: () => void) {
    this.animatedProjection = { from: fromProjection, to: toProjection, plan, onComplete };
    this.projection = toProjection;
    this.settledTransferDiagnostics = [];
    this.settledTransferEventPortReady = false;
    this.diagnosticPortal = plan.portalTransitions.at(-1) ?? null;
    this.rememberFacing(plan);
    this.transferHasAggregateImpact = (plan.transferTransitions?.length ?? 0) > 0 &&
      plan.cameraCues.some((cue) => cue.kind === "impact");
    this.applyCameraCues(plan.cameraCues, this.transferHasAggregateImpact);
    this.controller.start({
      durationMs: plan.durationMs,
      manualProgress: this.options.manualProgress,
      onProgress: (progress, running) => this.draw(this.animationSystem.frame(plan, progress, running)),
      onComplete: () => {
        const completed = this.animatedProjection;
        this.settledTransferDiagnostics = retainSettledTransferDiagnostics(this.diagnosticTransfers);
        this.settledTransferEventPortReady = this.transferEventPortReady;
        this.animatedProjection = null;
        this.projection = toProjection;
        this.transitionPortal = null;
        this.transferHasAggregateImpact = false;
        this.camera.settle();
        this.draw();
        completed?.onComplete?.();
      },
    });
  }

  destroy() {
    if (!this.app) return;
    this.app.ticker.remove(this.tick);
    this.app.ticker.stop();
    this.animatedProjection = null;
    this.transitionRenderer?.cancel();
    this.app.destroy({ removeView: true }, { children: true });
    this.app = null;
    this.layers = null;
    this.transitionRenderer = null;
    this.transitionGeometry = null;
    this.settledTransferDiagnostics = [];
    this.transferCarrierCount = 0;
    this.transferImpactCount = 0;
    this.transferHasAggregateImpact = false;
    this.transferEventPortReady = false;
    this.settledTransferEventPortReady = false;
    this.resetFrameDiagnostics();
  }

  private draw(animationFrame?: AnimationFrameState) {
    const app = this.app;
    const layers = this.layers;
    if (!app || !layers) return;
    const viewport = { width: app.screen.width, height: app.screen.height };
    this.lastViewport = viewport;
    this.transitionGeometry = null;
    this.resetFrameDiagnostics();
    this.renderRevision += 1;
    layers.backgroundLayer.removeChildren();
    layers.recursiveWorldLayer.removeChildren();
    layers.effectLayer.removeChildren();
    layers.overlayLayer.removeChildren();
    this.transitionRenderer?.setLayers(layers.cameraRoot, layers.effectLayer);
    this.drawVoid(layers.backgroundLayer, viewport);

    const projection = animationFrame && this.animatedProjection
      ? this.interpolateProjection(this.animatedProjection.from, this.animatedProjection.to, animationFrame, this.animatedProjection.plan)
      : this.projection;
    const rootLocalBounds = getWorldRenderRect(projection.world.size, projection.depth);
    this.renderWorldProjection(projection, rootLocalBounds, layers.recursiveWorldLayer, animationFrame, {
      parentRootOrigin: { x: 0, y: 0 },
      ancestorClips: [],
    });

    if (animationFrame && this.activeTransferBridges.length > 0) {
      this.applyFocusedCamera(projection.activeAddress, viewport);
      this.applyTransferCamera(animationFrame.progress, viewport, projection.activeAddress);
    } else if (animationFrame && this.transitionRenderer?.isActive && this.transitionGeometry) {
      this.transitionRenderer.applyProgress(animationFrame.progress, this.transitionGeometry);
    } else if (animationFrame && this.camera.hasActiveEffects) {
      this.camera.applyProgress(animationFrame.progress);
      this.camera.applyTo(layers.cameraRoot);
    } else {
      this.applyFocusedCamera(projection.activeAddress, viewport);
    }
    if (animationFrame && this.animatedProjection) {
      this.applyTransferEffects(animationFrame);
    }
    this.finalizeDiagnostics(viewport);
    if (!animationFrame && this.settledTransferDiagnostics.length > 0) {
      this.diagnosticTransfers = this.settledTransferDiagnostics;
      this.transferEventPortReady = this.settledTransferEventPortReady;
    }
    if (this.options.manualProgress) {
      app.render();
      this.explicitRenderRevision = this.renderRevision;
    }
  }

  private resetFrameDiagnostics() {
    this.frameWorlds = [];
    this.frameEntities = [];
    this.frameApertures = [];
    this.rawTransferDiagnostics = [];
    this.transferEventPortReady = false;
  }

  private focusOptions(depth: number, viewport: Size2D) {
    return depth === 0
      ? { margin: Math.max(44, Math.min(viewport.width, viewport.height) * 0.08), maxScale: 1.05 }
      : { margin: Math.max(26, Math.min(viewport.width, viewport.height) * 0.1), maxScale: 5.5 };
  }

  private applyFocusedCamera(activeAddress: WorldAddress, viewport: Size2D) {
    const target = selectAddressedWorld(this.frameWorlds, activeAddress);
    if (!target || !this.layers) return;
    this.camera.fitWorld(viewport, getWorldCameraBounds(target.rootBounds, target.depth), this.focusOptions(target.depth, viewport));
    this.camera.applyTo(this.layers.cameraRoot);
  }

  private drawVoid(layer: RenderLayers["backgroundLayer"], viewport: Size2D) {
    const palette = getPalette("void-lab");
    const backdrop = new Graphics();
    backdrop.rect(0, 0, viewport.width, viewport.height).fill(palette.voidBackground);
    for (let index = 0; index < 48; index += 1) {
      const size = index % 5 === 0 ? 18 : index % 3 === 0 ? 10 : 5;
      const x = (index * 181 + 73) % Math.max(1, viewport.width + 80) - 40;
      const y = (index * 113 + 29) % Math.max(1, viewport.height + 80) - 40;
      backdrop.rect(x, y, size, size).fill({ color: palette.voidParticle, alpha: palette.voidParticleAlpha * (index % 4 === 0 ? 0.75 : 0.45) });
    }
    layer.addChild(backdrop);
  }

  private renderWorldProjection(
    projection: WorldProjection,
    localBounds: Rect2D,
    parent: Container,
    animationFrame: AnimationFrameState | undefined,
    context: TraversalContext,
  ) {
    const worldRootOrigin = rootOriginForLocalBounds(localBounds, context.parentRootOrigin);
    const rootBounds = translateRectToRoot(localBounds, context.parentRootOrigin);
    const palette = getPalette(projection.world.paletteId);
    // Pixi children always draw in their immediate parent's coordinates. Root
    // diagnostics/camera/portal geometry are accumulated separately below.
    const worldFrame = createWorldFrame(localBounds, palette, projection.depth);
    this.frameWorlds.push({
      address: projection.address,
      depth: projection.depth,
      localBounds,
      rootBounds,
      ancestorClips: context.ancestorClips,
    });
    parent.addChild(worldFrame.container);

    for (const entityProjection of projection.entities) {
      const entityLocalBounds = this.applyEntityFeedback(
        entityProjection,
        getAlignedEntityRect(entityProjection.entity.kind, entityProjection.entity.bounds, projection.world.size, worldFrame.interiorRect, projection.depth),
        animationFrame,
      );
      const entityRootBounds = translateRectToRoot(entityLocalBounds, worldRootOrigin);
      const alpha = entityProjection.opacity ?? 1;
      this.frameEntities.push({
        occurrence: entityProjection.occurrence,
        localBounds: entityLocalBounds,
        rootBounds: entityRootBounds,
        alpha,
        renderable: alpha > 0,
        ancestorClips: context.ancestorClips,
      });
      if (entityProjection.entity.kind === "player") {
        const primitive = createPlayerPrimitive(entityLocalBounds, palette, this.facingByOccurrence.get(entityOccurrenceKey(entityProjection.occurrence)), projection.depth);
        primitive.alpha = alpha;
        worldFrame.contentLayer.addChild(primitive);
      } else if (entityProjection.entity.kind === "box") {
        const primitive = createBoxPrimitive(entityLocalBounds, palette, projection.depth);
        primitive.alpha = alpha;
        worldFrame.contentLayer.addChild(primitive);
      } else if (entityProjection.entity.kind === "goal") {
        const primitive = createGoalPrimitive(entityLocalBounds, palette, projection.depth);
        primitive.alpha = alpha;
        worldFrame.contentLayer.addChild(primitive);
      } else if (entityProjection.entity.kind === "recursive-container") {
        this.renderRecursiveContainer(
          projection,
          entityProjection,
          entityLocalBounds,
          palette,
          worldFrame.contentLayer,
          animationFrame,
          { worldRootOrigin, worldRootBounds: rootBounds, ancestorClips: context.ancestorClips },
        );
      }
    }
  }

  private renderRecursiveContainer(
    parentProjection: WorldProjection,
    entityProjection: EntityProjection,
    localBounds: Rect2D,
    palette: RenderPalette,
    parent: Container,
    animationFrame: AnimationFrameState | undefined,
    context: RenderedWorldContext,
  ) {
    const primitive = createRecursiveContainerPrimitive(localBounds, palette, parentProjection.depth);
    primitive.container.alpha = entityProjection.opacity ?? 1;
    parent.addChild(primitive.container);
    const childWorld = entityProjection.childWorld;
    const portal = this.transitionPortal ?? this.diagnosticPortal;
    const containerRootBounds = translateRectToRoot(localBounds, context.worldRootOrigin);
    const apertureRootBounds = translateRectToRoot(primitive.previewRect, context.worldRootOrigin);
    const childLocalBounds = childWorld
      ? getNestedWorldRect(childWorld.world.size, childWorld.depth, primitive.previewRect)
      : null;
    const childRootBounds = childLocalBounds
      ? translateRectToRoot(childLocalBounds, context.worldRootOrigin)
      : null;
    const transfer = transferForContainer(this.activeTransferBridges, entityProjection.occurrence);
    if (portal && childWorld && selectAddressedPortalTarget(portal, parentProjection.address, entityProjection.occurrence, childWorld.address)) {
      if (!childRootBounds) return;
      this.transitionGeometry = {
        viewport: this.lastViewport,
        target: {
          port: portal.port,
          outerWorld: { address: parentProjection.address, rootBounds: context.worldRootBounds, depth: parentProjection.depth },
          innerWorld: { address: childWorld.address, rootBounds: childRootBounds, depth: childWorld.depth },
          container: { occurrence: entityProjection.occurrence, rootBounds: containerRootBounds },
          aperture: { rootBounds: apertureRootBounds },
        },
      };
      this.frameApertures.push({
        port: portal.port,
        container: entityProjection.occurrence,
        depth: parentProjection.depth,
        rootBounds: apertureRootBounds,
        renderable: (entityProjection.opacity ?? 1) > 0,
        ancestorClips: context.ancestorClips,
      });
    } else if (transfer) {
      this.frameApertures.push({
        container: entityProjection.occurrence,
        depth: parentProjection.depth,
        rootBounds: apertureRootBounds,
        renderable: (entityProjection.opacity ?? 1) > 0,
        ancestorClips: context.ancestorClips,
      });
    }
    if (childWorld && childLocalBounds) {
      this.renderWorldProjection(childWorld, childLocalBounds, primitive.previewLayer, animationFrame, {
        parentRootOrigin: context.worldRootOrigin,
        ancestorClips: [...context.ancestorClips, { container: entityProjection.occurrence, rootBounds: apertureRootBounds }],
      });
    }
  }

  private interpolateProjection(fromProjection: WorldProjection, toProjection: WorldProjection, frame: AnimationFrameState, plan: AnimationPlan): WorldProjection {
    const fromEntities = projectionEntityMap(fromProjection);
    const bridges = (plan.transferTransitions ?? []).flatMap((transfer) => deriveTransferBridges(fromProjection, toProjection, transfer));
    this.activeTransferBridges = bridges;
    const interpolateWorld = (toWorld: WorldProjection): WorldProjection => {
      const entities: EntityProjection[] = toWorld.entities.map((entityProjection) => {
        const key = entityOccurrenceKey(entityProjection.occurrence);
        const fromEntity = fromEntities.get(key);
        const progress = frame.entityProgress[key];
        const entity = fromEntity && progress !== undefined
          ? { ...entityProjection.entity, bounds: interpolateRect(fromEntity.entity.bounds, entityProjection.entity.bounds, progress) }
          : entityProjection.entity;
        const bridge = bridges.find((candidate) => sameEntityOccurrence(candidate.destination.occurrence, entityProjection.occurrence));
        return {
          ...entityProjection,
          entity,
          opacity: bridge
            ? transferProjectionOpacity("destination", frame.progress)
            : isPortalActorAfter(entityProjection.occurrence, plan.portalTransitions) ? frame.progress : entityProjection.opacity,
          childWorld: fromEntity?.childWorld && entityProjection.childWorld ? interpolateWorld(entityProjection.childWorld) : entityProjection.childWorld,
        };
      });
      const bridgedSource = portalActorSourceForWorld(toWorld.address, plan.portalTransitions, fromEntities);
      if (bridgedSource && !entities.some((candidate) => sameEntityOccurrence(candidate.occurrence, bridgedSource.occurrence))) {
        entities.push({ ...bridgedSource, opacity: 1 - frame.progress });
      }
      for (const bridge of bridges) {
        if (!sameWorldAddress(toWorld.address, bridge.source.occurrence.world)) continue;
        if (entities.some((candidate) => sameEntityOccurrence(candidate.occurrence, bridge.source.occurrence))) continue;
        entities.push({ ...bridge.source, opacity: transferProjectionOpacity("source", frame.progress) });
      }
      return { ...toWorld, entities };
    };
    return interpolateWorld(toProjection);
  }

  private applyTransferEffects(frame: AnimationFrameState) {
    const renderer = this.transitionRenderer;
    if (!renderer) return;
    renderer.beginTransferFrame();
    this.transferEventPortReady = false;
    for (const bridge of this.activeTransferBridges) {
      const source = this.frameEntities.find((entity) => sameEntityOccurrence(entity.occurrence, bridge.source.occurrence));
      const destination = this.frameEntities.find((entity) => sameEntityOccurrence(entity.occurrence, bridge.destination.occurrence));
      const aperture = this.frameApertures.find((entry) => sameEntityOccurrence(entry.container, bridge.apertureContainer));
      if (!source || !destination || !aperture) continue;
      const isEventPortAperture = isExactTransferEventAperture(bridge.eventPort, aperture.container, aperture.renderable);
      this.transferEventPortReady ||= isEventPortAperture;
      const carriedWorld = bridge.transfer.carriedSubtree
        ? carriedGeometryForTransfer(bridge, this.frameWorlds)
        : undefined;
      const geometry: TransferTransitionGeometry = {
        transfer: bridge.transfer,
        source: { occurrence: source.occurrence, rootBounds: source.rootBounds },
        destination: { occurrence: destination.occurrence, rootBounds: destination.rootBounds },
        aperture: { eventPort: bridge.eventPort, container: aperture.container, rootBounds: aperture.rootBounds },
        ...(carriedWorld ? { carriedWorld } : {}),
      };
      renderer.appendTransferProgress(frame.progress, geometry, this.transferHasAggregateImpact && isEventPortAperture);
      this.rawTransferDiagnostics = [...this.rawTransferDiagnostics, {
        eventPort: bridge.eventPort,
        apertureContainer: aperture.container,
        eventPortRenderable: isEventPortAperture,
        source,
        destination,
        carrierRootBounds: interpolateRect(source.rootBounds, destination.rootBounds, frame.progress),
        ...(carriedWorld ? {
          carriedWorldRootBounds: interpolateRect(carriedWorld.fromRootBounds, carriedWorld.toRootBounds, frame.progress),
          carriedBeforeRoot: carriedWorld.beforeRoot,
          carriedAfterRoot: carriedWorld.afterRoot,
        } : {}),
        progress: frame.progress,
      }];
    }
    this.transferCarrierCount = renderer.renderedTransferCarrierCount;
    this.transferImpactCount = renderer.renderedTransferImpactCount;
  }

  private applyTransferCamera(progress: number, viewport: Size2D, activeAddress: WorldAddress) {
    const layers = this.layers;
    if (!layers) return;
    const bridges = this.activeTransferBridges.map((bridge) => ({
      bridge,
      source: this.frameEntities.find((entry) => sameEntityOccurrence(entry.occurrence, bridge.source.occurrence)),
      destination: this.frameEntities.find((entry) => sameEntityOccurrence(entry.occurrence, bridge.destination.occurrence)),
      aperture: this.frameApertures.find((entry) => sameEntityOccurrence(entry.container, bridge.apertureContainer)),
      parentWorld: selectAddressedWorld(this.frameWorlds, bridge.apertureContainer.world),
    })).filter((entry): entry is {
      readonly bridge: TransferBridge;
      readonly source: FrameEntity;
      readonly destination: FrameEntity;
      readonly aperture: FrameAperture;
      readonly parentWorld: FrameWorld;
    } => Boolean(entry.source && entry.destination && entry.aperture && entry.parentWorld));
    const activeWorld = selectAddressedWorld(this.frameWorlds, activeAddress);
    if (bridges.length === 0 || !activeWorld) return;
    const geometry: TransferCameraGeometry = {
      viewport,
      endpoint: this.camera.current,
      sourceRootBounds: unionTransferBounds(bridges.map((entry) => entry.source.rootBounds) as [Rect2D, ...Rect2D[]]),
      destinationRootBounds: unionTransferBounds(bridges.map((entry) => entry.destination.rootBounds) as [Rect2D, ...Rect2D[]]),
      apertureRootBounds: unionTransferBounds(bridges.map((entry) => entry.aperture.rootBounds) as [Rect2D, ...Rect2D[]]),
      activeWorldRootBounds: activeWorld.rootBounds,
      parentWorldRootBounds: unionTransferBounds(bridges.map((entry) => entry.parentWorld.rootBounds) as [Rect2D, ...Rect2D[]]),
    };
    this.camera.setState(sampleTransferCamera(this.camera, geometry, progress));
    this.camera.applyTo(layers.cameraRoot);
  }

  private applyEntityFeedback(entityProjection: EntityProjection, rootBounds: Rect2D, animationFrame?: AnimationFrameState): Rect2D {
    const activePlan = this.animatedProjection?.plan;
    if (!animationFrame || !activePlan) return rootBounds;
    const motion = activePlan.entityMotions.find((candidate) => sameEntityOccurrence(candidate.occurrence, entityProjection.occurrence));
    if (motion?.kind !== "push") return rootBounds;
    const progress = animationFrame.entityProgress[entityOccurrenceKey(motion.occurrence)] ?? 0;
    const settle = Math.sin(Math.min(1, progress) * Math.PI);
    const insetX = rootBounds.width * 0.035 * settle;
    const insetY = rootBounds.height * 0.035 * settle;
    return { x: rootBounds.x - insetX, y: rootBounds.y - insetY, width: rootBounds.width + insetX * 2, height: rootBounds.height + insetY * 2 };
  }

  private applyCameraCues(cues: readonly CameraCue[], transferOwnsImpact = false) {
    const portal = cues.find((cue) => cue.kind === "enter" || cue.kind === "exit");
    if (portal?.portal && this.transitionRenderer) {
      this.transitionPortal = portal.portal;
      this.diagnosticPortal = portal.portal;
      this.transitionRenderer.start(portal.kind as "enter" | "exit");
      return;
    }
    this.transitionPortal = null;
    this.diagnosticPortal = null;
    const impact = cues.find((cue) => cue.kind === "impact");
    if (impact && !transferOwnsImpact) {
      const vector = directionVector(impact.direction);
      this.camera.beginImpact(vector.x * (impact.strength ?? 6), vector.y * (impact.strength ?? 6));
      return;
    }
    const follow = cues.find((cue) => cue.kind === "follow");
    if (follow?.occurrence) {
      // V1 deliberately keeps non-portal movement camera composition fixed on
      // the fully addressed active world. The interpolated entity still moves,
      // but no root/depth-zero lookup or completion snap can occur.
      this.camera.cancelTransition();
    }
  }

  private finalizeDiagnostics(viewport: Size2D) {
    const screenViewport = { x: 0, y: 0, width: viewport.width, height: viewport.height };
    const screenClip = (chain: readonly AncestorClip[]) => chain.reduce<ScreenRect>((clip, entry) => intersectRect(clip, rootToScreen(entry.rootBounds, this.camera.current)), screenViewport);
    this.diagnosticWorlds = this.frameWorlds.map((world) => {
      const ancestorClip = screenClip(world.ancestorClips);
      const screenBounds = rootToScreen(world.rootBounds, this.camera.current);
      const shellThickness = Math.max(1, scaleMetric(WALL_THICKNESS, world.depth) * this.camera.current.scale);
      const shellScreenBounds = expandRectBy(screenBounds, shellThickness);
      return {
        address: world.address,
        depth: world.depth,
        localBounds: world.localBounds,
        rootBounds: world.rootBounds,
        screenBounds,
        shellScreenBounds,
        ancestorClip,
        viewportClippedBounds: intersectRect(screenBounds, screenViewport),
        clippedBounds: intersectRect(screenBounds, ancestorClip),
        rimSegments: outerRimSegments(screenBounds, shellThickness, ancestorClip),
      };
    });
    this.diagnosticEntities = this.frameEntities.map((entity) => {
      const ancestorClip = screenClip(entity.ancestorClips);
      const screenBounds = rootToScreen(entity.rootBounds, this.camera.current);
      return {
        occurrence: entity.occurrence,
        localBounds: entity.localBounds,
        rootBounds: entity.rootBounds,
        screenBounds,
        alpha: entity.alpha,
        renderable: entity.renderable,
        ancestorClip,
        viewportClippedBounds: intersectRect(screenBounds, screenViewport),
        clippedBounds: intersectRect(screenBounds, ancestorClip),
      };
    });
    this.diagnosticApertures = this.frameApertures.map((aperture) => {
      const ancestorClip = screenClip(aperture.ancestorClips);
      const screenBounds = rootToScreen(aperture.rootBounds, this.camera.current);
      const rimThickness = Math.max(1, scaleMetric(WALL_THICKNESS * 0.08, aperture.depth) * this.camera.current.scale);
      return {
        port: aperture.port,
        container: aperture.container,
        depth: aperture.depth,
        rootBounds: aperture.rootBounds,
        renderable: aperture.renderable,
        screenBounds,
        ancestorClip,
        viewportClippedBounds: intersectRect(screenBounds, screenViewport),
        clippedBounds: intersectRect(screenBounds, ancestorClip),
        rimSegments: centeredRimSegments(screenBounds, rimThickness, ancestorClip),
      };
    });
    this.diagnosticTransfers = this.rawTransferDiagnostics.map((transfer) => {
      const carrierScreenBounds = rootToScreen(transfer.carrierRootBounds, this.camera.current);
      const carriedScreenBounds = transfer.carriedWorldRootBounds
        ? rootToScreen(transfer.carriedWorldRootBounds, this.camera.current)
        : undefined;
      return {
        eventPort: transfer.eventPort,
        apertureContainer: transfer.apertureContainer,
        eventPortRenderable: transfer.eventPortRenderable,
        source: {
          occurrence: transfer.source.occurrence,
          rootBounds: transfer.source.rootBounds,
          renderable: transfer.source.renderable,
        },
        destination: {
          occurrence: transfer.destination.occurrence,
          rootBounds: transfer.destination.rootBounds,
          renderable: transfer.destination.renderable,
        },
        progress: transfer.progress,
        carrier: {
          renderable: transfer.progress > 0 && transfer.progress < 1,
          rootBounds: transfer.carrierRootBounds,
          screenBounds: carrierScreenBounds,
          viewportClippedBounds: intersectRect(carrierScreenBounds, screenViewport),
          clippedBounds: intersectRect(carrierScreenBounds, screenViewport),
        },
        ...(carriedScreenBounds ? {
          carriedWorld: {
            beforeRoot: transfer.carriedBeforeRoot,
            afterRoot: transfer.carriedAfterRoot,
            rootBounds: transfer.carriedWorldRootBounds,
            screenBounds: carriedScreenBounds,
            viewportClippedBounds: intersectRect(carriedScreenBounds, screenViewport),
            clippedBounds: intersectRect(carriedScreenBounds, screenViewport),
          },
        } : {}),
      };
    });
  }

  private diagnosticWorlds: readonly object[] = [];
  private diagnosticEntities: readonly object[] = [];
  private diagnosticApertures: readonly object[] = [];
  private diagnosticTransfers: readonly object[] = [];

  /** DEV QA reads a completed explicit manual render, never a stale draw. */
  getQaSnapshot() {
    const app = this.app;
    const canvas = app?.canvas;
    return {
      tickerRunning: app?.ticker.started ?? false,
      renderRevision: this.renderRevision,
      explicitRenderRevision: this.explicitRenderRevision,
      progress: this.controller.progress,
      camera: this.camera.current,
      activeAddress: this.projection.activeAddress,
      canvas: canvas ? {
        cssWidth: canvas.clientWidth,
        cssHeight: canvas.clientHeight,
        backingWidth: canvas.width,
        backingHeight: canvas.height,
        resolution: app?.renderer.resolution,
      } : null,
      visibleOccurrences: this.diagnosticEntities,
      worldFrames: this.diagnosticWorlds,
      apertures: this.diagnosticApertures,
      transfers: this.diagnosticTransfers,
      transferCarrierCount: this.transferCarrierCount,
      transferImpactCount: this.transferImpactCount,
      transferEventPortReady: this.transferEventPortReady,
      portal: this.transitionGeometry?.target ?? null,
    };
  }

  private rememberFacing(plan: AnimationPlan) {
    for (const motion of plan.entityMotions) if (motion.facing) this.facingByOccurrence.set(entityOccurrenceKey(motion.occurrence), motion.facing);
  }

}

export function projectionEntityMap(projection: WorldProjection) {
  const map = new Map<string, EntityProjection>();
  const collect = (world: WorldProjection) => {
    for (const entity of world.entities) {
      map.set(entityOccurrenceKey(entity.occurrence), entity);
      if (entity.childWorld) collect(entity.childWorld);
    }
  };
  collect(projection);
  return map;
}

function isPortalActorAfter(occurrence: EntityOccurrenceAddress, portals: readonly PortalTransition[]) {
  return portals.some((portal) => sameEntityOccurrence(portal.actorAfter, occurrence));
}

function portalActorSourceForWorld(world: WorldAddress, portals: readonly PortalTransition[], fromEntities: ReadonlyMap<string, EntityProjection>) {
  const portal = portals.find((candidate) => sameWorldAddress(candidate.actorBefore.world, world));
  return portal ? fromEntities.get(entityOccurrenceKey(portal.actorBefore)) : undefined;
}

/** Structural portal selection; no depth, last-container, or delimiter key participates. */
export function selectAddressedPortalTarget(
  portal: PortalTransition,
  parentAddress: WorldAddress,
  container: EntityOccurrenceAddress,
  childAddress: WorldAddress,
) {
  const innerAddress = portal.mode === "enter" ? portal.actorAfter.world : portal.actorBefore.world;
  return sameEntityOccurrence(container, portal.port.container) &&
    sameWorldAddress(parentAddress, portal.port.container.world) &&
    sameWorldAddress(childAddress, innerAddress);
}

function transferForContainer(
  bridges: readonly TransferBridge[],
  occurrence: EntityOccurrenceAddress,
) {
  return bridges.find((bridge) => sameEntityOccurrence(bridge.apertureContainer, occurrence));
}

/** An alias aperture is drawable context, never a fabricated declaration of the event port. */
export function isExactTransferEventAperture(
  eventPort: PortOccurrenceAddress,
  apertureContainer: EntityOccurrenceAddress,
  renderable: boolean,
) {
  return renderable && sameEntityOccurrence(eventPort.container, apertureContainer);
}

function carriedGeometryForTransfer(
  bridge: TransferBridge,
  worlds: readonly FrameWorld[],
): TransferTransitionGeometry["carriedWorld"] | undefined {
  const carried = bridge.transfer.carriedSubtree;
  if (!carried) return undefined;
  const beforeRoot = childRootFor(bridge.source.occurrence);
  const afterRoot = childRootFor(bridge.destination.occurrence);
  if (!sameWorldAddress(rebaseWorldAddress(beforeRoot, beforeRoot, afterRoot) ?? beforeRoot, afterRoot)) return undefined;
  const before = selectAddressedWorld(worlds, beforeRoot);
  const after = selectAddressedWorld(worlds, afterRoot);
  if (!before || !after) return undefined;
  return {
    beforeRoot,
    afterRoot,
    fromRootBounds: before.rootBounds,
    toRootBounds: after.rootBounds,
  };
}

interface ProjectionEntityRecord {
  readonly entity: EntityProjection;
  readonly owner: WorldProjection;
}

interface ProjectionWorldContext {
  readonly world: WorldProjection;
  readonly parentWorld?: WorldProjection;
  readonly parentContainer?: EntityProjection;
}

/**
 * Expands one canonical transfer into every visible alias pair. Pairing is
 * derived from occurrence paths and the resolved canonical containing worlds;
 * a canonical entity id is used only after those structural checks succeed.
 */
export function deriveTransferBridges(
  fromProjection: WorldProjection,
  toProjection: WorldProjection,
  transfer: TransferTransition,
): readonly TransferBridge[] {
  const fromRecords = projectionEntityRecords(fromProjection);
  const toRecords = projectionEntityRecords(toProjection);
  const fromContexts = projectionWorldContexts(fromProjection);
  const toContexts = projectionWorldContexts(toProjection);
  const sourceTemplate = selectAddressedWorld(projectionWorlds(fromProjection), transfer.entityBefore.world);
  const destinationTemplate = selectAddressedWorld(projectionWorlds(toProjection), transfer.entityAfter.world);
  if (!sourceTemplate || !destinationTemplate) return [];
  const bridges: TransferBridge[] = [];
  const append = (source: EntityProjection, destination: EntityProjection, portContainer: EntityProjection) => {
    if (!validCarriedBridge(source, destination, transfer)) return;
    if (bridges.some((existing) =>
      sameEntityOccurrence(existing.source.occurrence, source.occurrence) &&
      sameEntityOccurrence(existing.destination.occurrence, destination.occurrence))) return;
    bridges.push({
      transfer,
      source,
      destination,
      eventPort: transfer.via,
      apertureContainer: portContainer.occurrence,
    });
  };

  if (transfer.mode === "push-in") {
    // Every destination inner-world occurrence identifies its actual parent
    // container. This covers aliases exposed by different container IDs rather
    // than assuming the selected event receiver is the only visible path.
    for (const destinationRecord of toRecords) {
      if (destinationRecord.entity.entity.id !== transfer.entityAfter.entityId ||
        destinationRecord.owner.world.id !== destinationTemplate.world.id) continue;
      const destinationContext = toContexts.find((context) => sameWorldAddress(context.world.address, destinationRecord.owner.address));
      const parentWorld = destinationContext?.parentWorld;
      const portContainer = destinationContext?.parentContainer;
      if (!parentWorld || !portContainer || parentWorld.world.id !== sourceTemplate.world.id) continue;
      const source = fromRecords.find((candidate) =>
        candidate.entity.entity.id === transfer.entityBefore.entityId &&
        candidate.owner.world.id === sourceTemplate.world.id &&
        sameWorldAddress(candidate.owner.address, parentWorld.address),
      )?.entity;
      if (source) append(source, destinationRecord.entity, portContainer);
    }
  } else {
    // Every source inner-world occurrence identifies the exact parent port it
    // exits through. The destination is that same addressed parent world.
    for (const sourceRecord of fromRecords) {
      if (sourceRecord.entity.entity.id !== transfer.entityBefore.entityId ||
        sourceRecord.owner.world.id !== sourceTemplate.world.id) continue;
      const sourceContext = fromContexts.find((context) => sameWorldAddress(context.world.address, sourceRecord.owner.address));
      const parentWorld = sourceContext?.parentWorld;
      const portContainer = sourceContext?.parentContainer;
      if (!parentWorld || !portContainer || parentWorld.world.id !== destinationTemplate.world.id) continue;
      const destination = toRecords.find((candidate) =>
        candidate.entity.entity.id === transfer.entityAfter.entityId &&
        candidate.owner.world.id === destinationTemplate.world.id &&
        sameWorldAddress(candidate.owner.address, parentWorld.address),
      )?.entity;
      if (destination) append(sourceRecord.entity, destination, portContainer);
    }
  }
  return [...bridges].sort(compareTransferBridges);
}

function validCarriedBridge(source: EntityProjection, destination: EntityProjection, transfer: TransferTransition) {
  const carried = transfer.carriedSubtree;
  if (!carried) return true;
  const beforeRoot = childRootFor(source.occurrence);
  const afterRoot = childRootFor(destination.occurrence);
  return Boolean(source.childWorld && destination.childWorld &&
    source.childWorld.world.id === carried.innerWorldId &&
    destination.childWorld.world.id === carried.innerWorldId &&
    sameWorldAddress(source.childWorld.address, beforeRoot) &&
    sameWorldAddress(destination.childWorld.address, afterRoot));
}

function compareTransferBridges(left: TransferBridge, right: TransferBridge) {
  return compareEntityOccurrenceTuple(left.source.occurrence, right.source.occurrence) ||
    compareEntityOccurrenceTuple(left.destination.occurrence, right.destination.occurrence) ||
    compareEntityOccurrenceTuple(left.apertureContainer, right.apertureContainer) ||
    compareStringCodePoint(left.eventPort.portId, right.eventPort.portId);
}

function compareEntityOccurrenceTuple(left: EntityOccurrenceAddress, right: EntityOccurrenceAddress) {
  return compareWorldAddressTuple(left.world, right.world) || compareStringCodePoint(left.entityId, right.entityId);
}

function compareWorldAddressTuple(left: WorldAddress, right: WorldAddress) {
  const root = compareStringCodePoint(left.rootWorldId, right.rootWorldId);
  if (root !== 0) return root;
  const sharedLength = Math.min(left.containerPath.length, right.containerPath.length);
  for (let index = 0; index < sharedLength; index += 1) {
    const comparison = compareStringCodePoint(left.containerPath[index]!, right.containerPath[index]!);
    if (comparison !== 0) return comparison;
  }
  return left.containerPath.length - right.containerPath.length;
}

/** Stable code-point tuple ordering; it never depends on the host locale. */
function compareStringCodePoint(left: string, right: string) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function projectionEntityRecords(projection: WorldProjection): readonly ProjectionEntityRecord[] {
  const records: ProjectionEntityRecord[] = [];
  const visit = (world: WorldProjection) => {
    for (const entity of world.entities) {
      records.push({ entity, owner: world });
      if (entity.childWorld) visit(entity.childWorld);
    }
  };
  visit(projection);
  return records;
}

function projectionWorldContexts(projection: WorldProjection): readonly ProjectionWorldContext[] {
  const contexts: ProjectionWorldContext[] = [];
  const visit = (world: WorldProjection, parentWorld?: WorldProjection, parentContainer?: EntityProjection) => {
    contexts.push({ world, parentWorld, parentContainer });
    for (const entity of world.entities) if (entity.childWorld) visit(entity.childWorld, world, entity);
  };
  visit(projection);
  return contexts;
}

function projectionWorlds(projection: WorldProjection): readonly WorldProjection[] {
  const worlds: WorldProjection[] = [];
  const visit = (world: WorldProjection) => {
    worlds.push(world);
    for (const entity of world.entities) if (entity.childWorld) visit(entity.childWorld);
  };
  visit(projection);
  return worlds;
}

function appendAddress(parent: WorldAddress, containerId: string): WorldAddress {
  return { rootWorldId: parent.rootWorldId, containerPath: [...parent.containerPath, containerId] };
}

function childRootFor(occurrence: EntityOccurrenceAddress): WorldAddress {
  return appendAddress(occurrence.world, occurrence.entityId);
}

/**
 * Replaces only an exact full world-address prefix. It is intentionally
 * structural: delimiter-like IDs and canonical aliases cannot collide.
 */
export function rebaseWorldAddress(
  address: WorldAddress,
  beforeRoot: WorldAddress,
  afterRoot: WorldAddress,
): WorldAddress | undefined {
  if (address.rootWorldId !== beforeRoot.rootWorldId || afterRoot.rootWorldId !== beforeRoot.rootWorldId) return undefined;
  if (address.containerPath.length < beforeRoot.containerPath.length) return undefined;
  if (!beforeRoot.containerPath.every((part, index) => address.containerPath[index] === part)) return undefined;
  return {
    rootWorldId: afterRoot.rootWorldId,
    containerPath: [...afterRoot.containerPath, ...address.containerPath.slice(beforeRoot.containerPath.length)],
  };
}

/** Root/path bridge endpoints use the controller's same normalized sample. */
export function transferProjectionOpacity(endpoint: "source" | "destination", progress: number) {
  const normalized = Math.max(0, Math.min(1, progress));
  if (normalized > 0 && normalized < 1) return 0;
  return endpoint === "source" ? 1 - normalized : normalized;
}

/** Copies only JSON-like diagnostic data across the p=1 settled redraw. */
export function retainSettledTransferDiagnostics<T extends object>(diagnostics: readonly T[]): readonly T[] {
  return diagnostics.map((diagnostic) => ({ ...diagnostic }));
}

function rootToScreen(bounds: Rect2D, camera: { readonly x: number; readonly y: number; readonly scale: number }): ScreenRect {
  return { x: camera.x + bounds.x * camera.scale, y: camera.y + bounds.y * camera.scale, width: bounds.width * camera.scale, height: bounds.height * camera.scale };
}

export function rootOriginForLocalBounds(
  localBounds: Rect2D,
  parentRootOrigin: { readonly x: number; readonly y: number },
) {
  return { x: parentRootOrigin.x + localBounds.x, y: parentRootOrigin.y + localBounds.y };
}

export function translateRectToRoot(
  localBounds: Rect2D,
  parentRootOrigin: { readonly x: number; readonly y: number },
): Rect2D {
  return { ...localBounds, x: localBounds.x + parentRootOrigin.x, y: localBounds.y + parentRootOrigin.y };
}

export function selectAddressedWorld<T extends { readonly address: WorldAddress }>(
  worlds: readonly T[],
  address: WorldAddress,
): T | undefined {
  return worlds.find((world) => sameWorldAddress(world.address, address));
}

function intersectRect(left: Rect2D, right: Rect2D): ScreenRect {
  const x = Math.max(left.x, right.x);
  const y = Math.max(left.y, right.y);
  return { x, y, width: Math.max(0, Math.min(left.x + left.width, right.x + right.width) - x), height: Math.max(0, Math.min(left.y + left.height, right.y + right.height) - y) };
}

function outerRimSegments(screenBounds: Rect2D, thickness: number, clip: Rect2D) {
  const outer = expandRectBy(screenBounds, thickness);
  const bounded = Math.min(thickness, outer.width / 2, outer.height / 2);
  return [
    { side: "top", bounds: intersectRect({ x: outer.x, y: outer.y, width: outer.width, height: bounded }, clip) },
    { side: "bottom", bounds: intersectRect({ x: outer.x, y: outer.y + outer.height - bounded, width: outer.width, height: bounded }, clip) },
    { side: "left", bounds: intersectRect({ x: outer.x, y: outer.y, width: bounded, height: outer.height }, clip) },
    { side: "right", bounds: intersectRect({ x: outer.x + outer.width - bounded, y: outer.y, width: bounded, height: outer.height }, clip) },
  ];
}

function centeredRimSegments(screenBounds: Rect2D, thickness: number, clip: Rect2D) {
  const half = thickness * 0.5;
  const outer = expandRectBy(screenBounds, half);
  const bounded = Math.min(thickness, outer.width / 2, outer.height / 2);
  return [
    { side: "top", bounds: intersectRect({ x: outer.x, y: outer.y, width: outer.width, height: bounded }, clip) },
    { side: "bottom", bounds: intersectRect({ x: outer.x, y: outer.y + outer.height - bounded, width: outer.width, height: bounded }, clip) },
    { side: "left", bounds: intersectRect({ x: outer.x, y: outer.y, width: bounded, height: outer.height }, clip) },
    { side: "right", bounds: intersectRect({ x: outer.x + outer.width - bounded, y: outer.y, width: bounded, height: outer.height }, clip) },
  ];
}

function expandRectBy(rect: Rect2D, amount: number): ScreenRect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2,
  };
}

function interpolateRect(from: Rect2D, to: Rect2D, progress: number): Rect2D {
  return { x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress), width: lerp(from.width, to.width, progress), height: lerp(from.height, to.height, progress) };
}

function directionVector(direction: Direction | undefined) {
  if (direction === "left") return { x: -1, y: 0 };
  if (direction === "right") return { x: 1, y: 0 };
  if (direction === "up") return { x: 0, y: -1 };
  if (direction === "down") return { x: 0, y: 1 };
  return { x: 0, y: 0 };
}
