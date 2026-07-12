# Current Task: Phase A Recursive Foundation Rebuild

Status: active. User development instruction received on 2026-07-11.

Coordinator task: `019f4deb-7e83-7583-8cd5-8e6f075bc331`.

## 1. Objective

Resume production development toward a complete frontend and recursive game
engine, beginning with repository contracts and then the smallest dependency-
ordered stability slices.

This phase does not claim to complete the whole game in one change. It creates
a trustworthy engine-to-render path on which later visual depth, gameplay
depth, input, levels, audio, and shell UI can be completed without rebuilding
the foundation again.

Overall target completion remains below 10% at phase start. Historical `Stage
6` terminology is not used for current progress.

## 2. Active sequence and gates

```text
D0 repository contracts
        |
        v
I1 shared public-interface bridge
        |
        v
QA-I1 independent acceptance
        |
        v
C1 deterministic core safety and R1 execution
        |
        v
QA-C1 independent acceptance
        |
        v
V1 occurrence-address projection + unified visual completion barrier
        |
        v
QA-V1 independent acceptance with deterministic middle frames
        |
        v
R2D acyclic recursive-transfer contract freeze (documentation only)
        |
        v
QA-R2D independent acceptance
        |
        v
R2I-core deterministic recursive transfers
        |
        v
R2I-frontend addressed transfer presentation
        |
        v
R2I-evidence deterministic forward/Undo frames
        |
        v
QA-R2I whole-chain independent acceptance
        |
        v
V2 composition/material frontend rebuild
        |
        v
V3 retained recursive render graph and performance
        |
        v
V4 responsive input/accessibility/capture automation
```

I1 is a two-owner, linear candidate chain that migrates consumers to the frozen
public command/result/event interface before C1 replaces legacy rule behavior.
Gameplay produces the core bridge commit first; frontend starts from that exact
SHA and produces the consumer commit second. QA reviews the complete two-commit
chain. Neither half is integrated alone.

C1 and V1 are not parallel source-editing slices. After accepted I1, C1
implements the frozen semantics without breaking unchanged consumers. V1 then
adds occurrence-addressed rendering and visual completion ownership after
QA-C1. Frontend design/test planning may proceed during C1, but V1 production
edits begin only after QA-C1.

V1 and R2D are now independently accepted and integrated. After this exact
authorization is pushed, R2I-core is the sole active implementation slice for
original acyclic push-in/push-out and world-bearing-container transfers. The
frontend and evidence commits start only from their exact coordinator-reviewed
parent candidate, and independent QA reviews the complete chain before any
part is integrated. V2-V4 and all content remain frozen during R2I.

## 3. D0 — repository contracts (completed)

Owner: coordinator.

Allowed paths:

- `AGENTS.md`
- `DESIGN.md`
- `CURRENT_TASK.md`
- `docs/reboot/CURRENT_STATUS.md`
- `docs/workstreams/coordinator/THREAD_LOG.md`

Required result:

- repository-wide work, architecture, QA, Git, encoding, clean-room, and
  ownership rules are explicit;
- product/visual/frontend/accessibility/performance direction is executable;
- I1, C1, and V1 ownership and dependency order avoid a cross-layer compile
  migration deadlock and match the accepted R1 contract;
- current status no longer treats historical Stage 6 as active authority;
- gameplay, frontend, and QA workstreams independently review the D0 candidate;
- only documentation changes; no production source changes in D0.

D0 acceptance gate:

- exact-path and whitespace checks pass;
- independent QA reports no contradictory authority or unverifiable gate;
- coordinator integrates/pushes the accepted docs before production begins.

## 4. I1 — shared public-interface bridge

Status: independently accepted and integrated. Final accepted chain:
`0b7ebc3 -> a4633c2 -> ef27c9c`, with QA verdict integrated from source
`9579446`.

Named owners:

- gameplay/core half: task `019f4e82-7cb8-73c1-b4a1-d333273b359f`;
- frontend consumer half: task `019f4e80-145a-7520-81e1-41a45b2bec13`;
- independent chain reviewer: task
  `019f4e80-1462-7b32-8146-19ded692836c`.

Linear handoff rule:

1. Gameplay creates the core bridge commit on the accepted D0 base and stops.
2. Coordinator performs scope review and authorizes the frontend task to start
   from that exact candidate SHA without merge/rebase.
3. Frontend creates the consumer migration commit directly on that candidate
   history and stops.
4. QA reviews both commits as one indivisible I1 candidate. The coordinator
   integrates neither commit unless the full chain is accepted.

Gameplay/core-half owned paths:

- `src/core/types.ts`, `commands.ts`, `reducer.ts`, `history.ts`, `replay.ts`,
  and `systems.ts`;
- new `src/core/legacyRuntimeAdapter.ts`;
- `src/core/core.test.ts`, `replay.test.ts`;
- new `src/core/legacyRuntimeAdapter.test.ts`;
- gameplay workstream log.

Frontend/consumer-half owned paths:

- `src/runtime/EventPipeline.ts`, `GameRuntime.ts`,
  `InteractionPrototype.ts` and their existing tests;
- `src/animation/transitions.ts`, `transitions.test.ts`;
- frontend workstream log.

Frozen bridge policy:

- The runtime-facing command surface is exactly `PublicCommand` with
  `Step(direction)`, `Undo`, `Redo`, and `Reset`. Runtime/animation code may no
  longer import or construct legacy `Move`, `Enter`, `Exit`, or
  `SimulationCommand` after the frontend half.
- The runtime-facing dispatch envelope carries the frozen `CommandResult` and
  `SemanticEvent` values plus the next internal session. Consumer code does not
  inspect legacy `CommandDispatchResult` or `TransitionEvent`.
- The bridge is compatibility plumbing, not the R1 rules implementation. It may
  translate `Step(direction)` to the existing movement resolver atomically,
  then translate the legacy result into frozen public shapes. It must not pick a
  container, port, or recursive destination and must contain no fixture ID.
- Explicit legacy `Enter(containerId)` and `Exit(containerId)` are never
  produced by runtime and are not mapped to `Step`; a directionless command
  cannot select an R1 port deterministically.
- Any behavior the legacy kernel cannot express through `Step` returns a typed,
  unchanged-state public rejection. I1 makes no recursive-correctness claim.
- Deprecated legacy command/result/event symbols may remain temporarily in the
  gameplay-owned bridge paths to keep the first half and unchanged consumers
  compilable; adapter behavior is centralized in
  `legacyRuntimeAdapter.ts`. No runtime or animation import may reference a
  legacy symbol after the second half.
- C1 owns replacing and deleting the compatibility adapter after it implements
  the actual frozen resolver. No legacy export survives Phase A.

I1 acceptance evidence:

- the two commits touch only their respective exact paths and have no overlap;
- full-repository typecheck, all Vitest suites, build, boundary searches, and
  diff checks pass on the combined candidate;
- tests prove runtime emits only PublicCommand and directionless legacy
  Enter/Exit cannot be silently mapped;
- tests prove public accepted/rejected envelopes are total and consumer code
  receives SemanticEvent values without fixture IDs;
- source searches show no legacy command/result/event imports in
  `src/runtime/**` or `src/animation/**`;
- independent QA accepts the exact two-commit chain before C1 starts.

Explicitly excluded:

- port/rule/cycle implementation, stress suite, push-in/out, or recursive
  correctness claims;
- projection occurrence identity, camera/aperture locking, visual redesign,
  browser evidence, levels, or serialization;
- changes to projection, render, React, package, config, or root changelog.

## 5. C1 — deterministic core safety and contract execution

Owner: gameplay rules/engine task
`019f4e82-7cb8-73c1-b4a1-d333273b359f`.

Status: independently accepted and integrated. The accepted implementation is
`63750f9d1e9bf53b90074d9c341e8c5eec6f5f7a`; the independent QA decision is
`8cdf0f3f2628498fb6fcfc6eee89f996e2e0e15a`. The coordinator reproduced a
clean install, typecheck, 12 Vitest files / 70 tests, and production build on
the integrated `main` history. This closes C1 only; it does not authorize R2,
levels, frontend completion, or release.

Independent reviewer: QA task
`019f4e80-1462-7b32-8146-19ded692836c`.

Authority: accepted
`docs/workstreams/gameplay-rules-engine/RULES_SLICE_R1_CONTRACT.md`.

Start condition: the complete I1 chain is integrated and independently
accepted.

Owned implementation paths:

- existing `src/core/types.ts`, `commands.ts`, `components.ts`,
  `worldGraph.ts`, `collision.ts`, `grid.ts`, `movement.ts`,
  `movementResolver.ts`, `recursiveMovement.ts`,
  `recursiveTransitions.ts`, `reducer.ts`, `history.ts`, `replay.ts`,
  `systems.ts`, `win.ts`, and `hash.ts`;
- `src/core/legacyRuntimeAdapter.ts` and its test for required deletion once
  frozen semantics replace the bridge;
- new `src/core/ports.ts` and `src/core/validation.ts`;
- `src/core/core.test.ts`, `src/core/replay.test.ts`;
- new `src/core/ports.test.ts`, `src/core/validation.test.ts`, and
  `src/core/stress.test.ts`;
- gameplay workstream log.

Required implementation:

- implement the frozen Step/Undo/Redo/Reset semantics behind the already
  migrated I1 public interface; no second public-type migration is allowed;
- replace and remove the temporary legacy adapter/exports while preserving the
  I1 consumer contract;
- remove or migrate legacy wrapper/system exports in `movement.ts`,
  `recursiveMovement.ts`, and `systems.ts`; no `Move`/`Enter`/`Exit`, legacy
  command/result/event, or adapter symbol may survive the C1 candidate tree;
- complete typed total attempt/result/rejection/transaction/event values;
- replace throwing/unsafe entrance behavior with preflighted atomic resolution;
- implement exact port mapping, full rule enablement/priority validation, and
  deterministic Step fallback;
- enforce full-graph `cycleMode: "forbid"`, including unreachable components;
- keep rejected state/hash/history/focus unchanged;
- make replay, reset, undo, and redo reproduce the contracted traces;
- implement the fixed xorshift32 1,000-sequence stress suite and failure report.

Explicitly excluded:

- `src/projection/**`, `src/runtime/**`, `src/animation/**`, `src/render/**`;
- React/UI, browser tests, level schema/content, serialization;
- push-in/push-out and cyclic gameplay;
- visual redesign or fixed-ID runtime workarounds.

C1 acceptance evidence:

- typecheck, all Vitest suites, build, boundary search, and diff checks;
- test branch matrix for every port/validation/rejection/history path;
- deterministic 1,000-sequence report with seed and zero uncaught failures;
- exact before/after hashes and event traces for representative commands;
- independent QA acceptance by candidate SHA.

## 6. V1 — occurrence addressing and visual completion ownership

Owner: frontend/visual/runtime task
`019f4e80-145a-7520-81e1-41a45b2bec13`.

Independent reviewer: QA task
`019f4e80-1462-7b32-8146-19ded692836c`.

Status: completed, independently accepted, and integrated. The authorization
chain is `f2c47c3 -> c604d53 -> 272e138`; the accepted implementation/evidence/
QA chain is `cef6ab2 -> 5bb6a73 -> 4df4528`.

Start condition: satisfied from coordinator-pushed baseline `e45d2ea`. The
frontend owner used that exact baseline in its isolated worktree, and no other
production workstream overlapped the V1-owned paths.

Owned implementation paths:

- `src/app/GameCanvasHost.tsx`;
- `src/projection/types.ts`, `src/projection/worldProjection.ts`, new
  `src/projection/worldProjection.test.ts`,
  `src/projection/simulationProjection.ts`, and
  `src/projection/simulationProjection.test.ts`;
- `src/runtime/EventPipeline.ts`, `src/runtime/EventPipeline.test.ts`,
  `src/runtime/GameRuntime.ts`, new `src/runtime/GameRuntime.test.ts`,
  `src/runtime/InteractionPrototype.ts`,
  `src/runtime/InteractionPrototype.test.ts`, new
  `src/runtime/VisualTransactionController.ts`, new
  `src/runtime/VisualTransactionController.test.ts`, new
  `src/runtime/v1QaScenario.ts`, and new
  `src/runtime/v1QaScenario.test.ts`;
- `src/animation/AnimationSystem.ts`,
  `src/animation/AnimationSystem.test.ts`, `src/animation/Timeline.ts`,
  `src/animation/TransitionTimeline.ts`, `src/animation/transitions.ts`, and
  `src/animation/transitions.test.ts`;
- `src/render/PixiApp.ts`, new `src/render/PixiApp.test.ts`,
  `src/render/RecursiveTransitionRenderer.ts`, new
  `src/render/RecursiveTransitionRenderer.test.ts`, `src/render/Camera2D.ts`,
  and `src/render/Camera2D.test.ts`;
- exactly the V1 QA evidence paths listed below;
- frontend workstream log.

No other source, test, package, config, root-contract, core, audio, layer,
primitive, metric, level, serialization, or general browser-automation path is
owned by V1. If one becomes necessary, the frontend owner stops for a bounded
scope amendment before editing it.

Required implementation:

- remove every runtime/render dependency on `container-b` or another fixture
  identity;
- reuse C1's public `WorldAddress` and `EntityOccurrenceAddress` rather than a
  parallel projection-only address shape;
- carry the complete root-plus-`containerPath` occurrence through every world
  and entity projection, event, animation lookup, facing/progress map, camera
  target, render geometry, and diagnostic;
- use a collision-safe structural occurrence key/comparator. Canonical entity
  ID and ambiguous delimiter-joined strings are forbidden as keys;
- derive `projectionId` from the complete occurrence without collisions and
  test IDs containing delimiter-like text;
- support at least two containers, nested focus, and repeated canonical entity
  occurrences without map-key overwrite;
- remove production fallback selection of the historical recursive projection;
  only the named V1 QA scenario may select synthetic state, and only at
  application composition;
- make new `VisualTransactionController` the only owner of normalized
  transaction progress, entity/projection/camera/aperture/effect progress,
  completion, buffering, cancellation, and destruction;
- normalized progress is always `0 -> 1`, where `0` is the visual state before
  the command and `1` is its canonical result state, including Undo/Redo.
  Core-supplied reverse endpoints/events are never reversed a second time;
- `AnimationSystem`, `Camera2D`, and `RecursiveTransitionRenderer` consume the
  controller's progress and cannot own independent readiness clocks;
- keep all visible world frames present during move/enter/exit middle frames;
- enforce one bounded input policy: while a visual transaction is active, the
  first subsequent PublicCommand occupies a one-slot FIFO buffer; every later
  command is rejected locally as `input-buffer-full` without core dispatch;
  the buffered command dispatches exactly once after the combined barrier
  completes;
- apply that same one-slot policy to Step/Undo/Redo/Reset; cancellation cannot
  reorder or double-dispatch, destroy clears the slot without dispatch, and a
  completion callback fires exactly once;
- natural completion commits the exact final frame, fires completion once,
  then dispatches the buffered command once;
- non-destroy cancellation settles to the canonical destination, completes
  once, then drains the buffer once; destroy aborts, clears the slot, emits no
  dispatch/completion callback, and can never drain later;
- a zero-duration or no-presentation result commits and completes
  synchronously exactly once;
- accepted and rejected Step/Undo/Redo/Reset results that produce presentation
  feedback use the same controller and one-slot policy;
- preserve the accepted C1 semantics without core mutation or reinterpretation.

Deterministic V1 QA state surface:

- authorize only these dev-mode query forms:
  - `?qa=v1&case=move&progress=0.5`;
  - `?qa=v1&case=enter&progress=<value>`, where `<value>` is exactly `0`,
    `0.5`, or `1`;
  - `?qa=v1&case=exit&progress=<value>`, where `<value>` is exactly `0`,
    `0.5`, or `1`;
- invalid query values fail closed;
- QA mode disables wall-clock/ticker advancement and sets the controller to
  the exact normalized progress;
- inline synthetic states live only in `src/runtime/v1QaScenario.ts`; they are
  not levels, serialization, campaign content, or special production rules;
- each scenario dispatches real C1 `PublicCommand` values through
  `EventPipeline`; it never fabricates `CommandResult` or `SemanticEvent`;
- QA branching may choose a scenario only in `GameCanvasHost` application
  composition. Runtime, projection, animation, camera, and renderer remain
  fixture-agnostic;
- exit progress is `0 = settled child`, `0.5 = continuous midpoint`, and
  `1 = settled parent`.

Exact V1 evidence paths:

- `docs/qa/V1_BROWSER_EVIDENCE.md`;
- `docs/qa/v1-browser-evidence.json`;
- `docs/screenshots/v1/move-50.png`;
- `docs/screenshots/v1/enter-00.png`;
- `docs/screenshots/v1/enter-50.png`;
- `docs/screenshots/v1/enter-100.png`;
- `docs/screenshots/v1/exit-00.png`;
- `docs/screenshots/v1/exit-50.png`;
- `docs/screenshots/v1/exit-100.png`.

Every V1 capture uses desktop `1440x900`, reported/effective DPR `1`, and
records candidate SHA, browser/OS, exact query/command trace, normalized
progress, screenshot/CSS/backing dimensions, canvas count, gameplay-DOM count,
console problems, visible occurrence addresses, and geometry/world-frame
continuity metrics. These checked-in records are deterministic V1 evidence,
not the general capture-automation system assigned to V4.

Explicitly excluded:

- changing C1 port/rule/cycle semantics;
- level schema/content, push-in/out, cyclic gameplay;
- full V2 material overhaul except the minimum needed to make V1 frames
  diagnosable;
- retained-scene-graph/performance work assigned to V3, and mobile/DPR,
  reduced-motion, pointer/touch, accessibility, and checked-in capture
  automation assigned to V4; the V1 QA state-control surface is not general
  capture automation, and V1 may not claim any deferred capability;
- React gameplay DOM.

V1 acceptance evidence:

- unit/integration tests for occurrence identity, two containers, nested focus,
  one-slot FIFO ordering, Undo/Redo/Reset buffering, cancellation/destroy,
  completion-once behavior, and input spam;
- deterministic desktop captures for move midpoint and enter/exit
  start/midpoint/settle, with capture timestamps defined as normalized visual
  transaction progress rather than wall-clock guesses;
- exact evidence files, metadata, occurrence lists, frame geometry, and
  continuity measurements defined above;
- one canvas, zero gameplay DOM, zero unexpected console problems;
- no missing world frame and no fixed fixture ID in owned runtime/render code;
- independent QA acceptance by candidate SHA.

## 7. R2D — acyclic recursive-transfer contract freeze

Owner: gameplay rules/engine task
`019f4e82-7cb8-73c1-b4a1-d333273b359f`.

Frontend compatibility reviewer: frontend/visual/runtime task
`019f4e80-145a-7520-81e1-41a45b2bec13`.

Independent reviewer: QA task
`019f4e80-1462-7b32-8146-19ded692836c`.

Status: accepted and integrated. The exact accepted documentation chain is
`d4d9991 -> 59b1ae6 -> f1466fe -> c180c2b`. R2D remains documentation only;
its acceptance does not itself authorize source, package, serialization,
level, or content edits.

Owned paths:

- new `docs/workstreams/gameplay-rules-engine/RULES_SLICE_R2_CONTRACT.md`;
- `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`.

Required contract result:

- preserve the accepted `PublicCommand`, occurrence-address, transaction,
  rejection, history, and deterministic-dispatch foundation unless an exact
  shared public-type migration is explicitly named;
- define original acyclic `push-in` and `push-out` as atomic canonical-state
  transfers through a resolved `PortOccurrenceAddress`, never as renderer
  effects or fixture-specific branches;
- freeze applicability, rule priority/enablement, source and destination
  addresses, landing/outer-anchor geometry, occupancy and push-chain policy,
  actor position, focus-path behavior, and unchanged-state rejection shapes;
- define how a moved world-bearing container carries its `innerWorldId` while
  containment/parent queries are derived from canonical positions and preserve
  multiple addressed aliases rather than storing one mutable parent;
- freeze semantic events, visual handoff, win crossings, Undo/Redo/Reset,
  replay authentication, hashing, validation, and deterministic stress oracles
  for every accepted and rejected transfer branch;
- keep `cycleMode: "forbid"` across the complete graph. Self-containment,
  cyclic play, infinite traversal, level schema/content, solver work, and
  copied official layouts/assets remain excluded;
- name the exact non-overlapping core and frontend consumer paths, owners,
  linear commit order, migration/removal policy, and whole-chain QA gate needed
  for implementation. No partial integration or compile-dead intermediate
  state is allowed.

R2D acceptance evidence:

- gameplay contract: `59b1ae64b2b5344e45b58a456b82ce7b7979e086`;
- frontend compatibility acceptance:
  `f1466fedbc9676355ee725ea6579cbdebcb20ce1`;
- independent QA acceptance:
  `c180c2b997286653b9d9d0ff478b91cf18933f99`;
- exact linear ancestry, three-path scope, and diff/show checks passed;
- superseded `59b2db05` has no verdict or authority.

## 8. R2I — acyclic recursive-transfer implementation

Status: authorized as the sole active implementation slice only after the
coordinator commits and pushes this exact authorization. The implementation
baseline is the pushed `origin/main` SHA supplied to both owners by the
coordinator. No worker may infer a different base.

Owners:

- core: gameplay rules/engine task
  `019f4e82-7cb8-73c1-b4a1-d333273b359f`;
- frontend implementation and evidence: frontend task
  `019f4e80-145a-7520-81e1-41a45b2bec13`;
- whole-chain reviewer: independent QA task
  `019f4e80-1462-7b32-8146-19ded692836c`;
- integration/push: coordinator
  `019f4deb-7e83-7583-8cd5-8e6f075bc331`.

### Frozen public crossing

The only shared public-type migration is the additive
`EntityTransferredEvent` member of `SemanticEvent`. `PublicCommand`,
`CommandResult`, rejection, attempt, transaction, address, state, rule, and
hash shapes remain R1. The event and every consumer must use complete
root-plus-container-path occurrence addresses; entity-ID fallback and
delimiter-built identity are forbidden.

Any transfer-specific `AnimationPlan` field must remain optional and backward
compatible because `src/animation/AnimationSystem.test.ts` constructs a plan
literal and is read-only in R2I. If implementation proves that a required plan
field is unavoidable, stop: a fresh coordinator authorization must add that
test path before editing. `AnimationSystem` remains a read-only sampler of the
one controller-owned global progress source and may not gain a second clock.

### Indivisible linear commit chain

R2I is one shared migration exception under `AGENTS.md`. All three commits are
required, must have the exact parent order below, and may not be integrated or
pushed separately.

1. **R2I-core**, directly atop the pushed authorization baseline. Exact
   gameplay writable paths:
   - `src/core/types.ts`;
   - `src/core/movementResolver.ts`;
   - new `src/core/recursiveTransfers.ts`;
   - `src/core/ports.ts`;
   - `src/core/reducer.ts`;
   - `src/core/core.test.ts`;
   - `src/core/replay.test.ts`;
   - `src/core/ports.test.ts`;
   - `src/core/validation.test.ts`;
   - `src/core/stress.test.ts`;
   - new `src/core/recursiveTransfers.test.ts`;
   - `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`.
2. **R2I-frontend**, directly atop the exact core candidate after coordinator
   scope review. Exact frontend writable paths:
   - `src/animation/transitions.ts`;
   - `src/animation/transitions.test.ts`;
   - `src/runtime/GameRuntime.ts`;
   - `src/runtime/GameRuntime.test.ts`;
   - `src/runtime/EventPipeline.test.ts`;
   - `src/runtime/VisualTransactionController.test.ts`;
   - new `src/runtime/r2QaScenario.ts`;
   - new `src/runtime/r2QaScenario.test.ts`;
   - `src/render/PixiApp.ts`;
   - `src/render/PixiApp.test.ts`;
   - `src/render/RecursiveTransitionRenderer.ts`;
   - `src/render/RecursiveTransitionRenderer.test.ts`;
   - `src/projection/simulationProjection.test.ts`;
   - `src/projection/worldProjection.test.ts`;
   - `src/app/GameCanvasHost.tsx`.
3. **R2I-evidence**, directly atop the exact frontend candidate and captured
   from that frontend SHA. Exact writable paths:
   - `docs/qa/R2_BROWSER_EVIDENCE.md`;
   - `docs/qa/r2-browser-evidence.json`;
   - `docs/screenshots/r2/push-in-00.png`;
   - `docs/screenshots/r2/push-in-50.png`;
   - `docs/screenshots/r2/push-in-100.png`;
   - `docs/screenshots/r2/undo-push-in-00.png`;
   - `docs/screenshots/r2/undo-push-in-50.png`;
   - `docs/screenshots/r2/undo-push-in-100.png`;
   - `docs/screenshots/r2/push-out-00.png`;
   - `docs/screenshots/r2/push-out-50.png`;
   - `docs/screenshots/r2/push-out-100.png`;
   - `docs/screenshots/r2/undo-push-out-00.png`;
   - `docs/screenshots/r2/undo-push-out-50.png`;
   - `docs/screenshots/r2/undo-push-out-100.png`;
   - `docs/workstreams/frontend-design/THREAD_LOG.md`.

Read-only verification consumers are exactly those named in section I of the
accepted R2 contract. They are not writable ownership. In particular,
`src/core/validation.ts`, `worldGraph.ts`, `history.ts`, `replay.ts`,
`collision.ts`, `hash.ts`, `win.ts`, production projection modules,
`EventPipeline.ts`, `VisualTransactionController.ts`, `v1QaScenario.ts`,
`AnimationSystem.ts` and its test, and `Camera2D.ts` remain unchanged.

### Core result and guards

- implement push-out -> push-in receiver -> local-push classification in the
  exact accepted order; a reserved transfer failure never falls through;
- move exactly one terminal payload across one addressed port, shift only the
  specified same-world chain, and preserve actor focus;
- keep world-bearing payload identity/components and emit addressed subtree
  root rebasing without cloning canonical state;
- validate port geometry, occupancy, aliases, focus, and the complete derived
  graph with `cycleMode:"forbid"` before one atomic commit;
- explicitly reverse transfer mode, occurrences, cells, endpoints, and carried
  roots in `reducer.ts`; a generic event reversal is insufficient;
- authenticate stored transfer events/history and retain deterministic replay,
  hashes, win crossings, sequence, and unchanged-state rejection behavior;
- create no fixture/profile/fixed-ID rule branch and no push-in/out public rule.

### Frontend result and guards

- `push-resolved` remains the sole aggregate push impact/audio source;
- `entity-transferred` drives only addressed payload, carried-subtree,
  aperture/projection, and any required camera sampling; actor push motion is
  singular and Undo is never reversed a second time;
- the existing `VisualTransactionController` remains the sole progress,
  completion, one-slot buffer, cancel, and destroy owner; input unlocks only at
  the complete p=1 transaction;
- forward and Undo frames preserve parent/child/aperture context and update
  every aliased occurrence by structural path with no stale duplicate;
- QA scenario selection remains strict dev-only application composition, not
  a level, schema, production fixture selector, or general V4 automation.

### Verification and handoff

- during core/frontend implementation, run only focused tests needed for the
  edited behavior plus typecheck; do not repeatedly run the 1,000-case suite;
- the complete three-commit candidate runs one clean
  `npm.cmd ci --no-audit --no-fund`, typecheck, full test, and build gate. The
  full test contains one combined 1,000-fixture x 64-command R2-superset run
  plus the frozen 3,000 non-Step subcases, never a second exhaustive R1 suite;
- browser evidence uses exact 1440x900 DPR/resolution 1 normalized progress
  0/0.5/1 forward and Undo captures, structural addresses, <=0.5 CSS-pixel
  continuity, one canvas, zero gameplay DOM/problems, explicit render, and
  barrier locked before p=1;
- independent QA reviews the complete core -> frontend -> evidence SHA chain,
  reproduces the contracted clean gates once, and accepts by SHA before the
  coordinator integrates or pushes any R2I commit;
- each owner commits only its exact paths, reports its SHA, and stops. Workers
  never merge, rebase, push, edit root CHANGELOG, or start the next slice.

Explicitly excluded: V2-V4, package/config changes, audio implementation,
levels, schema, serialization, solver, campaign/showcase content, cycles,
self-containment, copied official material, release, Stage 6, and completion.

## 9. Later frontend completion slices

The user has authorized this frontend-and-engine framework sequence as the
current development objective. Each slice remains gated by its declared start
condition, exact-path coordinator authorization, and independent QA; this
authorization does not permit overlapping implementation.

### V2 — composition and material system

- implement detached-void and cropped-parent-context composition;
- expand authored palette tokens and sharp slab material grammar;
- rebuild player/box/goal/container/wall primitives against shared metrics;
- provide reference-mode visual comparison without committing official assets.

### V3 — retained recursive scene graph

- retain/diff static world geometry instead of clearing layers per frame;
- implement instance-aware aperture rendering and fixed detail degradation;
- measure object counts, p50/p95 frame time, recursion depth, and 30-cycle heap.

### V4 — complete frontend interaction surface

- add deterministic capture scripts, verified desktop/mobile viewports, DPR cap,
  safe-area behavior, reduced motion, pointer/touch, canvas focus, and
  accessibility checks;
- implement the original minimal boot/menu/pause/settings/completion shell
  defined by `DESIGN.md` without DOM gameplay.

Each later slice requires a fresh coordinator path authorization and
independent QA review.

### Level and content freeze

Level design, serialization, authored test fixtures, solver work, and campaign
content remain frozen until C1, V1, V2, V3, and V4 are all independently
accepted, integrated, and verified together. Documentation research must not
be turned into level layouts before that gate. This prevents an incorrect rule
engine or incomplete renderer from becoming the de facto level contract.

## 10. Known baseline defects to eliminate

Current source evidence at phase start:

- invalid or occupied recursive entry can reach an assertion/throw path;
- `src/runtime/GameRuntime.ts` and `InteractionPrototype.ts` dispatch against
  hard-coded `container-b`;
- `src/render/PixiApp.ts` contains depth-zero/`container-b` geometry logic;
- entity interpolation maps by canonical entity ID, so recursive occurrences
  can overwrite one another;
- entity event plans end around 500-560 ms while the recursive camera timeline
  runs 980 ms, allowing early command unlock;
- render layers are removed and recreated during animated draws;
- input is global-keyboard-only and renderer resolution uses uncapped device
  pixel ratio;
- no checked-in repeatable desktop/mobile/middle-frame browser workflow exists.

No later slice may hide these defects with a special fixture, longer arbitrary
timeout, copied scene, or visual effect.

## 11. Repository and handoff rules for this phase

- Workstreams use `gpt-5.6-terra`, `xhigh` reasoning effort, standard speed.
- Every candidate report uses task ID and candidate SHA as its identity.
- No overlapping production files may be edited by active workstreams.
- Workers do not merge/rebase/push or edit `docs/logs/CHANGELOG.md`.
- Independent QA reviews the exact candidate SHA before coordinator
  integration.
- The coordinator updates this file and the root changelog only after accepted
  implementation milestones.
- `.codex/`, `.serena/`, `node_modules/`, `dist/`, browser state, and unrelated
  local logs remain untracked/unstaged.
- `git add .` is forbidden.

## 12. Phase completion definition

The frontend-and-engine framework phase is not complete until I1, C1, V1, the
R2 implementation defined by an accepted R2D contract, V2, V3, and V4 are
independently accepted, integrated, and verified together from a clean install.
At that point:

- core commands are total, deterministic, and stress-tested;
- original acyclic push-in/push-out and world-bearing-container transfers are
  deterministic, atomic, replayable, and still reject all cycles;
- renderer/runtime use occurrence addresses and no fixed IDs;
- one visual transaction barrier protects recursive motion;
- deterministic middle-frame evidence proves continuous spatial context;
- `docs/logs/CHANGELOG.md` records the integrated implementation;
- both authored composition modes, retained recursive rendering, performance
  evidence, responsive input, accessibility, and deterministic capture are
  accepted without a false stage-completion claim.

Current checkpoint: **D0, I1, C1, V1, and R2D are independently accepted and
integrated. After this authorization commit is pushed, R2I-core is the sole
active implementation slice. R2I-frontend and evidence remain sequentially
closed until their exact parent candidate is coordinator-reviewed. V2-V4 and
all level/content work remain frozen until their declared gates pass.**
