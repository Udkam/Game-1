# Tetris T3 Core Workstream Log

- Workstream: `TETRIS-T3-C1`
- Coordinator thread: `019f4deb-7e83-7583-8cd5-8e6f075bc331`
- Owner branch: `codex/tetris`
- Authoritative base: `a59d6a638e40329129c83796b6455976c6857d10` (`origin/codex/tetris`)
- Ownership: deterministic six-level Puzzle campaign core only. The permitted non-core
  exception is the legacy Puzzle QA scenario fixture. No runtime layout, storage,
  rendering, root-document, Temple, or screenshot path is in scope.
- Pre-existing untracked `docs/screenshots/temple/` remains excluded and untouched.

## C1 implementation record

- Inspected with Python UTF-8: `AGENTS.md`, `DESIGN.md`, `CURRENT_TASK.md`, latest
  `docs/logs/CHANGELOG.md`, all accepted `docs/workstreams/tetris-t3-rules/` contract,
  level, replay, verifier, and handoff artifacts, plus the current core and QA scenario.
- Replaced only the legacy production `offset-01..03` Puzzle data with the accepted six
  typed T3R levels. Runtime data is compiled and immutable; production core does not read
  workstream files or the filesystem.
- T3 Puzzle state now carries immutable board rows/full queue, spawn index, canonical-board
  empty goal, outcome, completion ID, and next unlock ID. The deprecated target-lines field
  remains a type-only presentation bridge and is never read by Puzzle rules.
- Shared delayed line resolution is retained. The accepted replay inputs are preserved in
  order; public ticks are inserted only where the existing 12-tick line-clear phase must
  resolve before the next accepted action or terminal result.
- Iteration-only focused checks completed so far:
  - `npm.cmd run test -- src/game/core/puzzles.test.ts src/game/core/puzzleCampaign.test.ts src/game/runtime/qaScenario.test.ts`
    -> 3 files / 22 tests passed before fixed-hash assertions were added.
- Additional focused campaign and QA runs established the committed fixed canonical hashes
    and event digests; the final focused regression run and one-time final gates remain pending.

## C1 final-gate blocker

- Final focused regression before gates:
  `npm.cmd run test -- src/game/core/core.test.ts src/game/core/rules.test.ts src/game/core/race.test.ts src/game/core/puzzles.test.ts src/game/core/puzzleCampaign.test.ts src/game/runtime/qaScenario.test.ts`
  -> 6 files / 49 tests passed.
- Required typecheck (one run after the final source edit): `npm.cmd run typecheck` -> passed.
  The first typecheck identified test-only `node:fs` type availability and an unsafe illegal-piece
  fixture cast; both were corrected with JSON module imports and a deliberate `unknown` test cast,
  then the one post-correction typecheck passed.
- Required complete Vitest (one run): `npm.cmd run test` -> **BLOCKED**, 10 files passed and the
  pre-existing design-only `docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`
  failed 12 tests. Its faithful adapter hardcodes `createInitialState(..., 'puzzle', 'offset-01')`.
  T3 C1 correctly removes that legacy ID, and this workstream is explicitly forbidden from editing
  the T3R directory or retaining old-ID aliases/compatibility layers.
- Build was not run and no candidate commit was created: the full-suite failure must be resolved by
  a coordinator-authorized T3R verifier migration or an explicit compatibility decision. No gate
  was repeated and no forbidden path was altered.

## C1B test-contract deadlock resolution

- Coordinator authorized exactly one additional path:
  `docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`.
- Removed the verifier's only legacy production dependency (`offset-01`) and its manually built
  `GameState` adapter. It now creates every run through `createInitialState(seed, 'puzzle',
  level.id)` and advances only via public `dispatch` commands, adding public ticks solely for the
  existing delayed line-clear phase.
- The historical `currentAdapterInitialHash`, `currentAdapterFinalHash`, and `eventDigest` JSON
  fields are now format/static-integrity evidence only. The C1 core suite remains the production
  hash/event-order authority; this independent verifier checks production determinism, definition
  drift, first terminal success, exact queue consumption, board emptiness, conservation, and unlock
  fields.
- Required first check after migration:
  `npm.cmd run test -- docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`
  -> 1 file / 12 tests passed.
- No old-ID alias, production rollback, source-state injection, levels/replay JSON change, Temple,
  or other T3R document modification was made. Final typecheck, full Vitest, build, audit, and
  candidate commit are pending.

## C1B final gates and candidate preparation

- `npm.cmd run typecheck` -> passed.
- `npm.cmd run test` -> 11 files / 73 tests passed. This is the single post-migration full-suite
  run; the earlier failed full run remains recorded above as pre-C1B evidence only.
- `npm.cmd run build` -> passed (`tsc -b && vite build`). No browser/capture/npm-ci run was added.
- Audit: `git diff --check` passed; the tracked dirty set is limited to the authorized C1 core/QA
  paths plus the explicitly authorized T3R verifier. The only untracked paths are the pre-existing
  excluded Temple screenshots and the intended C1 core log/test. Legacy `offset-01..03` IDs are
  absent from production and verifier code. `puzzleTargetLines` remains only the documented
  deprecated bridge declaration/null initialization/assertion; Puzzle engine rules do not read it.
- Six production final hashes verified by C1 tests: `t3r-shaft-01=de7d2dbd`,
  `t3r-shaft-02=760c710d`, `t3r-shaft-03=2f1d9bf4`, `t3r-shaft-04=73cbfcf0`,
  `t3r-cascade-05=29e0146c`, `t3r-cascade-06=404ab9ea`.
- Candidate commit is the remaining authorized action; it will exclude every Temple path and will
  not be pushed.
