export const TICKS_PER_SECOND = 60;
export const FIXED_TICK_SECONDS = 1 / TICKS_PER_SECOND;

export const LANE_WIDTH = 2.35;
export const LANE_TRANSITION_TICKS = 10;

export const INITIAL_SPEED = 9;
export const MAX_SPEED = 19;
export const SPEED_GAIN_PER_METER = 0.004;
export const SHIELD_SPEED_FACTOR = 0.72;
export const SHIELD_SPEED_PENALTY_TICKS = 45;

export const JUMP_INITIAL_VELOCITY = 12;
export const JUMP_GRAVITY = -36;
export const BEAM_CLEARANCE_HEIGHT = 0.82;
export const GAP_CLEARANCE_HEIGHT = 0.52;
export const SLIDE_TICKS = 31;

export const COLLISION_LANE_TOLERANCE = 0.42;
export const PICKUP_LANE_TOLERANCE = 0.5;

export const COURSE_LOOKAHEAD_SECTIONS = 6;
export const COURSE_RETAIN_BEHIND = 2;
export const MAX_GENERATION_ATTEMPTS = 6;

export const TURN_REACTION_SECONDS = 1.25;
export const TURN_WARNING_SECONDS = 0.9;
export const MIN_HAZARD_REACTION_SECONDS = 1.1;
export const MIN_ACTION_RECOVERY_SECONDS = 0.72;

export function speedForDistance(distance: number): number {
  return Math.min(MAX_SPEED, INITIAL_SPEED + Math.max(0, distance) * SPEED_GAIN_PER_METER);
}

export function multiplierForDistance(distance: number): number {
  return Math.min(5, 1 + Math.floor(Math.max(0, distance) / 250));
}

export function scoreFor(distance: number, shards: number, multiplier: number): number {
  return Math.floor(Math.max(0, distance) * 10 * multiplier) + Math.max(0, shards) * 100;
}
