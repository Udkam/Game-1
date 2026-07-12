# Recursive Gameplay Rules and Engine Thread Log

## 2026-07-11 - Audit and clean-room rules proposal

- Thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-11, Asia/Shanghai
- Base commit: `3b23df3be86df568d5aa6a0bef7e1652ff502ef0`
- Coordinator revision consumed (read only; not merged/rebased):
  `ab58d7578d5cb2ef6f59ac7cde325a9cd175b9ef`

### Decisions and evidence

- First phase remains audit/design only. No production TypeScript, renderer,
  level, root changelog, push, merge, or rebase change is authorized.
- Read the shared handoff, `docs/logs/CHANGELOG.md`, `ARCHITECTURE.md`,
  `IMPLEMENTATION_PLAN.md`, `docs/recursive-box-lab/GAME_RULES.md`, current QA
  records, all core/projection/runtime/animation modules, and every existing
  local workstream log (none existed in this baseline).
- Consumed the coordinator protocol and coordinator log from `ab58d75` with
  `git show`; see `docs/workstreams/README.md` and
  `docs/workstreams/coordinator/THREAD_LOG.md` in that commit.
- Read peer thread status by authoritative ID before making dependency notes:
  frontend `019f4e80-145a-7520-81e1-41a45b2bec13`, level design
  `019f4e80-145c-7b53-b675-44b03aa4f625`, and independent QA
  `019f4e80-1462-7b32-8146-19ded692836c`. At audit time each was active and
  had no completed peer-log commit to consume.
- Primary research used the official Steam page and official custom-level
  documentation. The latter makes interaction priority, enter/exit, recursive
  references, and load diagnostics explicit evidence; no original code, asset,
  level, text, or format is copied.
- The audit identifies four pre-feature blockers: unsafe `Enter` semantics,
  hard-coded `container-b` interaction/camera paths, visual lock ending before
  the independent recursive camera timeline, and entity-ID-only projection
  interpolation.

### Files changed

- `docs/workstreams/gameplay-rules-engine/RULES_ENGINE_AUDIT.md`
- `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`

### Commands, tests, and screenshots

- Read-only source and contract audit with `rg`, explicit UTF-8 PowerShell
  reads, `git show`, and the Codex thread-read tool.
- `npm.cmd ci --ignore-scripts`: failed before installation because
  `package-lock.json` is out of sync with `package.json`; it lacks
  `@emnapi/core@1.11.1` and `@emnapi/runtime@1.11.1`. This is a baseline
  reproducibility blocker, not a repaired dependency change in this worktree.
- No browser session or screenshot was required for this rule-engine audit;
  runtime timing evidence was established by static inspection of the 560 ms
  event plan and the independent 980 ms recursive transition timeline.

### Commit

- Pending documentation-only commit.

### Dependencies, blockers, and handoff notes

- The coordinator must approve one bounded slice before production code starts.
- The lockfile must be repaired before the full automated suite can be used as
  a clean-install gate.
- Level-schema/campaign work depends on the approved acyclic rules contract.
- Deeper recursion and self-containment depend on address-aware locations and
  addressed projection/events; the current `worldId` location model is not
  sufficient.
- After committing, report the SHA and this log path to coordinator thread
  `019f4deb-7e83-7583-8cd5-8e6f075bc331`; route the SHA to independent QA
  thread `019f4e80-1462-7b32-8146-19ded692836c` through the coordinator.

## 2026-07-11 - P0 toolchain reproducibility candidate

- Thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-11, Asia/Shanghai
- Candidate base: `175ca5e3b251c0485f9603925b0cfda221c11aa1`
- Authorization: exactly one P0 lockfile candidate. Allowed paths are
  `package-lock.json` and this log only; `package.json`, `src/**`, toolchain
  configuration, declared dependency versions, root changelog, push, and merge
  remain forbidden.

### Coordination and independent evidence consumed

- QA artifact commit read with `git show`:
  `7a99506db46b54131b89473b67a86b5d5675577d`.
- Its coordinator integration read with `git show`:
  `c781c310e9ac68015dcff2ace9935472b56bb877`.
- Level-design handoff range read with `git show`:
  `42f9ca197905e3363551c25e91faa8a6ed25527e..fa4d0ef1906098a332e515ba96cede5f600ac4f7`.
  It confirms level content remains blocked on accepted gameplay semantics and
  schema work.
- Latest coordinator P0 decision consumed, read only with `git show`:
  `715b0397d94674f98b24bd544056819e8ead5607`.
- QA and coordinator both retain the Stage 6 release rejection. This candidate
  only closes the reproducibility gate if independent QA accepts it; it does
  not approve sequence item 2 or any product/rules/frontend/level work.

### Repair and verification evidence

- Environment: Node `v24.12.0`; npm `11.6.2`.
- Clean precondition: `Test-Path node_modules` returned `False`; the pre-repair
  `package-lock.json` SHA-256 was
  `FBE0A139404359861B88C6FF1C850BD9AA6753C8ACE6594C682A29C47D26DDD7`.
- Repair command:
  `npm.cmd install --package-lock-only --ignore-scripts --no-audit --no-fund`.
  It changed only `package-lock.json`, adding the missing nested
  `@emnapi/core@1.11.1` and `@emnapi/runtime@1.11.1` entries required by the
  locked `@rolldown/binding-wasm32-wasi` package. No `node_modules` directory
  was created by this metadata-only command and `package.json` had no diff.
- Clean-install proof:
  `npm.cmd ci --no-audit --no-fund` from the absent-`node_modules`
  precondition; passed and added 64 packages.
- `npm.cmd run typecheck`; passed (`tsc --noEmit`).
- `npm.cmd run test`; passed: 9 files / 35 tests.
- `npm.cmd run build`; passed. Vite built production assets successfully and
  emitted only its existing chunk-size advisory for a 520.27 kB minified chunk.
- `git diff --check`; passed. Before staging, `git status --short` showed only
  `M package-lock.json` and `M docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`;
  `git diff --name-only` listed exactly those two paths, and
  `git diff -- package.json` was empty.
- Scoped staging command:
  `git add -- package-lock.json docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`.
  `git diff --cached --name-only` listed exactly
  `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md` and
  `package-lock.json`; `git diff --cached --check` passed.
- Post-repair hashes: `package.json` SHA-256 remains
  `B6863FB4D1699C81466D5ECD9E4B506923C4736F3A2A78E3E4064D1977D6B3B3`;
  `package-lock.json` SHA-256 is now
  `C4C47BA150EE1F308301FBD2CD4BFDFB121641B2581FDC443B0AA00732FE7E80`.

### Candidate scope and handoff

- Files changed by this candidate:
  - `package-lock.json`
  - `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`
- Production behavior, declared dependency ranges, source code, and toolchain
  configuration are unchanged.
- Commit: pending final scoped staging and commit.
- Send the resulting SHA and this log path to coordinator
  `019f4deb-7e83-7583-8cd5-8e6f075bc331` and independent QA
  `019f4e80-1462-7b32-8146-19ded692836c`. Await their decision before starting
  any rules/runtime stability work.

## 2026-07-11 - R1 Contract Freeze (documentation only)

- Thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Timestamp: 2026-07-11, Asia/Shanghai
- Worktree base: `86d02d4498d314fcda9a8d7608509b4e5ba18ca1`
- Authorization: exactly one documentation-only R1 slice. Allowed paths are
  `docs/workstreams/gameplay-rules-engine/RULES_SLICE_R1_CONTRACT.md` and this
  log only. Production code, package/configuration files, frontend, levels,
  serialization, root changelog, push, and merge remain forbidden.

### Revisions and research consumed read-only

- Coordinator/P0 authority: `218bade` via
  `git show 218bade:docs/workstreams/coordinator/THREAD_LOG.md`.
- Independent QA/P0 authority: `1fb6c32` via
  `git show 1fb6c32:docs/workstreams/qa-approval/THREAD_LOG.md`.
- Authoritative user scope clarification: `f4f3433` via
  `git show f4f3433:docs/reboot/CURRENT_STATUS.md` and
  `git show f4f3433:docs/workstreams/coordinator/THREAD_LOG.md`. It confirms
  the project is less than 10% complete, Stage 6 is historical only, and this
  design-reboot round permits no production work without a later explicit user
  development instruction plus a new bounded coordinator authorization.
- Canonical planning documents were read from `218bade`, including this
  workstream's integrated `RULES_ENGINE_AUDIT.md` and log. The canonical audit
  remains the planning baseline, accepted only as planning direction.
- Non-authoritative delayed research commit
  `d5c36246c59ae9d96525543c0b93fc149db80a15` was read with `git show` for
  `RULES_CONTRACT.md` only. Its duplicate `THREAD_LOG.md` was neither read as
  authority nor copied, merged, or replaced.

### Decisions

- P0's clean-install acceptance does not release Stage 6 or authorize any
  source change. R1 freezes documentation before a separate C1 core-safety
  request can be considered; after QA review, this workstream stops until the
  later explicit user/coordinator development authorization arrives.
- R1 defines center-anchor, exactly-one port mapping; full discriminated
  command/attempt/transaction/event/address shapes; complete
  `cycleMode: "forbid"` enforcement; and a fixed 1,000-sequence stress
  protocol.
- R1 assigns C1 core safety and later V1 runtime/render occurrence-address and
  visual-lock work to disjoint file/test sets. V1 consumes C1 semantics and
  cannot silently rewrite them.
- The delayed duplicate supplied useful research but conflicts on authority,
  severity, initial cycle policy, and `not-applicable` semantics. R1 retains
  QA-mandated `cycleMode: "forbid"` and canonical workstream ownership.

### Files changed

- `docs/workstreams/gameplay-rules-engine/RULES_SLICE_R1_CONTRACT.md`
- `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`

### Commands, tests, and handoff

- Read-only evidence commands: `git show` for `218bade`, `1fb6c32`, canonical
  workstream documents, and delayed research `d5c3624`; no merge or rebase.
- This slice changes no executable code. Verification is scoped to Markdown
  content, allowed paths, `git diff --check`, and final staged-path review;
  no product test run is claimed as R1 evidence.
- Commit: pending scoped documentation-only verification and commit.
- Send the resulting SHA and this log path to coordinator and independent QA;
  await QA before requesting C1. No code follows from R1 automatically.

## 2026-07-11 - R1 conditional-reject contract correction

- Thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Candidate under correction: `87dfa4517ca668e09e97161405b39949939f2252`
- QA verdict: conditional reject. The independent QA thread
  `019f4e80-1462-7b32-8146-19ded692836c` identified three contract blockers;
  coordinator authorized exactly one follow-up documentation-only correction.

### Bounded correction decisions

- Split public-result and stress-oracle invariants by command family. A rejected
  `Step` now has a nonempty ordered attempt trace ending in terminal `blocked`;
  rejected `Undo`/`Redo`/`Reset` now explicitly use `attempts: []` and exactly
  one deterministic `command-blocked` event with frozen code/reason shape.
  Initial history/reset cases are explicit in the stress domain.
- Freeze the complete prioritized R1 rule set (`push`, `enter`, `exit`) with a
  complete enablement map. `interactionPriority` must contain every and only
  enabled rule once. After all enabled rules are not applicable, `Step` emits
  terminal `step-fallback` / `no-enabled-rule-applies`; it cannot fall through
  without a public result.
- Freeze exit selection against declared `CellAddress` semantics: resolve the
  actor address to canonical `worldId`, then compare exact `worldId/x/y` to the
  port landing. Duplicate `(innerWorldId, x, y)` landing cells are forbidden
  across all ports, leaving ambiguity only as defensive invalid-data handling.
- Performed a normative consistency pass across port validation, result/event
  shapes, stress fixtures/oracles, failure expectations, C1/V1 ownership, and
  R1 acceptance criteria. No product or implementation authority is created.

### Files and verification

- Allowed changed paths only:
  - `docs/workstreams/gameplay-rules-engine/RULES_SLICE_R1_CONTRACT.md`
  - `docs/workstreams/gameplay-rules-engine/THREAD_LOG.md`
- This is contract repair only. No source, package, configuration, QA file,
  root changelog, test run, merge, rebase, or push is permitted or claimed.
- Required pre-commit checks: exact path scope, `git diff --check`, and
  `git show --check` after committing.
- Commit: pending one scoped follow-up documentation commit. Report its SHA to
  coordinator and independent QA, then stop; a conditional-reject repair does
  not authorize C1, V1, Stage 6, release, or production development.

## 2026-07-11 - D0 repository-contract review (conditional reject)

- Reviewer thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Candidate reviewed read-only: `e07808364febb2c6607fb6d962bf53fddd6c2cf3`
  (`docs: define Phase A implementation contracts`) on `main`.
- Review scope: gameplay/engine contract, path ownership, and core-to-runtime
  migration only. No production, root-contract, package, root-changelog,
  merge, rebase, or push change was made.

### Verdict

**CONDITIONAL REJECT.** D0 must add a bounded, coordinator-authorized shared
public-contract migration gate before C1 can be accepted for implementation.
Without it, the required frozen public-command/result/event migration cannot
both honor C1's exact excluded paths and leave the repository typecheck/build
green before V1.

### Evidence and findings

1. `CURRENT_TASK.md` requires C1 to migrate the public API to
   `Step`/`Undo`/`Redo`/`Reset` and typed total
   attempt/result/rejection/transaction/event values (lines 102-112), yet
   excludes all projection, runtime, animation, and render paths (lines
   114-119). It still makes whole-repository typecheck, all Vitest suites, and
   build mandatory C1 evidence (lines 121-127), while V1 production edits are
   prohibited until after QA-C1 (lines 48-50 and 137).
2. The accepted R1 contract freezes `PublicCommand` as exactly
   `Step | Undo | Redo | Reset` (R1 lines 73-80), its discriminated
   `CommandResult` (lines 281-337), and `SemanticEvent` values with occurrence
   addresses (lines 359-421). R1 assigns the legacy-consuming runtime,
   animation, projection, and render paths to V1 (lines 561-564) and states
   that a shared type migration is allowed only through a new
   coordinator-approved slice with named C1 and V1 owners (lines 566-571).
3. The candidate's unchanged source tree has direct compile-time consumers
   outside C1 ownership:
   - `src/runtime/EventPipeline.ts` imports `SimulationCommand`, dispatches
     the old reducer result, exposes `accepted`/free-form `reason`, and passes
     legacy `TransitionEvent[]` to animation.
   - `src/runtime/GameRuntime.ts` and `src/runtime/InteractionPrototype.ts`
     import and emit `Move`/`Enter`/`Exit`/`SimulationCommand`; both retain
     `container-b`-based recursive commands.
   - `src/animation/transitions.ts` and its test import legacy
     `TransitionEvent` and discriminate `move`/`push`/`blocked`/
     `enterWorld`/`exitWorld` rather than the frozen semantic events.
   - `src/core/systems.ts`, which is included by `tsconfig.json` but absent
     from C1's owned paths, imports `Move`, `SimulationCommand`, and
     `CommandDispatchResult`.
   `tsconfig.json` includes all of `src`, so removing or replacing the legacy
   exports to satisfy the frozen public contract makes these consumers fail
   typecheck before V1 is permitted to change them.
4. A C1-only legacy adapter is not a sound escape hatch. `Move(direction)` can
   map to `Step(direction)`, but legacy `Enter(containerId)` and
   `Exit(containerId)` carry a fixture/container choice rather than the
   `Step(direction)` required by R1's exact port and address selection. Such
   an adapter would either preserve an uncontracted public command or put port
   selection back into runtime, contradicting R1's deterministic selection
   rules.
5. The remaining gameplay rules are internally consistent. `AGENTS.md` lines
   121-130 and 134-149 require total non-throwing typed dispatch, deterministic
   `Step`, full `cycleMode: "forbid"` validation, and the fixed stress oracle;
   these agree with `CURRENT_TASK.md` lines 104-112 and R1's result semantics
   (lines 200-203 and 340-357), complete containment validation (lines
   430-464), and 1,000-sequence generator/oracle (lines 466-554). C1's
   explicit exclusion of push-in/out and cyclic gameplay matches R1 and
   introduces no additional contradiction.
6. `DESIGN.md` does not leak rule implementation into presentation. It keeps
   camera/pixels outside canonical state (lines 95-117), requires a visual
   completion barrier only for accepted commands (lines 200-223), and assigns
   shell UI to React and gameplay visuals to PixiJS (lines 225-235). Its
   renderer-only blocked feedback is compatible with R1's typed blocked event:
   presentation consumes the event and never creates history.

### Required D0 correction before C1 authorization

- Insert a named, coordinator-approved compatibility/migration slice before
  C1 (or revise the sequence equivalently) with both the gameplay/C1 and
  frontend/V1 owners named, as R1 requires. It must state that it is the only
  permitted shared public-type boundary migration and must obtain independent
  QA review before C1 begins.
- Give that slice exact minimum source/test ownership for every legacy consumer
  it must update: `src/core/systems.ts`; `src/runtime/EventPipeline.ts`,
  `GameRuntime.ts`, and `InteractionPrototype.ts`; `src/animation/transitions.ts`;
  and their affected tests. Add projection files only if the selected C1 state
  representation makes them compile-time consumers. Do not authorize V1
  occurrence-address projection, visual-lock, rendering, level, or content
  work in this compatibility slice.
- Freeze an adapter policy: runtime input must emit only `PublicCommand`; no
  `Enter(containerId)`/`Exit(containerId)` compatibility path may choose ports,
  containers, or directions. The migrated event pipeline/animation adapter
  must consume frozen `CommandResult`/`SemanticEvent` without redefining core
  rules. The slice must prove `npm.cmd run typecheck`, all Vitest suites, and
  `npm.cmd run build` before C1 is allowed to start.

### Commands and handoff

- Read the candidate itself with `git show e078083`; its diff was verified as
  documentation-only and `git diff --check e078083^ e078083` passed.
- Inspected the candidate's `AGENTS.md`, `CURRENT_TASK.md`, `DESIGN.md`,
  `docs/reboot/CURRENT_STATUS.md`, accepted R1 contract, `tsconfig.json`, and
  the referenced core/runtime/animation/projection source with `git show`,
  `git grep`, and `git ls-tree`.
- No executable tests were run: this is a documentation-only static
  compatibility review, not a production candidate.
- Commit: pending one log-only review commit. Report its SHA and this log path
  to the coordinator, then stop. This review does not authorize C1.

## 2026-07-11 - Corrected D0/I1 chain re-review (conditional reject)

- Reviewer thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Candidate range reviewed read-only:
  `e07808364febb2c6607fb6d962bf53fddd6c2cf3..ade2678fbe187b8950f1635b103807a900acc73a`.
- Candidate HEAD: `ade2678fbe187b8950f1635b103807a900acc73a`
  (`docs: resolve Phase A migration gates`).
- Review scope: corrected D0/I1 documentation and real compile-time consumer
  paths only. No production, package, root-changelog, merge, rebase, or push
  change was made.

### Verdict

**CONDITIONAL REJECT.** I1 resolves the prior concrete consumer/path deadlock,
but D0 leaves an unqualified higher-precedence stop condition that orders I1's
named owners to stop before making the very shared public-interface migration
that I1 authorizes. One explicit I1 exception is required in `AGENTS.md` before
the chain is executable without contradictory authority.

### I1 verification

- `CURRENT_TASK.md` lines 95-104 names the gameplay/core owner, frontend
  consumer owner, and independent QA reviewer. Lines 106-114 require a linear
  two-commit chain: gameplay creates the bridge first, frontend starts from its
  exact SHA, and QA reviews the indivisible chain. The core and consumer exact
  path lists (lines 116-130) are disjoint.
- Lines 132-156 freeze the correct bridge: runtime-facing code uses only
  `PublicCommand`/`CommandResult`/`SemanticEvent`; translation is centralized
  in `src/core/legacyRuntimeAdapter.ts`; it cannot choose a container, port, or
  destination and carries no fixture ID; and directionless
  `Enter(containerId)`/`Exit(containerId)` cannot be mapped to `Step`.
- Lines 158-169 require full-repository typecheck, all Vitest suites, build,
  boundary searches, diff checks, and independent QA-I1 before C1. Lines
  190-211 then make C1 consume the already migrated surface, delete the bridge,
  and perform no second public-type migration.
- Candidate-tree searches found no missing required I1 consumer path. The
  legacy imports outside the gameplay half are exactly the listed runtime
  files/tests and `src/animation/transitions.ts` plus its test. The previously
  omitted `src/core/systems.ts` is now in the gameplay half. `src/audio/AudioManager.ts`
  consumes only the internal `AudioCue` plan type, while projection/render
  consume stable state/direction values; neither must change for this bridge.
  Legacy internals retained in `movementResolver.ts`, `recursiveTransitions.ts`,
  and history remain behind the centralized gameplay bridge and are not
  runtime-facing after I1.

### Remaining authority blocker

- R1 permits a shared public type migration only through a new
  coordinator-approved slice with named C1/V1 owners (R1 lines 566-571), which
  I1 substantively supplies. However, candidate `AGENTS.md` has higher
  precedence than `CURRENT_TASK.md` (lines 19-41) and still says every worker
  must stop when "a public type change would cross the frozen C1/V1 boundary"
  (lines 244-255), without an I1 exception.
- I1 necessarily performs that cross-boundary change: its gameplay half defines
  the bridge and its frontend half migrates runtime/animation consumers. Under
  the literal higher-precedence stop condition, each named I1 owner must return
  to the coordinator instead of editing, even though `CURRENT_TASK.md` lines
  54-58 and 106-169 authorize the chain. This is a contradictory authority,
  not a missing source path.

### Required D0 correction

- Amend the `AGENTS.md` stop condition to retain the freeze for all ordinary
  cross-boundary changes while explicitly allowing the sole
  coordinator-authorized I1 two-commit chain described in `CURRENT_TASK.md`,
  provided it has the named gameplay/frontend owners, exact paths, combined QA
  acceptance, and no C1/V1 semantic redefinition. No other exception should be
  implied.

### Commands and handoff

- Read the corrected candidate itself with `git show ade2678`, compared the
  full `e078083..ade2678` range, and verified it remains documentation-only on
  the same five root/coordinator paths. `git diff --check e078083 ade2678`
  passed.
- Searched the candidate source tree with `git grep` for legacy
  `Move`/`Enter`/`Exit`/`SimulationCommand`/`CommandDispatchResult`/
  `TransitionEvent` consumers, and inspected `tsconfig.json`, runtime,
  animation, projection, render, and audio dependencies.
- No executable tests were run: this is a documentation-only static re-review.
- Commit: pending one log-only review commit. Report its SHA to the coordinator
  and stop. I1/C1 code remains unauthorized.

## 2026-07-11 - Final D0/I1 stop-condition re-review (conditional reject)

- Reviewer thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Candidate reviewed read-only: `b96d261641d41800df9101efe634718db8b65d80`, a
  direct child of `ade2678`.
- Candidate scope verified: only `AGENTS.md` and the coordinator workstream
  log changed. No production, package, root-changelog, merge, rebase, or push
  change was made.

### Verdict

**CONDITIONAL REJECT.** The new wording correctly removes the absolute stop
that blocked I1, but it creates a generic exception: "an explicit,
coordinator-authorized shared migration contract such as the active I1 linear
bridge" does not itself require future bridges to be named in
`CURRENT_TASK.md`, have exact non-overlapping/linear ownership, receive
full-chain QA, or prohibit partial integration. Those safeguards are currently
written only for I1, so the exception remains broader than the accepted R1
boundary permits.

### Verification and remaining blocker

- `b96d261` changes the stop condition from an unconditional C1/V1
  cross-boundary stop to a stop for changes without an explicit
  coordinator-authorized shared migration contract, and points to I1 as an
  example. This resolves the direct textual contradiction identified in
  `31811b0`: the active I1 can now be a permitted exception.
- I1 itself remains correctly bounded in `CURRENT_TASK.md`: named gameplay,
  frontend, and QA owners; exact disjoint path lists; gameplay-first then
  frontend-on-that-SHA linear commits; full-chain QA; and no partial
  integration. Its frozen bridge still requires runtime-facing
  `PublicCommand`/`CommandResult`/`SemanticEvent`, forbids directionless
  `Enter`/`Exit` conversion and fixture/port/container selection, and makes C1
  delete the bridge without a second public-type migration.
- The current source tree is unchanged from the prior I1 review. I1's path
  lists still cover every concrete current public-interface consumer:
  runtime `EventPipeline`/`GameRuntime`/`InteractionPrototype` and tests,
  animation `transitions` and its test, and gameplay `systems.ts` plus the
  adapter/core paths. No additional compile dependency is missing; audio,
  projection, and render do not need edits for this interface-only bridge.
- However, `AGENTS.md` now permits any future "shared migration contract" that
  is merely explicit and coordinator-authorized. It does not say that a future
  exception must be individually named in `CURRENT_TASK.md` with named owners,
  exact paths, a linear ordered commit chain, full-chain independent QA, and
  an explicit no-partial-integration rule. "Such as I1" is illustrative, not a
  restrictive "only if" condition; it is therefore a generic loophole.

### Required final D0 correction

- Replace the stop-condition exception with a restrictive condition: a public
  type crossing remains blocked **unless** the active `CURRENT_TASK.md`
  individually names the coordinator-authorized shared migration, its named
  owners and exact non-overlapping paths, mandatory linear handoff order,
  full-chain independent QA, and no-partial-integration rule. State that I1 is
  the sole currently active instance and that any future instance requires a
  new coordinator authorization and those same fields. This preserves the
  freeze while allowing exactly the audited I1 chain.

### Commands and handoff

- Read the candidate itself with `git show b96d261`, compared it to `ade2678`,
  and ran `git diff --check ade2678 b96d261`; the check passed.
- Reused the prior candidate-tree `git grep` consumer inventory because this
  direct child changes only documentation, then rechecked I1's exact path
  lists against that inventory.
- No executable tests were run: this is a documentation-only authority review.
- Commit: pending one log-only review commit. Report its SHA to the coordinator
  and stop. I1/C1 code remains unauthorized.

## 2026-07-11 - Final D0/I1 closed-gate re-review (accept)

- Reviewer thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Candidate reviewed read-only: `15a5443b8f4e93dfa5e063d0a57826394e343f7c`, a
  direct child of `b96d261`.
- Candidate scope verified: only `AGENTS.md` and the coordinator workstream
  log changed. No production, package, root-changelog, merge, rebase, or push
  change was made.

### Verdict

**ACCEPT.** The final delta closes the sole remaining generic-exception
blocker without weakening the ordinary cross-workstream public-type freeze.

### Evidence

- `AGENTS.md` now stops every cross-workstream public-type change unless all
  four conditions are frozen before the first file edit: `CURRENT_TASK.md`
  names the one shared slice and exact public types; the coordinator names
  owners, exact disjoint paths, and linear commit order; the contract forbids
  partial integration and requires whole-repository verification of the full
  chain; and named independent QA accepts that complete chain by SHA.
- The same clause states that I1 is the only currently authorized exception and
  that every future bridge needs fresh explicit coordinator authorization plus
  a `CURRENT_TASK.md` update before work. It is restrictive rather than the
  prior illustrative "such as I1" wording, so it creates no generic loophole.
- The active I1 section already satisfies all four frozen conditions: it names
  `PublicCommand`, `CommandResult`, and `SemanticEvent`; assigns the gameplay,
  frontend, and QA tasks; lists exact disjoint paths and gameplay-first then
  frontend-second linear history; forbids partial integration; requires
  whole-repository typecheck/test/build and full-chain QA; and makes C1 remove
  the bridge without a second public-type migration.
- This direct documentation-only child leaves the prior candidate source tree
  unchanged. The rechecked I1 inventory therefore remains complete: runtime
  `EventPipeline`/`GameRuntime`/`InteractionPrototype` and tests, animation
  `transitions` and its test, and gameplay `systems.ts` plus bridge/core paths
  cover every current public-interface compile consumer. No additional I1 path
  is required.

### Commands and handoff

- Read `15a5443` directly, compared it with `b96d261`, and ran
  `git diff --check b96d261 15a5443`; the check passed.
- No executable tests were run: this was a documentation-only delta review.
- Commit: pending one log-only acceptance commit. Report its SHA to the
  coordinator and stop. This acceptance does not begin I1 or C1 code.

## 2026-07-11 - I1 gameplay/core public-interface bridge

- Thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`
- Coordinator thread ID: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Independent QA task: `019f4e80-1462-7b32-8146-19ded692836c`
- Authorization base: `0b7ebc38cc51b1fd314cdaeb3f1c8bdfa43140e6`
  (`docs: open Phase A interface bridge`), checked out detached without merge
  or rebase after a clean-worktree check.
- Authorization: only the gameplay/core half of I1. The frontend consumer half
  remains coordinator-gated after this candidate; C1 and all later slices stay
  closed.

### Contracts, consumer inventory, and assumptions

- Read the accepted root `AGENTS.md`, `DESIGN.md`, `CURRENT_TASK.md`, accepted
  R1 contract, and the latest coordinator, independent-QA, frontend, and
  gameplay logs before editing. The I1 four-condition shared-migration gate is
  satisfied by the named owners, exact disjoint paths, linear handoff, complete
  verification, and later full-chain QA.
- Inspected every current consumer of `SimulationCommand`, `Move`/`Enter`/
  `Exit`, `CommandDispatchResult`, `TransitionEvent`, history/session, and
  systems. Gameplay-owned compatibility consumers are `commands`, `reducer`,
  `history`, `replay`, `systems`, and core tests. The remaining runtime and
  animation consumers are frontend-owned and intentionally unchanged in this
  first commit.
- I1 public dispatch will expose only `PublicCommand` (`Step`, `Undo`, `Redo`,
  `Reset`) and a stable reducer `dispatchPublicCommand(session, command)` entry
  returning the next internal `SimulationSession` plus frozen `CommandResult`.
  Legacy `dispatchCommand`, `SimulationCommand`, `Move`/`Enter`/`Exit`,
  `CommandDispatchResult`, and `TransitionEvent` remain explicitly deprecated
  compatibility only for unchanged consumers.
- The bridge translates only public `Step(direction)` to legacy `Move` and
  translates legacy movement/push/history/reset outcomes into frozen public
  shapes. It does not implement R1 port/enter/exit/cycle rules, select a
  container/port/world/destination, or contain a fixture ID. Directionless
  legacy `Enter(containerId)`/`Exit(containerId)` are not public and are never
  mapped to `Step`.
- Public transaction sequence is session metadata, not canonical state/hash.
  Accepted bridge transactions retain semantic-event metadata on legacy history
  records solely to make public undo/redo deterministic; C1 must remove this
  temporary compatibility layer while retaining the public reducer surface.
- Any unsafe legacy preflight, unrepresentable history record, or caught legacy
  exception returns one typed unchanged-state public rejection. This bridge
  makes no recursive-correctness claim.

### Allowed paths and planned verification

- Allowed production/test paths are exactly the I1 gameplay list in
  `CURRENT_TASK.md`, plus this log. No runtime, animation, projection, render,
  app, audio, package/config, root documentation/changelog, level, screenshot,
  merge, rebase, or push change is permitted.
- Planned checks: clean `npm.cmd ci --no-audit --no-fund`, typecheck, Vitest,
  build, `git diff --check`, exact changed-path audit, and source searches that
  the new adapter/public dispatch contains no `container-b` or fixture
  selection.

### Implemented bridge and verification evidence

- Added the frozen R1 public data shapes in `src/core/types.ts`: addressed
  cells/entities/ports, attempts, typed rejection code/reason values,
  transaction IDs, `CommandResult`, and `SemanticEvent`. The legacy
  `TransitionEvent` remains marked deprecated and is not redefined as public.
- Added `Step(direction)`, `PublicCommand`, and `isPublicCommand` in
  `commands.ts`; `Move`/`Enter`/`Exit`/`SimulationCommand` remain documented
  I1-only compatibility. `dispatchPublicCommand(session, command)` in
  `reducer.ts` is the stable frontend-facing entry and returns
  `PublicDispatchEnvelope { session, result }`.
- Added `legacyRuntimeAdapter.ts` as the only legacy translation boundary. It
  maps public Step to legacy Move atomically, emits walk/push transactions and
  semantic events, records session-only transaction sequence/history metadata
  for deterministic public undo/redo, and maps unsafe/unrepresentable cases to
  typed unchanged-state rejections. It contains no `container-b` or fixture
  selection. It does not call or map legacy Enter/Exit.
- Added public replay/system conveniences while preserving legacy APIs and
  existing callers. C1 must replace/delete the adapter internals and legacy
  exports without changing `dispatchPublicCommand` or frozen public types.
- `npm.cmd ci --no-audit --no-fund`: passed, 64 packages added.
- Verification runtime: Node `v24.12.0`; npm `11.6.2`.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run test`: passed, 10 files / 44 tests. New coverage includes public
  walk/push translation, ordered attempts, typed unchanged rejection, actor
  preflight, initial and accepted Undo/Redo/Reset shapes, transaction/event/
  address invariants, legacy compatibility, directionless Enter/Exit exclusion,
  caught-adapter exception conversion, and deterministic public replay.
- `npm.cmd run build`: passed. The existing Vite chunk-size advisory remains
  (520.29 kB minified main chunk); no package/configuration change was made.
- `git diff --check`: passed. Static boundary search found no `container-b` or
  fixture occurrence in `legacyRuntimeAdapter.ts` or `dispatchPublicCommand`.
  The search also confirms all remaining legacy runtime/animation consumers are
  the explicitly frontend-owned I1 paths.
- Representative deterministic trace: the Stage 3B initial canonical hash is
  `aeaaa2a1`; `dispatchPublicCommand(session, Step("right"))` accepts as
  transaction sequence `1`, `rule: "walk"`, changes canonical hash to
  `dedf1068`, emits one forward `entity-moved` event at root address
  `world-a`/empty path, and leaves the corresponding public Undo/Redo trace
  deterministic in tests. Session transaction metadata is not passed to
  `hashState`.

### Handoff status

- Candidate commit: pending exact scoped staging. The only permitted candidate
  paths are the I1 gameplay/core sources/tests plus this log; no frontend
  notification, C1 work, merge, rebase, or push is authorized after commit.

## 2026-07-12 — C1 deterministic core-safety execution (active)

- Thread ID: `019f4e82-7cb8-73c1-b4a1-d333273b359f`; coordinator:
  `019f4deb-7e83-7583-8cd5-8e6f075bc331`; independent reviewer:
  `019f4e80-1462-7b32-8146-19ded692836c`.
- Authorization base: `d3552c81894a43805854611822bcfab86e993538`, checked out
  detached after `git status --short` confirmed a clean worktree. No merge or
  rebase was performed.
- Before editing, read the root operating contract, `CURRENT_TASK.md`, the
  relevant core/presentation boundary in `DESIGN.md`, the accepted R1 contract,
  and the latest coordinator, gameplay, and QA logs. The coordinator records
  the accepted I1 chain as gameplay `a4633c2` / frontend `ef27c9c` / QA
  `9579446`, integrated before this C1 base.
- Inspected every C1-owned core module/test and all current I1 runtime and
  animation consumers. `src/runtime/EventPipeline.ts`, `GameRuntime.ts`,
  `InteractionPrototype.ts`, and `src/animation/transitions.ts` consume only
  `PublicCommand`, `dispatchPublicCommand`, `PublicDispatchEnvelope`,
  `CommandResult`, and `SemanticEvent`; they do not import legacy core command
  or event names. The legacy `Move`/`Enter`/`Exit`, `SimulationCommand`,
  `CommandDispatchResult`, `TransitionEvent`, and adapter references are
  confined to `src/core/**` at the C1 base.
- C1 implementation assumption: preserve those public I1 names/signatures
  unchanged while replacing only their internal deterministic resolution. The
  historical Stage3B fixture is minimally migrated solely to keep unchanged
  runtime consumers compiling; it is not new content. Rejected valid public
  commands must be typed and non-throwing; out-of-domain JavaScript values
  remain outside that union and may fail closed before dispatch.

### Coordinator-authorized I1 gameplay correction

- Coordinator read-only review rejected the first candidate before any
  frontend-half authorization. The correction remains inside the I1 gameplay
  half and is limited to `legacyRuntimeAdapter.ts`, its test, and this owner
  log; C1, frontend consumer edits, merge/rebase, push, and root changelog work
  remain closed.
- The public adapter now validates the runtime command value before invoking
  the legacy dispatcher. Forced legacy `Enter`/`Exit` and unknown command
  objects fail closed with the deterministic `TypeError("Invalid
  PublicCommand.")`; they cannot fall through to reset, cannot call the legacy
  dispatcher, and cannot mutate state, history, focus, hash, or transaction
  sequence.
- The non-Step compatibility mapping is exhaustive over only `undo`, `redo`,
  and `reset`. No default branch treats an unknown discriminant as reset.
- After actor/focus preflight succeeds, both a caught legacy exception and an
  accepted legacy result containing unsupported events now produce the frozen
  rejected-Step shape: a leading `walk` attempt, terminal `step-fallback`
  blocked attempt, exactly one non-transactional `command-blocked` event, and
  the original unchanged session metadata.
- Added forced-cast Enter/Exit/unknown regression coverage plus exact exception
  and unsupported-event trace/invariant coverage. Full verification and the
  amended replacement candidate SHA are recorded at handoff; no first-candidate
  SHA may be passed to the frontend owner.
- Correction verification passed: `npm.cmd run typecheck`; all Vitest suites
  (`10` files / `45` tests); and `npm.cmd run build` with only the existing
  520.29 kB Vite chunk advisory. `git diff --check`, exact-path review, and
  fixture/container/port hard-code searches passed for the correction delta.

### C1 implementation, contract decisions, and verification

- Replaced the I1 bridge with direct R1 dispatch in `reducer.ts` while keeping
  the stable `PublicCommand`, `dispatchPublicCommand(session, command)`,
  `PublicDispatchEnvelope`, `CommandResult`, `SemanticEvent`, address, and
  transaction names/signatures unchanged for runtime/animation consumers.
  `PublicDispatchEnvelope` now lives in the reducer rather than an adapter.
- Removed `legacyRuntimeAdapter.ts` and its test, plus all legacy core command,
  result, event, wrapper, system, and replay surfaces. The exact case-sensitive
  search for `Move`, `Enter`, `Exit`, `SimulationCommand`,
  `StateChangingCommand`, `CommandDispatchResult`, `TransitionEvent`,
  `legacyRuntimeAdapter`, `dispatchCommand`, `moveActor`, `enterContainer`,
  `exitContainer`, `createSimulationSystems`, and `replayCommands` has zero
  matches in `src/core/**`.
- Added one canonical R1 `ruleSet` and `portTables` state home, deep cloning
  and canonical table/port ordering, stable canonical hashing, non-throwing
  `loadSimulationState` validation, present-state validation before dispatch,
  and candidate-state validation before every commit. A malformed supplied
  session with a valid `PublicCommand` returns typed unchanged
  `invalid-level-data`; only an out-of-domain runtime command fails closed
  with the existing deterministic `TypeError("Invalid PublicCommand.")`.
- Implemented literal data-driven resolution: walk accepts immediately when
  possible, otherwise only the exact enabled `interactionPriority` order is
  evaluated. Disabled rules do not appear in attempts; all-not-applicable
  resolution ends in the frozen fallback. Entry and exit use resolved
  root-plus-focus-path addresses, exact port mappings, inverse directions, and
  focused occurrence selection. Entry versus push is priority-driven, not
  fixture-driven; exit remains after walk.
- Coordinator clarification consumed: an entity with a container component is
  normally pushable only when it has `PushableComponent`. Same-world pushing
  moves only that entity's parent-world position and preserves its contained
  world reference; it never performs a cross-port/world transfer. Tests cover
  both a pushable container under push-first priority and a non-pushable solid
  container block, plus entry-first priority for the same arrangement.
- Added deterministic full-graph `cycleMode: "forbid"` validation across all
  worlds, including unreachable components. Traversal and witnesses use
  code-point ordering rather than locale ordering. Load validation covers IDs,
  component references, bounds, solid occupancy, focus, rule masks/priority,
  every port uniqueness/inverse/landing branch, legacy cycle-enable input, and
  self/two/three/unreachable cycle cases.
- History now stores canonical transaction records. Undo reverses event order,
  reindexes, swaps endpoints, reverses portal mode/movement direction, and
  carries `sourceTransactionId`; redo restores forward events. Win changes are
  emitted only for a true predicate transition, including reverse/forward
  history behavior. Reset emits reset plus win change only when needed.
- Stress suite: exact `xorshift32`, master seed `0x51CEB00C`, anchors case 0
  `2116095627`, case 1 `2116365994`, and case 999 `1908512370`; 1,000 valid
  generated fixtures and 64-command arrays reused for direct/replay; 3,000
  initial Undo/Redo/Reset subcases; all eight rule masks; deterministic invalid
  mutation coverage; invariant oracle; and canonical JSON failure report with
  deterministic 1-minimal command reduction. The executed run completed with
  zero uncaught failures.
- Exact changed paths: `src/core/types.ts`, `commands.ts`, `components.ts`,
  `worldGraph.ts`, `collision.ts`, `movement.ts`, `movementResolver.ts`,
  `recursiveMovement.ts`, `recursiveTransitions.ts`, `reducer.ts`,
  `history.ts`, `replay.ts`, `systems.ts`, deleted
  `legacyRuntimeAdapter.ts` and `legacyRuntimeAdapter.test.ts`, new `ports.ts`,
  new `validation.ts`, updated `core.test.ts` / `replay.test.ts`, new
  `ports.test.ts` / `validation.test.ts` / `stress.test.ts`, and this log.
  `grid.ts`, `win.ts`, and `hash.ts` were inspected and consumed without
  modification. No runtime, projection, animation, render, package,
  configuration, level, serialization, root-document, changelog, merge,
  rebase, or push path changed.
- Environment/evidence: Node `v24.12.0`, npm `11.6.2`; `npm.cmd ci --no-audit
  --no-fund` passed (64 packages added); `npm.cmd run typecheck` passed;
  `npm.cmd run test` passed (`12` files / `43` tests); `npm.cmd run build`
  passed. The existing Vite advisory remains: the 533.46 kB minified main
  chunk exceeds 500 kB; no build/package configuration was changed.
  `git diff --check` passed. The source searches also found zero fixture IDs in
  `reducer.ts`, `ports.ts`, and `validation.ts`.
- Representative deterministic public traces: Stage3B initial hash
  `bc289b3b`; `Step("right")` accepts transaction sequence 1, rule `walk`,
  with root empty-path actor occurrence and final hash `f7dbec3a`. An
  unpushable right target rejects with `target-solid-not-pushable`, attempt
  trace `walk:not-applicable`, `enter:not-applicable`, `push:blocked`, one
  non-transactional command-blocked event, and unchanged hash `bb435b20`.

### C1 handoff status

- Candidate is ready for exact-path staging and the one authorized C1 commit.
  No QA/frontend notification, C1 follow-on work, merge, rebase, or push is
  authorized after the commit; await coordinator scope review and independent
  QA.

## 2026-07-12 — C1 conditional-reject amendment and final verification

- Coordinator `019f4deb-7e83-7583-8cd5-8e6f075bc331` conditionally rejected
  candidate `5b18eb0edc8398d6822e71cfed58e5a7d08e61d1` and authorized only an
  amendment on its unchanged parent
  `d3552c81894a43805854611822bcfab86e993538`. This remains the gameplay
  workstream's exact established 23-path C1 candidate; no new path, public API
  migration, frontend/QA contact, merge, rebase, or push is authorized.
- Corrected boundary push applicability: an empty out-of-bounds target is
  `push:not-applicable`, allowing later literal-priority exit evaluation;
  a started chain that runs out of bounds remains terminally blocked. Tests
  exercise both push/exit priority orders and the blocking pushable-target
  path. An accepted push now labels the actor `entity-moved` event
  `cause:"push"`; exact forward and reversed Undo event traces retain one
  aggregate push impact.
- Added candidate validation before Undo (`previousState`), Redo (`nextState`),
  and Reset (`initialState`) commits. Malformed candidates yield the frozen
  rejected non-Step result (empty attempts, one `invalid-level-data` blocked
  event) while preserving the supplied session's canonical hash, history,
  focus, and sequence.
- Made loading structurally total before clone/dereference and separated
  initial from runtime landing occupancy. Runtime accepts the controlled actor
  on a landing only at the final focused container occurrence, resolved active
  inner world, and exact active cell; a player at an unrelated landing remains
  invalid. Initial loading rejects every solid landing occupant. Port direction
  values are verified before inverse-direction calculation, and an internally
  rejected Stage3B fixture uses a deterministic valid fallback rather than
  returning an invalid clone.
- Cycle witnesses now slice the active gray-edge cycle rather than include a
  DFS prefix, while preserving code-point-stable traversal and unreachable
  component coverage. Validation/port tests cover the specified duplicate,
  direction, landing, table, rule-mask/priority, alias, depth-two, and
  malformed-input branches.
- Completed the stress oracle corrections: immutable initial/history/future
  snapshots are saved once and checked after every dispatch; event occurrences,
  push moved cells, focus/reset/win shapes, and actual win-transition cardinality
  are independently resolved against before/after snapshots. The deterministic
  free-cell helper never returns an occupied fallback. Fault-injection tests
  cover first-prefix selection, same-class 1-minimal reduction, and
  report-contained invalid fixture/diagnostic replay. The suite remains exactly
  1,000 fixtures, 64 commands per fixture, and 3,000 initial non-Step
  subcases, with fixed xorshift anchors and no time/random API.
- The prior focused stress run at the original 120,000 ms bound reached
  `124.289s` and failed only the Vitest timeout (four companion tests passed;
  there was no oracle failure report). At an intermediate 180,000 ms bound,
  the focused file passed (`1` file / `5` tests; stress body `179.76s`, total
  `180.94s`), which was too close to the bound. Per coordinator direction the
  bound alone is now `240000` ms; scale, data domain, and oracle are unchanged.
  The required subsequent full-suite second green run passed `12` files / `56`
  tests in `116.24s` (`114.77s` test time).
- Final verification on Node `v24.12.0` and npm `11.6.2`: clean
  `npm.cmd ci --no-audit --no-fund` passed (64 packages added);
  `npm.cmd run typecheck` passed; the full `npm.cmd run test` passed as above;
  and `npm.cmd run build` passed. The existing Vite chunk-size advisory remains
  (537.15 kB minified main chunk); no package/configuration change was made.
  `git diff --check` passed. Core legacy-surface, fixture-selection, and stress
  non-determinism searches returned zero matches.
- The frozen I1 boundary decision remains explicit: the valid
  `PublicCommand` domain is total and non-throwing, whereas a forced
  out-of-domain JavaScript value is rejected by `isPublicCommand` before core
  dispatch with deterministic `TypeError("Invalid PublicCommand.")`. C1 does
  not widen the public command/result/rejection unions to represent that
  out-of-domain condition.
- Amendment staging is restricted to the same 23 paths already present between
  the C1 parent and candidate: this owner log; `collision.ts`, `commands.ts`,
  `components.ts`, `core.test.ts`, `history.ts`, deleted
  `legacyRuntimeAdapter.ts` and `legacyRuntimeAdapter.test.ts`, `movement.ts`,
  `movementResolver.ts`, `ports.ts`, `ports.test.ts`, `recursiveMovement.ts`,
  `recursiveTransitions.ts`, `reducer.ts`, `replay.ts`, `replay.test.ts`,
  `stress.test.ts`, `systems.ts`, `types.ts`, `validation.ts`,
  `validation.test.ts`, and `worldGraph.ts`. `grid.ts`, `win.ts`, and
  `hash.ts` remain unmodified. The next action is only `git commit --amend`
  with the existing C1 message, followed by a coordinator-only SHA handoff.

## 2026-07-12 — C1 second conditional-reject amendment (active candidate)

- Coordinator `019f4deb-7e83-7583-8cd5-8e6f075bc331` conditionally rejected
  `15ae9e3c488eb41d6bbf367caecec23f6bcd1362` and authorized one final
  amendment on the same exact parent
  `d3552c81894a43805854611822bcfab86e993538`. The allowlist is the established
  23 C1 candidate paths plus `src/core/win.ts` (24 maximum); no public type
  migration, frontend/projection/runtime/animation/render/package/config/root
  document/changelog/level/serialization/push-in-out/cycle feature, merge,
  rebase, push, QA contact, or V1 work is authorized.
- `validation.ts` now validates unknown state data before typed use or cloning:
  scalar IDs/version/focus paths; world/entity IDs, size/palette; complete
  component literals/cross-invariants/visuals; exact rules; and ports. Tables
  and ports sort by canonical keys before duplicate/inverse/landing checks, so
  reversed input produces identical diagnostics. False/unknown literals,
  malformed records, inconsistent IDs, and non-solid containers reject stably.
- Initial loading rejects every solid landing occupant. Runtime accepts legal
  occupancy, allowing push-to-landing and then exact public
  `port-landing-occupied` rejection on entry. Tests cover player/box initial
  rejection, legal post-enter/runtime box occupancy, and unchanged rejection.
- `win.ts` now searches all colocated non-goal entities: goals cannot satisfy
  each other, optional visual filters need a matching non-goal overlay, and
  absent filters accept any non-goal candidate. Tests cover goal-only, decoy-
  before-box, multi-world all/partial satisfaction, and insertion-order safety.
- Undo/Redo authenticate selected history records before traversal: runtime
  snapshots, hash/address/transaction/source fields, exact forward stored-event
  shape, snapshot occurrence/cell/port/focus/portal positions, rule-specific
  base sequences, optional win transition, and deterministic re-dispatch must
  all agree. Known-shaped wrong cells/addresses/events, unknown events, hashes,
  IDs, and wrong rules reject unchanged `invalid-level-data`.
- Reset validates `session.initialState` with initial-state validation; a forged
  initial box on a port landing now rejects empty-attempt/null-transaction
  unchanged. Undo/Redo intentionally use runtime validation for legal gameplay
  landing occupancy.
- Stress now catches generation/mutation/load/direct/replay faults into a
  canonical report; asserts mutation code/message/witness; isolates two-world
  cycles; finds first replay divergence incrementally; and tests replay-only
  1-minimal reduction. It independently checks command/result/attempt/hash/
  address/transaction/event/history/win fields per dispatch. The fixed seed,
  1,000 fixtures, 64 commands, eight masks, 3,000 initial non-Step subcases,
  no random/time APIs, and 240,000 ms bound remain unchanged.
- Representative traces: a runtime box at `container-b`'s landing blocks root
  `Step("down")`; a focused actor can push a box onto that landing, then entry
  blocks. A matching box solves a filtered goal despite a decoy; goal-only is
  false. Known-shaped wrong historical walk cells and reset-in-walk events are
  rejected before Undo traversal.
- Efficiency authority consumed: while editing, only targeted typecheck and
  core/validation/port/replay tests ran. One final `npm.cmd run test` ran the
  complete suite: **12 files / 63 tests passed in 200.50s** (199.94s test body)
  inside the unchanged 240,000 ms bound. No separate focused stress run followed.
- Final evidence: Node `v24.12.0`, npm `11.6.2`; clean
  `npm.cmd ci --no-audit --no-fund` added 64 packages; typecheck and build
  passed. The existing Vite 537.15 kB advisory remains. `git diff --check`
  passed; legacy-core/random-time/fixed-ID-or-fixture-selection searches are
  clean. The frozen out-of-domain command remains deterministic `TypeError`
  before dispatch. `target-out-of-bounds` remains compatibility-only: empty OOB
  push is not-applicable and total fallback is `no-enabled-rule-applies`.
- Pending final amend only: stage this log plus `core.test.ts`, `reducer.ts`,
  `stress.test.ts`, `validation.test.ts`, `validation.ts`, and `win.ts`; amend
  with unchanged message `phase a c1: implement deterministic recursive rules`.
  The final candidate is the previous 23 paths plus `win.ts` (24 total), then
  report only to coordinator and stop.

## 2026-07-12 — C1 final proof/oracle amendment (active candidate)

- Coordinator `019f4deb-7e83-7583-8cd5-8e6f075bc331` conditionally rejected
  `53472f21a0ea49683ca8ef7fb526be54ea01aae6` only on proof/oracle evidence.
  Semantics and scope otherwise passed. The correction amends the same exact
  parent `d3552c81894a43805854611822bcfab86e993538`, retains the 24-path
  maximum, does not alter public APIs or scope, and remains closed to QA/V1,
  push, merge, rebase, and every non-C1 path.
- Production stored-history authentication (`reducer.ts`) now resolves a port
  occurrence only when its root equals the snapshot root, its parent container
  path resolves to the container's actual parent world, its table/port and
  declared inner world resolve, and the container anchor is known. Portal
  geometry is exact: enter begins one cell opposite `outerApproach` from that
  anchor and ends at the addressed inner landing; exit begins at the addressed
  inner landing and ends at that parent destination. The same checks naturally
  validate Undo's swapped endpoints/mode.
- The independent stress event oracle applies the same root/parent/table/
  inner-world/outer-approach geometry. Targeted production and oracle tests
  inject a known-shaped wrong root and a wrong outer cell; both reject rather
  than passing as merely structurally valid history/event data.
- Accepted-result proof is now exact: transaction rule equals the Step terminal
  accepted rule or command rule; final Step attempt deep-equals its enclosing
  transaction; only Undo uses reverse direction; base event sequences are
  fixed for walk/push/enter/exit/reset plus optional true win transition; and
  Undo/Redo preserve selected source type order (reversed for Undo) and exact
  source transaction identity.
- Replay failure reporting is now first-prefix accurate only on failure paths:
  length differences use the first missing/extra index; replay throws replay
  deterministic prefixes to find the first throw; final-only hash/win/address
  differences compare direct per-command checkpoints to replay prefixes. The
  normal 1,000-case path stays single-pass. The evaluator/minimizer is total;
  it verifies same-code 1-minimality or emits a distinct `minimizer-failure`,
  never silently reports an unminimized prefix. Cheap synthetic tests cover
  length, throw, final-only mismatch, and replay-only reduction.
- Independent history tests now assert Exit Redo portal/focus forward order,
  full addresses/cells/port/index/direction/source ID, and solved → Reset →
  Undo → Redo traces: `[reset, win false]`, reversed `[win true, reset]`, then
  forward `[reset, win false]`, each with the expected source identity.
- Verification efficiency: one erroneous broad targeted command that included
  stress was terminated before completion and is not evidence. After stable
  fast typecheck/core/validation/port/replay checks, exactly one completed full
  `npm.cmd run test` ran the exhaustive suite: **12 files / 67 tests passed in
  129.52s** (128.84s test body), inside the unchanged 240,000 ms bound. No
  separate focused stress result was used.
- Clean final gate: Node `v24.12.0`, npm `11.6.2`; `npm.cmd ci --no-audit
  --no-fund` added 64 packages; typecheck and build passed. The existing Vite
  537.15 kB chunk advisory remains unchanged. `git diff --check` passed;
  legacy-core, fixed-ID/fixture-selection, and random/time searches return
  zero. Working correction paths are this log plus `core.test.ts`,
  `reducer.ts`, and `stress.test.ts`; the amended candidate must retain the
  prior 24 paths total, unchanged commit message, clean worktree, and a
  coordinator-only handoff.

## 2026-07-12 — C1 final two-bug stress-oracle amendment (active candidate)

- Coordinator `019f4deb-7e83-7583-8cd5-8e6f075bc331` conditionally rejected
  `0f79588d24af37987fe09517e6eb9025f387bb0e` only for two stress-oracle proof
  defects. The correction keeps the exact parent
  `d3552c81894a43805854611822bcfab86e993538`, unchanged commit message, same
  24-path maximum, frozen production semantics/workload/timeout/public types,
  and the no-QA/V1/push/merge/rebase scope boundary.
- `evaluateFixture(validState, [])` is now a valid no-code trace: with no
  direct checkpoint, replay's final active address is compared with the initial
  state's active address. A real evaluator-path injected final replay mismatch
  verifies minimization retains its nonempty command rather than treating empty
  evaluation as the same code; this uses `evaluateFixture` with a test replay
  runner rather than the prior synthetic bypass helper.
- `stepAttemptTraceValid` accepts exhausted terminal `step-fallback` only with
  exact `no-enabled-rule-applies` plus reason kind `step-fallback`. The distinct
  immediate invalid-level fallback remains limited to its zero-interaction
  validation path. Fast negative coverage rejects wrong code and wrong reason
  with empty enabled priority, exercising zero enabled rules.
- Verification efficiency: an initial npm-exec targeted invocation did not
  forward its test-name argument and was terminated before any test result; it
  is not evidence. The corrected direct Vitest helper invocation passed **2
  selected tests / 8 skipped in 15ms**. Then exactly one full `npm.cmd run
  test` executed the exhaustive protocol: **12 files / 69 tests passed in
  135.27s** (134.64s test body), within the unchanged 240,000 ms bound. No
  separate focused exhaustive stress run was used.
- Final clean gate: Node `v24.12.0`, npm `11.6.2`; `npm.cmd ci --no-audit
  --no-fund` added 64 packages; typecheck and build passed. The existing Vite
  537.15 kB advisory remains. The final correction changes only this owner log
  and `src/core/stress.test.ts`; after amend the candidate retains the existing
  24 total paths, passes diff/staged/show checks and purity searches, and is
  reported only to coordinator before stopping.

## 2026-07-12 — C1 stored-history sequence-authentication amendment (active)

- Independent QA conditionally rejected
  `d6677c9e2a6d2818f898fbf97f7b2d123546b522` only for a P1 source-transaction
  sequence forgery. No QA acceptance/log commit exists. Coordinator authority
  remains an in-place amendment on exact parent
  `d3552c81894a43805854611822bcfab86e993538`, unchanged message, maximum 24
  paths, and no QA/V1/push/new-scope work.
- `dispatchPublicCommand` now fail-closes before transaction creation or source
  replay unless `publicTransactionSequence` is a finite nonnegative integer.
  Negative, fractional, `NaN`, and infinite forged metadata return frozen
  unchanged invalid-level-data shapes: Step keeps ordered walk/fallback
  attempts; non-Step keeps empty attempts and one null-transaction blocked event.
- Selected stored source records now require ID sequence integer `>= 1` and
  `<= session.publicTransactionSequence` before synthetic reproduction. This
  prevents a forged source sequence from self-validating. Existing initial-hash,
  event-ID, geometry, rule, state, and hash authentication remains intact;
  accepted transaction sequencing and history record shape are unchanged.
- Independent core coverage reproduces QA's forged past record with source ID
  and every top-level/nested event ID rewritten to `999`, and equivalent future
  Redo forgery: both reject unchanged invalid-level-data. It also covers
  `-1`, `1.5`, `NaN`, and `Infinity` session sequence for Step and Undo, plus
  legitimate source sequence `1` accepting during real Undo/Redo after public
  sequence advances.
- The stress oracle now independently requires session sequence finite integer
  `>= 0`, every past/future source record sequence `>= 1` and `<=` current,
  and top-level/nested stored-event IDs matching their source ID. The fixed
  1,000-fixture/64-command/3,000-subcase workload and 240,000 ms bound remain.
- Verification efficiency: targeted typecheck plus core/validation/port/replay
  tests passed **4 files / 37 tests in 1.12s**. Exactly one final full
  `npm.cmd run test` passed **12 files / 70 tests in 117.06s** (116.56s test
  body), including exhaustive stress; no focused exhaustive run followed. Node
  `v24.12.0`, npm `11.6.2`: clean ci added 64 packages; typecheck/build passed
  with only the existing Vite advisory. Final correction paths are this log,
  `src/core/core.test.ts`, `src/core/reducer.ts`, and `src/core/stress.test.ts`;
  amend, coordinator-only report, then stop.

## 2026-07-12 — R2D acyclic recursive-transfer contract freeze

- Coordinator `019f4deb-7e83-7583-8cd5-8e6f075bc331` authorized exactly one
  documentation-only R2D slice for gameplay task
  `019f4e82-7cb8-73c1-b4a1-d333273b359f`, on detached origin/main baseline
  `d4d99911576ba8217ed905f52c7d53e94fb39c2c`. The worktree was clean before
  checkout and remains limited to this log plus new
  `RULES_SLICE_R2_CONTRACT.md`. No source/test/package/config/root-doc/log
  outside this owner, fixtures/levels/schema/solver/assets, merge/rebase/push,
  or branch creation is authorized.
- Sources and read-only tools consumed: root `AGENTS.md`, `CURRENT_TASK.md`
  R2D section, relevant `DESIGN.md` gameplay/motion boundary, accepted R1
  contract and rules audit, latest coordinator/gameplay/frontend/QA logs, and
  the accepted C1/V1 type/consumer inventory. `rg` inspected core public
  surfaces and projection/runtime/animation/render consumers. Official public
  comparison evidence was limited to <https://www.patricksparabox.com/>,
  <https://www.patricksparabox.com/press/>,
  <https://store.steampowered.com/app/1260520/Patricks_Parabox/>, and the
  non-normative official custom-level page
  <https://www.patricksparabox.com/custom-levels/>. The last visibly exposes
  `attempt_order` and `inner_push`, but its format/content is not copied. No
  official code, assets, levels, text, audio, or community custom-level
  material was consumed as implementation input.
- Contract decisions: preserve `PublicCommand`, the stable public reducer
  entry, all R1 rule/version/priority/attempt/transaction shapes, R1/V1 state
  literals, and accepted hashes. Push-in/out are internal deterministic
  addressed submodes of public `push`, never new priority items. Add only the
  additive `entity-transferred` event; no command/rule/rejection/state union
  changes. R2 freezes walk-first R1 priority, push-submode
  reservation/order, exact addressed contiguous source-chain push-in/out with
  one terminal crossing/no parent-side chain, component-driven world-bearing container movement,
  unchanged actor focus, alias-safe derived containment, candidate graph
  validation, and cycleMode forbid.
- The contract freezes aggregate transfer event ordering, V1 single-barrier
  and no-double-feedback handoff, reverse/replay/history/win authentication,
  1,000-fixture/64-command/3,000-initial-subcase xorshift stress extension
  with the unchanged eight R1 masks plus deterministic push submodes, and a
  240,000 ms measured-timeout policy. It also names R2I as a mandatory
  core-first/frontend-directly-atop linear public migration with no temporary
  adapter, no partial integration, complete-chain verification, and later
  independent QA.
- Verification is documentation-only: read-only consumer searches plus
  `git diff --check`, staged diff check, `git show --check`, exact-parent/path
  audit, and clean status are required before the single scoped commit. npm,
  typecheck, Vitest, build, and browser capture are deliberately not run.
- Open dependencies/stop: frontend must perform read-only compatibility review
  of the exact candidate SHA; independent QA then reviews the documentation
  chain; coordinator alone may integrate/push and later create finite R2I
  source allowlists. This candidate authorizes neither R2 implementation nor
  V2-V4, levels, serialization, solver, release, or a completion claim.
- Coordinator pre-commit correction identified two blockers after the initial
  documentation candidate object existed locally. The final candidate is
  therefore amended in place on the same exact d4d9991 parent, not made a
  second commit: the false custom-level-evidence assertion is corrected and
  the undefined RuleSetR2/load-upgrade/public-rule migration is removed. Only
  documentation scope checks are rerun; implementation remains stopped.
- Final QA-preflight correction further freezes contiguous source-chain
  transfers: terminal/farthest Q crosses exactly one port, remaining Q entries
  shift far-to-near, actor enters the nearest former cell, and no destination/
  parent-side chain or transfer fallthrough is allowed. It preserves R1
  load-time empty-landing validation; push-out sources arise only by accepted
  gameplay runtime occupancy.
- Event/feedback correction: `push-resolved` remains the sole aggregate
  impact/audio event and holds only same-world shifted payload motions;
  `entity-transferred` represents exactly one cross-world terminal payload with
  mode, addressed endpoints, port, and optional carried subtree. Actor remains
  the existing `entity-moved(cause:"push")`; forward and reverse ordering,
  transaction/event/source identity, stored history authentication, and replay
  requirements are explicitly frozen.
- Stress correction: one combined R2-superset 1,000-fixture/64-command run
  replaces any separate R1 run; it retains master seed `0x51CEB00C`, anchors,
  3,000 initial subcases, minimizer/failure schema, and eight R1 masks.
  Mandatory coverage counters require local and ordinary/world-bearing transfer
  success plus every named blocked/cycle branch, gap-no-transfer regression,
  all eight masks, and unchanged/resolvable focus assertions; a zero counter
  fails the candidate. Malformed focus remains a targeted invalid-data test,
  not an unreachable valid-transfer branch. Transfer stored-history forgeries
  are separate targeted tests, including recomputed-hash state/port geometry
  attacks.
- R2I now names a core commit, frontend consumer/runtime/render commit, and
  evidence-only direct child. `GameCanvasHost` plus new `r2QaScenario` and its
  test (not V1's scenario) belong to the frontend implementation commit. The
  third commit contains only exact R2 Markdown/JSON, 12 PNG evidence files, and
  the frontend log; it changes no behavior. Evidence uses 1440x900 DPR1
  forward/Undo midpoint comparisons and no redundant Redo capture. General
  capture automation remains V4. The candidate stays documentation-only, must
  be amended in place on d4d9991, and stops for frontend read-only review and
  independent QA after coordinator routing.

## 2026-07-13 — R2D coordinator recovery amendment

- After quota reset, the gameplay owner resumed but entered a local tool-
  approval wait before changing any file and then stopped on coordinator
  supersession. A bounded recovery amended the same documentation candidate in
  place, on the same `d4d9991` parent and the same two gameplay-owned docs
  paths. This is candidate recovery only; frontend compatibility review and
  independent QA remain mandatory, and no later production ownership changes.
- The push classifier is now executable: it reserves exact focused-landing
  push-out first, classifies the first solid container after a nonempty
  contiguous payload chain as push-in receiver before that receiver's pushable
  flag, and otherwise resolves ordinary local push. A gap cannot be skipped
  and no fixture/profile branch exists at runtime.
- Unreachable transfer-specific focus/ancestor public codes, reason, and
  counters were removed. Existing invalid-data/focus/cycle outcomes remain;
  every candidate preserves and re-resolves the exact unchanged focus.
- The combined stress trace preserves all 64 existing weighted draws and
  locates the first generated Step without inserting slot zero or mutating the
  seed stream. The additive transfer event freezes entity/cell equality,
  exact carried-subtree prefix rebasing, and no ID fallback.
- A lightweight read-only reproduction of the existing xorshift command draw
  over all 1,000 frozen case seeds found no trace without a Step; the latest
  first Step was slot 6 (`0:620`, `1:244`, `2:97`, `3:24`, `4:10`, `5:4`,
  `6:1`). This validates the contract assertion without changing the generator
  or running the exhaustive suite during a documentation-only slice.
- The three-commit boundary is corrected: R2 QA host/scenario source and test
  belong to frontend implementation, while the third commit is evidence-only.
  `AnimationSystem` remains read-only because its existing controller-owned
  global progress is sufficient; transfer interpolation consumes that value
  from the owned transition/Pixi/recursive-renderer paths without a second
  clock.
