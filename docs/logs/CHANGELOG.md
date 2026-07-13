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
