import { LANE_WIDTH } from "./constants";
import type {
  CourseSection,
  Heading,
  Point2,
  RunnerState,
  TurnDirection,
  WorldSample,
} from "./types";

const HEADINGS: readonly Heading[] = ["north", "east", "south", "west"];

export function headingVector(heading: Heading): Point2 {
  switch (heading) {
    case "north":
      return { x: 0, z: -1 };
    case "east":
      return { x: 1, z: 0 };
    case "south":
      return { x: 0, z: 1 };
    case "west":
      return { x: -1, z: 0 };
  }
}

export function rightVector(heading: Heading): Point2 {
  const forward = headingVector(heading);
  return { x: -forward.z, z: forward.x };
}

export function turnHeading(heading: Heading, direction: TurnDirection): Heading {
  const current = HEADINGS.indexOf(heading);
  const delta = direction === "right" ? 1 : -1;
  return HEADINGS[(current + delta + HEADINGS.length) % HEADINGS.length];
}

export function sectionEnd(section: CourseSection): Point2 {
  const forward = headingVector(section.heading);
  return {
    x: section.origin.x + forward.x * section.length,
    z: section.origin.z + forward.z * section.length,
  };
}

export function headingYaw(heading: Heading): number {
  switch (heading) {
    case "north":
      return 0;
    case "east":
      return -Math.PI / 2;
    case "south":
      return Math.PI;
    case "west":
      return Math.PI / 2;
  }
}

export function sampleCoursePosition(
  section: CourseSection,
  sectionDistance: number,
  lanePosition = 0,
  height = 0,
): WorldSample {
  const forward = headingVector(section.heading);
  const right = rightVector(section.heading);
  return {
    x:
      section.origin.x +
      forward.x * sectionDistance +
      right.x * lanePosition * LANE_WIDTH,
    y: height,
    z:
      section.origin.z +
      forward.z * sectionDistance +
      right.z * lanePosition * LANE_WIDTH,
    yaw: headingYaw(section.heading),
    heading: section.heading,
    lanePosition,
    sectionDistance,
  };
}

export function getCurrentSection(state: RunnerState): CourseSection {
  const section = state.course.sections.find((candidate) => candidate.index === state.sectionIndex);
  if (!section) {
    throw new Error(`Missing canonical section ${state.sectionIndex}`);
  }
  return section;
}

export function isTurnWindow(state: RunnerState): boolean {
  if (state.status !== "running") {
    return false;
  }
  const section = getCurrentSection(state);
  return state.sectionDistance >= section.turnInputStart && state.sectionDistance < section.length;
}

export function sampleRunnerPosition(state: RunnerState): WorldSample {
  return sampleCoursePosition(
    getCurrentSection(state),
    state.sectionDistance,
    state.runner.lanePosition,
    state.runner.height,
  );
}
