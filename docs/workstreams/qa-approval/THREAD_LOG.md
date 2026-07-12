# QA Approval Workstream Log

## Entry: Stage 6 baseline audit and gate proposal

- Workstream thread ID: `019f4e80-1462-7b32-8146-19ded692836c`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-11 Asia/Shanghai (first audit turn)
- Base commit: `3b23df3be86df568d5aa6a0bef7e1652ff502ef0`
- Base ref verified: `main == origin/main == 3b23df3` in the supplied handoff;
  this isolated worktree is detached at that commit.
- Commit hash for this QA-only artifact: pending initial commit; recorded in the
  follow-up entry after the commit is created.

### Independence and coordination

- Scope is independent approval, QA, and release gates only. No production
  source, root `docs/logs/CHANGELOG.md`, branch, push, or merge was changed.
- Coordinator protocol revision consumed: `ab58d75` (`docs/workstreams/README.md`
  and `docs/workstreams/coordinator/THREAD_LOG.md`) via `git show`; no rebase
  or merge was performed. It confirms Stage 6.5 rules, runtime-stability, and
  visual-fidelity gates precede level serialization.
- Collaboration manifest received with these peer thread IDs:
  - frontend design: `019f4e80-145a-7520-81e1-41a45b2bec13`
  - gameplay rules and engine: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
  - level design: `019f4e80-145c-7b53-b675-44b03aa4f625`
- Peer status was read by thread ID before cross-workstream gate design. At the
  time of reading, the peer audits were in progress and exposed no committed
  `THREAD_LOG.md` SHA to consume. Consequently, this rubric records no peer
  commit as reviewed and does not self-approve or pre-approve their work.
- Required follow-up: before reviewing an implementation slice, read its
  committed log/artifact by SHA and add the SHA plus review verdict here.

### Contracts and evidence read

- Shared handoff:
  `C:\Users\Alex Chen\AppData\Local\Temp\codex-handoff-game1-20260711-080600.md`.
- Repository contracts:
  `ARCHITECTURE.md`, `DESIGN_REFERENCE.md`, `IMPLEMENTATION_PLAN.md`,
  `docs/reboot/CURRENT_STATUS.md`, `docs/qa/STAGE6_RENDER_ALIGNMENT.md`, and
  `docs/recursive-box-lab/GAME_RULES.md`.
- Historical QA records:
  `docs/qa/STAGE3B_CORE.md`, `docs/qa/STAGE4_PLAYABLE_CORE.md`, and
  `docs/qa/STAGE5_GAME_FEEL.md`.
- Code audited:
  core state, validation, reducer, movement/collision, recursive transition,
  history/hash/replay, simulation projection, runtime/input pipeline,
  animation, camera, recursive transition renderer, Pixi renderer, metrics,
  and related Vitest files.
- Visual evidence inspected:
  `docs/screenshots/stage6-render-fidelity.png` at native resolution. It is a
  nonblank static parent/child canvas scene, not mobile or transition evidence.

### Findings and decisions

- Verdict: **reject Stage 6 for release / no implementation slice approved**.
- P0: clean reproducibility fails. `npm.cmd ci` reported a lockfile mismatch
  (missing `@emnapi/core@1.11.1` and `@emnapi/runtime@1.11.1`).
- P1: unsafe enter validation, hard-coded recursive target, incomplete command
  lock, and entity-ID-only projection identity are proven in source and block
  deeper recursive/runtime work.
- P2: browser/mobile/middle-frame evidence, repeatable visual automation,
  performance/memory budgets, touch/reduced-motion coverage, and documentation
  consistency are incomplete.
- The authoritative severity, gates, evidence template, and acceptance/reject
  conditions are in `docs/workstreams/qa-approval/QA_APPROVAL_RUBRIC.md`.

### Commands and results

- `git rev-parse HEAD`; verified `3b23df3be86df568d5aa6a0bef7e1652ff502ef0`.
- `git status --short`; clean before QA documentation edits.
- `npm.cmd run typecheck`; initially could not find `tsc` because this clean
  worktree had no dependencies.
- `npm.cmd ci`; failed with the lockfile mismatch above.
- `npm.cmd install --package-lock=false --no-audit --no-fund`; attempted only
  as non-authoritative local diagnosis and did not modify tracked manifests.
  The current partial dependency tree leaves `pixi.js` invalid; it is ignored
  local state and must not be treated as a fix.
- After that attempt, `npm.cmd run test` passed: 9 files / 35 tests. Current
  `typecheck` and `build` fail because `pixi.js` cannot be resolved. This does
  not contradict the historical Stage 6 claims; it proves the present checkout
  cannot reproduce them from the committed lockfile.
- Browser automation was not run because a clean dependency install/build is a
  P0 prerequisite. The existing Stage 6 screenshot was inspected instead.
- Source searches confirmed no committed screenshot script, no mobile capture
  workflow, and no reduced-motion/pointer/touch implementation.

### Files changed

- `docs/workstreams/qa-approval/QA_APPROVAL_RUBRIC.md`
- `docs/workstreams/qa-approval/THREAD_LOG.md`

### Dependencies and blockers

- Blocker P0 owner: integrated dependency/toolchain slice; `npm ci` must pass
  from the committed lockfile before release evidence is trusted.
- Frontend and gameplay owners must agree on projection-instance identity and
  full transition-lock ownership before either slice is accepted.
- Level design remains blocked on accepted gameplay semantics and serialization
  contract.
- Coordinator owns final integration and `docs/logs/CHANGELOG.md` update.

### Handoff notes

- This artifact is QA-only and safe to cherry-pick/integrate without product
  code. Do not treat it as coordinator approval.
- Next QA action: review each worker's committed proposal/implementation by
  SHA, append the SHA and verdict here, then report only evidence-backed
  acceptance to thread `019f4deb-7e83-7583-8cd5-8e6f075bc331`.

## Entry: independent proposal review — rules engine and level design

- Workstream thread ID: `019f4e80-1462-7b32-8146-19ded692836c`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-11 Asia/Shanghai
- Base commit for this QA worktree: `3b23df3be86df568d5aa6a0bef7e1652ff502ef0`;
  QA governance parent: `7a99506db46b54131b89473b67a86b5d5675577d`.
- Latest coordinator decision consumed read-only: `715b039` via
  `git show 715b039:docs/workstreams/coordinator/THREAD_LOG.md` and
  `git show 715b039:docs/workstreams/qa-approval/QA_APPROVAL_RUBRIC.md`.
  No rebase or merge was performed.

### Coordinator state acknowledged

- The coordinator integrated the QA governance documentation as `c781c31` and
  independently reproduced the P0 lock mismatch with
  `npm.cmd ci --dry-run --ignore-scripts --no-audit --no-fund` (exit 1;
  missing `@emnapi/core@1.11.1` and `@emnapi/runtime@1.11.1`).
- Stage 6 remains rejected for release. Product rules/runtime, frontend,
  serialization, and level content remain frozen.
- Only the gameplay workstream is authorized for a later P0 candidate limited
  to `package-lock.json` and its own `THREAD_LOG.md`; that candidate requires a
  separate clean-install QA review and is not covered by this proposal review.

### Candidate review: gameplay rules and engine

- Consumed candidate SHA:
  `175ca5e3b251c0485f9603925b0cfda221c11aa1`.
- Reviewed paths:
  - `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`
  - `docs/workstreams/gameplay-rules-engine/RULES_ENGINE_AUDIT.md`
- Diff scope and hygiene: documentation only (two workstream files); `git show
  --check` passed. No production code, package manifest, root changelog, or
  generated asset is present in the candidate.
- Independent evidence check: current baseline source supports the proposal's
  four critical findings (unsafe enter validation, fixed `container-b`, split
  animation/portal lock, and entity-ID-only projection lookup). The cited
  official sources support the mechanic family only: recursive boxes, boundary
  pushes, self-containment, and editor-level enter/exit/reference concepts.
  The proposal correctly avoids copying their code, data format, content, or
  layouts.
- QA verdict: **accepted as a planning direction only; not an implementation or
  release approval.** The acyclic, address-aware target, typed rejection
  policy, transaction boundary, replay enrichment, and ordered stability
  sequence satisfy the current QA design gate.
- Mandatory pre-implementation clarifications:
  1. Define one serializable, deterministic mapping from an incoming `Step`
     direction to exactly one port, including duplicate/ambiguous-port and
     absent-port rejection. “Chosen port” must not be a runtime heuristic.
  2. Specify the exact public result/event shape for `not-applicable`, terminal
     `blocked`, accepted transactions, inverse events, and address keys before
     renderer/runtime implementation begins.
  3. Enforce `cycleMode: "forbid"` at the load/validation boundary for every
     edge in the first rules slice; the existing per-container cycle flag must
     not remain an accidental alternate path.
  4. Keep the proposed 1,000-sequence stress criterion as a future acceptance
     test with a recorded PRNG seed, generated-command domain, and failure
     report. It is not evidence supplied by this documentation commit.
- Dependencies: P0 clean-install acceptance first; then coordinator approval of
  one numbered stability slice; frontend must co-own address-key and full
  visual-lock contracts before addressed rendering is accepted.

### Candidate review: level design proposal range

- Consumed candidate SHAs, in order:
  - `42f9ca197905e3363551c25e91faa8a6ed25527e`
  - `fa4d0ef1906098a332e515ba96cede5f600ac4f7`
  - `2f421646aea3a24f578d927718d730a30e59cfe8`
- Reviewed paths at the final range revision:
  - `docs/workstreams/level-design/THREAD_LOG.md`
  - `docs/workstreams/level-design/LEVEL_DESIGN_PROPOSAL.md`
- Diff scope and hygiene: the first commit adds only the proposal/log; the
  second changes only the handoff log; the third records the coordinator's
  `715b039` P0-only/freeze decision in that log. `git show --check` passed for
  all three. No level data, schema, source, assets, screenshots, root changelog,
  or generated content is present.
- Independent assessment: the four original teaching beats are appropriately
  scoped to acyclic entry/exit, multi-world goals, moved-container identity,
  and depth-two context. The proposal correctly defers coordinates, schema
  fields, replay storage, ports, transfer mechanics, cycles, and visual tokens
  to their owning accepted contracts. Its browser evidence requirements agree
  with the independent QA rubric.
- QA verdict: **accepted as a provisional campaign-design direction only; not
  authorization to serialize, author, or run any level.** It does not conflict
  with the P0-only authorization or the frozen product scope. The final
  acknowledgment commit is consistent with that verdict and adds no feature
  scope.
- Mandatory pre-authoring conditions:
  1. Consume an independently accepted gameplay-rule SHA that resolves contact,
     port selection, exit destination, moved-focus behavior, win events, and
     the public `Step`/replay trace API.
  2. Consume an accepted serialization/validator contract with a schema version
     before adding coordinates, fixtures, or level identifiers to product data.
  3. Define the solver cost function, state-space bounds, milestone-signature
     equivalence relation, and exhaustion behavior before claiming a unique or
     minimum solution; the proposal's current wording is a requirement, not
     proof.
  4. Obtain frontend desktop/mobile/middle-transition staging criteria before
     visual acceptance. No layout may use renderer coordinates, `container-b`,
     or a workaround for unresolved engine behavior.

### Commands, files, and handoff

- Read coordinator decision `715b039`, all three candidate revisions, the
  final candidate documents, and their exact file lists with `git show`.
- Ran `git diff --check` across `3b23df3..175ca5e`,
  `3b23df3..42f9ca1`, `42f9ca1..fa4d0ef`, and `fa4d0ef..2f42164`; no whitespace
  errors reported.
- Ran `git show --check` for all four reviewed candidate commits; no whitespace errors
  reported.
- Rechecked the cited official Steam and custom-level documentation as primary
  research; only high-level mechanic evidence was relied upon.
- Files changed by this QA follow-up: this `THREAD_LOG.md` only.
- Follow-up commit hash: pending creation; report it with this path to the
  coordinator after committing. No push, merge, rebase, product change, or root
  `docs/logs/CHANGELOG.md` edit is authorized.

## Entry: independent proposal review — frontend visual redesign

- Workstream thread ID: `019f4e80-1462-7b32-8146-19ded692836c`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-11 Asia/Shanghai
- QA parent revision: `b10537e90e869153be0d86d08e9eddddf5356db3`.
- Coordinator decision remains `715b039`: Stage 6 is rejected; P0 remains
  open; only gameplay owns the package-lock-plus-log P0 candidate. This review
  neither changes nor broadens that authorization.

### Candidate chain consumed

1. `2ac2ed058af4ac49d7f5821f64d416b608ed845a`
2. `be0b9e79bb6e84683b4c55b9f1bfad48ac91ca45`

Reviewed paths at the final revision:

- `docs/workstreams/frontend-design/VISUAL_REDESIGN_PROPOSAL.md`
- `docs/workstreams/frontend-design/THREAD_LOG.md`

### Scope and evidence review

- The first commit adds only the two frontend workstream documents; the second
  changes only its handoff log. `git diff --check` and `git show --check` pass
  for both. No source, package, asset, screenshot, root changelog, generated
  output, branch, or remote change is present.
- Baseline source independently supports the P1 analysis: renderer animation
  currently redraws full layers during active frames, projection interpolation
  keys occurrences by canonical entity ID, runtime/transition geometry contain
  `container-b` paths, and the animation-plan completion can precede the
  independent recursive camera timeline. The live middle-frame observation is
  therefore credible as a defect report, but is not acceptance evidence until
  a reproducible capture harness records the candidate SHA and timing.
- The design correctly retains the PixiJS canvas, deterministic core/projection
  separation, shared metrics, masked recursive child worlds, command-driven
  motion, and original procedural assets. Its partial reboot of composition,
  material, aperture readability, mobile behavior, and allocation strategy is
  consistent with the QA architecture gate.
- Official press material confirms the high-level recursive mechanism and
  publicly provides screenshots, but this candidate stores no reference asset
  or copied layout. The proposal correctly treats references as temporary
  comparison evidence rather than repository content.

### QA verdict

**Accepted as a frontend planning direction only; not an implementation or
release approval.** The proposal correctly makes addressed projection
occurrence identity and one combined entity/camera/portal command lock P1
prerequisites, keeps P0 open, and explicitly refuses to infer mobile success
from the failed viewport override.

### Mandatory conditions before a frontend implementation slice

1. P0 must first be independently accepted from the authorized clean-lockfile
   candidate; no temporary installation, prior screenshot, or cached browser
   session substitutes for a clean `npm ci` gate.
2. V1 must consume a QA-accepted gameplay address/event/interaction contract,
   not only the current rules proposal. It must remove every `container-b`
   branch and apply a single command lock through entity, camera, and portal
   completion/cancellation.
3. The transition defect must have a deterministic regression harness that
   captures initial, 50%, and settled move/enter/exit frames from one exact
   command trace. Every capture must retain the relevant world frame and record
   candidate SHA, dimensions/DPR, canvas/DOM count, console events, and
   nonblank/palette metrics.
4. Mobile proof requires a capture surface that reports the actual 390x844 DPR
   3 viewport and backing-store dimensions. A CSS resize or an override that
   leaves the canvas at desktop dimensions is a test failure, not mobile
   evidence.
5. Performance acceptance must name the browser/runtime version, device or
   emulation profile, deterministic scene/command workload, collection method,
   recursion depth/object count, and heap sampling rule. The 30-cycle p95 and
   memory budgets are requirements pending that measurement protocol, not a
   demonstrated result.
6. Projection-instance addresses belong in capture metadata/test output, not
   a gameplay HUD or React DOM. Composition/staging metadata remains outside
   the deterministic core until an accepted level schema defines it.
7. All screenshots, palettes, geometry, and layout data remain original. No
   official download, visual trace, logo, audio, or game copy may enter a
   frontend candidate.

### Handoff

- Files changed by this QA follow-up: this `THREAD_LOG.md` only.
- Follow-up commit hash: pending creation; report it with this log path to the
  coordinator after committing.
- Frontend implementation remains frozen. Stage 6 release remains rejected.

## Entry: independent P0 toolchain reproducibility review

- Workstream thread ID: `019f4e80-1462-7b32-8146-19ded692836c`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-11 Asia/Shanghai
- Coordinator revision consumed read-only: `daf8565` and its integrated QA
  planning-review record `423fff9`; neither was merged or rebased into this
  isolated QA worktree.
- Candidate SHA: `86d02d4498d314fcda9a8d7608509b4e5ba18ca1`.
- Candidate parent reviewed: `175ca5e3b251c0485f9603925b0cfda221c11aa1`.

### Scope and lock integrity review

- Exact changed paths: `package-lock.json` and
  `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md` only. No diff exists
  for `package.json`; no source, configuration, declared dependency range, root
  changelog, asset, push, or merge change is present.
- The lock diff adds only the nested
  `@rolldown/binding-wasm32-wasi/node_modules/@emnapi/core@1.11.1` and
  `@emnapi/runtime@1.11.1` entries, including resolved registry URLs and
  integrity hashes. They match the dependency declaration already present for
  the optional WASI binding; unrelated lock entries are unchanged.
- `git diff --check` and `git show --check` pass. The candidate log accurately
  preserves the P0-only authorization and records no attempt to claim Stage 6
  release or rules/runtime authority.

### Independent clean-checkout reproduction

- Created a new detached temporary Git worktree at candidate SHA
  `86d02d4`; `Test-Path node_modules` was `False` before installation.
- Environment: Node `v24.12.0`; npm `11.6.2`.
- `npm.cmd ci --no-audit --no-fund`: passed, added 64 packages.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test`: passed, 9 files / 35 tests.
- `npm.cmd run build`: passed, including its nested typecheck; production
  `dist/index.html` exists. The only output warning was Vite's existing
  chunk-size advisory for a 520.27 kB minified chunk; it is unrelated to this
  lockfile-only repair and remains a future performance gate item.
- The post-install candidate worktree had clean tracked status and empty
  `git diff --check`/`git diff --name-only` output. SHA-256 observations:
  `package.json` `B6863FB4D1699C81466D5ECD9E4B506923C4736F3A2A78E3E4064D1977D6B3B3`;
  repaired `package-lock.json`
  `C4C47BA150EE1F308301FBD2CD4BFDFB121641B2581FDC443B0AA00732FE7E80`.
- `npm ls` does not install the optional `binding-wasm32-wasi` tree on this
  win32 x64 host and exits with an empty tree for those queried packages. This
  platform exclusion is expected; the successful `npm ci` proves the lock can
  now parse/install cleanly and does not turn the omitted optional artifact
  into a P0 failure.

### QA verdict

**Accept P0 toolchain reproducibility for candidate `86d02d4` only.** The
candidate meets its authorized path scope and independently reproduces a clean
install, typecheck, 9-file/35-test suite, and production build.

This decision does **not** accept Stage 6 for release, authorize rules/runtime
sequence item 2, authorize frontend/level/serialization work, or close any P1
or P2 finding. The coordinator must integrate the candidate before any later
slice can be considered, and each such slice still requires explicit renewed
authorization plus independent QA by SHA.

### Additional coordination note

- Delayed duplicate worktree commit `d5c36246c59ae9d96525543c0b93fc149db80a15`
  was explicitly excluded from this review and contributes no authority or
  evidence to either the P0 or frontend verdict.
- Files changed by this QA follow-up: this `THREAD_LOG.md` only. Follow-up
  commit hash is pending creation and will be reported to the coordinator.

## Entry: independent re-review — R1 Contract Freeze correction

- Workstream thread ID: `019f4e80-1462-7b32-8146-19ded692836c`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-11 Asia/Shanghai
- Rejected base candidate:
  `87dfa4517ca668e09e97161405b39949939f2252`.
- Re-review candidate:
  `d834f4350fe760e8f2997f0c246fc80e4fe0b69e`.
- Authority consumed: coordinator R1 scope `218bade` and the authoritative
  design-reboot/user-scope clarification `f4f3433`. R1 remains
  documentation-only; Stage 6 remains a historical prototype label and is
  still release-rejected.

### Scope and authority checks

- The corrected candidate is a direct child of rejected R1 candidate `87dfa45`.
  Its exact changed paths are only
  `docs/workstreams/gameplay-rules-engine/RULES_SLICE_R1_CONTRACT.md` and
  `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`.
- `git diff --check` and `git show --check` pass. No production source,
  package/configuration, frontend, level, serialization, QA document, root
  changelog, merge, rebase, or push change is present.
- Delayed duplicate research `d5c36246c59ae9d96525543c0b93fc149db80a15` is
  not an ancestor of this candidate and is not treated as authority.

### Re-review of the prior blockers

1. **Rejected-command totality is internally consistent.** `StepCommandResult`
   now has a nonempty ordered attempt trace; a rejected Step ends in terminal
   `blocked`, including an actor/focus-preflight `step-fallback`. The distinct
   `NonStepCommandResult` freezes `attempts: []` for Undo/Redo/Reset and one
   indexed, forward, null-transaction `command-blocked` event. The stress
   protocol explicitly exercises initial Undo, Redo, and Reset rejections, and
   applies the corresponding split oracle.
2. **Rule selection is complete and total.** `ruleEnablement` is a complete
   map for push/enter/exit, priority contains every and only enabled rule once,
   and all eight deterministic enablement masks are generated. After walk and
   every enabled candidate are not applicable, `step-fallback` with
   `no-enabled-rule-applies` is terminal. This removes the previously undefined
   priority/enablement and fall-through behavior.
3. **Exit selection is frozen to declared coordinates.** It resolves the active
   actor occurrence to canonical `worldId` and compares exact world/x/y values
   with the port landing. Landing cells are globally unique by
   `(innerWorldId, x, y)` across all ports, including canonical-world aliases;
   duplicate landing validation and stress mutations now cover this rule.

### Five R1 requirements

- `Step(direction)` port selection is deterministic, center-anchor-only, and
  has typed absent/ambiguous terminal rejections.
- Public discriminated attempt, result, transaction, semantic-event,
  `WorldAddress`, and `EntityOccurrenceAddress` shapes are explicit. The new
  `AttemptRule`/`step-fallback` extension preserves the Step/non-Step split.
- `cycleMode: "forbid"` validates every containment edge in deterministic
  order, including unreachable components and legacy override rejection.
- The xorshift32 protocol fixes its master seed, 1,000-case domain, masks,
  64-command traces, oracle, initial history/reset subcases, and deterministic
  minimised failure report.
- C1 core and V1 runtime/render file/test ownership remains disjoint; V1 may
  consume but not reinterpret C1 semantics.

### QA verdict

**Accept R1 Contract Freeze documentation candidate `d834f43` only.** The
three blocking contract edits are resolved and the five authorized R1
requirements are frozen sufficiently for a future, separately authorized C1
request.

This is not C1 or V1 authority, does not authorize any product source change,
does not accept Stage 6 or a release, and does not override the requirement for
a later explicit user development instruction plus a new bounded coordinator
authorization. After this review, the gameplay workstream is to stop as
directed.

### Handoff

- Files changed by this QA follow-up: this `THREAD_LOG.md` only.
- Follow-up commit hash: pending creation; report it with this log path to the
  coordinator after committing. No push or merge is authorized.

## Entry: independent D0 repository-contract re-review and acceptance

- Workstream thread ID: `019f4e80-1462-7b32-8146-19ded692836c`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-11 Asia/Shanghai
- Accepted R1/coordinator base reviewed: `fee9c5bd3d4b839df5bd5b148ee0e92145b502eb`.
- Initial D0 candidate conditionally rejected without a QA acceptance commit:
  `e07808364febb2c6607fb6d962bf53fddd6c2cf3`.
- Intermediate correction reviewed read-only and superseded before verdict:
  `ade2678fbe187b8950f1635b103807a900acc73a`.
- Second correction reviewed read-only and superseded before verdict:
  `b96d261641d41800df9101efe634718db8b65d80`.
- Final D0 candidate reviewed: `15a5443b8f4e93dfa5e063d0a57826394e343f7c`.
  It is the direct child of `b96d261`, which follows `ade2678` and `e078083`;
  the full candidate chain is therefore `fee9c5b..15a5443`.

### Scope and repository checks

- The cumulative candidate changes exactly five D0-authorized paths:
  `AGENTS.md`, `CURRENT_TASK.md`, `DESIGN.md`,
  `docs/reboot/CURRENT_STATUS.md`, and
  `docs/workstreams/coordinator/THREAD_LOG.md`. The direct final correction
  changes only `AGENTS.md` and the coordinator log.
- `git diff --check fee9c5b..15a5443`, `git diff --check b96d261..15a5443`,
  and `git show --check 15a5443` pass. The QA worktree remained clean before
  this log-only update.
- No production `src/**`, test, package, configuration, asset, root
  `docs/logs/CHANGELOG.md`, merge, rebase, or push change is present.
  `package.json` and `package-lock.json` are unchanged from the R1/coordinator
  base.

### Re-review of the D0 blockers and final correction

1. **Authority and finding disposition are now safe.** `AGENTS.md` places
   accepted normative contracts above `CURRENT_TASK.md` and `DESIGN.md`, and
   places applicable independent QA gates above both. It expressly says that a
   current task cannot redefine frozen semantics, weaken a gate, or close a
   finding; doing so needs coordinator authorization, a replacement contract,
   and an independent QA decision accepted by the coordinator. The historical
   rubric table remains evidence, while the current disposition is explicitly
   sourced from the latest integrated QA log and coordinator decision.
2. **I1 removes the C1-to-V1 migration deadlock with a bounded shared chain.**
   The pre-existing runtime/animation source imports and constructs legacy
   `Move`/`Enter`/`Exit`/`SimulationCommand` and consumes legacy results/events,
   while C1 excludes those paths. I1 therefore assigns a gameplay-owned core
   bridge commit first and a frontend-owned consumer migration commit second,
   with disjoint exact path sets, no merge/rebase handoff, combined repository
   verification, and independent QA of the exact two-commit chain before either
   half can integrate. C1 starts only after that accepted, integrated bridge.
3. **The final cross-boundary exception closes the prior loophole.** A crossing
   stops unless all four facts are frozen before the first file change: the
   shared slice and exact public types are named in `CURRENT_TASK.md`; the
   coordinator has named owners, disjoint exact paths, and linear order; partial
   integration is forbidden and the full chain requires whole-repository
   verification; and the named independent QA task accepts the complete chain
   by SHA. I1 is the only current exception. A future bridge requires fresh
   explicit coordinator authorization and a `CURRENT_TASK.md` update before
   work, so this wording cannot silently widen a workstream's ownership or
   authorize arbitrary cross-boundary edits.
4. **Adapter semantics do not reinstate the rejected shortcuts.** I1 confines
   legacy compatibility to `legacyRuntimeAdapter.ts`; it may atomically call
   the existing movement resolver and translate its result, but may not select
   a container, port, recursive destination, or fixture ID. Directionless
   legacy `Enter`/`Exit` are neither emitted by runtime nor mapped to `Step`.
   Cases the legacy kernel cannot express return an unchanged-state typed public
   rejection. Required boundary searches and tests prevent legacy imports in
   runtime/animation after the consumer half, so the adapter cannot become a
   second rule resolver.
5. **V1 ownership, input policy, and deferrals are internally consistent.**
   V1 now includes `AnimationSystem` and the timeline paths that own visual
   progress, and it fixes one FIFO policy for all four public commands:
   one queued command, deterministic overflow drop, exactly-once dispatch after
   the combined visual barrier, and no reorder/double dispatch on cancellation
   or destroy. `input-buffer-full` is a runtime input-submission disposition,
   not a new R1 `Rejection`/`CommandResult` code: it has no core dispatch and
   must not be implemented as a change to frozen core semantics. QA will test
   that boundary in V1. V1 expressly cannot claim the retained-graph/performance
   work assigned to V3 or the mobile/DPR/reduced-motion/pointer/touch,
   accessibility, and checked-in capture automation assigned to V4.

### QA verdict

**Accept D0 documentation candidate `15a5443` only.** The corrected authority
order, QA-disposition source, I1 bridge, V1 ownership/input policy, and explicit
P2 deferrals resolve the conditional-rejection findings without changing product
code or weakening accepted R1/QA requirements.

This acceptance permits **only I1** to open after the coordinator integrates
and pushes D0. It does **not** authorize C1, V1, any other production work,
Stage 6 acceptance, a release, or a completion claim. C1 and V1 retain their
separate start conditions and each requires later independent QA by SHA.

### Handoff

- Files changed by this QA follow-up: this `THREAD_LOG.md` only.
- Follow-up commit hash: pending creation; report it with this log path to the
  coordinator after committing. No push, merge, or rebase is authorized.

## Entry: independent QA-C1 re-review and acceptance

- Workstream thread ID: `019f4e80-1462-7b32-8146-19ded692836c`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-12 Asia/Shanghai
- Exact C1 parent/base: `d3552c81894a43805854611822bcfab86e993538`.
- Prior rejected C1 head, with no QA verdict commit:
  `d6677c9e2a6d2818f898fbf97f7b2d123546b522`.
- Reviewed superseding C1 candidate:
  `63750f9d1e9bf53b90074d9c341e8c5eec6f5f7a`.

### Scope, ancestry, and boundary review

- The candidate is a direct child of the exact C1 base. Its full diff retains
  exactly the 24 C1-owned paths: gameplay log plus the approved `src/core/**`
  implementation/test paths. No projection, runtime, animation, render,
  package, configuration, root documentation/changelog, level, serialization,
  or QA path is in the candidate.
- `git diff --check` for the full range and correction delta, plus `git show
  --check` for the candidate, pass. The detached candidate worktree stayed
  clean after verification and began with no `node_modules`.
- The R1 public `PublicCommand`/`CommandResult`/`SemanticEvent`/address/
  transaction/`dispatchPublicCommand` boundary remains runtime-compatible;
  I1 adapter and all legacy core command/result/event/wrapper exports are
  removed. Core searches find no legacy bridge symbols, presentation imports,
  fixed-ID rule resolution, or random/time/locale nondeterminism.

### C1 contract and sequence-authentication re-review

1. **Deterministic rules and validation hold.** The candidate uses explicit
   rule enablement/priority, exact addressed enter/exit port mapping, atomic
   candidate validation, typed unchanged rejections, runtime-versus-initial
   landing validation, full-graph `cycleMode: "forbid"` validation including
   unreachable components, and canonical goal/hash/replay behavior. Stored
   transactions authenticate full root/path/table/port/inner-world/landing/
   outer-approach geometry before Undo/Redo; direction, event ordering,
   `sourceTransactionId`, reset, and win traces are covered by the C1 tests.
2. **The prior P1 sequence forgery is resolved.** Dispatch now rejects a
   negative, fractional, `NaN`, or infinite `publicTransactionSequence` before
   transaction creation/replay and returns the frozen unchanged Step or
   non-Step rejection shape. A selected history source must have an integer
   sequence in `[1, currentSessionSequence]` before synthetic reproduction.
   Rewritten past Undo and future Redo source/event IDs at sequence `999`
   reject unchanged; legitimate older source sequence `1` continues through
   Undo/Redo. Nested `push-resolved.moved` transaction IDs are also verified.
3. **Stress proof remains frozen and total.** The xorshift32 seed/anchors,
   1,000 fixtures × 64 commands, three initial non-Step subcases per fixture,
   all enablement masks/weights, and 240,000 ms limit are unchanged. The oracle
   validates session/source sequence ranges and top-level/nested event IDs,
   uses a single direct/replay pass on success, localizes only failures, keeps
   empty traces valid, locates first replay/length/final mismatches, and either
   produces a same-code 1-minimal trace or emits a distinct minimizer failure.

### Independent clean-candidate verification

- Environment: Node `v24.12.0`; npm `11.6.2`.
- `npm.cmd ci --no-audit --no-fund`: passed from an absent-`node_modules`
  precondition; added 64 packages.
- `npm.cmd run typecheck`: passed.
- Exactly one full `npm.cmd run test` invocation ran, including stress. Its
  npm debug record reports authoritative exit `0`; independent discovery
  confirms the expected **12 test files / 70 test cases**.
- `npm.cmd run build`: passed. The only warning is the existing Vite >500 kB
  chunk advisory (main chunk `545.93 kB` minified); it remains outside C1 and
  is not acceptance evidence.

### QA verdict

**Accept C1 candidate `63750f9` only.** The 24-path implementation now meets
the accepted R1 deterministic-core contract and corrects the rejected stored-
history sequence-authentication flaw. No P0 or C1-scope P1 blocker remains.

This is not V1/V2-V4 authority, frontend/level/serialization work, Stage 6
acceptance, release authority, or a target-completion claim. The coordinator
must integrate and push this exact accepted chain before considering a later,
separately authorized slice and its own independent QA review.

### Handoff

- Files changed by this QA follow-up: this `THREAD_LOG.md` only.
- Follow-up commit hash: pending creation; report it with this log path to the
  coordinator after committing. No push, merge, or rebase is authorized.

## Entry: independent QA-I1 replacement-chain review and acceptance

- Workstream thread ID: `019f4e80-1462-7b32-8146-19ded692836c`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-12 Asia/Shanghai
- Base: `0b7ebc38cc51b1fd314cdaeb3f1c8bdfa43140e6`.
- Gameplay/core half: `a4633c2bbdd4c1780b7396bff5dff9c2d245d16a`.
- Superseding frontend/complete-chain head:
  `ef27c9c57baf940ceec3c693cfc537cba93cc6be`.
- Superseded frontend head `9e3006528e9da69db59d87b7d8d4bc6d8f26dbcb`
  received no QA verdict or acceptance commit.

### Scope, ancestry, and hygiene

- Candidate parentage is exact: `0b7ebc3 -> a4633c2 -> ef27c9c`. The QA
  baseline was clean at `701bf51`; a detached `ef27c9c` worktree started with
  no `node_modules`.
- The gameplay half changes only its exact I1 core paths/tests and owner log.
  The frontend half changes only its exact runtime/animation paths/tests and
  owner log. The two allowlists are disjoint and the complete chain contains no
  package, config, root contract/changelog, projection, render, React/UI,
  level, asset, screenshot, or QA path.
- The superseding amendment is bounded to
  `src/animation/transitions.ts`, `src/animation/transitions.test.ts`, and the
  frontend log. Full-chain and amendment `git diff --check`, plus `git show
  --check` for both indivisible commits, pass. Candidate status is clean after
  verification.

### I1 contract and correction review

1. **Public boundary remains exact.** Runtime/animation searches find no legacy
   `Move`/`Enter`/`Exit`/`SimulationCommand`/`CommandDispatchResult`/
   `TransitionEvent`/`dispatchCommand` import or construction, no `container-b`
   or fixture identity, and no directionless E command. The adapter translates
   only public `Step` to legacy `Move`; it contains no container, port, world,
   or recursive-destination selection. Its amended fail-closed Enter/Exit and
   unknown-command regression remains present.
2. **The push correction resolves the P1 feedback defect.** A real bridge push
   supplies the aggregate `push-resolved` event plus the addressed actor move.
   `push-resolved` is now the sole impact/push-audio source. It creates the box
   push motion; the aggregate actor match creates one ordinary actor move
   without box anticipation/settle. The duplicate pushed-box motion is
   suppressed by full occurrence-plus-addressed-cell equality.
3. **Ordering and Undo are safe.** Both actor matching and box duplicate
   detection scan the complete semantic event array and compare full
   root-plus-container-path occurrence addresses, so they are independent of
   forward versus reversed Undo order. The core adapter already reverses and
   swaps Undo values once; transition planning preserves those supplied
   endpoints/direction without a second transformation. Forward and reverse
   correction tests each assert one aggregate impact and one push audio.
4. **Reset/win semantics are corrected.** Reset now provides no success cue;
   `win-changed { solved: true }` is the sole success-audio source and yields
   exactly one cue. This closes the reported P2 misleading-reset feedback.
5. **I1 remains a bridge, not feature acceptance.** The frozen public
   command/result/event forwarding, Step/non-Step rejection invariants,
   EventPipeline by-reference semantic forwarding, and temporary addressed
   renderer-compatibility data remain intact. Recursive port/cycle safety,
   address-keyed renderer ownership, visual lock, mobile/accessibility,
   performance, levels, and release proof remain later C1/V1-V4 gates.

### Independent clean-candidate verification

- Environment: Node `v24.12.0`; npm `11.6.2`.
- `npm.cmd ci --no-audit --no-fund`: passed from the absent-`node_modules`
  precondition; added 64 packages.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test`: passed, **10 files / 50 tests**.
- `npm.cmd run build`: passed. The only warning is the pre-existing Vite
  >500 kB advisory (main chunk `527.88 kB` minified), which remains V3
  performance work and is not credited as I1 evidence.
- Full source-boundary searches for legacy consumer symbols, fixed
  container/fixture identity, adapter directionless selection, and forbidden
  core presentation imports pass.

### QA verdict

**Accept the complete, indivisible I1 chain ending at `ef27c9c` only.** The
replacement frontend half resolves the P1 duplicate push feedback and P2 reset
success-cue findings without broadening the I1 scope. No P0 or I1-scope P1
blocker remains. The historical P1 recursive-safety and runtime/render defects
are deliberately not closed by this compatibility bridge and remain bounded to
C1 and V1 under their existing independent QA gates.

After coordinator integration and push, this acceptance opens **only C1**. It
does **not** accept C1 implementation, V1/V2-V4, frontend or engine completion,
levels, Stage 6, release, root changelog work, or any target-completion claim.
Each later slice requires its own candidate SHA and independent QA decision.

### Handoff

- Files changed by this QA follow-up: this `THREAD_LOG.md` only.
- Follow-up commit hash: pending creation; report it with this log path to the
  coordinator after committing. No push, merge, or rebase is authorized.
