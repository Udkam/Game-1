# TIDE//RELAY TR2 independent QA log

Owner: `independent_qa`

Candidate: `c5b3db041175c19c71bd0086baf1e034fc97caf0`
Parent reviewed: `6126df8`
Verdict: **ACCEPT**

## Scope and contract audit

- The isolated checkout was detached exactly at the candidate SHA and remained clean before the QA log was added.
- The candidate diff is limited to TR2 core/runtime/render/UI, tests, QA contracts/evidence, final screenshots, and the TR2 workstream log. It contains no `AGENTS.md`, root `docs/logs/CHANGELOG.md`, Tetris, archived-recursive, dependency, build-output, or third-party-asset changes.
- `git show --check` and the exact parent-to-candidate whitespace check are clean.
- QA scenarios start at `createInitialState(seed)`, record accepted public commands and fixed `Tick`s, and replay to their canonical hashes; no QA scenario directly mutates canonical game state.
- Deterministic stumble/capture pressure, shield consumption, gap/wrong-turn/missed-turn failure, distance/score/milestone accounting, and command-reachable replay hashes are implemented and covered by the reviewed tests.
- Runtime/render review confirms CSS-pixel swipe classification, one-action dispatch, turn priority, reduced-motion suppression, resize observer disposal, listener/input cleanup, rAF cancellation, renderer/context disposal, and bounded resource teardown.

## Independent verification

- `npm.cmd ci --no-audit --no-fund` passed.
- `npm.cmd run typecheck` passed.
- `npm.cmd run test` passed: 11 files, 47 tests.
- `npm.cmd run build` passed. The only output was Vite's non-blocking 500 kB chunk advisory.
- Candidate evidence manifest independently parses as 23 records / 19 screenshots. All 19 PNG SHA-256 values match the manifest. Every captured record reports one canvas, zero gameplay DOM entities, zero console/page problems, zero WebGL context losses, no horizontal overflow, and exact canonical HUD values.
- Revalidated evidence: milestone `78bd1dc3` at 250.0899 m / score 5,101 / flow 2 / one shard; close chase `fa85830e` at `chaseGap` 1.1940 m with 64,374.2 CSS px² pursuer area; beam/ring/column/gap bounds 18,510.5 / 25,497.2 / 2,952.2 / 29,607.6 CSS px². Each has a non-empty matching public-command trace and replay hash.
- Manual screenshot review covered close chase, milestone, beam, ring, column, gap, mobile portrait, mobile landscape, and reduced motion. The articulated runner is legible, the black-tide pair creates visible chase pressure, all four obstacle silhouettes are distinct, and no material overlap or clipping hides a gameplay-critical object.

## Residual risk (P2, QA environment only)

- The prescribed one fresh Playwright recapture could not be counted: after a non-start caused by a missing temporary capture directory, one safe retry emitted no JSON or screenshots. Per instruction, no further capture retry was run. This does not alter the candidate worktree; the committed manifest and screenshots above were independently hash- and structure-checked, but a fresh browser-run transcript is unavailable from this QA environment.

## Handoff

- This commit contains only this QA log and sits directly above the reviewed candidate. No production, contract, evidence, or root changelog files were changed; no push was performed.
