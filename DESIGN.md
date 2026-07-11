# Game-1 Product and Visual Design Contract

Status: active design authority for the reboot implementation. This document
supersedes historical stage aesthetics while preserving evidence and enduring
constraints from `DESIGN_REFERENCE.md` and the accepted frontend redesign
proposal.

## 1. Product promise

Game-1 should feel like a complete, deliberate recursive spatial puzzle game
in a browser—not an engine demo, Sokoban grid, UI mockup, or collection of
colored rectangles.

The fidelity target is the original game's clarity of scale, continuous
box-within-box spatial reasoning, confident movement, sparse presentation, and
orthographic physicality. The implementation remains clean-room: all layouts,
geometry, palettes, copy, audio, names, and code shipped by this repository are
original.

Primary experience pillars, in order:

1. Recursive space is continuously understandable.
2. Rules are deterministic enough to trust experimentation and undo.
3. Every command has responsive, spatially coherent feedback.
4. The playfield looks like a physical nested puzzle space, not web UI.
5. Desktop, mobile, keyboard, pointer/touch, and reduced motion share one game.
6. A small set of original levels teaches meaningful depth better than a large
   shallow pack.

## 2. Signature visual direction

The signature image is an **orthographic recursive slab diorama**: a saturated
world tray cuts into a near-black void or a larger cropped parent world, while
one world-bearing container exposes a smaller but materially consistent space.

One visual gesture governs the entire product: **the aperture is always a real
place**. It must preserve a frame, floor, palette identity, and meaningful
entity silhouette at every supported depth. Entering it enlarges the same
space continuously; it never becomes a route change, blank rectangle, or
separate scene.

Avoid generic frontend aesthetics:

- no dashboard cards around the board;
- no CSS grid board or tiled spreadsheet appearance;
- no neon/glassmorphism shell competing with the playfield;
- no excessive gradients, bloom, particles, or decorative UI motion;
- no rounded mobile-app widgets pretending to be game objects;
- no text labels inside gameplay entities.

## 3. Experience structure

### Boot and loading

- Show a near-black full-viewport surface and one restrained geometric mark.
- Initialize PixiJS asynchronously and expose truthful loading/failure state.
- Avoid fake progress percentages. A recoverable load failure offers retry.
- The shell must not flash a white page before the canvas is ready.

### Main menu

- Minimal original title treatment, primary Play action, Continue when valid,
  Settings, and an optional level-select entry after content is accepted.
- Use generous negative space and one small recursive visual vignette rendered
  by the same Pixi pipeline, not a copied hero image.
- Keyboard focus and touch targets are explicit; menu motion respects reduced
  motion.

### Gameplay

- The canvas dominates the viewport. Gameplay has no persistent panel chrome.
- A small level name/move count may appear only when useful and may fade when
  input begins.
- Undo, reset, pause, and input help are discoverable but visually subordinate.
- State feedback must be spatial first: motion, camera, aperture, goal response,
  and original audio cues; text is a fallback, not the main explanation.

### Pause and settings

- Pause freezes command dispatch and visual timelines at a safe boundary.
- Settings cover master/music/effects volume, reduced motion, input help, and
  renderer quality/DPR policy where relevant.
- Modal focus is trapped and restored correctly. Closing a modal never emits a
  gameplay command.

### Completion

- Completion confirms the solved spatial state without hiding it immediately.
- Use a restrained rim/floor response and original sound; then offer next,
  replay, and level-select actions.
- No confetti layer or large modal should erase the solved recursive relation.

## 4. Composition system

The renderer supports two authored composition modes selected by presentation
metadata outside canonical rules state.

### Detached void

- One active slab occupies approximately 60-86% of the limiting viewport
  dimension.
- Near-black void remains visible on at least one side.
- Sparse square particles provide scale only; they never compete with entities.
- Use for first reads, shallow puzzles, and isolated spatial demonstrations.

### Cropped parent context

- The active projection occupies approximately 42-78% of the viewport.
- At least one parent slab crosses a viewport edge and reads as larger context,
  never as a small card.
- Use during recursive depth, entry/exit, and scale-comparison puzzles.
- Mobile may choose a different crop while preserving the interaction target
  and aperture readability.

Camera state is deterministic for projection address, viewport, composition
mode, and reduced-motion setting. Canonical core state never stores pixels or
camera values.

## 5. World material grammar

Worlds are flat orthographic physical trays with scale-consistent construction:

1. thin dark outline;
2. authored shell color;
3. distinct top/side/bottom bevel planes;
4. recessed interior wall;
5. darker playable floor;
6. clipped goals, walls, entities, and child apertures;
7. restrained hard-edged shadow.

Corners are structural and modest, not soft application-card radii. Parent and
child worlds use the same grammar at different projection scales.

Every palette family provides at least:

```text
void, shell, outline, topBevel, sideBevel, bottomBevel,
recess, floor, wall, goal, player, pushable, container, shadow, focus
```

Initial original palette families:

- cobalt/magenta for strong recursive contrast;
- mineral/ice for detached void scenes;
- ochre/teal for warm depth comparisons;
- moss/gold for multi-world goal scenes;
- violet/cyan for advanced nested scenes.

Do not hard-code palette colors in primitives. Shared tokens and
`src/render/metrics.ts` are the visual geometry authorities.

## 6. Grid, alignment, and scale

The logical grid is invisible but exact. Every player, box, goal, wall,
container anchor, aperture, and animation endpoint derives from the same cell
space -> world space -> projection occurrence -> camera -> screen pipeline.

- Resting entities are centered on logical cells unless a semantic primitive
  explicitly documents another anchor.
- Animation offsets are applied after projection, never fed back into core.
- Pixel snapping may be used at final screen scale for crisp edges, but cannot
  alter logical coordinates.
- Recursive depth uses one bounded scale policy. No child world is manually
  stretched to fill an arbitrary rectangle.
- At the minimum supported preview scale, retain the aperture outline, palette
  distinction, and at least one key entity silhouette.

## 7. Entity language

### Player

- High-contrast square body, two eye dots, and a restrained facing cue.
- Readable at 48 CSS px and at approved recursive preview scales.
- Movement may use subtle squash/settle but never rubbery character animation.

### Pushable box

- Opaque square with a stable side plane/shadow vocabulary.
- Distinct from player by silhouette and palette, not a label.
- Push anticipation and settle are small enough to preserve grid certainty.

### Goal

- Thin socket integrated into the floor.
- It sits below entities and never resembles a floating button or card.
- Matched state increases local contrast without obscuring the entity.

### Recursive container

- Strongest frame/rim hierarchy among entities.
- Contains a masked, addressable projection of its actual child world.
- Degrades detail in this order as scale shrinks: decoration, minor entities,
  goals/walls. The aperture boundary and palette identity never disappear.

### Walls

- Belong to world geometry, not a visible tile grid.
- Produce deliberate corridors and negative space with the same bevel grammar.

## 8. Recursive transition and motion

Every accepted command owns one visual transaction from dispatch to a single
commit-safe completion barrier. Entity motion, projection interpolation,
camera, aperture, particles, and audio cues cannot unlock independently.

Initial evidence-tuning targets:

| Action | Duration | Required read |
| --- | ---: | --- |
| Step | 120-140 ms | Crisp slide, stable world, no camera jump |
| Push | 160-190 ms | Tiny anticipation, confident slide, restrained settle |
| Blocked | 70-95 ms | Directional nudge; canonical state/history unchanged |
| Enter/exit | 600-700 ms | Continuous scale change; parent, rim, and destination coexist near midpoint |
| Undo/redo | Reverse equivalent path | No stale entity or camera frame |

Rules:

- No frame during movement, enter, or exit may lose a visible world frame.
- Enter/exit target a resolved occurrence path, never a fixed entity ID.
- Reversing/cancelling follows the same transaction state machine.
- Reduced motion uses the same command/result and final camera state, but snaps
  or shortens presentation.
- Blocked feedback is renderer-only and never creates history.

## 9. Frontend architecture and accessibility

React owns semantic shell UI: loading, menus, settings, dialogs, navigation,
and optional accessible status. PixiJS owns gameplay visuals.

- One gameplay canvas; zero DOM gameplay cells/entities/worlds.
- The canvas is focusable and has a truthful accessible name and instructions.
- Keyboard: arrows/WASD step; Z/Backspace undo; Y/Shift+Z redo; R reset; Escape
  pause. Exact mappings remain configurable outside core rules.
- Pointer/touch uses swipe or deliberate directional controls that emit the
  same commands. Minimum target size is 44 CSS px.
- Focus indicators meet WCAG 2.2 AA contrast. Menus have logical headings and
  focus order.
- Status changes that cannot be perceived visually have a restrained
  `aria-live` summary outside the gameplay entity tree.
- Safe-area insets and `100dvh` are handled without shrinking the board into an
  illegible desktop thumbnail.

## 10. Original audio direction

Audio is replaceable and event-driven:

- step: short dry tick;
- push: lower body plus small settle;
- blocked: muted directional knock;
- enter/exit: scale sweep anchored to transaction progress;
- goal/complete: restrained harmonic resolution.

Only original or explicitly licensed assets may ship. Audio playback state is
never canonical simulation state, and reduced-motion does not silently mute
audio unless the user changes audio settings.

## 11. Runtime and performance design

- Retain/diff the scene graph; static world geometry is not destroyed and
  recreated every animated tick.
- Projection recursion is explicitly bounded and exposes visible occurrence
  counts for diagnostics.
- Renderer resolution is capped at a documented maximum DPR; CSS viewport size
  and backing resolution are reported separately.
- Target p95 frame time is <=16.7 ms for the agreed demo on desktop 1440x900
  DPR 1 and mobile 390x844 with reported DPR 3/capped renderer resolution.
- Thirty enter/exit cycles show no monotonic heap growth.
- Bundle size is measured; the existing Pixi chunk advisory is recorded, not
  hidden. Optimization must preserve architecture and fidelity.

If an agreed target device cannot hold 60 fps, publish measurements and obtain
a coordinator-approved budget; never silently lower visual correctness.

## 12. Gameplay and content direction

The deterministic engine is the authority. Presentation cannot create special
rules for one fixture or container.

The playable target eventually includes:

- normal movement and push chains;
- deterministic enter and exit through declared ports;
- reliable undo, redo, reset, replay, and win checks;
- original push-in/push-out and movable world-bearing-container mechanics only
  after a dedicated accepted contract;
- bounded, explicitly supported recursive depth/cycle policy;
- serializable original levels with validator and replay/solver evidence.

The initial campaign remains small. It should teach entry/exit, multi-world
goals, movable containers, and two-level nesting with original layouts. Level
work cannot compensate for engine defects or rely on hard-coded IDs.

## 13. Deterministic visual QA matrix

Every accepted visual milestone captures original local output tied to the
candidate SHA:

| Capture | Viewport | State |
| --- | --- | --- |
| `rest-void` | 1440x900 DPR 1 | Deterministic detached scene |
| `rest-context` | 1440x900 DPR 1 | Cropped parent and active child |
| `move-50` | 1440x900 DPR 1 | Mid-step with complete world frame |
| `enter-00/50/100` | 1440x900 DPR 1 | Start, midpoint, settled child |
| `exit-50/100` | 1440x900 DPR 1 | Reverse midpoint and settled parent |
| `mobile-rest/enter-50` | 390x844 reported DPR 3 | Verified portrait viewport |
| `reduced-motion-enter` | 1440x900 DPR 1 | Equivalent final hash/target |

Each record includes exact command trace/timing, visible occurrence addresses,
canvas/DOM/console counts, pixel dimensions, nonblank/palette metrics, and a
short comparison against the intended composition mode. Official reference
images remain outside the repository.

## 14. Acceptance and red flags

A visual slice is acceptable only when spatial hierarchy reads without text,
resting entities align, middle frames remain continuous, both composition modes
work, and objective browser evidence passes.

Immediate red flags:

- centered gray panel with empty margins as the only composition;
- nested world presented as a thumbnail or blank color field;
- entities floating between cells at rest;
- parent frame disappearing during transition;
- camera changing scene instead of crossing an aperture;
- fixed fixture/container IDs;
- gameplay rendered as DOM;
- whole render tree rebuilt every frame;
- desktop-only evidence presented as mobile support;
- effects used to hide geometry or alignment defects;
- copied official content.

`CURRENT_TASK.md` converts this design into bounded implementation slices. No
single screenshot, stage label, or feature demo may declare this contract
complete.
