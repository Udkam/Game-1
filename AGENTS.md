# TIDE//RELAY Collaboration Agreement

These rules apply to every worker on the `codex/temple-run` branch.

## Coordinator and workstream boundary

- The primary Codex task is the coordinator. It owns scope, sequencing, final acceptance,
  `docs/logs/CHANGELOG.md`, commit, and push.
- The Temple implementation owner may edit only the paths named in `CURRENT_TASK.md` and
  must keep `DESIGN.md`, rules, tests, and QA contracts synchronized with behavior.
- Independent QA is read-only and starts only after a candidate SHA exists. It must not
  repair production code or rewrite the implementation owner's evidence.
- Tetris work lives only in `E:\Proj\Game-1` on `codex/tetris`; do not read its dirty
  files as inputs, copy its implementation, or commit its artifacts here.
- A design or QA recommendation is not production authority. The coordinator must open
  a bounded implementation slice first.

## Required execution order

1. Read `AGENTS.md`, `DESIGN.md`, `CURRENT_TASK.md`, `docs/rules/RUNNER_RULES.md`,
   `docs/qa/TEMPLE_ACCEPTANCE.md`, and the latest changelog entry.
2. Correct the contracts before code whenever rules, visual direction, evidence, or
   completion gates change. Status must say `in progress` until final evidence exists.
3. Implement one named slice with one writer. Stop on any dirty-path ownership collision.
4. Run targeted tests during development; do not repeat full tests without a new reason.
5. After the last source edit, run exactly one final typecheck, one complete Vitest suite,
   one production build, and one browser-evidence capture pass.
6. Produce a candidate SHA and exact path/evidence summary. Independent QA then reviews
   that candidate without modifying production files.
7. Only the coordinator may resolve final documentation, update the changelog, push, and
   claim the slice accepted.

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
- Browser evidence must use fixed seeds/ticks, real keyboard or touch input where claimed,
  hashed screenshots, structured canonical state, one canvas, zero gameplay DOM entities,
  and zero console errors. QA scenarios must be reachable by real commands and replay to
  the same hash; direct inconsistent state fabrication is forbidden.
- Avoid repeated full tests. Run targeted checks while editing and one justified final full suite after the last source change.
- Do not commit `node_modules`, `dist`, coverage, browser profiles, or temporary captures.
- Ordinary verified edits, installs, tests, builds, commits, and pushes do not require confirmation.
- Ask before recursive or wildcard deletion, `git clean`, `git reset --hard`, force-push, or deleting sensitive files.
