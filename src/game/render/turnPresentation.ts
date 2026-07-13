import { LANE_WIDTH } from '../core';

export interface PlanarOffset {
  readonly x: number;
  readonly z: number;
}

export function turnLaneOffset(
  yaw: number,
  baseLanePosition: number,
  presentedLanePosition: number,
): PlanarOffset {
  const distance = (presentedLanePosition - baseLanePosition) * LANE_WIDTH;
  return {
    x: Math.cos(yaw) * distance,
    z: -Math.sin(yaw) * distance,
  };
}
