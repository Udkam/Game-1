# Implementation Plan

Status: approved implementation contract through Stage 6 renderer fidelity
alignment. Do not proceed to Stage 7 without review.

## Gate 0: Approval Required

Current allowed work:

- Stage 1 scaffold.
- Stage 2 PixiJS renderer foundation.
- Stage 3A recursive space interaction prototype.
- Stage 3A-Refinement recursive visual fidelity.
- Stage 3B recursive simulation core.
- Stage 4 recursive gameplay kernel.
- Browser/computer visual QA and screenshot evidence for Stage 2.
- Browser/computer visual QA and screenshot evidence for Stage 3A.
- Browser/computer visual QA and screenshot evidence for Stage 3A-Refinement.
- Browser/computer visual QA and screenshot evidence for Stage 3B.
- Browser/computer visual QA and screenshot evidence for Stage 4.
- Browser/computer visual QA and screenshot evidence for Stage 5.
- Browser/computer visual QA and screenshot evidence for Stage 6.

Current forbidden work:

- Renderer redesign.
- React gameplay UI, DOM cells, or DOM entities.
- Level systems or puzzle content.
- Level packs, level editor, menus, polish UI, or large content.
- Proceeding to Stage 7 without explicit review.

## Evidence Already Collected

Local repository:

- Current worktree is records-only except new draft docs.
- Current branch is `feature/recursive-box-lab`.
- Old local history contains a DOM/CSS implementation rejected as visually and
  architecturally insufficient.
- `docs/reboot/FAILED_ROUND.md` says failed branches must not be continued.

External research:

- Official site and press kit establish recursive boxes, over 350 hand-crafted
  puzzles, minimal visuals, and a focus on boxes within boxes.
- Official screenshots establish orthographic slab worlds, nested previews,
  high-contrast entity colors, and almost no UI chrome.
- Chrome inspection of the official press page confirmed eight full-size
  `1920x1080` screenshot references; a temporary image-analysis pass measured
  dark/void coverage, saturation coverage, and dominant palette families.
- GameDeveloper interview confirms center-entry and camera-context decisions
  are careful rule/feel choices, not incidental details.
- GitHub demakes are useful for rule comparison, not for final architecture.

Library/resource research:

- Context7 resolved PixiJS as `/pixijs/pixijs`.
- Context7 confirmed PixiJS v8 async `Application.init`, renderer preference,
  `Assets`, `Container`, resize, and ticker usage.
- Context7 confirmed React effects/cleanup are the right boundary for an
  imperative canvas runtime.
- Context7 resolved Vite docs and confirmed public/base asset handling concerns.

## Applicable Skills And MCP Resources

Use these in the implementation phase:

- Context7: PixiJS, React, Vite, Vitest, and any other library docs before code.
- Browser/in-app browser or Chrome tools: inspect local canvas output, interact
  with the game, and capture screenshots.
- Playwright: deterministic screenshots and canvas pixel checks.
- Multi-agent review: use for independent architecture review, visual critique,
  and implementation verification once coding begins.
- GitHub/web search: consult public demakes for rule edge cases only.
- Image generation: optional for non-infringing texture studies, but procedural
  Pixi graphics should be the first implementation path.

Unavailable/limited:

- The repo-local `craft-frontend-design` skill file was deleted during reset,
  so it cannot be executed from `.agents`. Its old guidance remains useful only
  as historical evidence and should not be restored blindly.

## Risk Register

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| Implementation drifts back to DOM grid | Previous local attempt failed partly because the UI read as a dashboard around cells. | Add source checks for gameplay DOM nodes; keep React host-only; require Pixi canvas screenshot evidence. |
| Renderer duplicates recursive state | Cloning nested worlds would make cycles, undo, and serialization brittle. | Keep canonical graph state separate from bounded `WorldProjection` views. |
| Visuals become low-fidelity demake | GitHub references are low-fidelity or Canvas/TIC-80 oriented. | Use them only for rule edge cases; judge visuals against official screenshot metrics. |
| Camera transitions feel like page navigation | Enter/exit is core game feel, not a route change. | Implement camera timelines before adding multiple levels. |
| Undo diverges from animation state | If history includes renderer state, replay and tests become unreliable. | Store only deterministic core snapshots or patches; derive animation from transition events. |
| Level schema overfits first tutorial | A narrow schema would block later recursive/cyclic cases. | Version schema, validate graph references, and keep cycle policy explicit. |
| Asset/legal boundary blurs | High fidelity can accidentally become copying. | Use procedural originals, do not ship official art/levels/sounds/copy, and keep reference assets out of repo. |
| Content amount hides weak architecture | Many levels can mask a shallow engine. | Delay content expansion until Stage 8 after fidelity, recursion, and game feel gates pass. |

## Requirement Traceability

| Objective requirement | Current evidence | Status before implementation |
| --- | --- | --- |
| Inspect existing repository | `Get-ChildItem`, `git status`, and current docs confirm a records-only baseline plus three draft approval docs. | Complete for architecture gate; repeat before coding. |
| Inspect git history and documents | `git log` and `git show HEAD:docs/recursive-box-lab/*` were reviewed; failed branch docs are summarized in `ARCHITECTURE.md`. | Complete for architecture gate; old code remains evidence only. |
| Analyze Patrick's Parabox screenshots through browser/computer tools | Chrome inspected the official press page; temporary full-size screenshots were measured and summarized in `DESIGN_REFERENCE.md`. | Complete for architecture gate; local output comparison remains future Stage 7 work. |
| Search GitHub for related recursive puzzle engines | GitHub demakes, ports, PuzzleScript archive/gists, and `patricks-hyperbox` are listed and analyzed in `DESIGN_REFERENCE.md`. | Complete for architecture gate; consult again for rule edge cases only. |
| Identify useful coding skills/MCP resources | Context7, browser/Chrome tools, Playwright, image generation boundaries, and multi-agent review are listed above. | Complete for architecture gate; fetch library docs again before code. |
| Do not use simple React DOM components | `ARCHITECTURE.md` explicitly makes React a host shell and forbids React cells/entities/worlds. | Enforced by architecture; implementation must add tests/search checks. |
| Use React + TypeScript + Vite + PixiJS/WebGL | Architecture and Stage 1/2 plan require this stack. | Planned, not implemented. |
| Recursive graph based world model | `ARCHITECTURE.md` defines `WorldNode`, `ContainerComponent`, `WorldAddress`, and bounded projections. | Designed, not implemented. |
| Entity component separation | `ARCHITECTURE.md` defines components and systems rather than inheritance-heavy game objects. | Designed, not implemented. |
| Renderer layer | `ARCHITECTURE.md` defines Pixi display layers and render rules. | Designed, not implemented. |
| Camera system | `ARCHITECTURE.md` defines camera behaviors for zoom, fit, parent context, void mode, and deterministic screenshots. | Designed, not implemented. |
| Input manager | `ARCHITECTURE.md` defines command-based keyboard/pointer/replay input. | Designed, not implemented. |
| Undo/redo history | `ARCHITECTURE.md` defines deterministic history entries and state boundaries. | Designed, not implemented. |
| Level serialization | `ARCHITECTURE.md` defines JSON schema and validation requirements; Stage 6 plans loader/replay modules. | Designed, not implemented. |
| Use computer tools to compare visual output | Stage 7 requires Playwright screenshots, canvas pixel checks, and color analysis against the official screenshot metrics. | Planned; blocked until implementation output exists. |
| Create `ARCHITECTURE.md`, `DESIGN_REFERENCE.md`, `IMPLEMENTATION_PLAN.md` | All three root-level docs exist and are draft-for-approval. | Complete for architecture gate. |
| Only after architecture approval start implementation | Each doc states draft/approval status and this plan's Gate 0 forbids source/package creation. | Active gate; no implementation files exist. |

## Pre-Implementation Readiness Audit

Current state before Stage 3A approval:

| Check | Evidence | Decision |
| --- | --- | --- |
| Worktree is reset away from failed implementation | Root contains only `.git`, `docs`, and the three draft approval documents. | Ready for approval review. |
| Old implementation is not being continued | Git status shows old implementation files as deletions; no old `src` files are restored. | Ready for approval review. |
| Required pre-code research exists | Repository/history/screenshots/GitHub references/MCP resources are documented. | Ready for approval review. |
| Architecture covers requested systems | Core graph, ECS, renderer, camera, input, history, serialization, and QA gates are defined. | Ready for approval review. |
| Implementation has not started | `src`, `package.json`, `vite.config.ts`, and `index.html` do not exist. | Gate is intact. |
| Local visual output has been compared | No local output exists yet, so comparison is impossible. | Deferred until Stage 7 after implementation output exists. |
| Approval has been granted | Stage 1, Stage 2, and Stage 3A approval messages have been recorded. | Ready for Stage 3A only. |

The next missing decision is Stage 7 approval after Stage 6 renderer-fidelity
review.

## Approval Decision Record

No implementation work may begin until this section has an explicit approval
entry from the user or a later agent records the exact approval message.

Current decision:

- Status: approved through Stage 6 renderer fidelity alignment only.
- Stage 1 approval evidence: user message on 2026-07-07:
  `Approved for Stage 1 scaffold: ARCHITECTURE.md, DESIGN_REFERENCE.md, and IMPLEMENTATION_PLAN.md are accepted as the implementation contract.`
- Stage 2 approval evidence: user-provided objective on 2026-07-07:
  `Proceed with Stage 2: PixiJS Renderer Foundation. Stage 1 is approved.`
- Stage 3A approval evidence: user-provided objective on 2026-07-07:
  `Proceed with Stage 3A: Recursive Space Interaction Prototype. Stage 2 renderer foundation is approved.`
- Stage 3A-Refinement approval evidence: user-provided objective on 2026-07-08:
  `Implement Stage 3A-Refinement only, improving renderer visual fidelity. Do not proceed to Stage 3B.`
- Stage 3B approval evidence: user-provided objective on 2026-07-08:
  `Proceed to Stage 3B: Recursive Simulation Core. Stage 3A-Refinement is approved.`
- Stage 4 approval evidence: user-provided objective on 2026-07-08:
  `Proceed with Stage 4: Recursive Gameplay Kernel. Stage 3B is approved.`
- Stage 5 approval evidence: user-provided objective on 2026-07-08:
  `Proceed to Stage 5: Game Feel and Event Driven Rendering. Stage 4 is approved.`
- Stage 6 approval evidence: user-provided objective on 2026-07-08:
  `Proceed to Stage 6: Renderer Fidelity Pass. Stage 5 approved.`
- Allowed next action: Stage 6 renderer fidelity alignment,
  browser visual QA, screenshot evidence, commit, and main-branch publication.
- Previous allowed action: Stage 2 renderer foundation, browser visual QA,
  screenshot evidence, commit, and main-branch publication.
- Forbidden next action: level packs, level editor, menus, polish UI, large
  content, renderer redesign, React gameplay UI, or Stage 7 work.

Approval can be recorded as:

```text
Approved for Stage 1 scaffold: ARCHITECTURE.md, DESIGN_REFERENCE.md, and
IMPLEMENTATION_PLAN.md are accepted as the implementation contract.
```

If the documents are rejected or revised, record the requested changes here
before implementation starts.

Default decisions after approval:

- Start with Stage 1 only; do not batch Stage 2 or movement logic into the same
  first commit.
- Use npm scripts through `npm.cmd` on this Windows machine.
- Fetch current Context7 documentation again before adding PixiJS, React, Vite,
  or Vitest code.
- Keep reference screenshots out of the repository unless the user explicitly
  approves storing derived review artifacts.
- Use procedural PixiJS geometry for first visuals; no generated or third-party
  texture atlas in the first scaffold.

## Implementation Directory Contract

After approval, use this directory shape unless a later architecture revision
changes it:

```text
src/
  app/              React host shell only
  runtime/          lifecycle, command queue, dependency wiring
  core/             deterministic graph simulation
  projection/       bounded recursive view models
  render/           PixiJS renderer, camera, layers, primitives
  animation/        timelines and transition feedback
  input/            keyboard, pointer, replay command sources
  levels/           JSON data, schema, validation, replay fixtures
  qa/               browser-visible debug hooks only, no gameplay logic
scripts/
  capture-screenshots.mjs
  analyze-screenshot-colors.mjs
docs/
  qa/
  screenshots/
```

Disallowed implementation shortcuts:

- Creating `src/components/Cell.tsx`, `src/components/Board.tsx`, or any
  gameplay React component equivalent under a different name.
- Putting PixiJS display objects into core state.
- Putting movement rules inside renderer, input, or React handlers.
- Storing levels as arbitrary TypeScript functions instead of serializable data.
- Reintroducing `.agents` design-skill files as part of the app.

## Stage 1: Scaffold After Approval

Goal: create a clean React + TypeScript + Vite project without gameplay yet.

Planned files:

- `package.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `src/main.tsx`
- `src/app/GameCanvasHost.tsx`
- `src/runtime/GameRuntime.ts`
- `src/styles/app.css`

Acceptance:

- `npm.cmd install`
- `npm.cmd run typecheck`
- `npm.cmd run build`
- Browser shows a mounted PixiJS canvas with deterministic background.
- React does not render gameplay cells/entities.

Failure conditions:

- `src` contains React components named or structured around cells, tiles,
  entities, worlds, or boards.
- The first canvas mount depends on CSS grid/flex layout to position gameplay
  elements.
- PixiJS initialization uses old synchronous v7-style `new Application(options)`
  instead of v8 async `app.init(...)`.

## Stage 2: PixiJS Rendering Skeleton

Goal: establish canvas-first rendering and camera primitives.

Planned modules:

- `src/render/PixiApp.ts`
- `src/render/Camera2D.ts`
- `src/render/layers.ts`
- `src/render/palette.ts`
- `src/render/primitives/worldFrame.ts`
- `src/render/primitives/entitySprites.ts`

Acceptance:

- PixiJS v8 async initialization works.
- Canvas resizes with host.
- World frame primitive draws beveled shell/interior.
- Entity sprite primitives draw without text labels.
- Screenshot and pixel check prove nonblank WebGL output.

Failure conditions:

- The player, box, recursive container, wall, or goal can only be understood
  through text labels.
- The world frame reads as a flat spreadsheet grid rather than a thick slab.
- No screenshot can distinguish void-mode from cropped-parent mode.

## Stage 3A: Recursive Space Interaction Prototype

Goal: prove that entering a recursive container changes spatial scale
continuously before implementing gameplay.

Planned modules:

- `src/animation/TransitionTimeline.ts`
- `src/animation/easing.ts`
- `src/render/RecursiveTransitionRenderer.ts`
- `src/runtime/InteractionPrototype.ts`

Acceptance:

- Pressing `E` triggers an enter transition.
- Pressing `E` again triggers the reverse exit transition.
- The transition uses the existing projection tree: World A contains Box B,
  whose aperture projects World C.
- Camera transform interpolates position and scale deterministically.
- Transition cancellation/reversal is safe if the prototype input is used while
  a transition is active.
- Browser QA captures `docs/screenshots/stage3a-enter-transition.png`.

Failure conditions:

- The prototype introduces movement, levels, undo/redo, or ECS.
- The inner world is cloned into a second mutable gameplay state.
- React renders gameplay nodes for the transition.
- Entering the box hard-switches views instead of visibly changing scale.

## Stage 3A-Refinement: Recursive Visual Fidelity

Goal: improve the Stage 3A recursive transition's visual fidelity without
introducing gameplay systems.

Implemented modules/artifacts:

- `src/render/materials/worldMaterial.ts`
- `src/render/materials/index.ts`
- `src/render/primitives/worldFrame.ts`
- `src/render/primitives/entityPrimitives.ts`
- `src/render/RecursiveTransitionRenderer.ts`
- `src/render/palette.ts`
- `docs/screenshots/stage3a-refined.png`

Acceptance:

- Outer and inner worlds use shared proportional slab material metrics.
- Player, box, goal, and recursive container primitives are readable without
  text labels.
- Enter transition keeps recursive aperture context visible instead of replacing
  the view with a flat full-frame child world.
- Browser QA captures `docs/screenshots/stage3a-refined.png`.
- React DOM still contains no gameplay cells or entities.

Failure conditions:

- The refinement adds movement, levels, undo/redo, ECS, or Stage 3B simulation.
- The renderer relies on official Patrick's Parabox assets or copied level
  layouts.
- The recursive aperture is visually indistinguishable from a normal static
  world frame.

## Stage 3B: Simulation Core

Goal: build deterministic recursive graph logic independent of PixiJS.

Planned modules:

- `src/core/types.ts`
- `src/core/worldGraph.ts`
- `src/core/components.ts`
- `src/core/commands.ts`
- `src/core/reducer.ts`
- `src/core/movement.ts`
- `src/core/recursiveTransitions.ts`
- `src/core/history.ts`
- `src/core/win.ts`
- `src/core/hash.ts`

Acceptance:

- Unit tests cover world graph creation, entity lookup, container references,
  enter/exit state changes, invalid recursive reference rejection, and
  deterministic hashing.
- Core has no React or Pixi imports.
- History records commands, previous state hashes, and next state hashes without
  renderer state.
- Existing renderer can consume a projection generated from a simulation
  snapshot.

Failure conditions:

- Core state stores pixels, display objects, DOM nodes, timers, CSS classes, or
  viewport dimensions.
- Recursive containment is represented by deep-cloning worlds instead of graph
  references.
- Undo restores visuals without proving the core hash changed back.
- The stage adds levels, UI, or complete Sokoban push-chain rules.

## Stage 4: Recursive Gameplay Kernel

Goal: build the gameplay foundation of a Patrick's Parabox-style recursive
puzzle engine while preserving the existing renderer architecture.

Implemented modules/artifacts:

- `docs/recursive-box-lab/GAME_RULES.md`
- `src/core/collision.ts`
- `src/core/movementResolver.ts`
- `src/core/recursiveMovement.ts`
- `src/core/systems.ts`
- `src/core/commands.ts`
- `src/core/reducer.ts`
- `src/core/recursiveTransitions.ts`
- `src/core/worldGraph.ts`
- `src/core/types.ts`
- `src/core/core.test.ts`
- `src/projection/simulationProjection.ts`
- `src/projection/simulationProjection.test.ts`
- `docs/qa/STAGE4_PLAYABLE_CORE.md`
- `docs/screenshots/stage4-playable-core.png`

Acceptance:

- Movement resolver handles normal moves, blocked moves, single-box pushes, and
  multi-box push chains.
- Recursive movement handles enter, exit, and moving a pushable container entity
  while preserving its contained world graph reference.
- Core emits transition events and stores no renderer, camera, animation, DOM,
  CSS, viewport, or timing state.
- Undo/redo restores canonical positions, focus path, active world, and hashes.
- Existing Pixi renderer consumes a projection generated from Stage 4
  `SimulationState`.

Failure conditions:

- Stage 4 is simplified into a flat normal Sokoban engine.
- Renderer imports or Pixi objects enter `src/core`.
- Gameplay entities are rendered as React DOM nodes.
- The stage adds level packs, a level editor, menus, polish UI, or large
  content.

## Stage 5: Event Driven Game Feel

Goal: convert simulation events into high-fidelity playable feedback without
adding level content.

Implemented modules/artifacts:

- `src/animation/AnimationSystem.ts`
- `src/animation/Timeline.ts`
- `src/animation/easing.ts`
- `src/animation/transitions.ts`
- `src/audio/AudioManager.ts`
- `src/runtime/EventPipeline.ts`
- `src/runtime/InteractionPrototype.ts`
- `src/core/replay.ts`
- `src/render/Camera2D.ts`
- `src/render/PixiApp.ts`
- `docs/qa/STAGE5_GAME_FEEL.md`
- `docs/screenshots/stage5-game-feel.png`

Acceptance:

- Keyboard commands drive the same API used by tests and replays.
- Simulation events flow through `EventPipeline` into animation timelines and
  Pixi renderer interpolation.
- Movement, push, blocked, enter, exit, undo, and solved feedback have distinct
  animation/audio/camera cues.
- Camera follow, impact, enter, and exit cues remain outside
  `SimulationState`.
- Audio foundation exposes replaceable move, push, blocked, enter, exit, and
  success sound events without final assets.
- Browser QA captures `docs/screenshots/stage5-game-feel.png`.

Failure conditions:

- Keyboard handling directly mutates entities.
- Undo/redo uses separate code paths from replay.
- A move can be accepted while the prior transition is in an undefined
  half-committed state.
- Stage 5 adds level packs, a level editor, menus, polish UI, or large content.

## Stage 6: Renderer Fidelity Alignment

Goal: fix coordinate consistency and improve Patrick's Parabox-inspired visual
fidelity without adding level content.

Implemented modules/artifacts:

- `src/render/metrics.ts`
- `src/render/metrics.test.ts`
- `src/render/PixiApp.ts`
- `src/render/materials/worldMaterial.ts`
- `src/render/primitives/worldFrame.ts`
- `src/render/primitives/entityPrimitives.ts`
- `src/projection/simulationProjection.ts`
- `src/projection/worldProjection.ts`
- `docs/qa/STAGE6_RENDER_ALIGNMENT.md`
- `docs/screenshots/stage6-render-fidelity.png`

Acceptance:

- Shared metrics define cell, entity, box, wall, goal, shadow, and recursive
  depth sizing.
- Simulation projection hands renderer cell-space bounds only.
- Renderer owns visual alignment, primitive dimensions, recursive child scaling,
  shell material, shadows, and camera bounds.
- Recursive child worlds are depth-scaled and masked through container
  apertures; they are not manually resized into aperture rectangles.
- Browser QA captures `docs/screenshots/stage6-render-fidelity.png`.

Failure conditions:

- Stage 6 adds level packs, level serialization, menus, polish UI, large
  content, or new gameplay rules.
- Core imports renderer, animation, runtime, PixiJS, DOM, camera, or viewport
  modules.
- React renders gameplay cells/entities.
- Primitive dimensions fall back to scattered pixel constants instead of
  `src/render/metrics.ts`.

## Stage 7: Level Serialization

Goal: make levels data-driven and extensible after renderer fidelity review.

Planned modules:

- `src/levels/schema.ts`
- `src/levels/validateLevel.ts`
- `src/levels/loadLevel.ts`
- `src/levels/tutorial/*.json`
- `src/levels/replay.ts`

Acceptance:

- JSON level schema has versioning.
- Every level validates before play.
- Scripted solutions solve included levels.
- Level data is separate from engine code.

Failure conditions:

- A level imports executable TypeScript to define rules.
- Entity IDs, world IDs, or container edges are inferred from render order.
- A schema migration path is impossible because no `schemaVersion` exists.

## Stage 8: Visual QA And Reference Comparison

Goal: prove output is moving toward the requested visual target.

Planned modules/artifacts:

- `scripts/capture-screenshots.mjs`
- `scripts/analyze-screenshot-colors.mjs`
- `docs/screenshots/reference-study/*.png`
- `docs/qa/VISUAL_AUDIT.md`

Acceptance:

- Playwright captures desktop and mobile screenshots.
- Canvas pixel checks confirm nonblank render and expected palette diversity.
- Screenshots show recursive parent/child context.
- Screenshot analysis reports dominant colors, dark/void coverage, saturation
  coverage, and whether the scene is closer to void-mode or full-frame
  colored-parent mode.
- Findings are documented before claiming a slice is acceptable.

Failure conditions:

- The local screenshot is accepted based on a passing build only.
- Canvas pixel checks are omitted or only prove a blank background exists.
- The first slice does not include any visible recursive-world relationship.

## Stage 9: Content Expansion

Goal: add content only after fidelity, architecture, and game feel are credible.

Planned content:

- 3 to 5 mechanics-first tutorial levels.
- Each level introduces one idea.
- No copied layouts from Patrick's Parabox.
- No filler levels to inflate count.

Acceptance:

- All levels have scripted solution tests.
- Level progression demonstrates recursive architecture rather than generic
  Sokoban pushing.

Failure conditions:

- More levels are added before Stage 7 visual QA passes.
- Levels primarily test wall/box pushing without recursive enter/exit or
  container movement.
- Any level copies an official Patrick's Parabox layout.

## Approval Checklist

Implementation can start when the user approves:

- Canvas/WebGL-first direction with PixiJS v8.
- Graph-based recursive world model with bounded projection rendering.
- Entity component separation.
- Camera/input/history/serialization module boundaries.
- Visual reference targets and non-commercial study boundary.
- Stage order that delays content amount until fidelity and architecture are
  credible.

## First Post-Approval Commit Scope

The first implementation commit should be small:

- Scaffold Vite/React/TypeScript.
- Mount PixiJS canvas.
- Draw one static reference-style world frame and one entity.
- Add build/typecheck scripts.
- Add one Playwright or browser smoke check if tooling cost is low.

It should not include full puzzle rules, level packs, or recreated old UI.

Hard stop after first commit:

- Capture a screenshot before adding gameplay rules.
- Confirm the screenshot is nonblank and visibly canvas-rendered.
- Confirm no React DOM gameplay nodes exist.
- Record whether the initial composition targets void-mode or cropped-parent
  mode.
- Do not proceed to movement code until the static frame passes this visual
  smoke gate.
