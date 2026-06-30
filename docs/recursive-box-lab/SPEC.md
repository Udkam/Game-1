# Recursive Box Lab Specification

Stage 1 establishes the core gameplay model for an original recursive box puzzle demo. This specification is a project contract for the pure TypeScript engine under `src/game`.

## World Model

Recursive Box Lab uses a graph of rectangular worlds. A world may be the root world or the inner world of a box entity.

- `World`
  - `id`
  - `name`
  - `width`
  - `height`
  - optional `parent` with `worldId` and containing `boxId`
  - optional `entry` coordinate used when an entity enters the world
- `Entity`
  - `Player`
  - `Box`
  - `Wall`
  - `Goal`
- `Box`
  - may be pushable
  - may be open
  - may own `innerWorldId`
- `Level`
  - owns all `World` records
  - owns all `Entity` records
  - identifies the `playerId`
  - identifies the starting active world

Entity locations are absolute within the world graph:

```ts
type Position = {
  worldId: string;
  x: number;
  y: number;
};
```

## Coordinates and Directions

Each world has a local zero-based grid.

- `x` grows to the right.
- `y` grows downward.
- `worldId` identifies the containing world.
- Directions are `up`, `down`, `left`, and `right`.

## Basic Rules

- The player moves one cell at a time.
- Walls block movement.
- Goals do not block movement.
- Boxes are pushable unless explicitly marked otherwise.
- A pushed box moves one cell if the destination can accept it.
- Pushing can cascade through multiple pushable boxes.
- A move that cannot be completed leaves the state unchanged.
- `undo` restores the previous core snapshot.
- `reset` restores the level's initial core snapshot.

## Recursive Rules, Version 1

### Open Box

An open box has `open: true` and an `innerWorldId`. When the player moves into an open box, the player enters that box's inner world at the inner world's `entry` coordinate, or the center cell if no entry is provided.

### Push Into

When a pushable entity is pushed into an open box, the entity's `worldId` changes to the box's `innerWorldId`, and its position becomes the inner world's entry coordinate.

### Push Out

When an entity is pushed or moved beyond the edge of an inner world, the engine checks that world's parent box. The entity exits into the parent world at the cell adjacent to the parent box in the movement direction.

For Stage 1, push-out is intentionally finite:

- It supports parent-child world transitions.
- It preserves entity IDs.
- It does not implement infinite self-recursive worlds.

### Paradox Guard

The engine rejects moves that would put a box into itself or into one of its own descendant worlds. This prevents unserializable state and obvious self-reference loops while leaving room for later explicit self-reference mechanics.

## Win Condition

The level is won when every required goal is covered by a matching entity:

- `target: "box"` requires a box.
- `target: "player"` requires the player.
- `target: "any"` accepts any non-goal, non-wall entity.

The engine checks goals across all worlds.

## Not In Scope

- No copied levels from Patrick's Parabox.
- No copied visual identity, UI layout, assets, sounds, copy, or naming.
- No commercial release copy.
- No full infinite-recursion simulation in Stage 1.
