import type { Direction, LevelDefinition } from "../game";

export interface TutorialLevel extends LevelDefinition {
  lesson: string;
}

export const tutorialLevels = [
  {
    id: "tutorial-01-first-push",
    title: "First Push",
    lesson: "Push a crate onto a receiver pad.",
    description: "A compact baseline puzzle for movement and box pushing.",
    worlds: [{ id: "root", name: "Lab Floor", width: 6, height: 5 }],
    entities: [
      { id: "player", type: "player", position: { worldId: "root", x: 1, y: 2 } },
      { id: "crate", type: "box", name: "Crate", position: { worldId: "root", x: 2, y: 2 } },
      { id: "goal", type: "goal", target: "box", position: { worldId: "root", x: 4, y: 2 } },
    ],
    playerId: "player",
  },
  {
    id: "tutorial-02-step-inside",
    title: "Step Inside",
    lesson: "Enter an open crate world.",
    description: "The player target sits inside the crate's inner world.",
    worlds: [
      { id: "root", name: "Outer Bench", width: 5, height: 5 },
      {
        id: "inside-alpha",
        name: "Inside Alpha",
        width: 3,
        height: 3,
        parent: { worldId: "root", boxId: "box-alpha" },
        entry: { x: 1, y: 1 },
      },
    ],
    entities: [
      { id: "player", type: "player", position: { worldId: "root", x: 1, y: 2 } },
      {
        id: "box-alpha",
        type: "box",
        name: "Alpha",
        open: true,
        innerWorldId: "inside-alpha",
        position: { worldId: "root", x: 2, y: 2 },
      },
      {
        id: "inner-goal",
        type: "goal",
        target: "player",
        position: { worldId: "inside-alpha", x: 1, y: 1 },
      },
    ],
    playerId: "player",
  },
  {
    id: "tutorial-03-load-the-crate",
    title: "Load the Crate",
    lesson: "Push one crate into another open crate.",
    description: "A crate can transfer into the open crate's inner world.",
    worlds: [
      { id: "root", name: "Loading Rail", width: 5, height: 5 },
      {
        id: "inside-loader",
        name: "Loader Interior",
        width: 3,
        height: 3,
        parent: { worldId: "root", boxId: "loader" },
        entry: { x: 1, y: 1 },
      },
    ],
    entities: [
      { id: "player", type: "player", position: { worldId: "root", x: 0, y: 2 } },
      { id: "crate", type: "box", name: "Cargo", position: { worldId: "root", x: 1, y: 2 } },
      {
        id: "loader",
        type: "box",
        name: "Loader",
        open: true,
        innerWorldId: "inside-loader",
        position: { worldId: "root", x: 2, y: 2 },
      },
      {
        id: "inner-goal",
        type: "goal",
        target: "box",
        position: { worldId: "inside-loader", x: 1, y: 1 },
      },
    ],
    playerId: "player",
  },
  {
    id: "tutorial-04-push-out",
    title: "Push Out",
    lesson: "Push cargo out from an inner world to its parent.",
    description: "The parent-world target sits beside the containing crate.",
    worlds: [
      { id: "root", name: "Parent Track", width: 5, height: 5 },
      {
        id: "inside-exit",
        name: "Exit Chamber",
        width: 3,
        height: 3,
        parent: { worldId: "root", boxId: "exit-box" },
        entry: { x: 1, y: 1 },
      },
    ],
    entities: [
      { id: "player", type: "player", position: { worldId: "inside-exit", x: 1, y: 1 } },
      { id: "crate", type: "box", name: "Cargo", position: { worldId: "inside-exit", x: 2, y: 1 } },
      {
        id: "exit-box",
        type: "box",
        name: "Exit Box",
        open: true,
        innerWorldId: "inside-exit",
        position: { worldId: "root", x: 2, y: 2 },
      },
      { id: "goal", type: "goal", target: "box", position: { worldId: "root", x: 3, y: 2 } },
    ],
    playerId: "player",
    activeWorldId: "inside-exit",
  },
  {
    id: "tutorial-05-two-layer-transfer",
    title: "Two-Layer Transfer",
    lesson: "Enter a crate, then load cargo into a deeper crate.",
    description: "A two-level setup introduces nested interior previews.",
    worlds: [
      { id: "root", name: "Outer Rig", width: 5, height: 5 },
      {
        id: "inside-a",
        name: "Fold A",
        width: 5,
        height: 5,
        parent: { worldId: "root", boxId: "box-a" },
        entry: { x: 1, y: 2 },
      },
      {
        id: "inside-b",
        name: "Fold B",
        width: 3,
        height: 3,
        parent: { worldId: "inside-a", boxId: "box-b" },
        entry: { x: 1, y: 1 },
      },
    ],
    entities: [
      { id: "player", type: "player", position: { worldId: "root", x: 1, y: 2 } },
      {
        id: "box-a",
        type: "box",
        name: "Fold A",
        open: true,
        innerWorldId: "inside-a",
        position: { worldId: "root", x: 2, y: 2 },
      },
      { id: "crate", type: "box", name: "Cargo", position: { worldId: "inside-a", x: 2, y: 2 } },
      {
        id: "box-b",
        type: "box",
        name: "Fold B",
        open: true,
        innerWorldId: "inside-b",
        position: { worldId: "inside-a", x: 3, y: 2 },
      },
      { id: "deep-goal", type: "goal", target: "box", position: { worldId: "inside-b", x: 1, y: 1 } },
    ],
    playerId: "player",
  },
] satisfies TutorialLevel[];

export const tutorialSolutions: Record<string, Direction[]> = {
  "tutorial-01-first-push": ["right", "right"],
  "tutorial-02-step-inside": ["right"],
  "tutorial-03-load-the-crate": ["right"],
  "tutorial-04-push-out": ["right"],
  "tutorial-05-two-layer-transfer": ["right", "right"],
};
