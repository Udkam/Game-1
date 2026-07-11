# R1 Contract Freeze: Deterministic Recursive Core Safety

Status: documentation-only contract. This freezes the public semantics and
test boundary for a future core-safety implementation; it authorizes no source
change, runtime integration, serialization, level content, asset, or release.
The project remains a design-reboot prototype assessed as less than 10% complete
relative to the intended high-fidelity playable target. "Stage 6" is only a
historical artifact label, not a completion signal.

## Authority and scope

- Owner thread: `019f4e82-7cb8-73c1-b4a1-d333273b359f`.
- Coordinator thread: `019f4deb-7e83-7583-8cd5-8e6f075bc331`.
- Planning baseline: canonical rules audit `175ca5e`, independently accepted as
  planning direction in QA follow-up `b10537e` / integrated `423fff9`.
- P0 is closed only for clean toolchain reproducibility (`86d02d4` integrated
  as `5075df0`). Stage 6 remains rejected for release; all P1/P2 issues remain
  open.
- R1 freezes the requirements that QA requested before an implementation slice:
  deterministic port selection, exact typed results/events/addresses,
  `cycleMode: "forbid"`, deterministic stress evidence, and ownership split.

This is an original clean-room contract. It does not adopt the original game's
implementation, assets, layouts, editor format, or defaults.

## Terms and stable value shapes

The following TypeScript shapes are the public core contract. They are
serializable data; render pixels, timers, DOM/Pixi objects, and camera state
are forbidden.

```ts
export type WorldId = string;
export type EntityId = string;
export type PortId = string;
export type StateHash = string;
export type Direction = "up" | "right" | "down" | "left";
export type CycleMode = "forbid";

export interface CellAddress {
  readonly world: WorldAddress;
  readonly x: number;
  readonly y: number;
}

/** Identifies one reachable occurrence, never a cloned world. */
export interface WorldAddress {
  readonly rootWorldId: WorldId;
  readonly containerPath: readonly EntityId[];
}

/** Identifies an entity as seen in one reachable occurrence. */
export interface EntityOccurrenceAddress {
  readonly world: WorldAddress;
  readonly entityId: EntityId;
}

export interface PortOccurrenceAddress {
  readonly container: EntityOccurrenceAddress;
  readonly portId: PortId;
}

export interface TransactionId {
  /** Stable hash of the session's immutable initial simulation state. */
  readonly initialStateHash: StateHash;
  /** Session-local, monotonically increasing dispatch sequence (starting at 1). */
  readonly sequence: number;
}

export interface StepCommand {
  readonly type: "step";
  readonly direction: Direction;
}
export interface UndoCommand { readonly type: "undo"; }
export interface RedoCommand { readonly type: "redo"; }
export interface ResetCommand { readonly type: "reset"; }
export type PublicCommand = StepCommand | UndoCommand | RedoCommand | ResetCommand;

export type InteractionRule = "walk" | "push" | "enter" | "exit";
export type EventDirection = "forward" | "reverse";
```

`WorldAddress` is valid only if resolving each `containerPath` item from the
current world reaches the next contained world. Its canonical identity key is
`JSON.stringify([rootWorldId, ...containerPath])`; implementations must not
join raw IDs with a delimiter. `EntityOccurrenceAddress` is the sole key for a
visible entity in projections, events, interpolation, camera targeting, and
QA traces. In R1 all valid paths are acyclic; the shape intentionally remains
address-aware so a later, separately approved cycle policy can extend it.

## Port data and exactly-one directional mapping

Each container declares its ports as data. The container's positioned cell is
the only outer anchor in R1 (the clean-room "center" rule); a step can never
enter an arbitrary container elsewhere in the active world.

```ts
export interface ContainerPort {
  readonly id: PortId;
  /** Direction of the parent-world step that approaches the container anchor. */
  readonly outerApproach: Direction;
  /** Unoccupied child-world cell reached after the accepted enter transaction. */
  readonly innerLanding: { readonly x: number; readonly y: number };
  /** Direction that leaves innerLanding through this same port. */
  readonly innerExit: Direction;
}

export interface ContainerPortTable {
  readonly containerId: EntityId;
  readonly ports: readonly ContainerPort[];
}

export interface RuleSetR1 {
  readonly version: 1;
  readonly cycleMode: CycleMode;
  readonly interactionPriority: readonly Exclude<InteractionRule, "walk">[];
}
```

R1 validation requires all of the following:

1. Each port ID is unique within its container.
2. Each `outerApproach` occurs at most once within its container, and each
   `innerExit` occurs at most once within its container.
3. `innerExit` equals `opposite(outerApproach)`. This makes the first-slice
   entry/exit relation explicitly inverse rather than dependent on object-key
   enumeration.
4. `innerLanding` is an integer in-bounds cell of that container's
   `innerWorldId`, and contains no solid occupant in a validated initial state.
5. `interactionPriority` contains each known item at most once and contains no
   disabled/unknown item. `walk` is implicit and only applies to an empty,
   in-bounds adjacent cell.

### Selection algorithm

For `Step(direction)`, evaluate `walk` first when the adjacent cell is empty
and in bounds. Otherwise, evaluate `interactionPriority` in declared order.
Each rule produces an `AttemptOutcome` defined below; only prior
`not-applicable` outcomes may fall through. A terminal `blocked` outcome stops
resolution and no candidate observes a partially mutated state.

`enter` maps a port as follows:

1. Compute the adjacent cell from the controlled actor's `CellAddress` and the
   incoming direction.
2. Find container occurrences at that exact adjacent cell in the active
   `WorldAddress`.
3. If none is present, return `not-applicable` for `enter`.
4. If more than one container occurrence is present, return terminal
   `blocked: "port-ambiguous"`.
5. For the one container, filter ports by `outerApproach === direction`.
   Zero matches returns terminal `blocked: "port-absent"`; more than one
   returns terminal `blocked: "port-ambiguous"`; exactly one returns its
   `PortOccurrenceAddress`.

`exit` maps a port only from the focused occurrence:

1. The active address must have a nonempty `containerPath`; otherwise `exit`
   is `not-applicable`.
2. Resolve its final container occurrence in the parent address. Filter its
   ports by both `innerLanding === actor.localCell` and
   `innerExit === direction`.
3. Zero matches is `not-applicable` unless the actor is on an inner landing
   cell of that container, in which case it is terminal
   `blocked: "port-absent"`. More than one match is terminal
   `blocked: "port-ambiguous"`. Exactly one returns that same port occurrence.
4. The parent destination is the parent-world cell adjacent to the container
   anchor in `opposite(port.outerApproach)`. It must be in bounds and free
   before an exit can be accepted.

The selected port ID is included in every traversal event, replay record, and
test assertion. No keyboard handler, renderer, camera, fixed entity ID, array
order, or "nearest" heuristic participates in port choice.

## Exact resolution, transaction, and event contract

`not-applicable` is an internal, observable attempt result: it means a rule
does not match the current unmodified snapshot. It is not a rejected command.
`blocked` is terminal: it means a matching rule/data situation cannot legally
commit. Every public dispatch ends in either `accepted` or `rejected`.

```ts
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
  | "already-initial-state";

export interface Rejection {
  readonly code: RejectionCode;
  readonly rule?: InteractionRule;
  readonly attemptedCell?: CellAddress;
  readonly port?: PortOccurrenceAddress;
}

export type AttemptOutcome =
  | {
      readonly kind: "not-applicable";
      readonly rule: InteractionRule;
    }
  | {
      readonly kind: "blocked";
      readonly rule: InteractionRule;
      readonly rejection: Rejection;
    }
  | {
      readonly kind: "accepted";
      readonly rule: InteractionRule;
      readonly transaction: Transaction;
    };

export interface Transaction {
  readonly id: TransactionId;
  readonly command: PublicCommand;
  readonly rule: InteractionRule | "undo" | "redo" | "reset";
  /** Required for undo/redo; identifies the historic transaction replayed. */
  readonly sourceTransactionId?: TransactionId;
  readonly stateHashBefore: StateHash;
  readonly stateHashAfter: StateHash;
  readonly activeAddressBefore: WorldAddress;
  readonly activeAddressAfter: WorldAddress;
  readonly events: readonly SemanticEvent[];
}

export type CommandResult =
  | {
      readonly kind: "accepted";
      readonly transaction: Transaction;
      /** Earlier candidates may be not-applicable; final accepted attempt is last. */
      readonly attempts: readonly AttemptOutcome[];
    }
  | {
      readonly kind: "rejected";
      readonly command: PublicCommand;
      readonly rejection: Rejection;
      readonly stateHashBefore: StateHash;
      readonly stateHashAfter: StateHash;
      readonly activeAddressBefore: WorldAddress;
      readonly activeAddressAfter: WorldAddress;
      /** Earlier candidates may be not-applicable; final blocked attempt is last. */
      readonly attempts: readonly AttemptOutcome[];
      readonly events: readonly [CommandBlockedEvent];
    };
```

For a rejected result, before/after hashes and active addresses are equal,
history is unchanged, and `events` has exactly one `command-blocked` event.
That event has `transactionId: null` because no transaction committed.
For `undo`, `redo`, and `reset`, `attempts` is the empty array: interaction
attempts are a `Step` diagnostic only. Every accepted public action receives a
new transaction ID; undo/redo additionally set `sourceTransactionId` to the
history record whose events they reverse or replay.
`TransactionId.sequence` increments only when a command returns `accepted`;
it is session metadata, not canonical simulation state, and makes traces
deterministic when replay uses the same initial state and command array.

```ts
interface EventBase {
  /** Null only for a rejected command's non-transactional blocked event. */
  readonly transactionId: TransactionId | null;
  /** Zero-based event order within this result's event array. */
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
  | PortalTraversedEvent
  | FocusChangedEvent
  | WinChangedEvent
  | ResetEvent
  | CommandBlockedEvent;
```

Forward accepted traversal emits `portal-traversed` followed by
`focus-changed`. Undo emits the stored semantic sequence in reverse order with
`direction: "reverse"` and swapped source/destination fields where applicable;
redo emits the stored forward sequence. Animation consumers must not infer
undo/redo direction from an empty event array.

## `cycleMode: "forbid"` validation boundary

R1's only legal cycle mode is `"forbid"`. Any absent, unknown, or alternate
mode rejects the level with `invalid-level-data`; a legacy
`allowsRecursiveCycle: true` value rejects with `cycle-forbidden` and is never
an override.

For **every** positioned container, construct a containment edge:

```text
source world = container position.worldId
edge label   = container entity ID
target world = container.innerWorldId
```

The validator must:

1. Validate source/target worlds and the container's parent-world location
   before graph traversal.
2. Collect all containment edges, including edges in worlds unreachable from
   the root, and sort by `(sourceWorldId, containerId, targetWorldId)`.
3. Run deterministic depth-first search over all world IDs in lexical order;
   neighbors use that same sorted edge order.
4. Reject a self edge, any edge to a gray DFS node, and any cycle discovered in
   an unreachable component. The diagnostic contains the ordered edge witness
   and the offending container IDs.
5. Run this validator before exposing a loaded state and after constructing an
   accepted candidate transaction. A cycle failure returns a rejected result;
   it never partially mutates position, focus, history, or hash.

Required validation tests: self-container; two-world and three-world loop;
unreachable loop; valid nested acyclic graph; unknown inner world; invalid
source location; a legacy cycle-enable flag; and a post-transaction candidate
that would create a cycle. Every rejection is deterministic and has a stable
diagnostic/witness order.

## Deterministic 1,000-sequence stress protocol

This is a required future R1 core-safety test, not evidence that R1 has already
been implemented.

### Generator

- PRNG: unsigned 32-bit `xorshift32`:
  `x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return x >>> 0`.
- Master seed: `0x51CEB00C`.
- Cases: exactly 1,000, indexed `0..999`; case seed is
  `xorshift32(masterSeed ^ caseIndex)`.
- Valid-fixture domain: 1–3 worlds, each 3–6 cells wide and high; one root;
  exactly one controlled actor; 0–4 ordinary pushables/solids; 0–2 containers
  per world; unique in-bounds solid cells; and an acyclic containment graph.
  Containers receive 1–2 ports with unique approach/exit directions and free
  inner landing cells. IDs are generated from case index plus ordinal and are
  stable across replay.
- Invalid-fixture domain: one deterministic mutation of a generated valid
  fixture selected from unknown inner world, invalid parent location, duplicate
  port direction, occupied inner landing, self edge, two-world edge cycle, or
  legacy cycle-enable flag. Loading it must reject with diagnostics, not throw.
- Command domain for every valid fixture: 64 commands drawn from `Step(up)`,
  `Step(right)`, `Step(down)`, `Step(left)`, `Undo`, `Redo`, and `Reset` with
  weights `16,16,16,16,12,12,12` respectively. A command array is generated
  before execution and reused unchanged for direct/replay comparison.

### Oracle after each dispatch

1. No command or validation path throws.
2. The post-session validates under `cycleMode: "forbid"`; positions are
   in-bounds, solid occupancy is unique, and active focus resolves.
3. A rejected result has unchanged canonical hash, history lengths, active
   address, and exactly one `command-blocked` event; its last attempt is
   terminal `blocked`, not `not-applicable`.
4. An accepted result has a valid monotonic transaction ID, matching before/
   after hashes, a final accepted attempt, and every event address/port resolves
   against its declared before/after snapshot.
5. Replay of the fixture plus the entire generated command array produces the
   same accepted/rejected kinds, transaction rules, hash trace, address trace,
   semantic event trace, and final win state as direct dispatch.
6. The immutable initial fixture and every stored historical snapshot retain
   their original stable hash after later commands.

### Failure report and minimization

On the first oracle failure, the test throws one canonical JSON `StressFailure`
payload to test output; it does not write an untracked repository artifact.

```ts
interface StressFailure {
  readonly suite: "r1-core-safety-stress";
  readonly masterSeed: "0x51CEB00C";
  readonly caseIndex: number;
  readonly caseSeed: number;
  readonly fixture: unknown;
  readonly invalidMutation?: string;
  readonly originalCommands: readonly PublicCommand[];
  readonly failingPrefixLength: number;
  readonly minimizedCommands: readonly PublicCommand[];
  readonly oracleCode: string;
  readonly directTrace: readonly CommandResult[];
  readonly replayTrace: readonly CommandResult[];
}
```

`minimizedCommands` is a deterministic 1-minimal failing prefix: begin with the
commands through the first failure; test removal of one command at a time from
left to right; accept the first removal that reproduces the same `oracleCode`;
restart at index zero; stop only when no single deletion reproduces that code.
The report plus the fixture and minimized trace must reproduce the failure
without random state.

## Future implementation ownership boundary

R1 itself changes no code. The next approved implementation must choose one
row below and independently pass QA; it may not enlarge scope by implication.

| Future slice | Owned implementation files | Owned tests | Explicitly excluded |
| --- | --- | --- | --- |
| **C1 core safety and contract execution** | `src/core/types.ts`, `commands.ts`, `components.ts`, `worldGraph.ts`, `collision.ts`, `movementResolver.ts`, `recursiveTransitions.ts`, `reducer.ts`, `history.ts`, `replay.ts`; new `src/core/ports.ts` and `src/core/validation.ts` | Update `src/core/core.test.ts`, `src/core/replay.test.ts`; add `src/core/ports.test.ts`, `src/core/validation.test.ts`, `src/core/stress.test.ts` | `src/projection/**`, `src/runtime/**`, `src/animation/**`, `src/render/**`, React/UI, browser tests, levels, serialization, push-in/out, and every non-`forbid` cycle feature |
| **V1 runtime/render occurrence address and completion lock** | `src/projection/types.ts`, `worldProjection.ts`, `simulationProjection.ts`; `src/runtime/EventPipeline.ts`, `GameRuntime.ts`, `InteractionPrototype.ts`; `src/animation/transitions.ts`; `src/render/PixiApp.ts`, `RecursiveTransitionRenderer.ts`, `Camera2D.ts` | Update existing projection/runtime/animation/render tests; add occurrence-identity, two-container/nested-focus, unified-lock, and deterministic browser middle-frame coverage | Any reinterpretation of C1 result/port/cycle semantics; core mutation logic; level schema/content; push-in/out; cyclic gameplay |

C1 owns public semantic types and produces renderer-independent
`CommandResult`/`SemanticEvent` values. V1 only consumes those values to build
address-keyed projections and one visual-completion barrier; it must not
redefine port selection or mutate canonical state. A shared type migration is
allowed only through a new coordinator-approved slice with named C1 and V1
owners.

## Delayed duplicate research disposition

Non-authoritative commit `d5c36246c59ae9d96525543c0b93fc149db80a15` was read
without merge. Useful research ideas incorporated here are a center-anchor
entry rule, explicit inverse port relation, occurrence-address values, a
transaction completion barrier, and a detailed deterministic test matrix.

It is not a source of authority. This R1 contract rejects its stale
workstream identity/log, later-core P0 labeling, bounded-cycle first-slice
policy, and any result design that collapses `not-applicable` into terminal
`blocked`. `cycleMode: "forbid"` and the discriminated shapes above govern
the first core slice.

## R1 acceptance criteria

- Only this document and the workstream log change in the R1 commit.
- The contract makes port absence and ambiguity terminal, typed rejections;
  mapping is deterministic and testable from `Step(direction)` alone.
- Public results distinguish candidate `not-applicable` from terminal
  `blocked`; accepted semantic events contain transaction and occurrence
  identity, while the single rejected blocked event explicitly has no
  transaction ID.
- Every containment edge is covered by deterministic load-time cycle rejection
  under `cycleMode: "forbid"`, including unreachable graph components.
- The stress protocol is directly implementable with its named PRNG, seed,
  fixture/command domains, oracle, and reproducer.
- C1/V1 file and test responsibility has no unapproved overlap.
- Independent QA must accept the R1 SHA, then work stops. A C1 core
  implementation additionally requires a later explicit user development
  instruction and a new bounded coordinator authorization; no code follows
  from this documentation slice automatically.
