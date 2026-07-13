import {
  MIN_ACTION_RECOVERY_SECONDS,
  MIN_HAZARD_REACTION_SECONDS,
  TURN_WARNING_SECONDS,
} from "./constants";
import type {
  CourseEvent,
  CourseSection,
  FairnessReport,
  HazardKind,
  Lane,
} from "./types";

type Posture = "grounded" | "jump" | "slide";

const LANES: readonly Lane[] = [-1, 0, 1];
const POSTURES: readonly Posture[] = ["grounded", "jump", "slide"];

function isHazard(event: CourseEvent): event is CourseEvent & { kind: HazardKind } {
  return (
    event.kind === "beam" ||
    event.kind === "ring" ||
    event.kind === "column" ||
    event.kind === "gap"
  );
}

function appliesToLane(event: CourseEvent, lane: Lane): boolean {
  return event.lane === "all" || event.lane === lane;
}

function survives(event: CourseEvent & { kind: HazardKind }, lane: Lane, posture: Posture): boolean {
  if (!appliesToLane(event, lane)) {
    return true;
  }
  switch (event.kind) {
    case "beam":
    case "gap":
      return posture === "jump";
    case "ring":
      return posture === "slide";
    case "column":
      return false;
  }
}

interface HazardGroup {
  start: number;
  end: number;
  events: Array<CourseEvent & { kind: HazardKind }>;
}

function groupHazards(events: readonly CourseEvent[]): HazardGroup[] {
  const hazards = events.filter(isHazard).slice().sort((left, right) => {
    return left.at - right.at || left.id.localeCompare(right.id, "en");
  });
  const groups: HazardGroup[] = [];
  for (const event of hazards) {
    const start = event.at;
    const end = event.at + Math.max(0.01, event.length);
    const latest = groups.at(-1);
    if (latest && start <= latest.end + 0.65) {
      latest.end = Math.max(latest.end, end);
      latest.events.push(event);
    } else {
      groups.push({ start, end, events: [event] });
    }
  }
  return groups;
}

function legalResponses(group: HazardGroup): number {
  let count = 0;
  for (const lane of LANES) {
    for (const posture of POSTURES) {
      if (group.events.every((event) => survives(event, lane, posture))) {
        count += 1;
      }
    }
  }
  return count;
}

export function validateSectionFairness(section: CourseSection): FairnessReport {
  const reasons: string[] = [];
  const ids = new Set<string>();
  let legalResponseCount = 0;

  if (!(section.length > 0)) {
    reasons.push("section-length");
  }
  if (
    !(section.turnWarningStart >= 0) ||
    !(section.turnInputStart > section.turnWarningStart) ||
    !(section.turnInputStart < section.length)
  ) {
    reasons.push("turn-window-order");
  }

  for (const event of section.events) {
    if (ids.has(event.id)) {
      reasons.push(`duplicate-event:${event.id}`);
    }
    ids.add(event.id);
    if (!Number.isFinite(event.at) || !Number.isFinite(event.length) || event.length <= 0) {
      reasons.push(`invalid-event-geometry:${event.id}`);
      continue;
    }
    if (event.at < 0 || event.at + event.length > section.length) {
      reasons.push(`event-out-of-bounds:${event.id}`);
    }
  }

  const groups = groupHazards(section.events);
  const firstReactionDistance = section.authoredSpeed * MIN_HAZARD_REACTION_SECONDS;
  const recoveryDistance = section.authoredSpeed * MIN_ACTION_RECOVERY_SECONDS;
  const turnRecoveryDistance = section.authoredSpeed * TURN_WARNING_SECONDS * 0.6;

  if (groups[0] && groups[0].start < firstReactionDistance) {
    reasons.push("insufficient-first-reaction");
  }

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const responses = legalResponses(group);
    legalResponseCount += responses;
    if (responses === 0) {
      reasons.push(`no-legal-response:${group.start.toFixed(3)}`);
    }
    if (group.end > section.turnInputStart - turnRecoveryDistance) {
      reasons.push(`hazard-overlaps-turn:${group.start.toFixed(3)}`);
    }
    const previous = groups[index - 1];
    if (previous && group.start - previous.end < recoveryDistance) {
      reasons.push(`insufficient-recovery:${group.start.toFixed(3)}`);
    }
  }

  return {
    valid: reasons.length === 0,
    reasons,
    legalResponseCount,
  };
}
