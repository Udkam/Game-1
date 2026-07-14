# Tetris Independent QA Log

Coordinator: primary task `019f4deb-7e83-7583-8cd5-8e6f075bc331`

Candidate: `b2075ba5093defee1c397b9e2b48bceaa0e92962`

## 2026-07-14 — Independent acceptance

Verdict: **ACCEPT**

- Scope was read-only against the candidate. No Temple source, evidence, or assets were
  changed; pre-existing untracked `docs/screenshots/temple/` remains outside this QA
  commit.
- Static review confirms the player-facing name is `Tetris`, remaining player copy is
  Chinese, `Hold` and `Next` each draw one piece with `Next` below `Hold`, and no
  Preferences/Seed/Patterns/manual reduced-motion/high-contrast control is exposed.
- Race gravity is a deterministic, locked-piece-count curve (`42` through `2` ticks),
  capped at two ticks; mode and piece count are included in replay/hash coverage.
- Input review and live probes confirm immediate soft drop, three-tick delay, then
  per-tick repeat, with keyboard and touch releases cancelling repetition immediately.
  Pixi presentation follows targets continuously without overshoot.
- Clean `npm.cmd ci --no-audit --no-fund`, `npm.cmd run typecheck`, full
  `npm.cmd run test` (8 files / 41 tests), and `npm.cmd run build` all passed.
- A single live Playwright evidence pass passed with zero console/page errors:
  desktop `1440 × 900 DPR1`, portrait `390 × 844 DPR3`, and landscape
  `844 × 390 DPR3` each had one canvas, zero gameplay DOM cells, a complete 1:2 board,
  and no horizontal overflow. Keyboard and touch soft-drop both moved Y `19 → 26` and
  remained at `26` after release. Race's first lock had `mode=race` and `pieceCount=1`.
  System reduced motion remained automatic; malformed local leaderboard data rendered
  zero records (fail-closed).
- `docs/qa/tetris-browser-evidence.json` was checked against all nine submitted Tetris
  PNG files; every SHA-256 matched the manifest. Visual review of desktop ready/paused,
  portrait, and landscape images confirms a board-led, measured-paper presentation and
  a clear board-local `已暂停` state without a heavy card treatment.

QA handoff: this commit adds only this workstream log and is intentionally not pushed.

## 2026-07-14 — TETRIS-QA-003 canonical Git-blob checksum review

REPORT TETRIS-QA TETRIS-QA-003 ACCEPTED
HEAD `9d704d95850ce5c04f03bbe6406bbd97873f38d9`; PARENT `b4a51c19d372d72870c416181566855c8c9dcc19`; QA_SHA pending log-only commit.
SCOPE direct delta is only `docs/qa/evidence/tetris-t2/SHA256SUMS.md` and `docs/workstreams/tetris-t2/THREAD_LOG.md`; whitespace clean, with no product/evidence JSON/PNG/package/config/Temple/root CHANGELOG delta.
CHECKSUMS manifest explicitly specifies canonical raw Git blob SHA-256 (not working-tree/checkout-filter bytes); streamed all 18 `git show` blobs under `core.autocrlf=true` and `false`: 0 mismatches.
CHECKSUMS required values matched in both runs: `browser-evidence.json=bd1bed9445d058143b9aac6c8af5f6eaccf634addb2a5f5eaf1baa1b203b6c10`; `rules-replay.json=97fafadc2c29c6161aa56a3ac21e60b2d12545def7ab5f2fec1511b2016c9194`.
REUSED GATES QA-001 clean ci/typecheck/47-test/build plus rules and visual findings; this docs-only delta ran no npm, tests, build, browser, capture, or selector probe.
BLOCKER none; QA-002 commit `eabbcb6d5746ac4c90fa82e357c82eed73d42a29` is superseded and neither integrated nor pushed.
NEXT coordinator integration/push authorization only; no production changes.
LOG `docs/workstreams/tetris-qa/THREAD_LOG.md` only.

## Recoverable status reports

REPORT TETRIS-QA TETRIS-QA-000 READY
HEAD `c13961d9a079c7d6928471b7cb32ee0700d408c0`; dirty `docs/screenshots/temple/` (pre-existing untracked, untouched).
Candidate none; evidence no QA run under the current wait instruction.
Blocker awaiting a new Tetris candidate SHA from coordinator `019f4deb-7e83-7583-8cd5-8e6f075bc331`.
Next: on candidate instruction, begin `TETRIS-QA-001`; otherwise remain idle.
Log `docs/workstreams/tetris-qa/THREAD_LOG.md`.

## 2026-07-14 — TETRIS-T3R-QA-002 replacement acceptance

REPORT TETRIS-T3R-QA TETRIS-T3R-QA-002 ACCEPTED
HEAD `a096d96056457ebd2158bb6955cf7760fc36e238`; PARENT `e96f759006a953def64ebf6cceb680272021fb8f`; QA_SHA pending log-only commit.
SCOPE direct delta is exactly `docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts` and `docs/workstreams/tetris-t3-rules/THREAD_LOG.md`; whitespace clean, no product/Temple/root/package delta.
FIX only the required fail-closed threshold changed: levels 4–6 now require `distinctLandingXs >= 3`; stored replay values remain `5/4/3`, with no other weakening.
DEPENDENCIES fresh detached worktree lacked `node_modules`; authorized `npm.cmd ci --no-audit --no-fund` ran once and added 105 packages.
GATES exactly one targeted `npm.cmd run test -- docs/workstreams/tetris-t3-rules/tests/campaign.verifier.test.ts` passed: 1 file / 18 tests; no full test/typecheck/build/browser/capture.
REUSED QA-001 static review for unchanged contract/levels/replays/visual handoff and the 20-line Race requirement.
D5 `e31a0b665ff0864a0af35ab05dde4072bc96bbf5` is a separate divergent design-chain QA commit; it is neither integrated nor authorized by this acceptance.
RESIDUAL this accepts design/rules evidence only and grants no production implementation authority.
NEXT coordinator integration decision only; QA does not push.
LOG `docs/workstreams/tetris-qa/THREAD_LOG.md` only.

## 2026-07-14 — TETRIS-D5-QA-002 design-only replacement acceptance

REPORT TETRIS-D5-QA TETRIS-D5-QA-002 ACCEPTED
HEAD `4e13fcc01f2fec703e66f9027d7df25847bbe235`; PARENT `f7afb0ae4bedc872db47afae380bf3e2db43bf1a`; QA_SHA pending log-only commit.
SCOPE direct 19-path correction stays under `docs/workstreams/tetris-visual-design/**`; whitespace clean, no production/root/package/Temple delta.
EVIDENCE manually reviewed all 12 recaptured PNGs; `d5-geometry-evidence.json` reports 16 cases, 0 console errors, no overflow/overlap, board ratio 2, and controls at least `52 × 48`.
VISUAL complete `Tetris` is visibly inside all desktop/portrait/landscape images; title safe top inset is 8px desktop/portrait and 4px landscape, with no giant title, stripe, dark well, card grid, modal, Hold, or 暂存.
LAYOUT all 16 cases have essential/help/control/action copy ≥12px; six representative flat level rows are scroll-reachable (including row 6), selected `关卡 3/6`, a graphical single Next only while playing, and board-contained pause.
RULES race copy is `完成 20 行`; prototype source has no stale `40 行`, Hold, or 暂存; names are explicitly representative (`示例`) rather than frozen T3R production names.
GATES no npm, product tests, build, browser, or static-verifier rerun; candidate-provided geometry and formal PNGs were independently inspected read-only.
RESIDUAL production must still bind these mock state/data contracts to real canonical state and Pixi; this acceptance grants no production authority.
NEXT coordinator may integrate design-only acceptance; no push by QA.
LOG `docs/workstreams/tetris-qa/THREAD_LOG.md` only.
