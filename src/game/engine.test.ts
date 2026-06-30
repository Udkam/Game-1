import { describe, expect, it } from "vitest";
import { applyMove, createGameState, reset, undo } from ".";
import type { LevelDefinition } from "./types";

function baseLevel(overrides: Partial<LevelDefinition> = {}): LevelDefinition {
  return {
    id: "test",
    title: "Test Level",
    worlds: [
      {
        id: "root",
        name: "Root",
        width: 6,
        height: 5,
      },
    ],
    entities: [
      {
        id: "player",
        type: "player",
        position: { worldId: "root", x: 1, y: 1 },
      },
    ],
    playerId: "player",
    ...overrides,
  };
}

describe("recursive movement engine", () => {
  it("moves the player through empty cells", () => {
    const state = createGameState(baseLevel());
    const next = applyMove(state, "right");

    expect(next.entities.player.position).toEqual({ worldId: "root", x: 2, y: 1 });
    expect(next.moves).toBe(1);
    expect(state.entities.player.position).toEqual({ worldId: "root", x: 1, y: 1 });
  });

  it("pushes a box when the destination is open", () => {
    const state = createGameState(
      baseLevel({
        entities: [
          { id: "player", type: "player", position: { worldId: "root", x: 1, y: 1 } },
          { id: "crate", type: "box", position: { worldId: "root", x: 2, y: 1 } },
        ],
      }),
    );

    const next = applyMove(state, "right");

    expect(next.entities.player.position).toEqual({ worldId: "root", x: 2, y: 1 });
    expect(next.entities.crate.position).toEqual({ worldId: "root", x: 3, y: 1 });
  });

  it("leaves state unchanged when movement hits a wall", () => {
    const state = createGameState(
      baseLevel({
        entities: [
          { id: "player", type: "player", position: { worldId: "root", x: 1, y: 1 } },
          { id: "wall", type: "wall", position: { worldId: "root", x: 2, y: 1 } },
        ],
      }),
    );

    const next = applyMove(state, "right");

    expect(next).toBe(state);
    expect(next.entities.player.position).toEqual({ worldId: "root", x: 1, y: 1 });
  });

  it("supports undo and reset", () => {
    const state = createGameState(baseLevel());
    const moved = applyMove(applyMove(state, "right"), "down");
    const undone = undo(moved);
    const resetState = reset(moved);

    expect(undone.entities.player.position).toEqual({ worldId: "root", x: 2, y: 1 });
    expect(undone.history).toHaveLength(1);
    expect(resetState.entities.player.position).toEqual({ worldId: "root", x: 1, y: 1 });
    expect(resetState.history).toHaveLength(0);
  });

  it("pushes a box into an open box inner world", () => {
    const state = createGameState({
      id: "push-into",
      title: "Push Into",
      worlds: [
        { id: "root", name: "Root", width: 5, height: 3 },
        {
          id: "inner",
          name: "Inner",
          width: 3,
          height: 3,
          parent: { worldId: "root", boxId: "openBox" },
          entry: { x: 1, y: 1 },
        },
      ],
      entities: [
        { id: "player", type: "player", position: { worldId: "root", x: 0, y: 1 } },
        { id: "crate", type: "box", position: { worldId: "root", x: 1, y: 1 } },
        {
          id: "openBox",
          type: "box",
          open: true,
          innerWorldId: "inner",
          position: { worldId: "root", x: 2, y: 1 },
        },
      ],
      playerId: "player",
    });

    const next = applyMove(state, "right");

    expect(next.entities.player.position).toEqual({ worldId: "root", x: 1, y: 1 });
    expect(next.entities.crate.position).toEqual({ worldId: "inner", x: 1, y: 1 });
  });

  it("pushes a box out from an inner world to the parent world", () => {
    const state = createGameState({
      id: "push-out",
      title: "Push Out",
      worlds: [
        { id: "root", name: "Root", width: 5, height: 3 },
        {
          id: "inner",
          name: "Inner",
          width: 3,
          height: 3,
          parent: { worldId: "root", boxId: "openBox" },
          entry: { x: 1, y: 1 },
        },
      ],
      entities: [
        { id: "player", type: "player", position: { worldId: "inner", x: 1, y: 1 } },
        { id: "crate", type: "box", position: { worldId: "inner", x: 2, y: 1 } },
        {
          id: "openBox",
          type: "box",
          open: true,
          innerWorldId: "inner",
          position: { worldId: "root", x: 2, y: 1 },
        },
      ],
      playerId: "player",
      activeWorldId: "inner",
    });

    const next = applyMove(state, "right");

    expect(next.entities.player.position).toEqual({ worldId: "inner", x: 2, y: 1 });
    expect(next.entities.crate.position).toEqual({ worldId: "root", x: 3, y: 1 });
    expect(next.activeWorldId).toBe("inner");
  });
});
