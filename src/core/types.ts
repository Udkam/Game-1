import type { PublicCommand } from "./commands";

export type WorldId = string;
export type EntityId = string;
export type PortId = string;
export type StateHash = string;
export type Direction = "up" | "down" | "left" | "right";
export type CorePaletteId = "void-lab" | "inner-mint";
export type VisualKind = "player" | "box" | "recursive-container" | "goal";

export type CycleMode = "forbid";
export type InteractionRule = "walk" | "push" | "enter" | "exit";
export type PrioritizedInteractionRule = Exclude<InteractionRule, "walk">;
export type AttemptRule = InteractionRule | "step-fallback";
export type EventDirection = "forward" | "reverse";

export interface WorldAddress {
  readonly rootWorldId: WorldId;
  readonly containerPath: readonly EntityId[];
}

export interface CellAddress {
  readonly world: WorldAddress;
  readonly x: number;
  readonly y: number;
}

export interface EntityOccurrenceAddress {
  readonly world: WorldAddress;
  readonly entityId: EntityId;
}

export interface PortOccurrenceAddress {
  readonly container: EntityOccurrenceAddress;
  readonly portId: PortId;
}

export interface TransactionId {
  readonly initialStateHash: StateHash;
  readonly sequence: number;
}

export interface ContainerPort {
  readonly id: PortId;
  readonly outerApproach: Direction;
  readonly innerLanding: { readonly x: number; readonly y: number };
  readonly innerExit: Direction;
}

export interface ContainerPortTable {
  readonly containerId: EntityId;
  readonly ports: readonly ContainerPort[];
}

export interface RuleSetR1 {
  readonly version: 1;
  readonly cycleMode: CycleMode;
  readonly ruleEnablement: Readonly<Record<PrioritizedInteractionRule, "enabled" | "disabled">>;
  readonly interactionPriority: readonly PrioritizedInteractionRule[];
}

export const R1_PRIORITIZED_RULES = ["push", "enter", "exit"] as const;

export interface GridSize {
  readonly width: number;
  readonly height: number;
}

export interface GridPosition {
  readonly worldId: WorldId;
  readonly x: number;
  readonly y: number;
}

export interface WorldNode {
  readonly id: WorldId;
  readonly size: GridSize;
  readonly paletteId: CorePaletteId;
}

export interface Entity {
  readonly id: EntityId;
}

export interface PositionComponent extends GridPosition {}

export interface ContainerComponent {
  readonly innerWorldId: WorldId;
}

export interface SolidComponent {
  readonly blocksMovement: true;
}

export interface PushableComponent {
  readonly pushable: true;
}

export interface PlayerComponent {
  readonly controlled: true;
}

export interface GoalComponent {
  readonly acceptsVisualKind?: VisualKind;
}

export interface VisualComponent {
  readonly kind: VisualKind;
  readonly width: number;
  readonly height: number;
  readonly offsetX?: number;
  readonly offsetY?: number;
}

export interface ComponentStore {
  readonly positions: Readonly<Record<EntityId, PositionComponent>>;
  readonly containers: Readonly<Record<EntityId, ContainerComponent>>;
  readonly solids: Readonly<Record<EntityId, SolidComponent>>;
  readonly pushables: Readonly<Record<EntityId, PushableComponent>>;
  readonly players: Readonly<Record<EntityId, PlayerComponent>>;
  readonly goals: Readonly<Record<EntityId, GoalComponent>>;
  readonly visuals: Readonly<Record<EntityId, VisualComponent>>;
}

export interface SimulationState {
  readonly version: 1;
  readonly rootWorldId: WorldId;
  readonly activeWorldId: WorldId;
  readonly playerId: EntityId;
  readonly focusPath: readonly EntityId[];
  readonly ruleSet: RuleSetR1;
  readonly portTables: readonly ContainerPortTable[];
  readonly worlds: Readonly<Record<WorldId, WorldNode>>;
  readonly entities: Readonly<Record<EntityId, Entity>>;
  readonly components: ComponentStore;
}

export type RejectionCode =
  | "actor-not-active"
  | "focus-invalid"
  | "target-out-of-bounds"
  | "target-solid-not-pushable"
  | "push-chain-out-of-bounds"
  | "port-absent"
  | "port-ambiguous"
  | "port-landing-out-of-bounds"
  | "port-landing-occupied"
  | "port-parent-destination-out-of-bounds"
  | "port-parent-destination-occupied"
  | "cycle-forbidden"
  | "invalid-level-data"
  | "history-empty"
  | "future-empty"
  | "already-initial-state"
  | "no-enabled-rule-applies";

type RejectionContext = {
  readonly rule?: AttemptRule;
  readonly attemptedCell?: CellAddress;
  readonly port?: PortOccurrenceAddress;
};

export type Rejection =
  | (RejectionContext & { readonly code: "actor-not-active"; readonly reason: { readonly kind: "actor" } })
  | (RejectionContext & { readonly code: "focus-invalid"; readonly reason: { readonly kind: "focus" } })
  | (RejectionContext & {
      readonly code: "target-out-of-bounds" | "target-solid-not-pushable";
      readonly reason: { readonly kind: "target" };
    })
  | (RejectionContext & {
      readonly code: "push-chain-out-of-bounds";
      readonly reason: { readonly kind: "push" };
    })
  | (RejectionContext & {
      readonly code:
        | "port-absent"
        | "port-ambiguous"
        | "port-landing-out-of-bounds"
        | "port-landing-occupied"
        | "port-parent-destination-out-of-bounds"
        | "port-parent-destination-occupied";
      readonly reason: { readonly kind: "port" };
    })
  | (RejectionContext & { readonly code: "cycle-forbidden"; readonly reason: { readonly kind: "cycle" } })
  | (RejectionContext & { readonly code: "invalid-level-data"; readonly reason: { readonly kind: "validation" } })
  | (RejectionContext & {
      readonly code: "history-empty" | "future-empty";
      readonly reason: { readonly kind: "history" };
    })
  | (RejectionContext & { readonly code: "already-initial-state"; readonly reason: { readonly kind: "reset" } })
  | (RejectionContext & {
      readonly code: "no-enabled-rule-applies";
      readonly reason: { readonly kind: "step-fallback" };
    });

export type AttemptOutcome =
  | { readonly kind: "not-applicable"; readonly rule: InteractionRule }
  | { readonly kind: "blocked"; readonly rule: AttemptRule; readonly rejection: Rejection }
  | { readonly kind: "accepted"; readonly rule: InteractionRule; readonly transaction: Transaction };

export interface Transaction {
  readonly id: TransactionId;
  readonly command: PublicCommand;
  readonly rule: InteractionRule | "undo" | "redo" | "reset";
  readonly sourceTransactionId?: TransactionId;
  readonly stateHashBefore: StateHash;
  readonly stateHashAfter: StateHash;
  readonly activeAddressBefore: WorldAddress;
  readonly activeAddressAfter: WorldAddress;
  readonly events: readonly SemanticEvent[];
}

interface EventBase {
  readonly transactionId: TransactionId | null;
  readonly eventIndex: number;
  readonly direction: EventDirection;
}

export interface EntityMovedEvent extends EventBase {
  readonly type: "entity-moved";
  readonly occurrence: EntityOccurrenceAddress;
  readonly from: CellAddress;
  readonly to: CellAddress;
  readonly cause: "walk" | "push";
}

export interface PushResolvedEvent extends EventBase {
  readonly type: "push-resolved";
  readonly actor: EntityOccurrenceAddress;
  readonly directionMoved: Direction;
  readonly moved: readonly EntityMovedEvent[];
}

/** One terminal payload crossing an addressed port during the public push rule. */
export interface EntityTransferredEvent extends EventBase {
  readonly type: "entity-transferred";
  readonly mode: "push-in" | "push-out";
  readonly entityBefore: EntityOccurrenceAddress;
  readonly entityAfter: EntityOccurrenceAddress;
  readonly from: CellAddress;
  readonly to: CellAddress;
  readonly via: PortOccurrenceAddress;
  readonly carriedSubtree: {
    readonly innerWorldId: WorldId;
    readonly beforeRoot: WorldAddress;
    readonly afterRoot: WorldAddress;
  } | null;
}

export interface PortalTraversedEvent extends EventBase {
  readonly type: "portal-traversed";
  readonly mode: "enter" | "exit";
  readonly actorBefore: EntityOccurrenceAddress;
  readonly actorAfter: EntityOccurrenceAddress;
  readonly port: PortOccurrenceAddress;
  readonly from: CellAddress;
  readonly to: CellAddress;
}

export interface FocusChangedEvent extends EventBase {
  readonly type: "focus-changed";
  readonly before: WorldAddress;
  readonly after: WorldAddress;
  readonly via?: PortOccurrenceAddress;
}

export interface WinChangedEvent extends EventBase {
  readonly type: "win-changed";
  readonly solved: boolean;
}

export interface ResetEvent extends EventBase {
  readonly type: "reset";
}

export interface CommandBlockedEvent extends EventBase {
  readonly type: "command-blocked";
  readonly rejection: Rejection;
}

export type SemanticEvent =
  | EntityMovedEvent
  | PushResolvedEvent
  | EntityTransferredEvent
  | PortalTraversedEvent
  | FocusChangedEvent
  | WinChangedEvent
  | ResetEvent
  | CommandBlockedEvent;

export type StepCommandResult =
  | {
      readonly kind: "accepted";
      readonly command: Extract<PublicCommand, { readonly type: "step" }>;
      readonly transaction: Transaction;
      readonly attempts: readonly [AttemptOutcome, ...AttemptOutcome[]];
    }
  | {
      readonly kind: "rejected";
      readonly command: Extract<PublicCommand, { readonly type: "step" }>;
      readonly rejection: Rejection;
      readonly stateHashBefore: StateHash;
      readonly stateHashAfter: StateHash;
      readonly activeAddressBefore: WorldAddress;
      readonly activeAddressAfter: WorldAddress;
      readonly attempts: readonly [AttemptOutcome, ...AttemptOutcome[]];
      readonly events: readonly [CommandBlockedEvent];
    };

export type NonStepCommand = Exclude<PublicCommand, { readonly type: "step" }>;
export type NonStepCommandResult =
  | { readonly kind: "accepted"; readonly command: NonStepCommand; readonly transaction: Transaction; readonly attempts: readonly [] }
  | {
      readonly kind: "rejected";
      readonly command: NonStepCommand;
      readonly rejection: Rejection;
      readonly stateHashBefore: StateHash;
      readonly stateHashAfter: StateHash;
      readonly activeAddressBefore: WorldAddress;
      readonly activeAddressAfter: WorldAddress;
      readonly attempts: readonly [];
      readonly events: readonly [CommandBlockedEvent];
    };

export type CommandResult = StepCommandResult | NonStepCommandResult;
