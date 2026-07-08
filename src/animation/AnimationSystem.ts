import { clamp01, easeInOutCubic, easeOutBack, easeOutCubic } from "./easing";
import { Timeline } from "./Timeline";
import type { AnimationPlan, EntityMotion } from "./transitions";

export interface AnimationFrameState {
  readonly progress: number;
  readonly running: boolean;
  readonly complete: boolean;
  readonly entityProgress: Readonly<Record<string, number>>;
  readonly blockedImpact: number;
}

export class AnimationSystem {
  private readonly timeline = new Timeline(1);
  private activePlan: AnimationPlan | null = null;

  start(plan: AnimationPlan): AnimationFrameState {
    this.activePlan = plan;
    this.timeline.start(plan.direction, plan.durationMs, plan.direction === "forward" ? 0 : 1);
    return this.createFrameState();
  }

  step(deltaMs: number): AnimationFrameState {
    this.timeline.step(deltaMs);
    return this.createFrameState();
  }

  cancel(): AnimationFrameState {
    this.timeline.cancel();
    this.activePlan = null;
    return {
      progress: 0,
      running: false,
      complete: false,
      entityProgress: {},
      blockedImpact: 0,
    };
  }

  private createFrameState(): AnimationFrameState {
    const plan = this.activePlan;
    const snapshot = this.timeline.snapshot;

    if (!plan) {
      return {
        progress: 0,
        running: false,
        complete: false,
        entityProgress: {},
        blockedImpact: 0,
      };
    }

    const rawProgress = plan.direction === "forward" ? snapshot.rawProgress : 1 - snapshot.rawProgress;
    const progress = clamp01(rawProgress);
    const entityProgress = Object.fromEntries(
      plan.entityMotions.map((motion) => [motion.entityId, getMotionProgress(motion, progress)]),
    );

    return {
      progress,
      running: snapshot.running,
      complete: snapshot.complete,
      entityProgress,
      blockedImpact: getBlockedImpact(progress, plan),
    };
  }
}

function getMotionProgress(motion: EntityMotion, progress: number) {
  if (motion.kind === "push") {
    const anticipated = clamp01((progress - 0.08) / 0.82);
    return clamp01(easeOutBack(anticipated));
  }

  return easeInOutCubic(progress);
}

function getBlockedImpact(progress: number, plan: AnimationPlan) {
  if (plan.blockedImpacts.length === 0) {
    return 0;
  }

  return Math.sin(easeOutCubic(progress) * Math.PI);
}
