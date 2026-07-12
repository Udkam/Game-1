# R2 Contract: Acyclic Recursive Transfers

Status: R2D documentation freeze; implementation is not authorized.
Owner: gameplay/rules `019f4e82-7cb8-73c1-b4a1-d333273b359f`
Coordinator: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
Baseline: `d4d99911576ba8217ed905f52c7d53e94fb39c2c`

R2 specifies an original, acyclic subset of recursive transfer: pushing a
payload into a receiving container and pushing a payload out of the focused
container. It is a clean-room design contract only, never an implementation,
completion, or release claim.

## A. Evidence and clean-room boundary

The official Patrick's Parabox site, press material, Steam description, and
custom-level documentation publicly describe recursive boxes and pushing boxes
into/out of one another. The custom-level page visibly labels an `attempt_order`
with push/enter and an `inner_push` option. Those labels establish only
high-level observable comparison evidence; they do not prescribe this project's
rules, priority, data, events, layouts, timing, or implementation. This
contract neither copies their format/content nor treats them as a schema.
No official code, assets, audio, branding, game text, level coordinates, or
custom-level content is used or may be copied.

The objective is representative correct recursive mechanics for an original
high-fidelity puzzle target, not copying the full game. The official
custom-level page is non-normative read-only evidence; community layouts and
code are outside this contract.

## B. Versioning and public surface

`PublicCommand` stays exactly R1: `StepCommand | UndoCommand | RedoCommand |
ResetCommand`. `Step(direction)` remains the only directional constructor;
`dispatchPublicCommand`, `PublicDispatchEnvelope`, result discriminants,
addresses, transactions, and valid-command total/non-throwing behavior remain
stable. The I1 forced-JavaScript-value TypeError remains outside that domain.

State structural `version`, `RuleSetR1` version/shape,
`InteractionRule = "walk" | "push" | "enter" | "exit"`,
`PrioritizedInteractionRule`, `AttemptRule`, `R1_PRIORITIZED_RULES`,
`ruleEnablement`, `interactionPriority`, and `Transaction.rule` remain exactly
R1. There is no R2 rule-set version, state upgrade, loader, hash churn, or
fixture migration. The existing exact validation remains: `walk` is always
enabled; the three R1 prioritized rules have literal enablement, no extras, and
priority is the duplicate-free ordered enabled subset. The existing all-disabled
priority fallback remains valid.

Push-in and push-out are addressed internal submodes of the existing public
`push` rule. A Step attempt and accepted transaction rule remains `push` for
local push, push-in, and push-out; transfer mode is carried solely by the
event. This makes the core-first R2I commit whole-repository typecheck-capable:
current state literals, R1/V1 hashes, and public command/result consumers need
no compatibility adapter or intermediate fixture migration. The frontend
currently ignores the one additive event through non-exhaustive branches; its
directly-atop commit adds presentation support.

The only public addition is this one additive semantic-event union member:

```ts
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
```

No `RejectionCode`, rejection-reason, command, rule, attempt, transaction, or
state union changes in R2. Existing exact `port-*`, `cycle-forbidden`,
`focus-invalid`, and `invalid-level-data` outcomes continue to cover resolved
port geometry/occupancy, candidate cycles, invalid pre-command focus, and
malformed or internally inconsistent candidates. A valid transfer cannot move
the actor's focus ancestor: its payload occurrence is in the active world,
while every focus-path container occurrence is in an ancestor world. The
resolver asserts that separation and exact unchanged focus; failure is invalid
level/candidate data, not a new reachable gameplay rejection branch.

## C. Deterministic Step order

For every valid Step, resolve the full active root-plus-focus occurrence and
attempt `walk` first. Walk acceptance commits and walk blocking terminates. On
walk N/A, evaluate the members of the unchanged R1 `interactionPriority` in
its exact validated data order: enabled members of `push`, `enter`, `exit`.
N/A continues, blocked terminates, accepted commits, and disabled rules are
absent. Exhaustion emits
the existing terminal `step-fallback` with `no-enabled-rule-applies` and
`{kind:"step-fallback"}`. A rejected Step has nonempty ordered attempts ending
blocked; an accepted Step has one final accepted attempt/transaction. The R1
invalid-data preflight fallback remains the sole preflight-only exception.

The enabled public `push` attempt classifies only executable canonical geometry
and has this exact internal, non-public order:

1. **Push-out.** Starting at the adjacent cell, scan contiguous solid,
   pushable payloads only far enough to determine whether the farthest payload
   occupies the focused container's exact inner landing and input equals that
   port's `innerExit`. Perform this check before generic local-chain OOB
   handling, because the legal boundary is normally the edge that local push
   would call OOB. Exact boundary geometry reserves push-out; its blocked
   destination/port/candidate result is terminal and cannot fall through.
2. **Push-in receiver boundary.** Otherwise scan outward from the adjacent
   payload. After at least one payload, the first solid container occurrence
   is the receiver boundary, not another payload, before its own pushable flag
   or port table is considered. The immediately preceding contiguous payload
   is terminal. This classification reserves push-in; the resolver then
   requires exactly one port whose `outerApproach` equals input. A missing,
   wrong-side, ambiguous, blocked-landing, or invalid candidate result is
   terminal and cannot fall through.
3. **Local push.** Only when neither executable boundary above exists, scan the
   maximal contiguous solid pushable chain (including pushable containers) and
   apply the unchanged R1 local-push rules. A nonpushable solid blocks. A
   started local chain hitting OOB is `push-chain-out-of-bounds`; an empty OOB
   target remains N/A.

There is no declared transfer profile, fixture tag, level flag, or stress-case
branch consulted at runtime. A gap is never skipped to discover a remote
receiver: it prevents transfer classification and resolves under ordinary
local-push semantics, proving no teleport. An adjacent container while no
payload has yet been accumulated also remains ordinary R1 push/enter-priority
geometry, not a receiver. Once exact push-out or the solid receiver boundary
reserves a submode, port, occupancy, or candidate failure is terminal under the
one public `push` attempt. If public `push` is disabled, no submode evaluates
and later R1 priority rules may run. Enter/exit keep R1 rules. No renderer,
fixture/profile, world, fixed container, or entity-ID branch selects a rule or
submode.

## D. Push-in

Let actor cell be `A` in active occurrence `S`, input `d`, and scanned source
chain `Q0 ... Qn-1` at `A+d ... A+n*d`, where every Q is the occurrence of one
solid pushable entity and `Qn-1` is farthest. Push-in is reserved only when the
immediately next cell `A+(n+1)*d` contains a solid receiving
`ContainerComponent`. A gap is never skipped to find a receiver. Duplicate raw
occupancy or a nonpushable would-be source member is invalid data or terminal
public-push blocking, never a tie-break or a fallthrough to enter/exit.

The receiving occurrence is at S / `A+(n+1)*d`. Select exactly one port with
`outerApproach===d`; missing/defensive ambiguity are existing `port-absent`/
`port-ambiguous`; invalid table, inner world, inverse direction, or landing is
invalid data. Destination is the port's inner landing in addressed occurrence
`{rootWorldId, containerPath:[...S.containerPath, receiving.id]}`. Landing solid
occupancy blocks with `port-landing-occupied`.

On acceptance, only terminal payload Qn-1 crosses from its source cell to the
inner landing. Qn-2 through Q0 shift one same-world cell in direction d,
executed far-to-near, and actor moves A-to-Q0's former cell. The receiver never
moves. Exactly one payload crosses one boundary; there is no destination-side
chain. Candidate validation precedes the one atomic commit, so occupied
destination, invalid/missing/ambiguous port, graph/focus error, or any blocked
source-chain condition preserves state/hash/focus/history/sequence. A
world-bearing Qn-1 carries its one identity, innerWorldId, visuals, and
components without cloning; only its derived containment edge changes.

## E. Push-out

Push-out requires nonempty focusPath. Let C be the final focused container, S
its inner active occurrence, A actor, input d, and scanned chain Q0 ... Qn-1.
Its terminal/farthest payload Qn-1 must be at the exact inner landing of C's
unique port with `innerExit===d`; actor is therefore behind Q0 and the chain
ends at the landing. At root, or without this exact focused-boundary geometry,
push-out is N/A and invents no parent.

Parent destination is C's resolved anchor plus `opposite(port.outerApproach)`;
it is the R1 inverse exit geometry. It must be in bounds and lack a solid
occupant. R2 has no parent-side push chain: a solid parent destination is
terminal `port-parent-destination-occupied`. Missing/ambiguous ports, malformed
focus, OOB parent destination, and invalid data use their exact existing R1
rejection path.

On acceptance terminal Qn-1 moves from the inner landing to the parent
destination. Qn-2 through Q0 shift one inner-world cell in d, far-to-near, and
actor moves A-to-Q0's former cell while remaining focused in S. Actor occurrence
therefore stays S while terminal payload before/after occurrences differ. There
is exactly one crossing and no parent-side/destination-side chain. World-bearing
Qn-1 retains its canonical inner world/components. The fully validated candidate
commits once or not at all.

R1's load-time landing rule remains unchanged: an initial fixture may not place
any solid, including a future push-out payload, on a port landing. Runtime
validation permits a legal solid landing occupant created by accepted gameplay.
R2 push-out tests and stress cases must reach Qn-1's landing through an earlier
accepted push-in or ordinary push, never by bypassing initial validation.

## F. Containment, aliases, focus, and cycles

Containment/parent edges derive only from positioned container entities and
their innerWorldId; there is no mutable stored parent. Moving a container only
changes derived edges. Aliases remain distinct root-plus-container-path
occurrences even when their innerWorldId is equal; no world-ID-first selection
or delimiter address key is permitted.

Transfers do not update focus because actor remains local. Before commit, the
candidate must reproduce the exact unchanged root/focusPath/active-world actor
occurrence. A valid source payload cannot be a focus ancestor under the
one-position acyclic model. A malformed pre-state is rejected by existing
invalid-data/focus validation; a candidate containment cycle is rejected by
the existing cycle outcome. No transfer-specific focus/ancestor branch exists.

Every load and candidate validates the entire derived graph, unreachable
components included, with `cycleMode:"forbid"`. Self edges and direct/indirect
cycles, including a cycle newly created by transfer, reject atomically.
Self-containing/cyclic/infinite play is expressly deferred to a later contract.

## G. Events, presentation, history, replay, and win

`PushResolvedEvent` remains the sole aggregate push impact/audio event. A local
push is `[push-resolved, actor entity-moved(cause:"push")]`, then optional
`win-changed`. A transfer is exactly `[push-resolved, entity-transferred,
actor entity-moved(cause:"push")]`, then optional win: indices are 0, 1, 2,
3. `push-resolved.moved` contains only same-world Qn-2 ... Q0 shifts and may
be empty for one terminal payload. The terminal cross-world Qn-1 appears only
as `entity-transferred`; no same-world shifter is transferred. The actor is
represented only by the existing actor `entity-moved` event.

`entity-transferred` carries mode, terminal entity before/after occurrence and
cell, exact port, and `carriedSubtree`. It is null for an ordinary payload. For
a world-bearing payload it carries its innerWorldId plus exact before/after
root-plus-path addresses of that carried canonical subtree. This event neither
creates a focus change nor represents actor enter/exit.

The event identity is exact: `entityBefore.entityId===entityAfter.entityId`,
`from.world===entityBefore.world`, and `to.world===entityAfter.world` by
structural address equality. `via` is the classified receiver port for push-in
and the exact final-focus port for push-out. `carriedSubtree` is null if and
only if the terminal payload has no `ContainerComponent`; otherwise it is
required, retains that component's unchanged `innerWorldId`, and uses
`beforeRoot={rootWorldId:entityBefore.world.rootWorldId,
containerPath:[...entityBefore.world.containerPath,entityBefore.entityId]}` and
the analogous `afterRoot` built from `entityAfter.world`. Every projected
descendant inherits that exact prefix replacement; canonical state is not
cloned and render code may not fall back to entity ID.

V1 maps `push-resolved` to the one aggregate impact/audio transaction. It maps
`entity-transferred` only to cross-world payload/aperture motion using the same
controller barrier; the actor push move adds actor motion only and never a
second audio/impact, enter/exit focus zoom, or focus-camera transition. It
consumes supplied addresses/port, not inferred IDs. Its normalized 0-to-1
barrier covers shifted payloads, transferred payload/carried world, actor,
aperture/projection, and any camera target; input stays locked until settled.
Undo consumes already reversed core events; Redo uses forward. Existing
cancel/destroy must retire work without stale completion or early unlock.

Undo reverses all top-level events, uses a new reverse transaction ID, swaps
every before/after occurrence and cell, toggles transfer mode (`push-in` <->
`push-out`), swaps carried-subtree roots while retaining innerWorldId and `via`,
then reverses the actor and same-world motions. Redo restores exact source
forward order/mode. Event indices are contiguous, identities match their
enclosing transaction, and Undo/Redo preserve sourceTransactionId. Stored
history authenticates source rule, hashes, active addresses,
transaction/sequence/initial hash, all event geometry, and transfer data
against before/after snapshots. Replay compares results/rules/hashes/addresses/
events/transaction identity/final win. Sequence is monotonic only for accepted
transactions and excluded from canonical state hashing. Reset is not transfer;
win evaluates committed candidate and emits only on predicate crossing.

## H. Validation and adversarial matrix

| Area | Required later evidence |
| --- | --- |
| Rule order | walk first; all 8 unchanged R1 masks; exact priority/disabled absence; internal push-submode reservation/order; fallback. |
| Normal push | single/multi/blocked/OOB; pushable world-bearing container moves locally; nonpushable blocks. |
| Push-in/out | single and multi-payload chain shifts, terminal cross-world payload, exact addressed port/endpoints/subtree, gap-no-teleport/local fallback, occupied/OOB/absent/ambiguous/wrong-side/root/cycle rejection, unchanged focus, and atomic unchanged state. |
| Addresses/data | depth-two and aliased-world distinct paths; all scalar/component/rule/port checks; unreachable self/2/3 cycles. |
| History | exact forward/Undo/Redo event arrays/source IDs; reset/future clearing/rejections; solve/unsolve and direct/replay equality. |

Representative implementation fixtures must check in literal before,
accepted-after, Undo-after, and Redo-after StateHash constants plus exact event
arrays; this document cannot know those values before code and does not invent
fixtures. Tests may not substitute self-comparison. A multi-payload push-in
forward trace is transaction/attempt rule `push` with `push-resolved` shifts,
one `entity-transferred(push-in)`, actor-push, optional win; Undo is optional
win then actor reverse, reverse transfer(push-out), then reverse aggregate
push. Push-out is the inverse transfer mode but remains public rule `push`.

Transfer stored-history forgery tests sit outside the 1,000-case loop. They
forge and independently authenticate transfer mode; terminal entity identity;
before/after occurrence, cell, world/path; `via` container/port; carriedSubtree
roots/innerWorldId; top-level order/index/direction; transaction/event/source
IDs and future sequence; unchanged focus address or any forged focus-changed
event; and stored state or port geometry even if state hashes are recomputed. A
forged selected Undo/Redo record rejects
`invalid-level-data` with completely unchanged session/hash/focus/past/future/
sequence. Legitimate older source records remain accepted.

R2 is one combined R2-superset stress run, not a retained or second R1 run:
xorshift32 master seed `0x51CEB00C`, anchors case 0 `2116095627`, case 1
`2116365994`, case 999 `1908512370`; exactly 1,000 fixtures and one reused
64-command direct/replay trace per fixture; and 3,000 initial Undo/Redo/Reset
subcases. All 64 slots retain the existing xorshift weighted draw unchanged:
Step-up 16, Step-right 16, Step-down 16, Step-left 16, Undo 12, Redo 12, Reset
12. The generator inserts, removes, reorders, or redraws nothing. It locates the
first generated Step and builds the deterministic case profile around that
direction; the candidate asserts that every one of the frozen 1,000 traces has
such a Step and fails if any does not. `caseIndex & 7` covers all eight
unchanged R1 masks and xorshift orders enabled R1 priority.

The generator derives a deterministic case profile from each trace's first Step
direction and builds legal geometry around it, rather than merely exposing
optional opportunities. Mandatory coverage counters require at least one each
of ordinary and world-bearing push-in success, ordinary and world-bearing
push-out success, occupied destination, missing/wrong port, candidate-cycle
rejection, gap-no-transfer/local-push regression, focus-path unchanged and
resolvable assertions, and all eight R1 masks. Malformed-focus preflight is
covered by targeted invalid-data tests rather than an unreachable valid-
transfer counter. A candidate fails when any required counter is zero.
Each mask has its own counter and all eight counters must be nonzero.
Invalid mutations and their expected diagnostic/witness are selected
deterministically from that profile.

Fixtures have 1-4 worlds, 0-4 local pushables, 0-2 containers/world, genuinely
free cells, and possible aliases—not campaign layouts. After every dispatch the
independent oracle checks attempts/rejections, result hash/address,
transaction/source/sequence, exact aggregate/transfer/actor event
index/direction/geometry/subtree, initial/past/future snapshot immutability,
graph, and win cardinality; direct and replay compare every result/final win.
Reports include seed/case/domain/mutation/diagnostic/witness/fixture/first
index/prefix; total evaluation proves same-class 1-minimal reproduction. No
random/time/artifact writes. Timeout is 240,000 ms/test; changing it requires
measured evidence and contract amendment, never workload/oracle reduction.

## I. R2I ownership and linear integration

This is a d4d9991 compile-consumer inventory and future allowlist proposal, not
source authorization.

| Order | Owner and exact writable paths |
| --- | --- |
| R2I-core | Gameplay: `src/core/types.ts` (additive event), `src/core/movementResolver.ts` (public push dispatch), new `src/core/recursiveTransfers.ts` (chain/classification/candidate mutation), `src/core/ports.ts` (addressed boundary selection), and `src/core/reducer.ts` (transaction/events/stored-record authentication); tests `src/core/core.test.ts`, `src/core/replay.test.ts`, `src/core/ports.test.ts`, `src/core/validation.test.ts`, `src/core/stress.test.ts`, and new `src/core/recursiveTransfers.test.ts`; `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`. Existing validation, world-graph, history, replay, collision, hash, and win production modules are consumed read-only. |
| R2I-frontend, directly atop core | Frontend: `src/animation/transitions.ts`, `src/animation/transitions.test.ts` (aggregate/transfer plan and no duplicate feedback); `src/runtime/GameRuntime.ts`, `src/runtime/GameRuntime.test.ts`, `src/runtime/EventPipeline.test.ts`, `src/runtime/VisualTransactionController.test.ts`, new `src/runtime/r2QaScenario.ts`, new `src/runtime/r2QaScenario.test.ts` (one barrier and bounded QA scenario); `src/render/PixiApp.ts`, `src/render/PixiApp.test.ts`, `src/render/RecursiveTransitionRenderer.ts`, `src/render/RecursiveTransitionRenderer.test.ts` (addressed transfer/aperture sampling); `src/projection/simulationProjection.test.ts`, `src/projection/worldProjection.test.ts` (before/after occurrence-path proof); and `src/app/GameCanvasHost.tsx` (strict dev-only R2 QA intent). |
| R2I-evidence-only, directly atop frontend | Frontend evidence owner: `docs/qa/R2_BROWSER_EVIDENCE.md`, `docs/qa/r2-browser-evidence.json`, the twelve exact PNG paths enumerated below, and `docs/workstreams/frontend-design/THREAD_LOG.md`. It contains no TypeScript/TSX/test or other behavior change. |

Read-only compile/behavior verification, not R2I writable ownership, covers
`src/core/validation.ts`, `src/core/worldGraph.ts`, `src/core/history.ts`,
`src/core/replay.ts`, `src/core/collision.ts`, `src/core/hash.ts`,
`src/core/win.ts`,
`src/projection/types.ts`, `src/projection/worldProjection.ts`,
`src/projection/simulationProjection.ts`, `src/runtime/EventPipeline.ts`,
`src/runtime/VisualTransactionController.ts`, `src/runtime/v1QaScenario.ts`,
`src/animation/AnimationSystem.ts`, `src/animation/AnimationSystem.test.ts`, and
`src/render/Camera2D.ts`. `AnimationSystem` already exposes controller-owned
global `frame.progress`; transfer-specific addressed interpolation samples that
value in the owned transition/Pixi/recursive-renderer paths, so no second clock
or AnimationSystem edit is permitted. The additive event lets R2I-core
typecheck with these unchanged; it is behavior-incomplete and must never be
integrated alone. There is no compatibility adapter.

The coordinator must first name R2I, all three owners, exact finite allowlists,
linear order, and no-partial-integration gate in CURRENT_TASK. Only the complete
three-commit chain runs one clean ci/typecheck/test/build candidate gate and is
reviewed by independent QA as the whole SHA chain. During implementation use
targeted tests; do not run a duplicate exhaustive R1/R2 suite. Independent QA
receives one final clean R2-superset run.

The evidence is captured from the exact R2I-frontend implementation SHA, and
the evidence-only commit changes no behavior. It has exactly these dev-only
1440x900 DPR/resolution-1 files:
`docs/screenshots/r2/push-in-00.png`,
`docs/screenshots/r2/push-in-50.png`,
`docs/screenshots/r2/push-in-100.png`,
`docs/screenshots/r2/undo-push-in-00.png`,
`docs/screenshots/r2/undo-push-in-50.png`,
`docs/screenshots/r2/undo-push-in-100.png`,
`docs/screenshots/r2/push-out-00.png`,
`docs/screenshots/r2/push-out-50.png`,
`docs/screenshots/r2/push-out-100.png`,
`docs/screenshots/r2/undo-push-out-00.png`,
`docs/screenshots/r2/undo-push-out-50.png`, and
`docs/screenshots/r2/undo-push-out-100.png`.
Each Undo scenario dispatches a real Step then a real Undo; Redo is
unit/integration evidence only, not a redundant capture set. The JSON records
structured before/after paths and compares forward100==undo0,
forward50==undo50, and forward0==undo100 within <=0.5 CSS px for camera,
world, aperture, actor, payload, and carried-world geometry. At each midpoint
it proves real parent shell, child rim/floor, aperture stroke, actor/payload and
carried child world where applicable, no stale duplicates, stopped ticker plus
explicit render, one canvas, zero gameplay DOM/problems, and barrier locked
before p=1. General capture automation remains a V4 concern.

## J. Acceptance and stop

Frontend performs read-only compatibility review of this exact SHA, then
independent QA accepts the documentation chain by SHA and the coordinator
integrates/pushes it. Only a later finite CURRENT_TASK R2I authorization may
start source work. This contract authorizes no R2 source, V2-V4, levels,
serialization, solver, showcase, release, or completion claim.
