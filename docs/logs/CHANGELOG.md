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

## 2026-07-17 — Bounded commit policy adopted

- Added an authoritative small-checkpoint policy so core, frontend, generated evidence,
  QA verdicts, and coordinator records are no longer accumulated into one large commit.
- Set a default source checkpoint budget of 10 product/test paths, 500 hand-authored
  changed lines, and one subsystem or user-visible claim, with explicit pre-authorization
  required for any atomic exception.
- Recorded the inherited `CURRENT_TASK.md` and `DESIGN.md` edits as separately owned docs
  work; neither may be silently bundled with the next gameplay or frontend commit.

## 2026-07-17 — T5 authored endgames and cohesive mineral interface accepted

- Completed the clean-room T5 product as plain-text `Tetris` with player-facing
  `经典`, endless accelerating Race, and fifteen all-enabled Puzzle残局. Each残局 is a
  legal zero-clear mid-game snapshot with source-piece colors, normal gravity,
  continuous seeded seven-bag input, and two verified public-command solutions.
- Replaced isolated tile cards with cohesive Pixi tetromino components across active,
  locked, Next, and whole-piece Ghost rendering. Internal shared edges are suppressed;
  depth comes only from the frozen restrained mineral bevel and exact coordinated
  garnet/sea-pine/ochre/storm/moss/rock-violet/lake mapping.
- Adopted Space Grotesk plus Noto Sans SC through Google Fonts with a complete system
  fallback. Restored visible Next and keyboard context at every required viewport,
  capped the clear sweep at nine ticks, and replaced positional statistic borders with
  semantic roles so desktop and compact dividers remain continuous.
- Final product source is `effb353c0a4d1bef26fa524ed38d3d3653f45eb8`;
  post-source candidate tip is `ba5d387f6c32224a4869ccc4e84564d7bcd64b50`.
  The last-source gates passed typecheck, 40 files / 258 tests (39 files and 256 tests
  passed; 1 file and 2 tests skipped), the 739-module production build, the prescribed
  action client, and loaded/blocked-font five-viewport browser matrices.
- Independent static/functional and visual/browser QA accepted the source. Formal
  evidence `c0832e43dc1cdd31c074066919c229d4a9fe5518` records 23 screenshots across
  all five exact viewports, first/eighth/fifteenth Puzzle binding, three real gravity
  locks, ordinary Race top-out, and first-level completion at 35 pieces / 22 lines.
- Independent evidence QA inspected 23/23 captures at original detail and reproduced
  25/25 SHA-256 entries from raw Git blobs. `browser-evidence.json` and
  `SHA256SUMS.txt` both contain zero CRLF; one-canvas/zero-DOM-cell geometry, 2:1
  boards, 44 px controls, lifecycle teardown, and zero unexpected browser errors pass.
- `index.html`, dependencies, historical T3/T4 evidence, and all separate game
  repositories remain unchanged by the accepted final repair.

## 2026-07-18 — Brighter divided facets, faster lock, and entry countdown

- Preserved the accepted T5 layout and rebuilt the Pixi cell material so connected
  tetrominoes keep one outer silhouette, a larger inter-piece channel, narrower
  internal seams, individually readable facets, and restrained dimensional depth.
- Applied the exact light `雾昼矿物` palette without changing layout, copy, responsive
  geometry, dividers, controls, or the plain-text `Tetris` identity.
- Reduced the shared grounded lock delay from 30 to 18 fixed ticks while retaining the
  existing movement/rotation reset rules and 15-reset cap.
- Added an input-gated `3 / 2 / 1` countdown on initial Classic, Race, and selected
  Puzzle entry. Gravity, audio, keyboard, touch, and DEV-QA reset/selection/action
  routes cannot advance or mutate the canonical ready state before the countdown ends.
- Final product source is `48176fe3d23cbc450fe39b38310c8a6b6eb71945`;
  candidate log tip is `d292b15dd012ade4c635b15595d276505ac72c58`.
  Final gates passed typecheck, 260 passed / 2 skipped tests across 40 files, the
  739-module build, the prescribed action client, and the five-viewport browser matrix.
- Independent Core and frontend/browser cross-QA accepted the exact repaired source
  with no open finding. Evidence `7d374188b8672cef32b5d90023db4f677421d178`
  contains 24 source-bound screenshots and 26/26 matching SHA-256 entries with zero
  unexpected browser errors.
- `index.html`, dependencies, Puzzle definitions/references, and separate game
  repositories were not changed.

## 2026-07-18 — Three independent mode rules and rising-floor Survival

- Split the three player-facing modes by objective. Classic is fixed-speed chain-score
  play, `生存` replaces visible `竞速` with permanent rising-floor pressure, and Puzzle
  remains the fifteen-level authored canonical-board-empty library.
- Removed Classic/Survival level acceleration. Both use fixed 48-tick gravity; Classic
  adds a visible consecutive-clear combo bonus and resets it on a non-clearing lock.
- Added a type-safe canonical `BEDROCK_CELL`. Every five Survival lines clears and
  scores first, then pushes the remaining board upward and appends one unbreakable
  mineral row. Bedrock blocks placement, never clears, has its own renderer material,
  participates in deterministic Survival state/hash, and resets on restart.
- Preserved all thirty accepted Puzzle solution event digests and final hashes through
  an invisible score/event compatibility layer; Puzzle gravity, UI, continuous queue,
  starting boards, goals, and reference artifacts remain unchanged.
- Updated the concise UI to `经典 / 生存 / 解谜`; Classic statistics are score, lines,
  and `连消`, while Survival statistics are score, lines, and bedrock height. Removed
  visible `竞速`, `等级`, and `速度档` plus the obsolete DEV level snapshot.
- Final product source is `5a3c35af325e4fa43841190e8acfb4867c8f1ebc`;
  source-log tip is `2308d80a104177025d0bfcb3d52cab69ac054ac0`.
  Final gates passed typecheck, 40 files / 263 tests (39 files and 261 tests passed;
  1 file and 2 tests skipped), the 739-module production build, and one formal
  browser-evidence pass.
- Independent Core and combined frontend/browser QA accepted with no finding. Formal
  evidence `a26d989` contains 24 source-bound captures, a 695-command public Survival
  replay at 24 lines / 4 bedrock rows, one canvas, zero DOM cells, 44 px controls, and
  zero unexpected browser errors.
- Independent evidence QA inspected all 24 PNGs at original detail and reproduced all
  26 raw-Git-blob SHA-256 entries with zero CRLF or integrity failure.
- `index.html`, dependencies, Puzzle definitions/references, ordinary tetromino
  geometry/palette, and every separate game repository remain unchanged.

## 2026-07-18 — Survival bedrock warm-mineral recolor accepted

- Replaced only the permanent bedrock's blue-grey material with the low-saturation
  warm rock-brown set `#9C8B73 / #76664F / #40372D / #CDBEAA`. This creates a clear
  geological layer beneath the seven brighter playable materials while preserving
  the existing divided facets, seams, and directional relief.
- Source `4b27a98` leaves all ordinary piece colors, renderer geometry, gameplay,
  layout, copy, dependencies, and `index.html` unchanged. Direct contrast regression
  holds both face endpoints above 3:1 against the board well.
- Final gates passed typecheck, 261 passed / 2 skipped tests across 40 files, the
  739-module build, the prescribed action client, and one 24-capture browser matrix.
- Independent static and visual/evidence QA both accepted with no P0–P3 finding.
  Evidence `367a443` contains zero browser errors, four visible full bedrock rows at
  24 lines, and 26/26 matching raw-Git-blob checksums.

## 2026-07-18 — Timed Survival pressure and restrained motion accepted

- Classic and Survival now share a line-driven gravity curve: speed advances every
  ten cleared lines from 48 ticks per cell down to the three-tick cap. Puzzle remains
  fixed at its accepted 48-tick cadence and all thirty signed routes stay unchanged.
- Survival now raises one permanent bedrock row after a 40-second playing-time timer.
  Every five cleared lines removes one bottom bedrock row when present, resets pressure,
  and shortens the next interval by two seconds down to a ten-second minimum.
- The UI removes the two unexplained decorative horizontal bars and states the three
  mode rules directly. Classic shows fall cadence; Survival shows bedrock height and
  next-rise countdown, including pending state.
- Added only bounded mode-entry/focus feedback and a brief renderer stack shift on
  bedrock rise/removal. Reduced motion explicitly disables the new animations,
  transitions, and transforms without altering canonical timing.
- Core source is `ff90d61`; final product source is
  `356440cf0f785b2558745c6eddd307b1654525e6`. Final gates passed typecheck,
  267 passed / 2 skipped tests across 40 files, and the 739-module production build.
- Formal evidence `9ef2708` contains 25 captures and zero unexpected browser errors.
  The public-command replay proves one full bedrock row at 2763 ticks, then five lines,
  zero bedrock, zero pressure, and a visible 38-second next interval. All 27 hashes
  match. Independent static and visual QA accepted with no P0–P3 finding.
- `index.html`, dependencies, Puzzle data/references, ordinary piece materials, and
  every separate game repository remain unchanged.
