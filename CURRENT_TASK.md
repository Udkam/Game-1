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

C1 and V1 are not parallel source-editing slices. V1 consumes the accepted C1
public result/event/address contract. Frontend design review and test planning
may proceed during C1, but V1 production edits begin only after QA-C1.

## 3. D0 — repository contracts (active now)

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
- C1 and V1 ownership and dependency order match the accepted R1 contract;
- current status no longer treats historical Stage 6 as active authority;
- gameplay, frontend, and QA workstreams independently review the D0 candidate;
- only documentation changes; no production source changes in D0.

D0 acceptance gate:

- exact-path and whitespace checks pass;
- independent QA reports no contradictory authority or unverifiable gate;
- coordinator integrates/pushes the accepted docs before production begins.

## 4. C1 — deterministic core safety and contract execution

Owner: gameplay rules/engine task
`019f4e82-7cb8-73c1-b4a1-d333273b359f`.

Independent reviewer: QA task
`019f4e80-1462-7b32-8146-19ded692836c`.

Authority: accepted
`docs/workstreams/gameplay-rules-engine/RULES_SLICE_R1_CONTRACT.md`.

Owned implementation paths:

- existing `src/core/types.ts`, `commands.ts`, `components.ts`,
  `worldGraph.ts`, `collision.ts`, `movementResolver.ts`,
  `recursiveTransitions.ts`, `reducer.ts`, `history.ts`, and `replay.ts`;
- new `src/core/ports.ts` and `src/core/validation.ts`;
- `src/core/core.test.ts`, `src/core/replay.test.ts`;
- new `src/core/ports.test.ts`, `src/core/validation.test.ts`, and
  `src/core/stress.test.ts`;
- gameplay workstream log.

Required implementation:

- migrate public commands to the frozen Step/Undo/Redo/Reset contract;
- implement typed total attempt/result/rejection/transaction/event values;
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

## 5. V1 — occurrence addressing and visual completion ownership

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
- `src/animation/transitions.ts` and relevant tests;
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
- make repeated input queue/reject deterministically until the full transaction
  is commit-safe;
- preserve the accepted C1 semantics without core mutation or reinterpretation.

Explicitly excluded:

- changing C1 port/rule/cycle semantics;
- level schema/content, push-in/out, cyclic gameplay;
- full V2 material overhaul except the minimum needed to make V1 frames
  diagnosable;
- React gameplay DOM.

V1 acceptance evidence:

- unit/integration tests for occurrence identity, two containers, nested focus,
  unified lock, reversal/cancellation, and input spam;
- deterministic desktop captures for move midpoint and enter/exit
  start/midpoint/settle;
- one canvas, zero gameplay DOM, zero unexpected console problems;
- no missing world frame and no fixed fixture ID in owned runtime/render code;
- independent QA acceptance by candidate SHA.

## 6. Later frontend completion slices

These are planned, not yet authorized for production edits.

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

## 7. Known baseline defects to eliminate

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

## 8. Repository and handoff rules for this phase

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

## 9. Phase completion definition

Phase A is not complete until C1 and V1 are independently accepted, integrated,
and verified together from a clean install. At that point:

- core commands are total, deterministic, and stress-tested;
- renderer/runtime use occurrence addresses and no fixed IDs;
- one visual transaction barrier protects recursive motion;
- deterministic middle-frame evidence proves continuous spatial context;
- `docs/logs/CHANGELOG.md` records the integrated implementation;
- remaining V2-V4 and gameplay-depth work is explicitly listed without a false
  stage-completion claim.

Current checkpoint: **D0 documentation candidate in preparation. No production
source edits have started.**
