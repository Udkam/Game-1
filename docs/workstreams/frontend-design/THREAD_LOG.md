# Frontend and Visual Fidelity Workstream Log

## Workstream Identity

- Thread ID: `019f4e80-145a-7520-81e1-41a45b2bec13`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Coordinator deep link: `codex://threads/019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Scope: frontend and visual fidelity; audit/design only in this first phase.
- Base commit: `3b23df3be86df568d5aa6a0bef7e1652ff502ef0`
- Started: `2026-07-11 08:00:00 +08:00`
- Proposal completed: `2026-07-11 08:18:28 +08:00`
- Coordination update consumed: `2026-07-11 08:20:54 +08:00`

## 2026-07-11 — Stage 6 Visual Audit and Redesign Contract

### Coordination and revisions consumed

- Read coordinator protocol and log at `ab58d75` with:
  - `git show ab58d75:docs/workstreams/README.md`
  - `git show ab58d75:docs/workstreams/coordinator/THREAD_LOG.md`
- Do not merge or rebase `ab58d75` during this audit. The coordinator owns
  integration and `docs/logs/CHANGELOG.md` consolidation.
- Read latest coordinator decision from `715b039` without rebasing:
  - `git show 715b039:docs/workstreams/coordinator/THREAD_LOG.md`
  - `git show 715b039:docs/workstreams/qa-approval/QA_APPROVAL_RUBRIC.md`
  It records the accepted QA governance integration (`c781c31`), reproduces
  P0 lockfile failure, rejects Stage 6 for release, and freezes all frontend
  implementation. Only the gameplay workstream may make the bounded P0
  package-lock-plus-log candidate.
- Read peer workstream records before making cross-workstream dependency
  recommendations:
  - Level Design range
    `42f9ca197905e3363551c25e91faa8a6ed25527e..fa4d0ef1906098a332e515ba96cede5f600ac4f7`:
    `docs/workstreams/level-design/THREAD_LOG.md` and
    `LEVEL_DESIGN_PROPOSAL.md`.
  - Independent QA `7a99506db46b54131b89473b67a86b5d5675577d`:
    `docs/workstreams/qa-approval/THREAD_LOG.md` and
    `QA_APPROVAL_RUBRIC.md`.
  - Gameplay Rules and Engine `175ca5e3b251c0485f9603925b0cfda221c11aa1`:
    `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md` and
    `RULES_ENGINE_AUDIT.md`.

### Decisions

- Preserve PixiJS canvas ownership, deterministic core/projection separation,
  renderer-owned cell metrics, masked recursive children, procedural art, void
  particles, and command-driven animation.
- Partially reboot composition, material grammar, recursive aperture
  readability, projection-instance addressing, transition lifetime, mobile
  behavior, and active-frame allocation strategy.
- Treat the observed missing middle-frame geometry as a P1 acceptance blocker;
  do not accept a cosmetic renderer pass before generic address/transition-lock
  ownership is resolved.
- Treat clean `npm ci` as an upstream P0 release prerequisite. Temporary
  local dependency installation enabled audit commands only and is not a fix.
- Align future renderer/runtime work with the committed gameplay proposal:
  projection occurrence identity is keyed by addressed path, renderer events
  carry the occurrence route, and one command lock owns entity, camera, and
  portal transitions. No `container-b` hard-coding is acceptable.
- Keep the level workstream's four tutorial visual-staging needs provisional.
  They guide future screenshot needs but do not authorize level data, schema,
  camera metadata, or content.
- Do not implement product code, modify the root changelog, push, merge, or
  self-approve this proposal. Frontend implementation remains frozen until QA
  accepts P0 and the coordinator grants a new bounded approval.

### Evidence reviewed

- Shared handoff: `C:\Users\Alex Chen\AppData\Local\Temp\codex-handoff-game1-20260711-080600.md`.
- Core contracts: `ARCHITECTURE.md`, `DESIGN_REFERENCE.md`,
  `IMPLEMENTATION_PLAN.md`, `docs/reboot/CURRENT_STATUS.md`,
  `docs/qa/STAGE6_RENDER_ALIGNMENT.md`, and
  `docs/recursive-box-lab/GAME_RULES.md`.
- Renderer/runtime: `src/render/PixiApp.ts`, `Camera2D.ts`,
  `RecursiveTransitionRenderer.ts`, `metrics.ts`, material and primitive
  modules, `src/runtime/GameRuntime.ts`, `InteractionPrototype.ts`, and
  animation/projection modules.
- Existing visual artifact:
  `docs/screenshots/stage6-render-fidelity.png`.
- Official primary references: the official press page and screenshots 1, 2,
  and 8 listed by `DESIGN_REFERENCE.md`. They were inspected as temporary
  external files only and were not copied into the worktree.

### Browser and screenshot evidence

- In-app browser loaded `http://127.0.0.1:5173/` after dependencies were made
  available. Desktop result: one Pixi canvas, zero gameplay DOM nodes, viewport
  `1280x720`, DPR `1.25`, canvas CSS `1280x720`, backing store `1600x900`.
- Browser console check after interaction: zero warning/error entries.
- Resting scene was nonblank and exposes player, normal box, goal, and one
  recursive aperture, but has a single symmetric isolated slab rather than
  deliberate parent-context composition.
- A 70 ms movement capture and a 300 ms enter capture visibly lost the world
  frame, leaving a gray field with only the animated player/aperture. The
  settled frame returned. This is reproducible visual evidence of an incomplete
  transition lifecycle, not a screenshot-only concern.
- Requested `390x844` viewport override was attempted twice, including a fresh
  local tab. Both reported the unchanged `1280x720` viewport/canvas; therefore
  no mobile claim is made. The proposal requires a verified mobile capture
  surface before accepting responsive work.
- No screenshot was committed because this audit changes no local visual output.

### Commands and results

- `python .../webapp-testing/scripts/with_server.py --help`: completed before
  local browser testing.
- `npm.cmd ci`: failed reproducibly because `package-lock.json` lacks
  `@emnapi/core@1.11.1` and `@emnapi/runtime@1.11.1`.
- `npm.cmd install --package-lock=false --no-audit --no-fund`: completed only
  to run local audit tooling; tracked manifests remained unchanged.
- `npm.cmd run typecheck`: passed after temporary installation.
- `npm.cmd run test`: passed, 9 files / 35 tests.
- `npm.cmd run build`: passed after temporary installation.
- `git diff --check`: passed before documentation staging.
- `git status --short`: no tracked source/config change before this proposal.

### Files changed

- `docs/workstreams/frontend-design/VISUAL_REDESIGN_PROPOSAL.md`
- `docs/workstreams/frontend-design/THREAD_LOG.md`

### Commit, dependencies, blockers, and handoff

- Initial documentation-only audit commit:
  `2ac2ed058af4ac49d7f5821f64d416b608ed845a`
  (`docs(frontend): audit visual redesign`).
- This follow-up log-only commit records the audit SHA for the coordinator and
  independent QA handoff; it changes no production file.
- Dependencies: generic projection-instance identity and interaction targeting
  from gameplay; schema-approved visual staging from level design; clean
  reproducibility and independent verdict from QA.
- Blockers: lockfile P0, fixed-container/transition-lock P1, unverified mobile
  viewport, and no checked-in deterministic visual-capture tooling.
- Handoff: send the final commit SHA and both workstream document paths to
  coordinator thread `019f4deb-7e83-7583-8cd5-8e6f075bc331`; await an explicit
  approved slice before touching production code.

## 2026-07-11 — D0 Repository-Contract Review

- Review timestamp: `2026-07-11 16:15:48 +08:00`
- Reviewer thread ID: `019f4e80-145a-7520-81e1-41a45b2bec13`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Candidate reviewed: `e07808364febb2c6607fb6d962bf53fddd6c2cf3`
  (`docs: define Phase A implementation contracts`)
- Review scope: documentation only. No production source, root contract,
  package, root changelog, branch, push, merge, or rebase change was made in
  this worktree.

### Verdict: CONDITIONAL REJECT

The candidate is clean-room compliant, correctly treats historical Stage 6 as
non-authoritative, and makes the C1 -> QA-C1 -> V1 sequence explicit. It also
correctly adopts the accepted R1 boundary: C1 owns public semantic types while
V1 consumes them without core mutation. `DESIGN.md` is implementable with the
existing PixiJS/projection/metrics foundation: it preserves a single canvas,
procedural materials, bounded projections, shared metrics, and masked child
worlds instead of asking for DOM gameplay or copied assets.

However, D0 is not yet internally executable under its own precedence rules.
The coordinator must correct the clauses below before accepting D0 or opening
C1. These are contract corrections only; they do not authorize V1.

### Required corrections

1. **V1 misses a required owned source file.** `CURRENT_TASK.md` §5 permits
   `src/animation/transitions.ts` but not `src/animation/AnimationSystem.ts`.
   The current `AnimationSystem` exposes `entityProgress` as
   `Record<string, number>` and builds it from `motion.entityId`
   (`src/animation/AnimationSystem.ts:5-10,56-64`), while `PixiApp` reads that
   map by `entityProjection.entity.id` (`src/render/PixiApp.ts:331-337`). This
   is precisely the entity-ID collision V1 must remove for repeated recursive
   occurrences. Add `src/animation/AnimationSystem.ts` and its tests to V1
   ownership, and require occurrence-address keys end-to-end. No `src/core/**`
   change is needed: R1 already freezes `EntityOccurrenceAddress` as the
   consumer contract.

2. **The visual-completion policy is not deterministic enough to test.**
   `CURRENT_TASK.md` §5 says repeated input may "queue/reject
   deterministically" but does not choose one behavior, define FIFO ordering,
   state what happens to Undo/Redo/Reset while locked, or specify cancellation
   and destroy behavior. This is material because `GameRuntime` currently
   queues only while `PixiApp.isAnimating` (`src/runtime/GameRuntime.ts:52-87`)
   and the recursive camera can continue separately
   (`src/render/PixiApp.ts:61-78`; `RecursiveTransitionRenderer.ts:17-68`).
   Freeze one public runtime policy and its tests: command classification while
   locked, ordering/disposition, barrier owner, completion signal, cancellation,
   and teardown. Define the measurable midpoint invariant as well: the exact
   expected set/count of rendered world-frame occurrences and the addressable
   root/target aperture evidence at each capture, not only the phrase "no
   missing world frame."

3. **Global requirements contradict the stated V2-V4 deferrals.**
   `AGENTS.md` §8 makes retained layers, DPR cap plus actual mobile viewport,
   reduced motion, and pointer/touch mandatory frontend requirements. §9 then
   requires every runtime/render candidate to provide mobile and reduced-motion
   browser evidence. In contrast, `CURRENT_TASK.md` §5 accepts V1 using only
   desktop captures, while §6 defers retained scene graph to V3 and DPR,
   mobile, reduced-motion, pointer/touch, and capture automation to V4. The
   current implementation still recreates all layers per animated draw
   (`src/render/PixiApp.ts:175-189`) and uses uncapped
   `window.devicePixelRatio` (`src/render/PixiApp.ts:88-95`), so V1 cannot
   simultaneously preserve its planned boundary and satisfy the higher-priority
   global wording. Amend `AGENTS.md` or `CURRENT_TASK.md` to state the exact
   slice-scoped deferral: V1 must prove desktop occurrence/lock continuity;
   V3 owns retained-graph/performance acceptance; V4 owns DPR/mobile,
   reduced-motion, pointer/touch, and capture acceptance. The global gate must
   then require each item at its owning slice rather than from every V1
   runtime/render candidate.

### Non-blocking implementation notes

- V1's enumerated projection/runtime/render files do cover every current
  `container-b` dependency: prototype graph (`worldProjection.ts:37`), keyboard
  fallback (`InteractionPrototype.ts:47`), runtime selection
  (`GameRuntime.ts:90-92`), and transition geometry
  (`PixiApp.ts:295-324`).
- The R1 contract explicitly owns public `WorldAddress` and
  `EntityOccurrenceAddress` in C1 and directs V1 to consume them. V1 should
  replace the current projection-local `WorldAddress`/delimiter-built
  `projectionId` (`src/projection/types.ts:17-20`,
  `worldProjection.ts:75,111`) rather than define a competing address type.
- `DESIGN.md`'s presentation metadata remains renderer-owned and outside core,
  which is compatible with C1. Before V2 begins, a fresh bounded V2 contract
  must name its configuration source and owned palette/material/primitive
  paths; no additional C1 type needs to be frozen for it now.

### Evidence and checks

- Read the candidate itself at `e078083`, including `AGENTS.md`,
  `CURRENT_TASK.md`, `DESIGN.md`, `docs/reboot/CURRENT_STATUS.md`, and the
  coordinator log; no review conclusion relies on the delegation summary.
- Read the accepted R1 contract at `fee9c5b`, especially its address identity
  and C1/V1 ownership clauses.
- Inspected current projection, runtime, animation, and Pixi renderer code
  with line-numbered UTF-8 reads.
- `git show --check e078083`: passed.
- Candidate paths are documentation-only: `AGENTS.md`, `CURRENT_TASK.md`,
  `DESIGN.md`, `docs/reboot/CURRENT_STATUS.md`, and the coordinator log.

### Handoff

- Changed file for this review: `docs/workstreams/frontend-design/THREAD_LOG.md`
  only.
- Commit the log-only review, report its SHA to the coordinator, and stop.
- Do not begin C1, V1, V2, V3, or V4 from this review.

## 2026-07-11 — Corrected D0 Re-review

- Review timestamp: `2026-07-11 16:24:22 +08:00`
- Reviewer thread ID: `019f4e80-145a-7520-81e1-41a45b2bec13`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Candidate range reviewed:
  `e07808364febb2c6607fb6d962bf53fddd6c2cf3..ade2678fbe187b8950f1635b103807a900acc73a`
- Corrected candidate HEAD: `ade2678fbe187b8950f1635b103807a900acc73a`
- Scope: the same five coordinator/root documentation paths only. No product,
  package, root changelog, merge, rebase, or push change was made here.

### Verdict: ACCEPT

The corrected D0 contract resolves every condition in frontend review
`3e1ed2ccc82ec933fe72729df2d09b6fbde2dda9`.

1. `CURRENT_TASK.md` V1 now explicitly owns
   `src/animation/AnimationSystem.ts`, `Timeline.ts`, and
   `TransitionTimeline.ts`, with their directly corresponding tests. That is
   sufficient to replace the current canonical-entity-ID progress map with the
   accepted R1 occurrence-address key without modifying `src/core/**`.
2. V1 now specifies one bounded policy for every `PublicCommand`: one-slot
   FIFO buffering for the first command during a visual transaction,
   deterministic `input-buffer-full` local rejection for later commands,
   exact-once post-barrier dispatch, the same rule for Step/Undo/Redo/Reset,
   non-reordering cancellation, and destroy-time clearing without dispatch.
   Its browser captures use normalized visual-transaction progress for start,
   midpoint, and settled evidence rather than wall-clock guesses.
3. `AGENTS.md` now scopes frontend P2 gates by their owning slice. V1 is a
   desktop continuity/occurrence-lock candidate and cannot claim retained
   scene-graph performance, DPR/mobile, reduced-motion, pointer/touch,
   accessibility, or checked-in capture automation. V3 owns retained graph and
   performance acceptance; V4 owns the deferred responsive/accessibility
   gates. The documented `min(window.devicePixelRatio, 2)` cap is frozen for
   V4 unless a later measured contract replaces it.
4. I1's frontend consumer-half paths are sufficient for the frozen public
   bridge. Current legacy imports in `src/runtime/**` are limited to
   `EventPipeline.ts`, `GameRuntime.ts`, `InteractionPrototype.ts`, and their
   tests; the only animation consumer of legacy event types is
   `transitions.ts`/its test. `AudioManager.ts` consumes only the renderer-side
   `AudioCue` type, so it does not need to participate in the public
   command/result/event migration.

### Evidence and checks

- Read the corrected candidate itself at `ade2678`: `AGENTS.md`,
  `CURRENT_TASK.md`, `DESIGN.md`, `docs/reboot/CURRENT_STATUS.md`, and the
  coordinator log.
- Compared the complete documentation diff from `e078083` to `ade2678`.
- Rechecked the accepted R1 C1/V1 ownership boundary and inspected current
  runtime/animation imports to validate I1 consumer coverage.
- `git show --check ade2678` and range whitespace checks passed.
- The candidate changes exactly the declared documentation paths.

### Handoff

- This ACCEPT is for D0 documentation only. It does not authorize I1, C1, V1,
  V2, V3, V4, production code, level content, release, or a target-completion
  claim.
- Changed file for this review: `docs/workstreams/frontend-design/THREAD_LOG.md`
  only. Commit and report its SHA to the coordinator, then stop.

## 2026-07-11 — I1 Frontend Consumer Migration

- Implementation timestamp: `2026-07-11 17:24:00 +08:00`
- Frontend task: `019f4e80-145a-7520-81e1-41a45b2bec13`
- Coordinator task: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Exact gameplay candidate/base: `a4633c2bbdd4c1780b7396bff5dff9c2d245d16a`
  (`phase a i1: add public core interface bridge`). The worktree was clean,
  then detached directly at this commit without merge or rebase.
- Authorization: frontend/consumer half of I1 only. C1, V1, rendering,
  projection, assets, levels, packages, root contracts/changelog, browser
  evidence, merge/rebase, and push remain out of scope.

### Authority and public-surface audit

- Read root `AGENTS.md`, `DESIGN.md`, `CURRENT_TASK.md`, the accepted
  `RULES_SLICE_R1_CONTRACT.md`, and the latest coordinator, gameplay,
  frontend, and independent-QA logs before editing.
- The gameplay candidate exposes `dispatchPublicCommand(session, command)` and
  `PublicDispatchEnvelope { session, result }`. Consumers use only
  `PublicCommand` (`Step`, `Undo`, `Redo`, `Reset`), frozen `CommandResult`,
  and `SemanticEvent` values.
- I1 remains compatibility-only: `Step` reaches only the existing legacy
  walk/push bridge. It selects no port, world, container, or recursive
  destination and makes no recursive-correctness claim.

### Consumer migration mapping and decisions

- `InteractionPrototype`: arrows/WASD now construct `Step`; Undo/Redo/Reset
  mappings stay public; E returns `null`. The recursive callback and its
  directionless selection path are removed.
- `GameRuntime`: its pending queue and dispatch signatures now carry only
  `PublicCommand`; the existing queue behavior is deliberately retained. The
  one-slot FIFO visual-completion barrier is V1-only work.
- `EventPipeline`: dispatches only through `dispatchPublicCommand`, forwards
  accepted `result.transaction.events` and rejected `result.events` by
  reference, retains the frozen result/envelope, and derives accepted state,
  rejection code, hashes, and projections from public data. It no longer
  reconstructs history events.
- `transitions`: maps semantic entity/push/blocked/portal/reset/win values to
  current Pixi-compatible plan cues. It retains the semantic playback
  direction (including Undo `reverse`) while never reversing event order or
  endpoints again. Rejected Step feedback carries only its public direction;
  it does not invent an actor.
- Temporary V1-removal debt: `EntityMotion` carries lossless occurrence and
  addressed-cell fields alongside a compatibility position that exposes only
  the existing renderer's x/y needs. It uses the declared root-world value and
  never synthesizes a canonical world identity from a containment path. V1
  replaces the entity-ID progress/render path with occurrence-addressed
  interpolation.
- Push mapping structurally compares addressed occurrences/cells to suppress
  duplicate pushed-entity motions without delimiter-built identity keys.

### Authorized files and preliminary verification

- Changed only:
  - `src/runtime/EventPipeline.ts`
  - `src/runtime/EventPipeline.test.ts`
  - `src/runtime/GameRuntime.ts`
  - `src/runtime/InteractionPrototype.ts`
  - `src/runtime/InteractionPrototype.test.ts`
  - `src/animation/transitions.ts`
  - `src/animation/transitions.test.ts`
  - this workstream log
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test`: passed, 10 files / 48 tests.
- `npm.cmd ci --no-audit --no-fund`: passed, 64 packages added.
- Full clean-install rerun: typecheck passed; Vitest passed, 10 files / 48
  tests; build passed. The pre-existing Vite >500 kB chunk advisory remains
  (`527.87 kB` minified main chunk); no package or configuration change was
  made.
- `git diff --check`: passed. Exact changed-path audit passed for all eight
  authorized paths. Runtime/animation searches found no legacy
  command/result/event symbols, fixed-container identifier, or fixture text.
- Scoped staging contains exactly the eight authorized paths and passed its
  whitespace audit. This entry ships in the required
  `phase a i1: migrate runtime consumers` commit; its final object SHA is
  reported to the coordinator rather than creating a second acknowledgement
  commit solely to self-record that SHA.

## 2026-07-12 — I1 Frontend Candidate Correction

- Coordinator task `019f4deb-7e83-7583-8cd5-8e6f075bc331` conditionally
  rejected frontend candidate `9e3006528e9da69db59d87b7d8d4bc6d8f26dbcb`
  before QA/integration and authorized this bounded correction only.
- The detached worktree is clean at that candidate, whose parent remains the
  exact gameplay candidate `a4633c2bbdd4c1780b7396bff5dff9c2d245d16a`.
  The frontend commit must be amended, not followed by a third I1 commit.
- Allowed correction paths are `src/animation/transitions.ts`,
  `src/animation/transitions.test.ts`, this log, and the EventPipeline test
  only if an integration assertion proves necessary. V1 and every other path
  remain excluded.

### Assumptions and correction mapping

- A public push transaction contains one aggregate `push-resolved` event and
  a separately addressed actor `entity-moved` event with `cause: "push"`.
  Their relative ordering is not stable under Undo, so lookup must scan the
  entire semantic event array without changing its order or endpoints.
- A pushed-chain entity is still deduplicated by full occurrence and addressed
  cell equality against `push-resolved.moved`.
- The actor is identified only by full `EntityOccurrenceAddress` equality with
  `push-resolved.actor`, not a fixture or canonical entity ID. Its motion stays
  addressed but becomes a `move` plan motion without anticipation/settle,
  duplicate impact, or duplicate push audio.
- `push-resolved` is the sole I1 aggregate impact/push-audio source. Reset has
  no success cue; only `win-changed { solved: true }` may emit the existing
  success cue.
- Required correction tests cover forward and reverse push order/endpoints,
  nested duplicate suppression, aggregate feedback count, and reset/win audio.

### Correction verification and handoff

- `npm.cmd ci --no-audit --no-fund`: passed, 64 packages added.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test`: passed, 10 files / 50 tests, including forward and
  reverse aggregate-push feedback, nested duplicate suppression, and reset/win
  audio expectations.
- `npm.cmd run build`: passed. The existing >500 kB Vite chunk advisory
  remains (`527.88 kB` minified main chunk); no package/configuration change
  was made.
- `git diff --check`, exact allowed-path audit, and the runtime/animation
  legacy-symbol/fixed-container/fixture search passed. Only this log,
  `transitions.ts`, and its test changed; EventPipeline integration coverage
  did not require a modification.
- Amend the existing frontend candidate only. Report its new SHA to the
  coordinator and stop; independent QA remains coordinator-owned.

## 2026-07-12 — V1 Authorization-Document Review

- Reviewer task: `019f4e80-145a-7520-81e1-41a45b2bec13`
- Coordinator task: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Independent QA task: `019f4e80-1462-7b32-8146-19ded692836c`
- Candidate reviewed: `f2c47c3fa31875a8fb5ac2a8a6943f02c3ffbc3a`
  (`docs: freeze V1 implementation boundary`) directly atop accepted QA-C1
  `8cdf0f3f2628498fb6fcfc6eee89f996e2e0e15a`; accepted C1 implementation is
  `63750f9d1e9bf53b90074d9c341e8c5eec6f5f7a`.
- Review baseline: clean detached `f2c47c3`; no product source, package,
  configuration, root documentation/changelog, merge, rebase, or push change.

### Verdict: ACCEPT

The exact three-path documentation candidate is implementable against the
current C1 source tree and resolves the previously identified V1 preflight
gaps without starting production work.

1. **Status and order are correct.** C1 and QA-C1 are accepted/integrated;
   V1 remains documentation-only until frontend-owner and independent-QA
   acceptance followed by coordinator integration/push. `CURRENT_STATUS.md`
   keeps all level/content/serialization work frozen through V1-V4 and names
   one original showcase acceptance level as the later first content slice.
2. **Ownership is bounded and complete.** The path list includes the host, all
   current projection/runtime/animation/render consumers, their existing or
   explicitly new tests, `VisualTransactionController` plus test,
   `v1QaScenario` plus test, and an exact finite evidence list. It contains no
   catch-all test/tooling clause and explicitly excludes core, audio, layers,
   primitives, metrics, package/configuration, and general automation. The
   only current non-owned consumer is `AudioManager`, which consumes the
   unchanged `AudioCue` value type and requires no V1 edit.
3. **Occurrence identity is executable.** The candidate replaces the current
   projection-local address/path and delimiter-built `projectionId`, removes
   production recursive-projection fallback/fixed-ID selection, and requires
   C1 `WorldAddress`/`EntityOccurrenceAddress`, structural keys, delimiter-ID
   coverage, repeated canonical occurrences, and nested focus through every
   listed consumer.
4. **The visual lifecycle is singular and testable.** The controller exclusively
   owns normalized progress, completion, buffer, cancellation, and destroy;
   its requirements preserve core-supplied Undo values, define the one-slot
   policy for every public command/result presentation, and state natural,
   non-destroy cancellation, destroy, and synchronous zero-duration outcomes
   exactly.
5. **The QA/evidence boundary is closed.** Only the declared dev query forms
   are allowed, invalid values fail closed, ticker advancement is disabled,
   scenarios dispatch real C1 commands through `EventPipeline`, and synthetic
   state selection remains at application composition. The exact 1440x900 DPR
   1 files and metadata are fixed; V3 retained/performance and V4
   mobile/DPR/reduced-motion/pointer/accessibility/general automation remain
   explicit deferrals.

### Evidence

- Read candidate `CURRENT_TASK.md`, `docs/reboot/CURRENT_STATUS.md`, and the
  coordinator record; read accepted C1 and QA-C1 workstream decisions.
- Re-read the current `AGENTS.md`, relevant `DESIGN.md` rendering contract,
  this workstream's prior V1 preflight/I1 address-debt records, and all current
  projection/runtime/animation/render consumers and tests from the candidate
  tree.
- `git show --check f2c47c3` and full candidate-range whitespace checks passed.
  The candidate changes exactly `CURRENT_TASK.md`, `docs/reboot/CURRENT_STATUS.md`,
  and `docs/workstreams/coordinator/THREAD_LOG.md`.

### Handoff

- This is an acceptance of V1 authorization documentation only. It does not
  authorize V1 source edits, browser evidence capture, levels/content,
  V2-V4, release, or a completion claim.
- Commit this log-only review on the candidate baseline, report its SHA to the
  coordinator, and stop. Independent QA notification remains coordinator-owned.

## 2026-07-12 — V1 Occurrence Rendering and Visual Transaction Implementation

- Frontend owner task: `019f4e80-145a-7520-81e1-41a45b2bec13`
- Coordinator task: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Independent QA task: `019f4e80-1462-7b32-8146-19ded692836c`
- Exact pushed baseline: `e45d2ea3c5880bd59cc80417aa2272da4976e16a`
  (`origin/main`), fetched and checked out detached after a clean-worktree
  check, without merge or rebase.
- Authority consumed: accepted V1 authorization chain
  `f2c47c3 -> c604d53 -> 272e138`, accepted C1 implementation `63750f9`, and
  accepted QA-C1/V1 records. V1 is the only active production slice.

### Assumptions and implementation boundaries

- The public C1 `WorldAddress` and `EntityOccurrenceAddress` remain the only
  semantic address values. V1 may derive collision-safe structural keys inside
  its owned projection path but may not create a competing core contract or
  mutate C1.
- `GameCanvasHost` is the sole composition point for the temporary normal study
  state and for fail-closed V1 QA scenario selection. Runtime, projection,
  animation, camera, and renderer remain fixture-agnostic.
- `VisualTransactionController` will own the one normalized visual transaction
  and runtime-local one-slot submission disposition. `input-buffer-full` never
  crosses into C1 `CommandResult` or any core type.
- V1 fixes desktop occurrence/continuity and transaction correctness only. It
  does not claim V2 composition/material completion, V3 retained-graph or
  performance acceptance, or V4 DPR/mobile/reduced-motion/pointer/touch/
  accessibility/general capture automation.
- Browser evidence is restricted to the exact approved QA URLs and files at
  1440x900 effective DPR 1. All imagery remains original procedural Pixi output;
  no external/reference asset is introduced.

### Initial inventory

- Current fixed/fallback seams are in the owned projection and Pixi paths;
  current independent animation/camera/recursive timelines are in owned V1
  paths. `AudioManager` consumes the unchanged `AudioCue` value only and is
  intentionally unmodified.
- The final candidate must change only the V1 allowlist, contain the exact QA
  evidence files, pass the single final full test run (including C1 stress),
  and be committed once as `phase a v1: unify occurrence rendering`.

### Implementation and capture disposition

- Implementation/tests commit: `66b51da04be24aa6a2fe63fa32567e8d568f4124`
  (`phase a v1: unify occurrence rendering`), parent
  `e45d2ea3c5880bd59cc80417aa2272da4976e16a`. It contains only V1-owned
  implementation/test paths; this log and the generated captures remain
  unstaged pending a valid evidence gate.
- Verification before capture: `npm.cmd ci --no-audit --no-fund`,
  `npm.cmd run typecheck`, `npm.cmd run build`, `git diff --check`, and the
  source-boundary searches passed. The direct one-worker Vitest JSON run
  passed `36/36` suites and `81/81` tests (zero failures), report
  `C:\Users\Alex Chen\AppData\Local\Temp\game1-v1-vitest-1492bafa4471428e85f826b11389ad21.json`.
- Seven fresh-context dev QA captures were generated locally at 1440x900 DPR 1
  against exactly `66b51da`; each had one canvas, host-descendant canvas only,
  zero gameplay DOM, no listener-captured console/page/request/WebGL problem,
  ticker disabled, and stable manual progress. They are intentionally
  uncommitted.
- **Capture acceptance blocked:** at `enter-50` and `exit-50`, the parent
  world CSS bounds were `x=-380.4..1820.4`, `y=-336..1236` under
  `camera={x:-380.4,y:-336,scale:3.275}`. The parent *outer rim* therefore
  has zero ancestor-mask-and-viewport-clipped visible region; only child and
  aperture rim samples are available. A large intersecting world rectangle or
  nonblank frame cannot substitute for the frozen parent-rim gate. No browser
  evidence commit was created; await a bounded coordinator decision.

### Coordinator-authorized V1 recovery continuation

- The coordinator authorized continuation in this exact detached worktree
  after the frontend task repeatedly failed at the tool boundary. The base,
  implementation commit, owned paths, candidate message, independent reviewer,
  and V1 exclusions are unchanged; this is not a new slice.
- Preserve the first correction pass already present in the worktree. Its
  fail-closed QA startup, active-address projection, current-frame diagnostics,
  addressed portal selection, manual Pixi render/ticker state, audio dispatch
  reservation, and Redo/Reset/completion tests remain in scope.
- The remaining bounded corrections are: (1) draw nested worlds in their
  immediate parent-local coordinates while accumulating root-space world,
  entity, aperture, portal, and ancestor-clip geometry at every depth; (2)
  keep non-portal movement camera composition fixed on the fully addressed
  active world for V1 so a nested move cannot use root/depth-zero geometry or
  snap on completion; and (3) drain a re-entrant buffered command after a
  dispatch callback that returns without starting a visual transaction.
- Tests must include a real two-level nested address chain for focus, portal,
  accumulated diagnostics, and clip ancestry. The seven existing PNGs remain
  rejected local artifacts and may only be overwritten after the amended
  implementation SHA is frozen.
- No new dependency is open. If the parent-rim midpoint gate still fails after
  these corrections, implementation may be tuned only inside the V1-owned
  camera/transition paths; evidence must not be committed until the exact
  browser hard gate passes.

### V1 deterministic browser-evidence handoff

- Frozen implementation under review:
  `cef6ab2b2f45e6a7f7e70579f5ddc951f9380074`, exact parent
  `e45d2ea3c5880bd59cc80417aa2272da4976e16a`. The amended implementation
  remains the same 24 V1-owned source/test paths and commit message.
- Final source evidence: the sole post-correction exhaustive JSON run passed
  `36/36` suites and `91/91` tests in about `79.3 s`; clean dependency install
  added 64 packages; typecheck and build passed. The only build notice is the
  existing `553.09 kB` Vite chunk advisory. The first clean-install attempt
  encountered one exact residual Vite child holding the Rolldown native
  binding; after that worktree-owned process was stopped, the single retry
  passed. No exhaustive test was repeated.
- Browser evidence now consists of the exact seven approved PNGs,
  `docs/qa/v1-browser-evidence.json`, and
  `docs/qa/V1_BROWSER_EVIDENCE.md`. Each valid frame used a fresh system-Chrome
  context at `1440x900`, DPR/renderer resolution `1`, a real C1 dispatch, and
  explicit controller progress with the actual ticker stopped. The record has
  `hardGates.allPassed=true`, seven valid captures, and three invalid-query
  probes that created neither runtime nor canvas.
- Objective gates passed in the evidence record: one canvas, zero gameplay
  DOM/problem events, current explicit render, complete structural addresses,
  no stale frame diagnostics, stable move camera, true midpoint parent shell
  plus child rim/floor and aperture-stroke geometry/raster, identical visible
  world-address sets, and all three enter/exit continuity comparisons within
  `0.5` CSS px.
- This is candidate evidence only, not frontend self-acceptance. Independent
  QA must review the exact two-commit chain before coordinator integration.
  V2-V4, retained-graph/performance, responsive/mobile/reduced-motion/input,
  levels/content, Stage 6, release, and framework completion remain excluded.

### Frozen recovery candidate and final V1 browser evidence

- The amended, frozen V1 implementation is
  `cef6ab2b2f45e6a7f7e70579f5ddc951f9380074`
  (`phase a v1: unify occurrence rendering`), with exact parent
  `e45d2ea3c5880bd59cc80417aa2272da4976e16a`. The recovery preserved a
  single implementation commit rather than adding an intermediate correction
  commit. No production source, test, package, config, root contract, or root
  changelog file changed during the final evidence-only pass.
- Frozen-candidate verification had already passed typecheck, build,
  `git diff --check`, and `36/36` Vitest suites with `91/91` tests. The retained
  one-worker JSON report is
  `C:\Users\Alex Chen\AppData\Local\Temp\game1-v1-final-vitest-b7c0bf607ee246fa8d6d16011bc62609.json`.
  The evidence-only pass did not rerun the full suite.
- The final capture used the existing system Chrome `150.0.7871.115` against a
  local Vite dev server at `127.0.0.1:5173`. Every valid and invalid query used
  a fresh isolated context/page at exactly `1440x900`, reported DPR 1 and
  renderer resolution 1. The real C1 `PublicCommand`/`EventPipeline` result and
  semantic events drove the runtime; manual `VisualTransactionController`
  progress selected each frame without wall-clock or ticker advancement.
- Fresh captures passed for exactly `move-50`, `enter-00/50/100`, and
  `exit-00/50/100`. Every capture had one canvas, only that canvas below the
  host, zero gameplay DOM, zero warning/error/assert/page-error/unhandled-
  rejection/request-failure/HTTP 4xx-or-5xx/WebGL-loss event, stopped ticker,
  current explicit render revision, and stable progress/revision across two
  requestAnimationFrame reads. All CSS, backing, and screenshot dimensions
  were `1440x900`.
- Structured world, entity-occurrence, container, and port addresses were
  complete and unique with no stale duplicate frame records. The rendered
  world-address set was identical across all six enter/exit frames. `move-50`
  kept the addressed root camera fixed at `{x:367.2,y:198,scale:1.05}` and put
  the actor center `{x:192,y:240}` strictly between endpoint cell centers
  `{x:144,y:240}` and `{x:240,y:240}`.
- Camera plus world/aperture screen, shell, ancestor-clip, clipped, and rim
  geometry matched with no differences at the frozen `0.5` CSS-pixel tolerance
  for `enter-100 == exit-00`, `enter-50 == exit-50`, and
  `enter-00 == exit-100`.
- At both midpoint frames the real parent outer shell/rim, child rim and floor,
  and aperture stroke each had nonzero ancestor-plus-viewport-clipped geometry
  and exact authored canvas pixels. The checks sampled the reported rim/stroke
  regions directly; they did not substitute a floor rectangle, generic bounds,
  or a nonblank-frame count for the parent-rim gate.
- The exact duplicate-parameter, extra-parameter, and `progress=0.50` probes all
  published `invalid-query`, reported `runtimeConstructed: false`, and had an
  empty host with zero canvases and zero problem events.
- Final owned evidence is limited to
  `docs/qa/V1_BROWSER_EVIDENCE.md`,
  `docs/qa/v1-browser-evidence.json`, and the seven approved PNGs under
  `docs/screenshots/v1/`. The JSON includes implementation SHA, OS/browser/UA/
  WebGL, exact queries/commands/results/transactions/hashes/focus, normalized
  progress, dimensions/DPR, DOM/console arrays, structured geometry,
  continuity comparisons, raster samples, invalid-query results, and every PNG
  SHA-256.
- V3 retained-graph/performance acceptance and V4 mobile/DPR-cap,
  reduced-motion, pointer/touch, accessibility, and general capture automation
  remain explicitly deferred. These synthetic non-level QA states make no V2,
  content, release, or completion claim.

## 2026-07-13 — R2D replacement frontend compatibility acceptance

- Frontend owner task `019f4e80-145a-7520-81e1-41a45b2bec13` was blocked by a
  host approval/ACL mismatch before it could inspect replacement candidate
  `59b1ae64b2b5344e45b58a456b82ce7b7979e086`. The coordinator moved the clean
  existing frontend worktree to that exact SHA without changing content.
  Recovery lineage `019f4e80-145a-7520-81e1-41a45b2bec13` ->
  `019f57d3-0b09-70e1-b4cf-044235ec54fc` ->
  `019f57d4-514c-7441-94cd-4862f76d2222` then completed the same bounded
  frontend compatibility review. The final reviewer used no tools or file
  writes; the coordinator records its verdict verbatim in substance because
  the task family could not write shared Git metadata.
- Verdict: **ACCEPT R2D frontend compatibility only**. The additive
  `EntityTransferredEvent` compiles through unchanged non-exhaustive consumers,
  and its occurrence, port, endpoint, and carried-subtree roots are sufficient
  for addressed prefix rebasing without entity-ID fallback.
- `push-resolved` remains the sole aggregate push impact/audio source. The
  actor's existing `entity-moved(cause:"push")` is motion-only, and Undo events
  are already reversed by core, so frontend never reverses event order or
  endpoints a second time.
- The existing single controller and controller-owned global `frame.progress`
  are sufficient for one p=1 completion barrier across same-world shifts,
  cross-world payload/carried subtree, aperture, projection, camera, and
  effects. `AnimationSystem` remains read-only; no second clock is required.
- The finite core/frontend/evidence commit allowlists are minimal and
  sufficient. `GameCanvasHost` plus the separate R2 QA scenario/source test
  belong to frontend implementation; the third commit contains only Markdown,
  JSON, twelve PNG captures, and this frontend log, with no behavior change.
- The twelve 1440x900 DPR1 forward/Undo captures specify adequate midpoint
  coexistence, structural-address/no-stale-duplicate, explicit-render, and
  locked-until-p1 evidence. V2 material/composition, V3 retained/performance,
  V4 mobile/accessibility/general automation, levels, serialization, and
  showcase work remain excluded. No R2 source implementation is authorized by
  this acceptance; independent QA must review the complete documentation chain.
