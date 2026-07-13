import {
  COURSE_LOOKAHEAD_SECTIONS,
  COURSE_RETAIN_BEHIND,
  MAX_GENERATION_ATTEMPTS,
  TURN_REACTION_SECONDS,
  TURN_WARNING_SECONDS,
  speedForDistance,
} from "./constants";
import { validateSectionFairness } from "./fairness";
import { sectionEnd, turnHeading } from "./path";
import { mixSeed, randomInt } from "./random";
import type {
  CourseEvent,
  CourseGeneratorState,
  CourseSection,
  CourseState,
  Lane,
  Point2,
  TurnDirection,
} from "./types";

const ALL_LANES: readonly Lane[] = [-1, 0, 1];

interface CandidateBuild {
  readonly section: CourseSection;
  readonly rngState: number;
}

function event(
  sectionIndex: number,
  suffix: string,
  kind: CourseEvent["kind"],
  lane: CourseEvent["lane"],
  at: number,
  length = 1.15,
): CourseEvent {
  return {
    id: `section-${sectionIndex}:${suffix}`,
    kind,
    lane,
    at,
    length,
  };
}

function turnMetrics(length: number, authoredSpeed: number): {
  turnWarningStart: number;
  turnInputStart: number;
} {
  const turnInputStart = length - Math.max(18, authoredSpeed * TURN_REACTION_SECONDS);
  return {
    turnInputStart,
    turnWarningStart: Math.max(0, turnInputStart - authoredSpeed * TURN_WARNING_SECONDS),
  };
}

export function createOnboardingSection(seed: number): CourseSection {
  const length = 118;
  const authoredSpeed = speedForDistance(0);
  const turns = turnMetrics(length, authoredSpeed);
  const events: CourseEvent[] = [
    event(0, "lane-cue", "shard", -1, 15),
    event(0, "column-center", "column", 0, 27),
    event(0, "column-right", "column", 1, 27),
    event(0, "jump-beam", "beam", "all", 49, 1.35),
    event(0, "slide-ring", "ring", "all", 73, 1.45),
    event(0, "shield", "shield", -1, 89),
  ];
  const section: CourseSection = {
    id: `section-0-${mixSeed(seed, 0).toString(16).padStart(8, "0")}`,
    index: 0,
    origin: { x: 0, z: 0 },
    heading: "north",
    length,
    requiredTurn: "right",
    ...turns,
    authoredSpeed,
    generationAttempt: 1,
    fallbackUsed: false,
    events,
  };
  const report = validateSectionFairness(section);
  if (!report.valid) {
    throw new Error(`Authored onboarding section is invalid: ${report.reasons.join(", ")}`);
  }
  return section;
}

function impossibleCandidate(
  generator: CourseGeneratorState,
  authoredSpeed: number,
  attempt: number,
  rngState: number,
): CandidateBuild {
  const length = 126;
  const turns = turnMetrics(length, authoredSpeed);
  const requiredTurn: TurnDirection = (rngState & 1) === 0 ? "left" : "right";
  const events = ALL_LANES.map((lane) =>
    event(generator.nextSectionIndex, `rejected-column-${lane}`, "column", lane, 34),
  );
  return {
    rngState,
    section: {
      id: `section-${generator.nextSectionIndex}-${mixSeed(generator.seed, generator.nextSectionIndex)
        .toString(16)
        .padStart(8, "0")}`,
      index: generator.nextSectionIndex,
      origin: generator.nextOrigin,
      heading: generator.nextHeading,
      length,
      requiredTurn,
      ...turns,
      authoredSpeed,
      generationAttempt: attempt,
      fallbackUsed: false,
      events,
    },
  };
}

function safeCandidate(
  generator: CourseGeneratorState,
  authoredSpeed: number,
  attempt: number,
  initialRngState: number,
): CandidateBuild {
  let rngState = initialRngState;
  const lengthStep = randomInt(rngState, 9);
  rngState = lengthStep.state;
  const length = 124 + lengthStep.value;
  const turnStep = randomInt(rngState, 2);
  rngState = turnStep.state;
  const requiredTurn: TurnDirection = turnStep.value === 0 ? "left" : "right";
  const groupCount = generator.nextSectionIndex >= 5 ? 3 : 2;
  const positions = [29, 56, 83] as const;
  const events: CourseEvent[] = [];
  let eventNumber = 0;

  const pushEvent = (
    suffix: string,
    kind: CourseEvent["kind"],
    lane: CourseEvent["lane"],
    at: number,
    lengthValue = 1.15,
  ): void => {
    events.push(
      event(
        generator.nextSectionIndex,
        `${eventNumber.toString().padStart(2, "0")}-${suffix}`,
        kind,
        lane,
        at,
        lengthValue,
      ),
    );
    eventNumber += 1;
  };

  if (generator.nextSectionIndex % 4 === 0) {
    pushEvent("shield", "shield", 0, 17);
  } else {
    const cueLaneStep = randomInt(rngState, 3);
    rngState = cueLaneStep.state;
    pushEvent("approach-shard", "shard", ALL_LANES[cueLaneStep.value], 17);
  }

  for (let groupIndex = 0; groupIndex < groupCount; groupIndex += 1) {
    const patternStep = randomInt(rngState, 6);
    rngState = patternStep.state;
    const laneStep = randomInt(rngState, 3);
    rngState = laneStep.state;
    const lane = ALL_LANES[laneStep.value];
    const at = positions[groupIndex];

    switch (patternStep.value) {
      case 0: {
        const safeLane = lane;
        for (const blockedLane of ALL_LANES) {
          if (blockedLane !== safeLane) {
            pushEvent(`column-${blockedLane}`, "column", blockedLane, at);
          }
        }
        pushEvent("safe-shard", "shard", safeLane, at + 0.15);
        break;
      }
      case 1:
        pushEvent("beam", "beam", "all", at, 1.35);
        break;
      case 2:
        pushEvent("ring", "ring", "all", at, 1.45);
        break;
      case 3:
        pushEvent("gap", "gap", "all", at, 4.8);
        break;
      case 4:
        pushEvent("column", "column", lane, at);
        pushEvent("alternate-shard", "shard", lane === 1 ? -1 : 1, at + 0.2);
        break;
      case 5: {
        const otherLane: Lane = lane === -1 ? 0 : -1;
        pushEvent("beam-lane", "beam", lane, at, 1.35);
        pushEvent("ring-lane", "ring", otherLane, at, 1.45);
        break;
      }
    }
  }

  events.sort((left, right) => left.at - right.at || left.id.localeCompare(right.id, "en"));
  const turns = turnMetrics(length, authoredSpeed);
  return {
    rngState,
    section: {
      id: `section-${generator.nextSectionIndex}-${mixSeed(generator.seed, generator.nextSectionIndex)
        .toString(16)
        .padStart(8, "0")}`,
      index: generator.nextSectionIndex,
      origin: generator.nextOrigin,
      heading: generator.nextHeading,
      length,
      requiredTurn,
      ...turns,
      authoredSpeed,
      generationAttempt: attempt,
      fallbackUsed: false,
      events,
    },
  };
}

function buildCandidate(
  generator: CourseGeneratorState,
  authoredSpeed: number,
  attempt: number,
): CandidateBuild {
  let rngState = mixSeed(
    generator.seed ^ generator.rngState ^ attempt,
    generator.nextSectionIndex,
  );
  const filterStep = randomInt(rngState, 100);
  rngState = filterStep.state;
  if (filterStep.value < 45) {
    return impossibleCandidate(generator, authoredSpeed, attempt, rngState);
  }
  return safeCandidate(generator, authoredSpeed, attempt, rngState);
}

export function buildFallbackSection(
  generator: CourseGeneratorState,
  authoredSpeed: number,
): CandidateBuild {
  const length = 128;
  const turns = turnMetrics(length, authoredSpeed);
  const laneSelector = mixSeed(generator.seed, generator.nextSectionIndex) % 3;
  const blockedLane = ALL_LANES[laneSelector];
  const safeLane: Lane = blockedLane === 1 ? -1 : 1;
  const events = [
    event(generator.nextSectionIndex, "fallback-shard", "shard", safeLane, 17),
    event(generator.nextSectionIndex, "fallback-column", "column", blockedLane, 34),
    event(generator.nextSectionIndex, "fallback-ring", "ring", "all", 63, 1.45),
  ];
  const requiredTurn: TurnDirection = (mixSeed(generator.seed, generator.nextSectionIndex + 17) & 1)
    ? "right"
    : "left";
  return {
    rngState: mixSeed(generator.seed, generator.nextSectionIndex + 31),
    section: {
      id: `section-${generator.nextSectionIndex}-${mixSeed(generator.seed, generator.nextSectionIndex)
        .toString(16)
        .padStart(8, "0")}`,
      index: generator.nextSectionIndex,
      origin: generator.nextOrigin,
      heading: generator.nextHeading,
      length,
      requiredTurn,
      ...turns,
      authoredSpeed,
      generationAttempt: MAX_GENERATION_ATTEMPTS + 1,
      fallbackUsed: true,
      events,
    },
  };
}

export function generateNextSection(
  generator: CourseGeneratorState,
  authoredSpeed = speedForDistance(generator.nextSectionIndex * 120),
): { readonly section: CourseSection; readonly generator: CourseGeneratorState } {
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const candidate = buildCandidate(generator, authoredSpeed, attempt);
    if (validateSectionFairness(candidate.section).valid) {
      return finalizeGeneratedSection(generator, candidate);
    }
  }
  const fallback = buildFallbackSection(generator, authoredSpeed);
  const report = validateSectionFairness(fallback.section);
  if (!report.valid) {
    throw new Error(`Guaranteed course fallback is invalid: ${report.reasons.join(", ")}`);
  }
  return finalizeGeneratedSection(generator, fallback);
}

function finalizeGeneratedSection(
  generator: CourseGeneratorState,
  candidate: CandidateBuild,
): { readonly section: CourseSection; readonly generator: CourseGeneratorState } {
  const nextOrigin: Point2 = sectionEnd(candidate.section);
  return {
    section: candidate.section,
    generator: {
      ...generator,
      nextSectionIndex: candidate.section.index + 1,
      nextOrigin,
      nextHeading: turnHeading(candidate.section.heading, candidate.section.requiredTurn),
      rngState: candidate.rngState,
    },
  };
}

export function createCourse(seed: number): CourseState {
  const onboarding = createOnboardingSection(seed);
  let course: CourseState = {
    sections: [onboarding],
    generator: {
      seed,
      nextSectionIndex: 1,
      nextOrigin: sectionEnd(onboarding),
      nextHeading: turnHeading(onboarding.heading, onboarding.requiredTurn),
      rngState: mixSeed(seed, 0),
    },
  };
  course = ensureCourseWindow(course, 0);
  return course;
}

export function ensureCourseWindow(course: CourseState, currentSectionIndex: number): CourseState {
  let sections = course.sections.slice();
  let generator = course.generator;
  const requiredTail = currentSectionIndex + COURSE_LOOKAHEAD_SECTIONS;
  while (generator.nextSectionIndex <= requiredTail) {
    const generated = generateNextSection(generator);
    sections.push(generated.section);
    generator = generated.generator;
  }
  const minimumRetained = Math.max(0, currentSectionIndex - COURSE_RETAIN_BEHIND);
  sections = sections.filter((section) => section.index >= minimumRetained);
  return { sections, generator };
}
