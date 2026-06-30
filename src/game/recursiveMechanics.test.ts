import { describe, expect, it } from "vitest";
import { applyMove, checkWin, createGameState, enterBox } from ".";

describe("nested recursive mechanics", () => {
  it("pushes cargo into a second-layer open box", () => {
    const state = createGameState({
      id: "multi-layer-push-into",
      title: "Multi Layer Push Into",
      worlds: [
        { id: "root", name: "Root", width: 4, height: 3 },
        {
          id: "inside-a",
          name: "Inside A",
          width: 5,
          height: 3,
          parent: { worldId: "root", boxId: "box-a" },
          entry: { x: 1, y: 1 },
        },
        {
          id: "inside-b",
          name: "Inside B",
          width: 3,
          height: 3,
          parent: { worldId: "inside-a", boxId: "box-b" },
          entry: { x: 1, y: 1 },
        },
      ],
      entities: [
        { id: "player", type: "player", position: { worldId: "inside-a", x: 1, y: 1 } },
        { id: "crate", type: "box", position: { worldId: "inside-a", x: 2, y: 1 } },
        {
          id: "box-a",
          type: "box",
          open: true,
          innerWorldId: "inside-a",
          position: { worldId: "root", x: 1, y: 1 },
        },
        {
          id: "box-b",
          type: "box",
          open: true,
          innerWorldId: "inside-b",
          position: { worldId: "inside-a", x: 3, y: 1 },
        },
      ],
      playerId: "player",
      activeWorldId: "inside-a",
    });

    const next = applyMove(state, "right");

    expect(next.entities.crate.position).toEqual({ worldId: "inside-b", x: 1, y: 1 });
    expect(next.entities.crate.id).toBe("crate");
  });

  it("preserves identity when pushing out to a parent world", () => {
    const state = createGameState({
      id: "identity-push-out",
      title: "Identity Push Out",
      worlds: [
        { id: "root", name: "Root", width: 5, height: 3 },
        {
          id: "inner",
          name: "Inner",
          width: 3,
          height: 3,
          parent: { worldId: "root", boxId: "container" },
          entry: { x: 1, y: 1 },
        },
      ],
      entities: [
        { id: "player", type: "player", position: { worldId: "inner", x: 1, y: 1 } },
        { id: "crate", type: "box", position: { worldId: "inner", x: 2, y: 1 } },
        {
          id: "container",
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

    expect(next.entities.crate.id).toBe("crate");
    expect(next.entities.crate.position).toEqual({ worldId: "root", x: 3, y: 1 });
  });

  it("updates inner-world parentage when a box enters another box", () => {
    const state = createGameState({
      id: "box-contains-box",
      title: "Box Contains Box",
      worlds: [
        { id: "root", name: "Root", width: 5, height: 3 },
        {
          id: "portable-inner",
          name: "Portable Inner",
          width: 3,
          height: 3,
          parent: { worldId: "root", boxId: "portable" },
          entry: { x: 1, y: 1 },
        },
        {
          id: "dock-inner",
          name: "Dock Inner",
          width: 3,
          height: 3,
          parent: { worldId: "root", boxId: "dock" },
          entry: { x: 1, y: 1 },
        },
      ],
      entities: [
        { id: "player", type: "player", position: { worldId: "root", x: 0, y: 1 } },
        {
          id: "portable",
          type: "box",
          innerWorldId: "portable-inner",
          position: { worldId: "root", x: 1, y: 1 },
        },
        {
          id: "dock",
          type: "box",
          open: true,
          innerWorldId: "dock-inner",
          position: { worldId: "root", x: 2, y: 1 },
        },
      ],
      playerId: "player",
    });

    const next = applyMove(state, "right");

    expect(next.entities.portable.position.worldId).toBe("dock-inner");
    expect(next.worlds["portable-inner"].parent).toEqual({
      worldId: "dock-inner",
      boxId: "portable",
    });
  });

  it("rejects obvious self-reference containment", () => {
    const state = createGameState({
      id: "paradox-guard",
      title: "Paradox Guard",
      worlds: [
        { id: "root", name: "Root", width: 4, height: 3 },
        {
          id: "outer-inner",
          name: "Outer Inner",
          width: 4,
          height: 3,
          parent: { worldId: "root", boxId: "outer" },
          entry: { x: 1, y: 1 },
        },
        {
          id: "nested-inner",
          name: "Nested Inner",
          width: 3,
          height: 3,
          parent: { worldId: "outer-inner", boxId: "nested" },
          entry: { x: 1, y: 1 },
        },
      ],
      entities: [
        { id: "player", type: "player", position: { worldId: "root", x: 0, y: 1 } },
        {
          id: "outer",
          type: "box",
          open: true,
          innerWorldId: "outer-inner",
          position: { worldId: "root", x: 1, y: 1 },
        },
        {
          id: "nested",
          type: "box",
          open: true,
          innerWorldId: "nested-inner",
          position: { worldId: "outer-inner", x: 2, y: 1 },
        },
      ],
      playerId: "player",
    });

    const next = enterBox(state, "outer", "nested");

    expect(next).toBe(state);
    expect(next.entities.outer.position).toEqual({ worldId: "root", x: 1, y: 1 });
  });

  it("checks win conditions across multiple worlds", () => {
    const state = createGameState({
      id: "cross-world-win",
      title: "Cross World Win",
      worlds: [
        { id: "root", name: "Root", width: 4, height: 3 },
        {
          id: "inner",
          name: "Inner",
          width: 3,
          height: 3,
          parent: { worldId: "root", boxId: "box" },
          entry: { x: 1, y: 1 },
        },
      ],
      entities: [
        { id: "player", type: "player", position: { worldId: "root", x: 1, y: 1 } },
        {
          id: "box",
          type: "box",
          open: true,
          innerWorldId: "inner",
          position: { worldId: "root", x: 2, y: 1 },
        },
        { id: "crate", type: "box", position: { worldId: "inner", x: 1, y: 1 } },
        { id: "root-goal", type: "goal", target: "player", position: { worldId: "root", x: 1, y: 1 } },
        { id: "inner-goal", type: "goal", target: "box", position: { worldId: "inner", x: 1, y: 1 } },
      ],
      playerId: "player",
    });

    expect(checkWin(state)).toBe(true);
  });
});
