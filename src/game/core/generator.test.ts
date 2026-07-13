import { describe, expect, it } from "vitest";
import {
  MAX_GENERATION_ATTEMPTS,
  buildFallbackSection,
  createCourse,
  ensureCourseWindow,
  generateNextSection,
  validateSectionFairness,
} from "./index";
import type { CourseGeneratorState, CourseSection } from "./types";

describe("deterministic fair course generation", () => {
  it("authors the onboarding grammar in lane, jump, slide, then turn order", () => {
    const course = createCourse(0x10203040);
    const opening = course.sections[0];

    expect(opening.index).toBe(0);
    expect(opening.requiredTurn).toBe("right");
    expect(opening.events.map((event) => event.kind)).toEqual([
      "shard",
      "column",
      "column",
      "beam",
      "ring",
      "shield",
    ]);
    expect(opening.events.find((event) => event.kind === "beam")?.lane).toBe("all");
    expect(opening.events.find((event) => event.kind === "ring")?.lane).toBe("all");
    expect(validateSectionFairness(opening)).toMatchObject({ valid: true });
  });

  it("produces byte-equivalent sections from the same seed", () => {
    const first = createCourse(0xc0ffee);
    const second = createCourse(0xc0ffee);
    const different = createCourse(0xc0ffef);

    expect(second).toEqual(first);
    expect(different).not.toEqual(first);
  });

  it("accepts only fair candidates and terminates within the bounded fallback", () => {
    let fallbackCount = 0;
    for (let seed = 1; seed <= 320; seed += 1) {
      const course = createCourse(seed);
      for (const section of course.sections) {
        const report = validateSectionFairness(section);
        expect(report.valid, `${section.id}: ${report.reasons.join(",")}`).toBe(true);
        expect(section.generationAttempt).toBeLessThanOrEqual(MAX_GENERATION_ATTEMPTS + 1);
        if (section.fallbackUsed) fallbackCount += 1;
      }
    }
    expect(fallbackCount).toBeGreaterThan(0);
  });

  it("rejects an impossible three-lane decision and a hazard inside the turn window", () => {
    const base = createCourse(19).sections[1];
    const impossible: CourseSection = {
      ...base,
      events: [-1, 0, 1].map((lane) => ({
        id: `blocked-${lane}`,
        kind: "column" as const,
        lane: lane as -1 | 0 | 1,
        at: 35,
        length: 1,
      })),
    };
    const turnOverlap: CourseSection = {
      ...base,
      events: [
        {
          id: "late-gap",
          kind: "gap",
          lane: "all",
          at: base.turnInputStart - 1,
          length: 4,
        },
      ],
    };

    expect(validateSectionFairness(impossible).reasons).toContain("no-legal-response:35.000");
    expect(
      validateSectionFairness(turnOverlap).reasons.some((reason) =>
        reason.startsWith("hazard-overlaps-turn"),
      ),
    ).toBe(true);
  });

  it("keeps a bounded rolling course window with stable global section indices", () => {
    const initial = createCourse(78);
    const advanced = ensureCourseWindow(initial, 14);

    expect(advanced.sections[0].index).toBe(12);
    expect(advanced.sections.at(-1)?.index).toBe(20);
    expect(advanced.sections.map((section) => section.index)).toEqual(
      Array.from({ length: 9 }, (_, index) => index + 12),
    );
  });

  it("provides a separately validated guaranteed fallback", () => {
    const generator: CourseGeneratorState = {
      seed: 99,
      nextSectionIndex: 3,
      nextOrigin: { x: 10, z: -20 },
      nextHeading: "east",
      rngState: 17,
    };
    const fallback = buildFallbackSection(generator, 14).section;
    expect(fallback.fallbackUsed).toBe(true);
    expect(validateSectionFairness(fallback).valid).toBe(true);

    const generated = generateNextSection(generator, 14);
    expect(generated.section.index).toBe(3);
    expect(generated.generator.nextSectionIndex).toBe(4);
  });
});
