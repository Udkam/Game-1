# Repository Rules

These rules apply to every worker on the `codex/temple-run` branch.

## Product boundary

- Build one complete clean-room third-person endless-runner game named `TIDE//RELAY`.
- Reproduce the interaction grammar and tension of classic endless runners, not Temple Run branding, characters, monsters, art, music, icons, text, or screen composition.
- Do not copy assets or source from commercial games or public clones.
- Do not import work from `codex/tetris` or the archived recursive-puzzle branch.
- React owns the shell, menus, accessibility, and lifecycle. Three.js owns the only gameplay canvas and all world entities.
- The deterministic simulation core must not import React, Three.js, DOM, storage, WebAudio, or wall-clock APIs.

## Gameplay invariants

- All gameplay changes enter through typed commands and fixed 60 Hz simulation ticks.
- The course generator is deterministic from seed and generator state.
- A generated decision must always have at least one valid solution at its authored reaction speed.
- Lane changes, jumping, sliding, turns, collisions, pickups, scoring, and top-out/fall states are resolved in the simulation before presentation.
- Renderer interpolation and camera effects cannot alter canonical state.
- Pause, window blur, document hiding, restart, and unmount must clear held input and freeze or dispose the correct clocks.

## Visual and input rules

- Preserve one world-space coordinate pipeline for path, runner, obstacles, pickups, and camera.
- Obstacles must be readable by silhouette and geometry, not color alone.
- A turn window takes priority over an ordinary lane change.
- One swipe or key press produces at most one semantic action.
- Mobile controls use CSS-pixel thresholds and must not depend on device pixel ratio.
- `prefers-reduced-motion` removes camera shake, speed streaks, and decorative motion without changing rule timing.

## Evidence and scope

- Keep `DESIGN.md`, `CURRENT_TASK.md`, `docs/rules/RUNNER_RULES.md`, and `docs/qa/TEMPLE_ACCEPTANCE.md` aligned with production behavior.
- Browser evidence must use fixed seeds/ticks, real keyboard or touch input where claimed, hashed screenshots, structured state, one canvas, zero gameplay DOM entities, and zero console errors.
- Avoid repeated full tests. Run targeted checks while editing and one justified final full suite after the last source change.
- Do not commit `node_modules`, `dist`, coverage, browser profiles, or temporary captures.
- Ordinary verified edits, installs, tests, builds, commits, and pushes do not require confirmation.
- Ask before recursive or wildcard deletion, `git clean`, `git reset --hard`, force-push, or deleting sensitive files.
