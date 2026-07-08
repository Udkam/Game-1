import type { Container } from "pixi.js";
import type { Rect2D, Size2D } from "../projection/types";

export interface CameraState {
  x: number;
  y: number;
  scale: number;
}

export interface FitWorldOptions {
  margin: number;
  minScale?: number;
  maxScale?: number;
}

interface CameraTransition {
  from: CameraState;
  to: CameraState;
  elapsedMs: number;
  durationMs: number;
}

interface CameraImpact {
  offsetX: number;
  offsetY: number;
  elapsedMs: number;
  durationMs: number;
}

export class Camera2D {
  private state: CameraState = { x: 0, y: 0, scale: 1 };
  private transition: CameraTransition | null = null;
  private impact: CameraImpact | null = null;

  get current() {
    return { ...this.state };
  }

  get isTransitioning() {
    return this.transition !== null;
  }

  get hasActiveEffects() {
    return this.transition !== null || this.impact !== null;
  }

  fitWorld(viewport: Size2D, worldBounds: Rect2D, options: FitWorldOptions) {
    const next = this.getFitState(viewport, worldBounds, options);
    this.setState(next);
    return next;
  }

  getFitState(viewport: Size2D, worldBounds: Rect2D, options: FitWorldOptions): CameraState {
    const availableWidth = Math.max(1, viewport.width - options.margin * 2);
    const availableHeight = Math.max(1, viewport.height - options.margin * 2);
    const rawScale = Math.min(availableWidth / worldBounds.width, availableHeight / worldBounds.height);
    const minScale = options.minScale ?? 0.05;
    const maxScale = options.maxScale ?? 2;
    const scale = Math.min(maxScale, Math.max(minScale, rawScale));

    return {
      x: viewport.width * 0.5 - (worldBounds.x + worldBounds.width * 0.5) * scale,
      y: viewport.height * 0.5 - (worldBounds.y + worldBounds.height * 0.5) * scale,
      scale,
    };
  }

  getFollowState(
    viewport: Size2D,
    worldBounds: Rect2D,
    targetBounds: Rect2D,
    options: FitWorldOptions & { followStrength?: number },
  ): CameraState {
    const fit = this.getFitState(viewport, worldBounds, options);
    const followStrength = Math.min(1, Math.max(0, options.followStrength ?? 0.5));
    const worldCenter = {
      x: worldBounds.x + worldBounds.width * 0.5,
      y: worldBounds.y + worldBounds.height * 0.5,
    };
    const targetCenter = {
      x: targetBounds.x + targetBounds.width * 0.5,
      y: targetBounds.y + targetBounds.height * 0.5,
    };
    const focus = {
      x: lerp(worldCenter.x, targetCenter.x, followStrength),
      y: lerp(worldCenter.y, targetCenter.y, followStrength),
    };

    return {
      x: viewport.width * 0.5 - focus.x * fit.scale,
      y: viewport.height * 0.5 - focus.y * fit.scale,
      scale: fit.scale,
    };
  }

  setState(state: CameraState) {
    this.state = { ...state };
    this.transition = null;
  }

  beginZoomTransition(target: CameraState, durationMs: number) {
    this.transition = {
      from: this.current,
      to: { ...target },
      elapsedMs: 0,
      durationMs: Math.max(1, durationMs),
    };
  }

  beginFollowTransition(target: CameraState, durationMs: number) {
    this.beginZoomTransition(target, durationMs);
  }

  beginImpact(offsetX: number, offsetY: number, durationMs: number) {
    this.impact = {
      offsetX,
      offsetY,
      elapsedMs: 0,
      durationMs: Math.max(1, durationMs),
    };
  }

  cancelTransition() {
    this.transition = null;
    this.impact = null;
  }

  stepTransition(deltaMs: number) {
    const steppedTransition = this.stepCameraTransition(deltaMs);
    const steppedImpact = this.stepImpact(deltaMs);

    return steppedTransition || steppedImpact;
  }

  applyTo(container: Container) {
    const impact = this.getImpactOffset();
    container.position.set(this.state.x + impact.x, this.state.y + impact.y);
    container.scale.set(this.state.scale);
  }

  private stepCameraTransition(deltaMs: number) {
    if (!this.transition) {
      return false;
    }

    const transition = this.transition;
    transition.elapsedMs = Math.min(transition.durationMs, transition.elapsedMs + Math.max(0, deltaMs));
    const t = transition.elapsedMs / transition.durationMs;
    const eased = t * t * (3 - 2 * t);

    this.state = {
      x: lerp(transition.from.x, transition.to.x, eased),
      y: lerp(transition.from.y, transition.to.y, eased),
      scale: lerp(transition.from.scale, transition.to.scale, eased),
    };

    if (transition.elapsedMs >= transition.durationMs) {
      this.transition = null;
    }

    return true;
  }

  private stepImpact(deltaMs: number) {
    if (!this.impact) {
      return false;
    }

    this.impact.elapsedMs = Math.min(this.impact.durationMs, this.impact.elapsedMs + Math.max(0, deltaMs));
    if (this.impact.elapsedMs >= this.impact.durationMs) {
      this.impact = null;
    }

    return true;
  }

  private getImpactOffset() {
    if (!this.impact) {
      return { x: 0, y: 0 };
    }

    const t = this.impact.elapsedMs / this.impact.durationMs;
    const falloff = Math.sin(t * Math.PI) * (1 - t);

    return {
      x: this.impact.offsetX * falloff,
      y: this.impact.offsetY * falloff,
    };
  }
}

function lerp(from: number, to: number, t: number) {
  return from + (to - from) * t;
}
