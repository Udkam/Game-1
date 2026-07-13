export type Lane = -1 | 0 | 1;

export type Heading = "north" | "east" | "south" | "west";

export type TurnDirection = "left" | "right";

export type CourseEventKind =
  | "beam"
  | "ring"
  | "column"
  | "gap"
  | "shard"
  | "shield";

export type HazardKind = Extract<
  CourseEventKind,
  "beam" | "ring" | "column" | "gap"
>;

export interface Point2 {
  readonly x: number;
  readonly z: number;
}

export interface CourseEvent {
  readonly id: string;
  readonly kind: CourseEventKind;
  readonly lane: Lane | "all";
  readonly at: number;
  readonly length: number;
}

export interface CourseSection {
  readonly id: string;
  readonly index: number;
  readonly origin: Point2;
  readonly heading: Heading;
  readonly length: number;
  readonly requiredTurn: TurnDirection;
  readonly turnWarningStart: number;
  readonly turnInputStart: number;
  readonly authoredSpeed: number;
  readonly generationAttempt: number;
  readonly fallbackUsed: boolean;
  readonly events: readonly CourseEvent[];
}

export interface CourseGeneratorState {
  readonly seed: number;
  readonly nextSectionIndex: number;
  readonly nextOrigin: Point2;
  readonly nextHeading: Heading;
  readonly rngState: number;
}

export interface CourseState {
  readonly sections: readonly CourseSection[];
  readonly generator: CourseGeneratorState;
}

export interface LaneTransition {
  readonly from: number;
  readonly to: Lane;
  readonly elapsedTicks: number;
  readonly durationTicks: number;
}

export interface RunnerBodyState {
  readonly lanePosition: number;
  readonly targetLane: Lane;
  readonly laneTransition: LaneTransition | null;
  readonly height: number;
  readonly verticalVelocity: number;
  readonly grounded: boolean;
  readonly slideTicksRemaining: number;
  readonly shieldCharges: 0 | 1;
  readonly speedPenaltyTicks: number;
}

export type RunnerStatus = "ready" | "running" | "paused" | "game-over";

export type FailureReason =
  | {
      readonly kind: "wrong-turn";
      readonly sectionId: string;
      readonly expected: TurnDirection;
      readonly received: TurnDirection;
    }
  | {
      readonly kind: "missed-turn";
      readonly sectionId: string;
      readonly expected: TurnDirection;
    }
  | {
      readonly kind: "hazard-collision";
      readonly sectionId: string;
      readonly eventId: string;
      readonly hazard: Exclude<HazardKind, "gap">;
    }
  | {
      readonly kind: "gap-fall";
      readonly sectionId: string;
      readonly eventId: string;
    };

export interface RunnerState {
  readonly version: 1;
  readonly seed: number;
  readonly status: RunnerStatus;
  readonly tick: number;
  readonly elapsedTicks: number;
  readonly distance: number;
  readonly sectionIndex: number;
  readonly sectionDistance: number;
  readonly speed: number;
  readonly score: number;
  readonly shards: number;
  readonly multiplier: number;
  readonly queuedTurn: TurnDirection | null;
  readonly failureReason: FailureReason | null;
  readonly runner: RunnerBodyState;
  readonly course: CourseState;
  readonly resolvedEventIds: readonly string[];
  readonly consumedEventIds: readonly string[];
}

export type RunnerCommand =
  | { readonly type: "Start" }
  | { readonly type: "StepLeft" }
  | { readonly type: "StepRight" }
  | { readonly type: "Jump" }
  | { readonly type: "Slide" }
  | { readonly type: "Pause" }
  | { readonly type: "Resume" }
  | { readonly type: "Restart"; readonly seed?: number }
  | { readonly type: "Tick" };

export type RunnerEvent =
  | { readonly type: "run-started"; readonly tick: number }
  | {
      readonly type: "lane-shifted";
      readonly tick: number;
      readonly from: number;
      readonly to: Lane;
    }
  | { readonly type: "jump-started"; readonly tick: number }
  | { readonly type: "landed"; readonly tick: number }
  | { readonly type: "slide-started"; readonly tick: number }
  | {
      readonly type: "turn-queued";
      readonly tick: number;
      readonly sectionId: string;
      readonly direction: TurnDirection;
    }
  | {
      readonly type: "turned";
      readonly tick: number;
      readonly fromSectionId: string;
      readonly toSectionId: string;
      readonly direction: TurnDirection;
    }
  | {
      readonly type: "pickup-collected";
      readonly tick: number;
      readonly sectionId: string;
      readonly eventId: string;
      readonly pickup: "shard" | "shield";
    }
  | {
      readonly type: "shield-broken";
      readonly tick: number;
      readonly sectionId: string;
      readonly eventId: string;
      readonly hazard: HazardKind;
    }
  | {
      readonly type: "collision";
      readonly tick: number;
      readonly sectionId: string;
      readonly eventId: string;
      readonly hazard: HazardKind;
    }
  | {
      readonly type: "run-failed";
      readonly tick: number;
      readonly reason: FailureReason;
    }
  | { readonly type: "paused"; readonly tick: number }
  | { readonly type: "resumed"; readonly tick: number }
  | { readonly type: "restarted"; readonly tick: number; readonly seed: number };

export type CommandRejection =
  | "not-ready"
  | "not-running"
  | "not-paused"
  | "restart-not-allowed"
  | "lane-boundary"
  | "turn-already-queued"
  | "airborne"
  | "sliding"
  | "already-sliding";

export interface CommandResult {
  readonly state: RunnerState;
  readonly events: readonly RunnerEvent[];
  readonly accepted: boolean;
  readonly rejection: CommandRejection | null;
}

export interface WorldSample {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly yaw: number;
  readonly heading: Heading;
  readonly lanePosition: number;
  readonly sectionDistance: number;
}

export interface FairnessReport {
  readonly valid: boolean;
  readonly reasons: readonly string[];
  readonly legalResponseCount: number;
}

export interface ReplayFrame {
  readonly index: number;
  readonly command: RunnerCommand;
  readonly accepted: boolean;
  readonly hash: string;
}

export interface ReplayResult {
  readonly state: RunnerState;
  readonly hash: string;
  readonly frames: readonly ReplayFrame[];
}
