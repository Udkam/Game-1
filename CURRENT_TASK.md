# Current Task — T5 Rules Repair and Aqua Blueprint Rebuild

Branch: `codex/tetris-recovery`

Core/rule authority: `4c8582854088695ebac90467842dc2bc0cef3a20`

Current historical ancestor: `dd7e31ea3547c18a797b2308f04161310d1412ce`
(rejected T4 presentation candidate)

Preserved rejected follow-up: local branch
`codex/tetris-t4-rejected-preservation` at
`1362c664629b2a83f0659f836259b84c21750fee`

Status: **active — revised Puzzle normal-play contract is the current authority**

## User-visible problems to resolve

1. Replace the current frontend and block treatment with a new light cyan/light-blue,
   high-contrast design.
2. Add a dedicated entry page with separate Marathon, Race, and Puzzle entrances.
3. Make Race endless accelerating normal play. It has no line target and stops only
   through player exit or top-out.
4. Rebuild Puzzle as normal continuous play over harder authored starting boards:
   automatic gravity, replenishing seeded seven-bag input, no finite piece budget,
   every level unlocked, and at least two proven successful routes per level.
5. Keep all level layouts, copy, frontend composition, block language, and assets
   original. Similar games are abstract mechanics research only.

## Baseline policy

- Do not reset or rewrite `dd7e31e`; it remains a historical ancestor.
- Do not merge the rejected T4 preservation branch into T5.
- Migrate the valid 44 px and real-UI QA requirements into T5, not the old T4 styling.
- Do not modify T3/T4 screenshots, manifests, fixtures, capture scripts, or logs.
- New fixtures, logs, and browser evidence use T5-specific paths.

## Slice A — T5 Core

Task ID: `TETRIS-T5-PUZZLE-NORMALPLAY-002`

The Race and leaderboard work in candidate `3bf170ec252cc971b1f65d73b4649fabb2500dbb`
remains eligible. Its finite authored Puzzle queues, budget failures, no-gravity rule,
and single-route fixtures are superseded. The uncommitted removal of the live
`replayScenario` state-injection surface is retained as part of this slice.

The core writer may change only:

- `src/game/core/constants.ts`, `engine.ts`, `puzzles.ts`, `types.ts`, `random.ts`, and
  `index.ts` if public exports require it;
- directly related tests under `src/game/core/*.test.ts`, including a new focused
  Puzzle-flow test if useful;
- `src/game/runtime/qaScenario.ts`, `qaScenario.test.ts`, `GameRuntime.ts`, and
  `GameRuntime.test.ts` to migrate obsolete finite-Puzzle QA and permanently remove
  live state-replacement/replay injection;
- `src/leaderboard.ts` and `src/leaderboard.test.ts` for endless-Race records;
- `src/puzzleProgress.test.ts` only to replace hard-coded old 3–5-piece completion
  fixtures; `src/puzzleProgress.ts` remains forbidden;
- `src/game/render/presentation.test.ts` only to replace hard-coded old Puzzle queue
  expectations; renderer/presentation production files remain forbidden;
- `docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts` only to decouple
  frozen T3 evidence from current T5 production definitions and verify the unchanged
  historical artifacts internally; T3 fixtures/logs remain forbidden and the test
  must stay in full Vitest discovery;
- new or revised `docs/workstreams/tetris-t5-core/**` authoring helpers, fixtures, and
  `THREAD_LOG.md`.

The core writer must not edit `src/App.tsx`, `src/styles.css`,
`src/puzzleProgress.ts`, `src/game/render/**`, T3/T4 evidence, coordinator docs,
changelog, or the frontend log.

Core acceptance:

- no Race line count produces `finished`;
- Race speed uses locked pieces plus cleared lines, grows monotonically, and reaches
  its safe cap;
- each Puzzle definition has one stable seed and an original 8–12-row board meeting
  the topology constraints in `DESIGN.md`; numeric difficulty and finite queues/budgets
  are removed from production authority;
- Puzzle shares Marathon automatic gravity, scoring, SRS, lock/entry/clear timing, and
  continuously replenishing deterministic seven-bag generation;
- sampling 84 pieces per level proves twelve full seven-bags without exhaustion;
- every level has two deterministic successful public-command routes for the same seed,
  each using 18–35 pieces and meeting the semantic route-diversity metrics in
  `DESIGN.md`; verifier execution uses 70 locks only as a non-product guard;
- canonical board empty is success; an unsolved board never fails because a queue or
  budget ended, and normal top-out remains the gameplay failure;
- restart produces the exact authored board, seed, randomizer, and hash;
- mounted runtime exposes no replay or canonical-state replacement hook;
- focused tests and the new T5 verifier pass;
- after the last Core source change, one typecheck, one complete Vitest suite, and one
  build pass without weakening or deleting historical evidence checks;
- candidate SHA and exact evidence are logged before independent read-only QA.

## Slice B — T5 Frontend

Task ID: `TETRIS-T5-FRONTEND-001`

This slice remains blocked until the core candidate and independent core QA exist.

The frontend writer may change only:

- `src/App.tsx`;
- `src/styles.css`;
- `src/puzzleProgress.ts` and `src/puzzleProgress.test.ts`;
- `src/game/render/theme.ts`;
- `src/game/render/TetrisRenderer.ts`;
- `src/game/render/presentation.ts` and its test when necessary;
- new components under `src/ui/**`;
- directly related frontend/presentation tests when required;
- new `docs/workstreams/tetris-t5-frontend/THREAD_LOG.md`.

The frontend writer must not change core rules, Puzzle definitions/fixtures, build
configuration, dependencies, T3/T4 evidence, changelog, or coordinator docs.

Frontend acceptance:

- dedicated three-entry mode home;
- all Puzzle levels enabled, no numeric difficulty UI, completion only informational;
- Puzzle UI contains no piece budget or remaining-piece counter; it shows ordinary
  gameplay stats, goal, placed-piece count, and Next preview;
- Race copy/statistics contain no 20-line goal or remaining-line value;
- Aqua Blueprint tokens and completely new cell renderer;
- all visible buttons at least 44 × 44 CSS px and visible focus treatment;
- accessible pause/exit/result action sheets;
- one canvas per gameplay screen and no lifecycle leaks;
- targeted component/presentation checks before coordinator final gates.

## Coordinator final integration

After both accepted slices and the last product change, run exactly one final:

1. `npm.cmd run typecheck`;
2. `npm.cmd run test`;
3. `npm.cmd run build`;
4. T5 browser-evidence pass at every required viewport.

Browser evidence must use visible UI, exercise at least three consecutive Puzzle locks
under automatic gravity, and compare visible level, placed-piece count, active piece,
and Next preview with canonical state. Internal state replacement is not valid setup
evidence.

The coordinator routes the exact combined candidate to independent read-only QA,
resolves findings with newly bounded writer slices, updates
`docs/logs/CHANGELOG.md`, commits the documentation delta, and decides whether to push.
