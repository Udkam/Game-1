# Changelog

## 2026-07-13 — New two-game branch sequence

- Created and pushed `codex/tetris` and `codex/temple-run` from the neutral `main` baseline.
- Began only the Tetris branch as required; the Temple Run branch remains untouched.
- Added branch boundaries, the Signal Foundry design contract, and the T1 implementation/acceptance scope.

## 2026-07-13 — Signal Foundry T1 implementation complete

- Built a deterministic 10 × 20 visible falling-block Marathon engine with hidden spawn rows, seven-bag generation, SRS kicks, hold, ghost, lock delay, scoring, levels, pause, restart, and top-out.
- Kept the simulation core serializable and independent from React, PixiJS, browser timing, storage, and audio.
- Added a fixed-step runtime, DAS/ARR keyboard input, responsive touch controls, procedural WebAudio, local settings/high-score persistence, reduced-motion support, and high-contrast rendering.
- Delivered the original Signal Foundry presentation across desktop, portrait, and landscape layouts without copied commercial art, branding, music, fonts, or screen composition.
- Added deterministic rule, replay, input, runtime, and QA-scenario tests.
- Browser QA passed 10 evidence contexts with one canvas, zero gameplay DOM cells, zero recorded console errors, deterministic four-line-clear midpoint evidence, real command-driven game over, and hashed screenshots.
- Mobile QA now drives the rendered controls with real Chromium touch events and verifies tap input, DAS long-hold, pointer-release cancellation, pause/resume, and reduced-motion behavior in portrait and landscape.
- Window blur and document visibility loss both suspend active play without accidentally resuming an already-paused session.
- Recorded a Pixi scene-preparation benchmark of 0.30 ms p95; headless rAF throttling remains explicitly diagnostic rather than acceptance evidence.
- Kept `codex/temple-run` unchanged; endless-runner work remains sequenced after the Tetris milestone is committed and pushed.

## 2026-07-14 — Tetris interaction and visual rebuild

- Renamed the player-facing game to `Tetris` and rewrote the remaining interface in concise, natural Chinese.
- Replaced the three-column settings/dashboard composition with one narrow data rail and one dominant graphite Pixi board on a measured paper field.
- Limited previews to one Hold and one Next, placed vertically, and removed the settings panel, seed display, ornamental footer copy, pattern/high-contrast option, manual reduced-motion option, and generic line-clear particles.
- Kept system `prefers-reduced-motion` behavior automatic while retaining only one small audio preference and one clearly labelled pause control.
- Added a large board-local `已暂停` state with an explicit continue action.
- Changed held soft drop to immediate input, a three-tick initial delay, then one row attempt per fixed tick; release cancels repetition immediately.
- Replaced event-reset position tweens with bounded continuous Pixi presentation following, reduced entry delay to three ticks, and coalesced routine React state updates to remove visible step stalls.
- Added deterministic Race mode: every five locked pieces advances a fixed gravity tier, capped at two ticks per cell; mode and piece count participate in state hash and replay.
- Added a fail-closed local leaderboard for score, lines, locked pieces, mode, and completion time with deterministic ordering and an eight-record bound.
- Final gates passed: typecheck, 8 files / 41 tests, production build, and 10 structured browser evidence entries.
- Browser evidence passed at desktop, 390 × 844 DPR3 portrait, and 844 × 390 DPR3 landscape with one canvas, zero gameplay DOM cells, zero console errors, fast keyboard/touch soft drop with release-stop, Race selection, game-over persistence, and a 0.20 ms Pixi preparation p95.
- No Temple Run source was changed in this slice.
- Coordinator accepted implementation candidate `b2075ba` after independent QA commit
  `c13961d`; QA independently reproduced clean install, typecheck, 8 files / 41 tests,
  build, responsive live browser interaction, screenshot hashes, and release-stop input.

## 2026-07-14 — Tetris T2/D4 three-mode milestone accepted

- Rebuilt the interface as the original Offset Drop visual system: warm ungridded paper,
  a deep-ink 1:2 board, a single cinnabar drop-band, restrained print offsets, and a
  compact game-first composition across desktop, portrait, and landscape.
- Removed Hold/暂存 from the core, replay/hash surface, inputs, renderer, controls, and
  player-facing UI. Playing now exposes exactly one 下一个方块 preview.
- Froze three visibly and mechanically distinct modes: open-ended 马拉松模式 with
  top-out, fixed-tick 20-line 竞速模式, and three deterministic 解谜模式 layouts with
  canonical queues, piece budgets, targets, completion, and loss conditions.
- Kept full Chinese mode names, `↑ 旋转`, fast held soft drop, direct hard drop, five
  touch zones, a narrow board-contained pause strip, and a mode switch that stays
  outside the board without stale Next-piece residue.
- Added mode-owned, fail-closed local leaderboards and deterministic rule/replay proofs,
  including Marathon top-out, Race completion, all three puzzle completions, puzzle
  budget failure, input behavior, and rotation replay hash `e6936c36`.
- Formal browser evidence contains 16 final-candidate captures at 1440 × 900 DPR1,
  390 × 844 DPR3, and 844 × 390 DPR3. It verifies one canvas, zero gameplay DOM cells,
  no overflow, zero console/page errors, responsive geometry, pause/mode states, real
  keyboard/touch commands, and terminal rule outcomes.
- Independent QA reproduced clean install, typecheck, the complete 9-file / 47-test
  suite, and build, then accepted the final evidence-manifest child `9d704d9` after all
  18 canonical Git-blob SHA-256 entries matched under both CRLF settings.
- Integrated QA-003 acceptance from `9d4537b`; superseded QA-002 commit `eabbcb6` was
  deliberately excluded. No Temple production or evidence path was included.

## 2026-07-14 — Tetris T3 design and Puzzle contract accepted

- Recorded the user's rejection of the T2 dark Offset Drop presentation as the start
  of a new T3 production chain; T2 remains historical evidence rather than the active
  visual or Puzzle contract.
- Accepted the original D5 `浅岩台 / Mineral Shelf` direction: a light paper and light
  mineral 1:2 board, a small complete `Tetris` wordmark, one Next, five 44px+ controls,
  a board-contained pause strip, and flat external mode/level selection without cards,
  modals, giant titles, diagonal bands, Hold/暂存, or meaningless telemetry.
- Corrected and re-captured all 12 D5 formal states. Independent D5 QA verified visible
  title safe insets, essential copy at least 12px including 844 × 390, Race copy at
  exactly 20 lines, six reachable representative level rows, no overflow/overlap, and
  zero recorded console errors. Accepted source/QA identities are `4e13fcc` and
  `e31a0b6`.
- Accepted the clean-room T3R six-level campaign contract. Every level starts from a
  non-empty authored 20 × 10 stack, uses one finite fixed sequence and exact piece
  budget, and succeeds only when the complete canonical board—including the hidden
  buffer—is empty after ordinary line resolution.
- Added fail-closed ordering for top-out, canonical-board-empty success, exhausted
  budget/queue, and invalid spawn; canonical queue index, completion, completed level,
  and unlock result are reserved for production state/hash/replay.
- T3R reference evidence now proves six deterministic solutions, including 5-lock
  late-campaign levels, effective rotations and at least three distinct landing
  columns; negative proofs cover hidden/visible residuals, initial full rows, invalid
  spawn, queue exhaustion, stale digests, unused queue, and terminal tail commands.
  Independent T3R QA accepted `a096d96` with QA `0cf78e3` after one targeted 18-test
  verifier run in a clean dependency environment.
- Replaced root `DESIGN.md` and `CURRENT_TASK.md` with an atomic T3 production plan:
  C1 implements and independently verifies the core campaign first; V1 then binds the
  accepted D5 frontend and real campaign progression before the coordinator publishes
  a completed T3 milestone. No T3 production source is claimed complete by this entry.
- The pre-existing untracked `docs/screenshots/temple/` directory remains excluded and
  untouched; Temple Run continues only in its separate worktree and branch.

## 2026-07-14 — Tetris T3 six-level Puzzle core accepted

- Replaced the three temporary `offset-*` puzzles with the six accepted clean-room T3
  campaign definitions and their fixed queues, budgets, names, and difficulty data.
- Added canonical queue index, full authored queue, board-empty goal, completion code,
  completed-level ID, and next-unlocked-level ID to deterministic state and hashing.
- Enforced the frozen terminal order: hidden occupancy/top-out, canonical-board-empty
  success, exhausted budget/queue, then exact authored spawn. Final-piece success wins
  over budget failure; terminal states are inert and restart reconstructs the exact
  authored level.
- Migrated the design verifier to production initialization and public dispatch without
  legacy aliases, state injection, or treating historical adapter hashes as production
  authority.
- Candidate `8323203` passed the targeted verifier, focused campaign tests, typecheck,
  the complete 11-file / 73-test suite, and production build. Independent QA reproduced
  a clean install and the full suite, then accepted it in log-only commit `b79e142`.
- This is a core milestone only. The D5 Mineral Shelf interface, real level selection,
  fail-closed unlock persistence, responsive browser evidence, and removal of the
  deprecated presentation bridge remain the active T3-V1 work.
- No Temple path or the pre-existing untracked `docs/screenshots/temple/` directory was
  staged or modified.

## 2026-07-14 — Tetris T3 Mineral Shelf campaign accepted

- Bound the accepted six-level canonical Puzzle campaign to the light, board-first
  Mineral Shelf interface: each level starts from its authored non-empty board and
  finite fixed queue, succeeds only by emptying the full canonical board, and unlocks
  only the next level through versioned fail-closed local progress.
- Replaced the deprecated dark T2 Offset Drop surface with the accepted light mineral
  1:2 tray, complete `Tetris` wordmark, one graphical Next preview, compact
  mode-owned statistics, a board-contained pause strip, and one continuous five-action
  keyboard/touch rail. Hold/暂存 and line-target Puzzle progress are absent.
- Preserved deterministic Marathon and 20-line Race behavior, while Puzzle uses real
  canonical completion codes for board-empty success, top-out, invalid spawn, and
  budget exhaustion rather than UI-derived results.
- Final evidence covers the real runtime at desktop, portrait, landscape, and long
  Puzzle values, including keyboard/touch actions, mode and level selection,
  completion/unlock, malformed persistence fallback, one canvas, zero gameplay DOM
  cells, no overflow/overlap, and zero console/page errors.
- Candidate `6fb1728` passed clean install, typecheck, the full 12-file / 78-test
  suite, build, browser review, and a final coordinator live review. Independent QA
  accepted the canonical raw-Git-blob evidence manifest in log-only commit `fdd1ffb`;
  all 32 evidence entries match under both CRLF configurations.
