import { describe, expect, it } from "vitest";
import {
  createInitialState,
  getCurrentSection,
  hashState,
  replay,
  sampleCoursePosition,
  sectionEnd,
  serializeState,
} from "./index";
import type { RunnerCommand } from "./types";

describe("canonical replay and path sampling", () => {
  it("replays the same command stream to the same canonical bytes and hash", () => {
    const commands: RunnerCommand[] = [
      { type: "Start" },
      { type: "StepLeft" },
      ...Array.from({ length: 14 }, () => ({ type: "Tick" }) as const),
      { type: "Jump" },
      ...Array.from({ length: 44 }, () => ({ type: "Tick" }) as const),
      { type: "Slide" },
      ...Array.from({ length: 36 }, () => ({ type: "Tick" }) as const),
      { type: "Pause" },
      { type: "Tick" },
      { type: "Resume" },
      ...Array.from({ length: 20 }, () => ({ type: "Tick" }) as const),
    ];

    const first = replay(0xabc123, commands);
    const second = replay(0xabc123, commands);

    expect(second.hash).toBe(first.hash);
    expect(serializeState(second.state)).toBe(serializeState(first.state));
    expect(second.frames).toEqual(first.frames);
    expect(replay(0xabc124, commands).hash).not.toBe(first.hash);
  });

  it("hashes object keys canonically and remains stable for an untouched state", () => {
    const state = createInitialState(123);
    expect(hashState(state)).toBe(hashState(structuredClone(state)));
    expect(hashState(state)).toMatch(/^[0-9a-f]{8}$/);
  });

  it("samples lane and section geometry through one pure world-space pipeline", () => {
    const state = createInitialState(31);
    const first = getCurrentSection(state);
    const second = state.course.sections.find((section) => section.index === 1)!;
    const centerEnd = sampleCoursePosition(first, first.length, 0, 0);
    const centerStart = sampleCoursePosition(second, 0, 0, 0);
    const rightLane = sampleCoursePosition(first, 10, 1, 2);

    expect({ x: centerEnd.x, z: centerEnd.z }).toEqual(sectionEnd(first));
    expect(centerStart.x).toBeCloseTo(centerEnd.x, 12);
    expect(centerStart.z).toBeCloseTo(centerEnd.z, 12);
    expect(rightLane.x).toBeCloseTo(2.35, 12);
    expect(rightLane.z).toBeCloseTo(-10, 12);
    expect(rightLane.y).toBe(2);
    expect(rightLane.heading).toBe("north");
  });
});
