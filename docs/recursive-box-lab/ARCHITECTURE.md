# Recursive Box Lab Architecture

## State Structure

The game state is split into pure core state and UI/session state.

- `GameCoreState`
  - level metadata
  - world map
  - entity map
  - player id
  - active world id
  - move count
  - win flag
  - recent action
- `GameState`
  - current core state
  - immutable initial snapshot
  - history stack for undo
- UI state
  - selected view
  - debug/help visibility
  - localStorage progress

Worlds form a finite parent-child graph. A box may own `innerWorldId`; the owned world records its parent as the box's current world and box id. When a box with an inner world moves, the engine updates that parent metadata so nested boxes remain coherent.

## Move Pipeline

`applyMove(state, dir)`:

1. Clone the current core state.
2. Resolve the player entity and target cell.
3. If target is empty, move the player.
4. If target is a wall or blocked entity, reject the move.
5. If target is an open box, enter its inner world.
6. If target is pushable, recursively push it.
7. If a push crosses an inner-world boundary, push out to the parent world.
8. Recompute win state.
9. Add the previous core snapshot to history.

Failed moves return the original state object and do not add history.

## Recursive Mechanics

- `enterBox`: moves an entity into an open box's inner world at that world's entry coordinate.
- `pushInto`: pushes a box into another open box's inner world.
- `pushOut`: moves a pushed entity through the edge of an inner world into the parent world.
- `paradox guard`: rejects direct self-containment and descendant containment that would make state unserializable.

This is a finite recursive model. Infinite self-recursion is intentionally out of scope for the demo.

## Nested World Rendering

The UI renders the active world as the main board. Open boxes render compact inner-world previews up to a capped depth. This keeps nested structure visible without letting recursive previews make the board unreadable.

The debug panel shows the current world, entity count, recent action, and layer tree.

## Level Schema

Levels are static TypeScript objects:

- `worlds`: rectangular grids with optional parent metadata.
- `entities`: player, boxes, walls, and goals.
- `playerId`: the active player.
- `activeWorldId`: optional starting world.

Tests validate schema correctness and verify a solution path for every tutorial level.

## Progress Persistence

`src/progress/storage.ts` stores:

- current level id
- completed level ids
- best move count per level

The storage layer is defensive: corrupt or missing localStorage data falls back to an empty progress record.

## Known Limitations

- Infinite recursion is not implemented.
- Inner previews are capped.
- There is one player entity.
- Static level data is bundled with the app.
- Push-out maps to the parent cell adjacent to the containing box in the movement direction.
