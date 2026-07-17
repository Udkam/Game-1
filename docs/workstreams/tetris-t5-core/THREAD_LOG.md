# Tetris T5 Core Workstream Log

## 2026-07-16 — AUTHORIZED

- Task: `TETRIS-T5-CORE-001`
- Branch: `codex/tetris-recovery`
- Starting HEAD: `dd7e31ea3547c18a797b2308f04161310d1412ce`
- Rule authority: `4c8582854088695ebac90467842dc2bc0cef3a20`
- Scope: endless accelerating Race; longer Puzzle definitions; grounded soft-drop
  lock/queue repair; deterministic T5 references; runtime QA and leaderboard migration.
- Exact path boundary: the Core paths listed in `CURRENT_TASK.md` plus this log.
- Forbidden: frontend/render/progress files, T3/T4 evidence, coordinator docs,
  changelog, commit/push.
- Required candidate: one writer commit with exact commands/evidence and a read-only
  QA handoff.
- Blocker: none.
- Next: implement the bounded core slice.

## 2026-07-16 — CANDIDATE READY

- Task: `TETRIS-T5-CORE-001`
- Branch: `codex/tetris-recovery`
- Writer intake HEAD: `9fc3cae6e07ebcfa8d82769f804c6d80c7d17485`
- Coordinator boundary commits received while the writer was active:
  - `bcf7ce1e33dcb0bf9a7f5d90fd6ee7362cb5d9be` authorized migration of stale
    Puzzle test/runtime QA assertions without opening production frontend/render paths.
  - `3f6a03ae652c75b5bfc74ae131dcd10e7aa7ced0` authorized the verifier-only
    T3 test correction after the full suite exposed its obsolete production coupling.
- Candidate SHA: this single writer commit; exact SHA is reported to the coordinator
  immediately after commit creation.

### Exact changed paths

- `src/game/core/constants.ts`
- `src/game/core/engine.ts`
- `src/game/core/puzzles.ts`
- `src/game/core/types.ts`
- `src/game/core/race.test.ts`
- `src/game/core/puzzles.test.ts`
- `src/game/core/puzzleCampaign.test.ts`
- `src/game/core/puzzleFlow.test.ts`
- `src/game/runtime/GameRuntime.ts`
- `src/game/runtime/GameRuntime.test.ts`
- `src/game/runtime/qaScenario.ts`
- `src/game/runtime/qaScenario.test.ts`
- `src/leaderboard.ts`
- `src/leaderboard.test.ts`
- `src/puzzleProgress.test.ts` (test-only fixture migration authorized by `bcf7ce1`)
- `docs/workstreams/tetris-t5-core/puzzle-references.json`
- `docs/workstreams/tetris-t5-core/search-puzzles.mjs`
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md`
- `docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`
  (verifier-only historical-boundary correction authorized by `3f6a03a`; no T3 data,
  replay, evidence, or log artifact changed)

### Delivered behavior and evidence

- Race has no successful line terminal. Clear resolution at 20 or any other line count
  remains `playing` and spawns the successor.
- Race speed tier is
  `floor(pieceCount / 5) + floor(lines / 4)`, clamped to the 17-entry safe gravity
  curve. Runtime QA now proves a deterministic live 24-line endurance milestone.
- Leaderboard schema v3 accepts only top-out rows. Race ordering is endurance-first:
  pieces, lines, score, then lower elapsed ticks.
- All six T5 Puzzle definitions use grounded solid-skyline boards with seven occupied
  rows, at least four distinct row shapes, 11/13/14/14/15/15 pieces, all seven piece
  types, and no identical-piece run longer than two.
- `puzzle-references.json` freezes six complete public-command routes. Every route uses
  the full budget, at least four effective rotations, at least five landing x values,
  at least one non-clearing lock, and multiple separated clear phases. It records
  initial/final hashes plus command/event digests.
- The same fixture freezes one legal one-column neighboring decision per level; all six
  consume the budget, retain canonical cells, and end `failed-budget` with stable hashes.
- Puzzle automatic gravity remains disabled. A soft-dropped grounded piece now advances
  the shared lock delay, enters the ordinary entry delay, and spawns the exact next
  authored piece. Hard-drop clear/no-clear routes are covered by the full references.
- `search-puzzles.mjs` is retained only as a bounded, deterministic clean-room authoring
  helper. It is not imported by production and is not a test gate; the authoritative
  proof is the real engine `dispatch` verifier in `puzzleCampaign.test.ts`.
- The frozen T3 verifier now checks only its own levels/replays shape, digest, command,
  queue, landing, and static cell-conservation facts. It no longer compares those
  historical artifacts with current T5 production definitions.
- Deprecated `RACE_TARGET_LINES` remains exported only so the still-blocked frontend
  slice compiles; no Core/runtime path reads it. The frontend slice must remove its old
  Race copy and then may remove this compatibility export.

### Commands actually run

- Focused T5 convergence:
  `npm.cmd run test -- src/game/core/race.test.ts src/game/core/puzzles.test.ts src/game/core/puzzleCampaign.test.ts src/game/core/puzzleFlow.test.ts src/game/runtime/qaScenario.test.ts src/game/runtime/GameRuntime.test.ts src/leaderboard.test.ts src/puzzleProgress.test.ts src/game/render/presentation.test.ts`
  — PASS, 25 files / 123 tests.
- Historical verifier correction:
  `npm.cmd run test -- docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts`
  — final PASS, 3 files / 36 tests.
- First final typecheck exposed TS7022 at the two public-route movement loops. Both
  `beforeX` values were explicitly typed as `number`; no behavior changed.
- The next full suite exposed only the obsolete T3 verifier coupling: 36 files passed,
  1 historical verifier file failed 7 assertions. Work stopped until coordinator commit
  `3f6a03a` opened the verifier-only correction above.
- Final `npm.cmd run typecheck` — PASS.
- Final `npm.cmd run test` — PASS, 37 files / 234 tests.
- Final `npm.cmd run build` — PASS; Vite transformed 739 modules and produced the
  production bundle.
- `git diff --check` — PASS before final gates; line-ending notices only.

### Handoff

- Blocker: none.
- Push: not performed; coordinator owns integration and push decisions.
- Next: independent read-only Core QA must inspect the exact reported candidate SHA,
  rerun only the proportionate Core/T5 checks it needs, and report ACCEPT or REJECT to
  the coordinator before the frontend slice begins.

## 2026-07-16 — QA FIX PAUSED FOR CONTRACT UPDATE

- Task: `TETRIS-T5-CORE-QA-FIX-001`
- Base SHA: `3bf170ec252cc971b1f65d73b4649fabb2500dbb`
- Independent QA result: **REJECT**. The sole finding was the DEV
  `RuntimeQaSurface.replayScenario` hook assigning an offline replay terminal state
  directly into the mounted live runtime, bypassing visible UI and canonical play.
- Exact changed paths so far:
  - `src/game/runtime/GameRuntime.ts`
  - `src/game/runtime/GameRuntime.test.ts`
  - `docs/workstreams/tetris-t5-core/THREAD_LOG.md`
- Fix: removed the replay imports, QA-surface type member, live callback, and all direct
  replay-state assignment. The pure functions in `qaScenario.ts` remain isolated unit
  helpers and are not exposed on `window`.
- Proof: the mounted QA surface has no `replayScenario`, `setState`, or `replaceState`;
  mutating the structured clone returned by `getState()` cannot alter runtime state.
- Targeted command:
  `npm.cmd run test -- src/game/runtime/GameRuntime.test.ts` — PASS, 3 files / 10 tests.
- Final typecheck/full test/build: intentionally not run. The coordinator paused the
  candidate after the user superseded the finite-queue Puzzle contract with normal-play
  seeded seven-bag, automatic-gravity, no-budget Puzzle rules.
- Commit/push: not performed.
- Blocker: `DESIGN.md` and `CURRENT_TASK.md` must be updated before any new Puzzle rule
  implementation is authorized.
- Next: retain this minimal QA fix in the dirty worktree and wait for the coordinator's
  revised bounded Puzzle slice.

## 2026-07-16 — NORMAL-PLAY PUZZLE CANDIDATE READY

- Task: `TETRIS-T5-PUZZLE-NORMALPLAY-002`
- Branch: `codex/tetris-recovery`
- Base SHA: `79f60dd7a5c9ee16cb8a4c8fb8e958e2208e906e`
- Preserved intake delta: the three-path `TETRIS-T5-CORE-QA-FIX-001` removal of the
  mounted `replayScenario` state-injection path above.
- Candidate SHA: this single writer commit; exact SHA is reported immediately after
  commit creation.

### Exact changed paths

- `src/game/core/constants.ts`
- `src/game/core/engine.ts`
- `src/game/core/puzzles.ts`
- `src/game/core/types.ts`
- `src/game/core/puzzles.test.ts`
- `src/game/core/puzzleFlow.test.ts`
- `src/game/core/puzzleCampaign.test.ts`
- `src/game/runtime/GameRuntime.ts`
- `src/game/runtime/GameRuntime.test.ts`
- `src/game/runtime/qaScenario.ts`
- `src/game/runtime/qaScenario.test.ts`
- `src/puzzleProgress.test.ts` (test-only fixture migration)
- `src/game/render/presentation.test.ts` (test-only generated-Next migration)
- `docs/workstreams/tetris-t5-core/search-puzzles.mjs`
- `docs/workstreams/tetris-t5-core/puzzle-references.json`
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md`

No frontend/render production path, `puzzleProgress.ts`, coordinator document,
changelog, T3/T4 evidence, or QA archive was edited.

### Delivered behavior and production evidence

- Puzzle now changes only the stable starting board, level-owned seed, and
  canonical-board-empty success condition. It shares Marathon gravity, score, SRS,
  lock delay, entry delay, clear delay, soft/hard drop, and the continuously
  replenishing deterministic seven-bag.
- The engine does not read an authored Puzzle queue, piece budget, remaining count,
  or numeric difficulty. It does not emit `failed-budget`; an unsolved game continues
  until success, restart/exit, or ordinary `block-out`/`lock-out`, both mapped to
  `failed-top-out` for the Puzzle result surface.
- Each known Puzzle ID is bound to one exact stable nonzero seed. The first 84 pieces
  for every seed are frozen and verified as twelve complete consecutive seven-bags.
- The six original boards occupy 10/10/10/8/8/10 rows. Every board has 8–10 unique row
  shapes, four row densities (6/7/8/9 occupied cells), 7–8 covered-hole columns, and
  10–15 buried cavities. No board is a repeated floor template or single I-well.
- `puzzle-references.json` freezes two same-seed routes per level. Locked-piece counts
  are 35/35, 35/35, 30/30, 29/29, 34/34, and 30/30. The second routes differ at
  29/24/4/4/15/5 semantic lock indices and every pair has an intermediate canonical
  board-hash divergence.
- All twelve routes use all seven types, 9–11 landing x values, 19–30 effective
  rotations, 14–21 non-clearing locks, and 13–19 separated clear phases. They finish
  only when the canonical 40 × 10 board is empty.
- The authoritative verifier drives production `createInitialState` and public
  `dispatch` only. It verifies spawn type, every effective rotation, every horizontal
  movement path, hard-drop landing Y, clear count, delayed entry/clear resolution,
  terminal state, restart hash, route diversity, and frozen initial/final,
  command/event, and board-trace digests. The value 70 exists only as its safety guard.
- `GameRuntime.setReducedMotion(boolean)` forwards only the renderer option and does
  not rebuild or replace canonical state. Mounted DEV QA exposes a structured-clone
  read view and no replay, `setState`, or `replaceState` hook.

### Bounded authoring search evidence

- `search-puzzles.mjs` is an authoring helper only; its geometry proposals were not
  accepted until the TypeScript public-dispatch verifier passed.
- The initial one-hole-per-row prototype found 6/6 pairs quickly but was discarded
  because it violated the frozen no-repeated-floor-template rule.
- A fully random 1–4-hole prototype produced no Level 1 route within 120 seconds and
  was also discarded. The final generator uses staggered 1–5-cell cavity profiles,
  at least three row densities, and multiple covered holes.
- Successful bounded searches were:
  - `node docs/workstreams/tetris-t5-core/search-puzzles.mjs 0 18 4000 120000`
  - `node docs/workstreams/tetris-t5-core/search-puzzles.mjs 1 12 4000 180000 7`
  - `node docs/workstreams/tetris-t5-core/search-puzzles.mjs 2 16 4000 180000 0`
  - `node docs/workstreams/tetris-t5-core/search-puzzles.mjs 3 16 4000 180000 0`
  - `node docs/workstreams/tetris-t5-core/search-puzzles.mjs 4 20 4000 210000 0`
  - `node docs/workstreams/tetris-t5-core/search-puzzles.mjs 5 20 4000 240000 6`
- Bounded failure evidence was retained instead of weakening thresholds: early Level 2
  candidates found 32- and 24-lock first routes but no second route in 150 seconds;
  early Level 6 candidates found a 29-lock first route but no second route in 210
  seconds. Later candidate indices produced the accepted pairs.

### Commands actually run

- `node --check docs/workstreams/tetris-t5-core/search-puzzles.mjs` — PASS after the
  final helper change.
- Focused convergence command covering Core definitions/flow/campaign, runtime QA,
  runtime boundary, progress fixture, and presentation Next:
  `npm.cmd run test -- src/game/core/puzzles.test.ts src/game/core/puzzleFlow.test.ts src/game/core/puzzleCampaign.test.ts src/game/runtime/qaScenario.test.ts src/game/runtime/GameRuntime.test.ts src/puzzleProgress.test.ts src/game/render/presentation.test.ts`
  — PASS, 19 files / 92 tests.
- Final focused stable-seed validation:
  `npm.cmd run test -- src/game/core/puzzles.test.ts` — PASS, 3 files / 16 tests.
- Final `npm.cmd run typecheck` — PASS.
- Final `npm.cmd run test` — PASS, 37 files / 236 tests.
- Final `npm.cmd run build` — PASS; Vite transformed 738 modules and produced the
  production bundle.

### Deliberate compatibility debt for the frontend slice

- `puzzlePieceBudget` remains a deprecated state-field bridge and is always `null`.
- `puzzleQueue`/`puzzleQueueIndex` remain a deprecated generated-Next bridge: they
  mirror the shared queue at index zero and have no generation or terminal authority.
- `failed-budget`, `failed-invalid-spawn`, and the two matching event-reason literals
  remain type-only compatibility values; production Puzzle engine paths never emit them.
- `nextUnlockedLevelId` remains navigation/progress compatibility only and never
  controls Core availability. The frontend slice owns the all-levels-enabled UI and
  completion-only persistence migration.
- `PUZZLE_DEFINITIONS` exposes a deprecated type-only `difficulty` facade so the
  forbidden old `puzzleProgress.ts` compiles; runtime definition objects contain no
  numeric difficulty. Frontend must remove that read, then the facade can be deleted.
- `RACE_TARGET_LINES` remains the already documented frontend compile bridge; no
  Core/runtime rule reads it.

### Handoff

- Blocker: none.
- Commit: one candidate commit is created after final diff/path checks.
- Push: not performed; coordinator owns integration and push decisions.
- Next: independent read-only Core QA verifies the exact candidate SHA before the
  coordinator authorizes frontend integration.

## 2026-07-17 — FIFTEEN-LEVEL CAMPAIGN CANDIDATE READY

- Task: `TETRIS-T5-PUZZLE-CAMPAIGN-15-006`
- Branch: `codex/tetris-recovery`
- Base SHA: `ef2d7472eeb2cf461c5408101f045207605334ec`
- Scope: exactly fifteen all-enabled Puzzle definitions, deterministic multi-color
  starting boards, nine new original masks/seeds, and thirty same-seed successful
  public-command routes. No engine/random/runtime/frontend rule path was opened.
- Candidate SHA: this single writer commit; the exact SHA is reported to the
  coordinator immediately after creation.

### Exact changed paths

- `src/game/core/types.ts`
- `src/game/core/puzzles.ts`
- `src/game/core/puzzles.test.ts`
- `src/game/core/puzzleCampaign.test.ts`
- `src/game/core/puzzleFlow.test.ts`
- `src/puzzleProgress.test.ts`
- `docs/workstreams/tetris-t5-core/search-puzzles.mjs`
- `docs/workstreams/tetris-t5-core/puzzle-references.json`
- `docs/workstreams/tetris-t5-core/build-puzzle-references.test.ts` (the one authorized
  new reference-builder helper)
- `docs/workstreams/tetris-t5-core/THREAD_LOG.md`

### Delivered implementation and evidence

- Production exports exactly fifteen definitions. The first six retain their exact
  IDs, seeds, bottom alignment, normalized occupancy masks, and both placement streams.
  A base/current JSON comparison reported `allCompatible: true` for all four facts on
  every legacy level.
- A separate randomizer seeded with `level.seed ^ 0xa57e31d9` colors occupied cells
  without sharing or mutating gameplay randomizer state. Every board uses all seven
  piece types in the generated fixture; the gameplay active/preview stream still
  matches direct draws from the unmodified level seed for every definition.
- Geometry validation normalizes colors to occupancy before row-shape checks. All
  fifteen boards have at least six occupancy shapes, four density classes, five
  covered-cavity columns, and eight buried holes. The nine new boards each have ten
  occupied rows, ten shapes, four density classes, 5-9 covered columns, and 11-14
  buried holes; all fifteen normalized masks are unique.
- All fifteen seeds freeze the first 84 pieces as twelve complete seven-bags and prove
  another complete bag after that validation horizon.
- `puzzle-references.json` is 15 levels / 30 routes. New-route metrics are 30-35 locks,
  24-38 effective rotations, 10-11 landing x values, 14-20 non-clearing setup locks,
  and 15-19 clear phases. Paired semantic differences are 3-27 and every pair diverges
  at a real common-index intermediate canonical board hash.
- The generated JSON is 217,515 UTF-8 bytes. Re-running the builder with the same nine
  ignored authoring results produced the identical SHA-256
  `F1A05DB8CA31B6833FCF09F096A5C726E29D5B95274897A2A7E0259A5ED7696C`.
- Builder input merges by level ID, rejects seed or placement conflicts, initializes
  production `createInitialState(seed, "puzzle", id)`, and uses public `dispatch` only.
  It never constructs, replaces, or mutates canonical state.

### Bounded clean-room search record

- `search-puzzles.mjs` now accepts `--seed <uint32>` and an optional 9-12 row height,
  rejects topology below 6 shapes / 4 densities / 5 covered columns / 8 buried holes,
  and enforces the 28-35-lock route floor without changing the 70-lock verifier guard.
- At most two hidden Node processes ran concurrently. Every process wrote unique
  ignored `.local/tetris-t5-search/seed-*.{json,log}` output; no product or formal
  evidence path received search scratch data.
- Accepted seeds/candidates were `91e2b43d/5`, `c37a58e1/5`, `a5c91367/1`,
  `d1596af5/1`, `73bc20e9/2`, `b47d8e23/1`, `5c29f6a1/2`, `f2a7634b/0`, and
  `8ea45d17/1`. The first four used the default 9-12 cycle with 20 candidates,
  beam 4000, and 240 seconds; later searches used explicit height 10, with the final
  two bounded to 6 candidates / 150 seconds.
- Bounded misses `6d4a9f17`, `4f86d2b9`, `2be74d83`, `e8451c2f`, and `38af71c5`
  were discarded rather than weakening a gate. Hedge seed `17dce985` also succeeded
  but remained ignored: `8ea45d17` was selected for stronger covered/buried topology
  and greater mean 200-cell Hamming distance from the preceding eight new masks.

### Commands and results before final gates

- `node --check docs/workstreams/tetris-t5-core/search-puzzles.mjs` — PASS after the
  final helper change.
- Explicit-seed smoke with 1 candidate / beam 120 / 1 second — bounded miss as
  expected; CLI and JSON output were valid.
- Mid-authoring production builder verification — PASS, current 11 levels / 22 routes,
  proving the search mirror had not produced false-positive placements.
- Full reference builder with nine selected ignored results — PASS, 1 test; all 15
  levels / 30 routes executed before JSON replacement.
- Focused convergence:
  `npm.cmd run test -- src/game/core/puzzles.test.ts src/game/core/puzzleCampaign.test.ts src/game/core/puzzleFlow.test.ts src/puzzleProgress.test.ts docs/workstreams/tetris-t5-core/build-puzzle-references.test.ts`
  — PASS, 75 tests; the environment-gated builder was the one intentional skip.
- Idempotent full builder rerun — PASS, 1 test; JSON SHA-256 unchanged.
- `git diff --check` — PASS during pre-final audit; line-ending notices only.

### Final gate status and handoff

- Final `npm.cmd run typecheck` — PASS.
- Final `npm.cmd run test` — PASS, 38 files / 248 tests; the environment-gated
  reference writer was the one intentional skipped file/test.
- Final `npm.cmd run build` — PASS; Vite transformed 739 modules and produced the
  production bundle.
- Final explicit `npm.cmd run test -- src/game/core/puzzleCampaign.test.ts` — PASS,
  3 files / 47 tests, including the exact 15-level / 30-route production verifier.
- Blocker: none.
- Push: not performed; coordinator owns QA integration and push decisions.
- Next: create one candidate commit and hand the exact SHA to independent read-only
  Core QA before any frontend integration or push decision.

## 2026-07-17 — LEGAL AUTHORED ENDGAMES CANDIDATE READY

- Task: `TETRIS-T5-PUZZLE-AUTHORED-ENDGAMES-009`
- Branch: `codex/tetris-recovery`
- Writer base SHA: `50be21d70abab887051b85d412a102f0b77eb9d2`
- Core checkpoint A: `ee0d996f7309ead46654fc76bc2855f4c2ea73b6`
  (`feat(puzzle): add legal authored endgame search`)
- Core checkpoint B: `2d282b6796072c6fcd0d031c474f640c987c77a1`
  (`feat(puzzle): author fifteen legal endgame setups`)
- Integrated product/source SHA after the separately owned Slice J-R fixture migration:
  `26ef004dc4ab11de8caeee6605bbe21044c5d950`.
- Final HEAD also contains runtime's log-only checkpoint `aab0dc9`; it changes no
  product, Core, reference, or verifier path.

### Exact Core paths

- Checkpoint A changes only
  `docs/workstreams/tetris-t5-core/search-puzzles.mjs`.
- Checkpoint B changes only:
  - `src/game/core/puzzles.ts`;
  - `src/game/core/puzzles.test.ts`;
  - `src/game/core/puzzleCampaign.test.ts`;
  - `docs/workstreams/tetris-t5-core/build-puzzle-references.test.ts`;
  - `docs/workstreams/tetris-t5-core/puzzle-references.json`.
- This final documentation checkpoint changes only
  `docs/workstreams/tetris-t5-core/THREAD_LOG.md`.

### Delivered authored-endgame contract

- Removed `BOARD_COLOR_SALT`, `colorizeBoardRows`, random hole excavation, and every
  per-cell color draw from production Puzzle definition authority.
- Each level now owns a frozen separate setup seed and 16–22 explicit
  `{ type, rotation, x }` placements. Production reconstructs the board through the
  ordinary board/piece legality functions: each setup type matches the next setup-bag
  draw, landing `y` is derived by hard drop, and every setup lock is zero-clear with no
  top-out or hidden occupancy.
- The fifteen setup counts are
  `20, 20, 19, 20, 20, 21, 20, 22, 20, 21, 21, 19, 16, 22, 20`.
  Every final board uses all seven materials; each same-material connected component
  is exactly one canonical four-cell tetromino and same-material source pieces never
  share an orthogonal edge.
- The thirty public-dispatch completion routes have lock counts
  `35/35, 35/35, 41/36, 35/35, 35/35, 39/39, 30/40, 38/38, 35/35,
  34/34, 39/39, 36/36, 39/39, 33/38, 35/35`.
  All retain automatic gravity and an indefinitely replenishing gameplay seven-bag.
- Paired first-divergence locks are
  `1, 2, 2, 3, 5, 1, 4, 3, 2, 1, 1, 1, 2, 1, 2`; paired canonical board-hash
  divergence counts are
  `34, 33, 35, 32, 30, 38, 27, 35, 33, 32, 38, 35, 37, 33, 33`.
  Thus route diversity is real state divergence, not only a different command spelling.
- Search and reference output keep `landingY` only as diagnostic evidence. Production
  setup and route placements contain only the authored type/rotation/x contract.

### Reference identity and L7/L13 audit

- `docs/workstreams/tetris-t5-core/puzzle-references.json` is 263,980 bytes, contains
  15 levels / 30 routes, has 11,723 LF bytes and zero CRLF pairs, and hashes to SHA-256
  `4c8f9fac3451b2e888c5560126b75c5cd949c7e1a947f04274698e93c0171bec`.
- Final pairwise occupancy Hamming minimum is 24 (L1/L15), above the required 20.
- A prior L7/L13 candidate at direct Hamming 20 was discarded rather than weakening
  the gate. The final pair is direct Hamming 40, horizontal-mirror Hamming 38,
  vertical-mirror Hamming 144, and 180-degree Hamming 144.
- L7 is a left-high terrace with multilayer central cavities: 20 setup locks and
  30/40 completion locks. L13 is a right-side I cap with split vertical wells:
  16 setup locks and 39/39 completion locks. Their distinct topology survives direct
  and mirrored comparisons.

### Search, generation, and targeted evidence

- Search used at most two Node processes concurrently and wrote only ignored results
  below `.local/tetris-t5-endgames/`. Failed candidates were discarded; no setup,
  topology, route-length, route-diversity, or pairwise-distance threshold was lowered.
- Initial bounded probe:
  `node docs/workstreams/tetris-t5-core/search-puzzles.mjs --seed 1975562497 --setup-seed 2712847316 1 300 10000 0 20`
  — PASS in 6,768 ms; 20 setup locks, 10 occupied rows, 9 row shapes, 4 density
  classes, 9 covered columns, 11 buried holes, and two 35/40-lock routes.
- The final verifier inputs were `.local/tetris-t5-endgames/level-01.json` through
  `level-15.json`, with the intentionally replaced L13 input
  `.local/tetris-t5-endgames/level-13-alt3.json`.
- Environment-gated setup smoke with one result — PASS, 1 test / 1 skipped.
- Full write-enabled builder with all fifteen final results — PASS, 1 test / 1 skipped;
  it produced the signed reference identity above.
- Targeted production convergence — PASS, 7 files / 65 tests; separate Puzzle-flow
  convergence — PASS, 1 file / 2 tests.

### Failed full-suite attempt and bounded Slice J-R resolution

- The first post-Core-source `npm.cmd run test` attempt had one failure after
  38 passed files / 1 skipped file and 251 passed tests / 2 skipped tests:
  `src/game/runtime/qaScenario.test.ts` reported
  `Puzzle challenge QA route expected Z, received none`.
- Cause: `PUZZLE_CHALLENGE_QA_ROUTE` still contained the rejected pre-Slice-J route;
  the failure did not invalidate the Core setup or route references. Core stopped
  without touching runtime.
- The separately bounded Slice J-R writer replaced only that frozen route in
  `src/game/runtime/qaScenario.ts` and created source checkpoint
  `26ef004dc4ab11de8caeee6605bbe21044c5d950`. Its focused runtime suite passed before
  this Core owner resumed the final sequence.

### One green final sequence on source SHA `26ef004`

- `npm.cmd run typecheck` — PASS.
- `npm.cmd run test` — PASS, 39 files / 1 skipped file and 252 tests / 2 skipped
  tests. The jsdom `HTMLCanvasElement.getContext()` notice was non-failing test-environment
  output.
- `npm.cmd run build` — PASS; Vite transformed 739 modules and emitted the production
  bundle.
- The complete explicit verifier set:
  - set `VERIFY_PUZZLE_AUTHORING=1` and `VERIFY_PUZZLE_SETUP=1`;
  - set `PUZZLE_AUTHORING_RESULTS` to the exact fifteen paths described above;
  - run
    `npm.cmd run test -- docs/workstreams/tetris-t5-core/build-puzzle-references.test.ts src/game/core/puzzleCampaign.test.ts`.
  Result: PASS, 4 files / 49 tests, covering all 15 setup replays and all 30 signed
  completion routes without rewriting the reference.
- `git diff --check` — PASS before this log edit.
- Blocker: none.
- Push: not performed; coordinator owns independent QA integration and push.
- Next: independent read-only Core/runtime QA reviews the exact contiguous Slice J +
  J-R candidate range before Slice K or push.
