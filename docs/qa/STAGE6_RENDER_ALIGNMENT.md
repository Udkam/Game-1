# Stage 6 Renderer Fidelity Alignment

Status: Stage 6 renderer fidelity pass implemented for review.

## Scope

Stage 6 fixes renderer coordinate consistency and visual scaling without adding
levels, content, or gameplay rules.

Implemented boundaries:

- canonical render metrics live in `src/render/metrics.ts`;
- simulation projection now hands renderer cell-space bounds only;
- Pixi primitives derive player, box, goal, wall, shadow, and recursive scale
  from shared metrics;
- recursive child worlds are positioned by depth-scaled world rectangles and
  clipped by the container aperture rather than resized into the aperture;
- camera bounds are derived from world metrics and keep shell/shadow material in
  view.

Out of scope:

- level packs;
- level serialization;
- new puzzle content;
- React gameplay DOM;
- new gameplay rules.

## Coordinate Pipeline

Renderer transforms use this order:

```text
Cell Space
  -> World Space
  -> Projection Space
  -> Camera Space
  -> Animation Offset
  -> Screen Space
```

Rules:

- Cell Space is integer simulation position and size.
- World Space is `CELL_SIZE`-based canvas geometry.
- Projection Space is the bounded recursive `WorldProjection` tree.
- Camera Space is owned by `Camera2D`, not `SimulationState`.
- Animation Offset is transient renderer feedback from `EventPipeline`.
- Screen Space is PixiJS canvas output only.

## Alignment Rules

- `PrototypeEntity.bounds` from simulation projection must remain cell-space
  `{ x, y, width: 1, height: 1 }` for single-cell entities.
- Entity visual sizing is renderer-owned:
  - player: `ENTITY_SIZE`;
  - box and recursive container: `BOX_SIZE`;
  - goal: `GOAL_SIZE`.
- World content area is `world.size * CELL_SIZE`.
- World shell, shadow, and rim material are drawn outward from the content area
  using `WALL_THICKNESS` and `SHADOW_OFFSET`.
- Recursive depth scale is `RECURSIVE_SCALE_FACTOR ** depth`.
- Nested world size is `childWorld.size * CELL_SIZE * depthScale`.
- Container aperture masks recursive children but does not determine their
  scale.

## Known Exceptions

- Primitive highlight strips, eye placement, and tab proportions use ratios
  inside metric-derived rectangles; they are decorative proportions, not
  independent pixel sizes.
- Camera margins remain viewport-relative because they belong to screen
  composition, not world geometry.
- Background void particles remain screen-space decoration and are not gameplay
  primitives.

## Visual Screenshot

Screenshot:

- `docs/screenshots/stage6-render-fidelity.png`

Purpose:

- Shows aligned player, box, and recursive container inside metric-defined cell
  positions.
- Shows a nested world clipped through the recursive container aperture.
- Confirms improved composition against the approved design reference without
  adding level content.

## Verification

Commands:

```text
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Results:

- `canvasCount: 1`
- `gameplayDom: 0`
- `consoleProblemEvents: 0`
- Screenshot bytes: `9093`
- Pixel sample: `1262x804`, `sampled: 4029`, `uniqueColors: 29`,
  `nonDarkSamples: 2107`, `nonBlank: true`
- Source boundary checks:
  - no `src/levels` directory;
  - no core imports from renderer/runtime/animation/Pixi/DOM/camera/viewport;
  - no React gameplay DOM selectors.

Screenshot observations:

- Player and box share the same row and read as centered inside their cell
  positions after movement input.
- The recursive container remains aligned to the cell grid and shows a nested
  world through its aperture.
- The root world frame keeps a heavier slab material while the playable content
  grid keeps a stable `CELL_SIZE` mapping.
