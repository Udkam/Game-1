import { Container, Graphics } from "pixi.js";
import { lerp } from "../animation/easing";
import type { TransferTransition } from "../animation/transitions";
import type { EntityOccurrenceAddress, PortOccurrenceAddress, WorldAddress } from "../core/types";
import type { Rect2D, Size2D } from "../projection/types";
import { getWorldCameraBounds } from "./metrics";
import { Camera2D, type CameraState } from "./Camera2D";

export type RecursiveTransitionDirection = "enter" | "exit";

/** Exact addressed geometry for one portal bridge in root-space coordinates. */
export interface AddressedPortalGeometry {
  readonly port: PortOccurrenceAddress;
  readonly outerWorld: { readonly address: WorldAddress; readonly rootBounds: Rect2D; readonly depth: number };
  readonly innerWorld: { readonly address: WorldAddress; readonly rootBounds: Rect2D; readonly depth: number };
  readonly container: { readonly occurrence: EntityOccurrenceAddress; readonly rootBounds: Rect2D };
  readonly aperture: { readonly rootBounds: Rect2D };
}

export interface RecursiveTransitionGeometry {
  readonly viewport: Size2D;
  readonly target: AddressedPortalGeometry;
}

/** Addressed root-space geometry for a transfer payload and optional carried world. */
export interface TransferTransitionGeometry {
  readonly transfer: TransferTransition;
  readonly source: { readonly occurrence: EntityOccurrenceAddress; readonly rootBounds: Rect2D };
  readonly destination: { readonly occurrence: EntityOccurrenceAddress; readonly rootBounds: Rect2D };
  readonly aperture: {
    /** Exact semantic-event port supplied by core. */
    readonly eventPort: PortOccurrenceAddress;
    /** Visible alias aperture sampled only for presentation geometry. */
    readonly container: EntityOccurrenceAddress;
    readonly rootBounds: Rect2D;
  };
  readonly carriedWorld?: { readonly beforeRoot: WorldAddress; readonly afterRoot: WorldAddress; readonly fromRootBounds: Rect2D; readonly toRootBounds: Rect2D };
}

export interface TransferCameraGeometry {
  readonly viewport: Size2D;
  readonly endpoint: CameraState;
  readonly sourceRootBounds: Rect2D;
  readonly destinationRootBounds: Rect2D;
  readonly apertureRootBounds: Rect2D;
  readonly activeWorldRootBounds: Rect2D;
  readonly parentWorldRootBounds: Rect2D;
}

/** Renders aperture/camera values from controller-owned normalized progress. */
export class RecursiveTransitionRenderer {
  private readonly apertureEffect = new Graphics();
  private readonly transferEffect = new Graphics();
  private direction: RecursiveTransitionDirection | null = null;
  private transferCarrierCount = 0;
  private transferImpactCount = 0;
  private transferImpactApertureContainer: EntityOccurrenceAddress | null = null;

  constructor(
    private readonly camera: Camera2D,
    private cameraRoot: Container,
    private effectLayer: Container,
  ) {
    this.apertureEffect.label = "recursive-transition-aperture";
    this.transferEffect.label = "recursive-transfer-bridge";
    this.effectLayer.addChild(this.apertureEffect);
    this.effectLayer.addChild(this.transferEffect);
  }

  setLayers(cameraRoot: Container, effectLayer: Container) {
    this.cameraRoot = cameraRoot;
    this.effectLayer = effectLayer;
    this.effectLayer.addChild(this.apertureEffect);
    this.effectLayer.addChild(this.transferEffect);
  }

  start(direction: RecursiveTransitionDirection) {
    this.direction = direction;
  }

  applyProgress(progress: number, geometry: RecursiveTransitionGeometry) {
    if (!this.direction) return;
    const canonicalProgress = transitionProgressForDirection(this.direction, progress);
    // Preserve a real parent rim at the midpoint. This remains a pure sample
    // of controller progress, with exact outer/inner endpoint equality.
    const cameraProgress = visibilityPreservingProgress(canonicalProgress);
    const cameraState = interpolateCamera(
      getOuterCameraState(this.camera, geometry),
      getInnerCameraState(this.camera, geometry),
      cameraProgress,
    );
    this.camera.setState(cameraState);
    this.camera.applyTo(this.cameraRoot);
    this.drawApertureEffect(canonicalProgress, geometry, cameraState);
    if (progress === 1) {
      this.direction = null;
      this.apertureEffect.clear();
    }
  }

  cancel() {
    this.direction = null;
    this.apertureEffect.clear();
    this.transferEffect.clear();
  }

  get isActive() {
    return this.direction !== null;
  }

  /**
   * A transfer is sampled from the same controller progress as the rest of
   * the transaction. It intentionally does not own a camera transition or a
   * completion callback: focus stays where core left it.
   */
  beginTransferFrame() {
    this.transferEffect.clear();
    this.transferCarrierCount = 0;
    this.transferImpactCount = 0;
    this.transferImpactApertureContainer = null;
  }

  appendTransferProgress(progress: number, geometry: TransferTransitionGeometry, aggregateImpact: boolean) {
    if (progress <= 0 || progress >= 1) return;
    const carrier = interpolateTransferBounds(geometry.source.rootBounds, geometry.destination.rootBounds, progress);
    const apertureAlpha = 0.34 + Math.sin(progress * Math.PI) * 0.54;
    this.transferEffect
      .roundRect(geometry.aperture.rootBounds.x, geometry.aperture.rootBounds.y, geometry.aperture.rootBounds.width, geometry.aperture.rootBounds.height, 8)
      .stroke({ color: 0xc5e5ff, width: 3, alpha: apertureAlpha })
      .roundRect(carrier.x, carrier.y, carrier.width, carrier.height, 6)
      .fill({ color: 0xd99454, alpha: 0.72 })
      .stroke({ color: 0xf1dc9f, width: 3, alpha: 0.42 + Math.sin(progress * Math.PI) * 0.5 });
    this.transferCarrierCount += 1;
    if (aggregateImpact && this.transferImpactCount === 0) {
      this.transferEffect
        .roundRect(geometry.aperture.rootBounds.x - 3, geometry.aperture.rootBounds.y - 3, geometry.aperture.rootBounds.width + 6, geometry.aperture.rootBounds.height + 6, 10)
        .stroke({ color: 0xffffff, width: 2, alpha: Math.sin(progress * Math.PI) * 0.55 });
      this.transferImpactCount = 1;
      this.transferImpactApertureContainer = geometry.aperture.container;
    }
    if (geometry.carriedWorld) {
      const carried = interpolateTransferBounds(geometry.carriedWorld.fromRootBounds, geometry.carriedWorld.toRootBounds, progress);
      this.transferEffect
        .roundRect(carried.x, carried.y, carried.width, carried.height, 4)
        .fill({ color: 0x518d83, alpha: 0.68 })
        .stroke({ color: 0x97d8c7, width: 2, alpha: 0.3 + Math.sin(progress * Math.PI) * 0.45 });
    }
  }

  /** Compatibility wrapper for one bridge; batched Pixi draws call begin/append. */
  applyTransferProgress(progress: number, geometry: TransferTransitionGeometry) {
    this.beginTransferFrame();
    this.appendTransferProgress(progress, geometry, false);
  }

  get renderedTransferCarrierCount() {
    return this.transferCarrierCount;
  }

  get renderedTransferImpactCount() {
    return this.transferImpactCount;
  }

  get renderedTransferImpactApertureContainer() {
    return this.transferImpactApertureContainer;
  }

  private drawApertureEffect(progress: number, geometry: RecursiveTransitionGeometry, cameraState: CameraState) {
    this.apertureEffect.clear();
    if (progress <= 0 || progress >= 1) return;
    const active = Math.sin(progress * Math.PI);
    const ring = interpolateRect(geometry.target.container.rootBounds, geometry.target.aperture.rootBounds, Math.min(1, progress * 1.25));
    this.apertureEffect
      .roundRect(ring.x, ring.y, ring.width, ring.height, Math.max(2, 8 / cameraState.scale))
      .stroke({ color: 0xc5e5ff, width: Math.max(2, 5 / cameraState.scale), alpha: 0.3 + active * 0.7 });
  }
}

export function transitionProgressForDirection(direction: RecursiveTransitionDirection, progress: number) {
  const normalized = Math.max(0, Math.min(1, progress));
  return direction === "enter" ? normalized : 1 - normalized;
}

export function visibilityPreservingProgress(progress: number) {
  const normalized = Math.max(0, Math.min(1, progress));
  // The portal midpoint must still expose a real parent shell, not merely its
  // oversized floor. A cubic camera curve preserves that context while the
  // aperture/entity blend remains at the exact canonical progress.
  return normalized * normalized * normalized;
}

function getOuterCameraState(camera: Camera2D, geometry: RecursiveTransitionGeometry) {
  const target = geometry.target.outerWorld;
  return camera.getFitState(geometry.viewport, getWorldCameraBounds(target.rootBounds, target.depth), {
    margin: Math.max(44, Math.min(geometry.viewport.width, geometry.viewport.height) * 0.08),
    maxScale: 1.05,
  });
}

function getInnerCameraState(camera: Camera2D, geometry: RecursiveTransitionGeometry) {
  const target = geometry.target.innerWorld;
  return camera.getFitState(geometry.viewport, getWorldCameraBounds(target.rootBounds, target.depth), {
    margin: Math.max(26, Math.min(geometry.viewport.width, geometry.viewport.height) * 0.1),
    maxScale: 5.5,
  });
}

function interpolateCamera(from: CameraState, to: CameraState, progress: number): CameraState {
  return { x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress), scale: lerp(from.scale, to.scale, progress) };
}

function interpolateRect(from: Rect2D, to: Rect2D, progress: number): Rect2D {
  return { x: lerp(from.x, to.x, progress), y: lerp(from.y, to.y, progress), width: lerp(from.width, to.width, progress), height: lerp(from.height, to.height, progress) };
}

/** Pure addressed geometry sample for tests and Pixi transfer drawing. */
export function interpolateTransferBounds(from: Rect2D, to: Rect2D, progress: number): Rect2D {
  const normalized = Math.max(0, Math.min(1, progress));
  return interpolateRect(from, to, normalized);
}

/** One controller-progress sample: endpoints are exact focused states; midpoint fits all transfer context. */
export function sampleTransferCamera(camera: Camera2D, geometry: TransferCameraGeometry, progress: number): CameraState {
  if (progress <= 0 || progress >= 1) return geometry.endpoint;
  const union = camera.getFitState(geometry.viewport, unionTransferBounds([
    geometry.parentWorldRootBounds,
    geometry.activeWorldRootBounds,
    geometry.sourceRootBounds,
    geometry.destinationRootBounds,
    geometry.apertureRootBounds,
  ]), {
    margin: Math.max(44, Math.min(geometry.viewport.width, geometry.viewport.height) * 0.08),
    maxScale: 1.05,
  });
  const normalized = Math.max(0, Math.min(1, progress));
  const triangular = normalized <= 0.5 ? normalized * 2 : (1 - normalized) * 2;
  const envelope = triangular * triangular * (3 - 2 * triangular);
  return interpolateCamera(geometry.endpoint, union, envelope);
}

export function unionTransferBounds(bounds: readonly [Rect2D, ...Rect2D[]]): Rect2D {
  const left = Math.min(...bounds.map((entry) => entry.x));
  const top = Math.min(...bounds.map((entry) => entry.y));
  const right = Math.max(...bounds.map((entry) => entry.x + entry.width));
  const bottom = Math.max(...bounds.map((entry) => entry.y + entry.height));
  return { x: left, y: top, width: right - left, height: bottom - top };
}
