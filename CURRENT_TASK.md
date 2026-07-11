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

Independent reviewer: QA task
`019f4e80-1462-7b32-8146-19ded692836c`.

Authority: accepted
`docs/workstreams/gameplay-rules-engine/RULES_SLICE_R1_CONTRACT.md`.

Start condition: the complete I1 chain is integrated and independently
accepted.

Owned implementation paths:

- existing `src/core/types.ts`, `commands.ts`, `components.ts`,
  `worldGraph.ts`, `collision.ts`, `movementResolver.ts`,
  `recursiveTransitions.ts`, `reducer.ts`, `history.ts`, and `replay.ts`;
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

Start condition: C1 is integrated and independently accepted.

Owned implementation paths:

- `src/projection/types.ts`, `worldProjection.ts`,
  `simulationProjection.ts` and their tests;
- `src/runtime/EventPipeline.ts`, `GameRuntime.ts`,
  `InteractionPrototype.ts` and their tests;
- `src/animation/AnimationSystem.ts`, `AnimationSystem.test.ts`, `Timeline.ts`,
  `TransitionTimeline.ts`, `transitions.ts`, `transitions.test.ts`, and any
  directly corresponding existing tests;
- `src/render/PixiApp.ts`, `RecursiveTransitionRenderer.ts`, `Camera2D.ts`
  and relevant tests;
- deterministic browser-capture tooling/evidence explicitly approved with the
  V1 candidate;
- frontend workstream log.

Required implementation:

- remove every runtime/render dependency on `container-b` or another fixture
  identity;
- carry stable root-plus-container-path occurrence addresses through
  projection, events, animation lookup, camera targeting, and diagnostics;
- support at least two containers, nested focus, and repeated canonical entity
  occurrences without map-key overwrite;
- replace separate animation/camera readiness with one authoritative visual
  completion barrier;
- keep all visible world frames present during move/enter/exit middle frames;
- enforce one bounded input policy: while a visual transaction is active, the
  first subsequent PublicCommand occupies a one-slot FIFO buffer; every later
  command is rejected locally as `input-buffer-full` without core dispatch;
  the buffered command dispatches exactly once after the combined barrier
  completes;
- apply that same one-slot policy to Step/Undo/Redo/Reset; cancellation cannot
  reorder or double-dispatch, destroy clears the slot without dispatch, and a
  completion callback fires exactly once;
- preserve the accepted C1 semantics without core mutation or reinterpretation.

Explicitly excluded:

- changing C1 port/rule/cycle semantics;
- level schema/content, push-in/out, cyclic gameplay;
- full V2 material overhaul except the minimum needed to make V1 frames
  diagnosable;
- retained-scene-graph/performance work assigned to V3, and mobile/DPR,
  reduced-motion, pointer/touch, accessibility, and checked-in capture
  automation assigned to V4; V1 may not claim those deferred capabilities;
- React gameplay DOM.

V1 acceptance evidence:

- unit/integration tests for occurrence identity, two containers, nested focus,
  one-slot FIFO ordering, Undo/Redo/Reset buffering, cancellation/destroy,
  completion-once behavior, and input spam;
- deterministic desktop captures for move midpoint and enter/exit
  start/midpoint/settle, with capture timestamps defined as normalized visual
  transaction progress rather than wall-clock guesses;
- one canvas, zero gameplay DOM, zero unexpected console problems;
- no missing world frame and no fixed fixture ID in owned runtime/render code;
- independent QA acceptance by candidate SHA.

## 7. Later frontend completion slices

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

## 8. Known baseline defects to eliminate

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

## 9. Repository and handoff rules for this phase

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

## 10. Phase completion definition

The frontend-and-engine framework phase is not complete until I1, C1, V1, V2,
V3, and V4 are independently accepted, integrated, and verified together from
a clean install. At that point:

- core commands are total, deterministic, and stress-tested;
- renderer/runtime use occurrence addresses and no fixed IDs;
- one visual transaction barrier protects recursive motion;
- deterministic middle-frame evidence proves continuous spatial context;
- `docs/logs/CHANGELOG.md` records the integrated implementation;
- both authored composition modes, retained recursive rendering, performance
  evidence, responsive input, accessibility, and deterministic capture are
  accepted without a false stage-completion claim.

Current checkpoint: **D0 and the complete I1 chain are independently accepted
and integrated. After this status update is pushed, C1 is the only active
production slice. V1-V4 remain dependency-gated, and all level/content work is
frozen until the complete frontend-and-engine framework gate passes.**
