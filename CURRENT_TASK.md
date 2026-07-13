# Current Task

## Active slice: TR1 — Complete TIDE//RELAY endless runner

Branch: `codex/temple-run`

Status: complete and ready for branch delivery.

### Required outcome

Deliver one polished, complete third-person endless runner with:

- deterministic procedural course generation and replayable simulation state
- continuous acceleration and three-lane movement
- jump, slide, correct/incorrect 90-degree turns, gaps, blockers, pickups, and shield
- fair generation with reaction-distance validation
- distance, score, shards, multiplier, best score, pause, restart, and game over
- fixed-step runtime and smooth interpolated Three.js presentation
- runner animation, chase pressure, camera follow, turn camera, impacts, and procedural audio
- keyboard, real one-finger swipe, and visible accessible controls
- responsive desktop, portrait, and landscape layouts
- reduced motion, high contrast, audio toggle, and lifecycle cleanup
- unit tests, deterministic replay tests, build, browser interaction, screenshots, and performance evidence

### Non-goals

- copied Temple Run branding, characters, monsters, art, music, UI, screenshots, or source
- shops, ads, accounts, purchases, online leaderboards, unlock trees, or multiple environments
- importing implementation from `codex/tetris`
- shipping another game mode before TR1 acceptance

### Completion gate

TR1 is complete only after typecheck, the final full test suite, production build, desktop keyboard play, mobile touch/swipe play, pause/blur/visibility checks, deterministic turn/jump/slide/collision scenarios, screenshot review, console inspection, resource cleanup, and performance evidence pass.

### Completion evidence

- TypeScript project references pass without diagnostics.
- Vitest passes 9 files / 37 tests, including deterministic generation, replay, motion, turns, turn-lane presentation, reduced-motion rig behavior, runtime lifecycle, and touch classification.
- The production build completes successfully.
- Chrome evidence covers 13 visual states plus real desktop input, real DPR3 touch input, and separate 180-frame desktop/mobile scene-preparation benchmarks.
- Every browser hard gate in `docs/qa/TEMPLE_ACCEPTANCE.md` passes.
- The implementation remains clean-room and contains no Temple Run assets, branding, characters, music, interface, or source.
