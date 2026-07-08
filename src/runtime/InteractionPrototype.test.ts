import { describe, expect, it } from "vitest";
import { Enter, Move, Redo, Undo } from "../core/commands";
import { commandFromKeyboardEvent } from "./InteractionPrototype";

describe("keyboard command mapping", () => {
  it("maps movement keys into simulation commands", () => {
    expect(commandFromKeyboardEvent({ key: "ArrowRight", shiftKey: false })).toEqual(Move("right"));
    expect(commandFromKeyboardEvent({ key: "w", shiftKey: false })).toEqual(Move("up"));
  });

  it("maps undo, redo, and recursive entry onto the shared command API", () => {
    expect(commandFromKeyboardEvent({ key: "z", shiftKey: false })).toEqual(Undo());
    expect(commandFromKeyboardEvent({ key: "Z", shiftKey: true })).toEqual(Redo());
    expect(commandFromKeyboardEvent({ key: "e", shiftKey: false }, () => Enter("container-b"))).toEqual(
      Enter("container-b"),
    );
  });
});
