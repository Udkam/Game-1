import { describe, expect, it } from 'vitest';
import { LANE_WIDTH } from '../core';
import { turnLaneOffset } from './turnPresentation';

describe('turn presentation lane continuity', () => {
  it('follows a lane change continuously around the interpolated turn yaw', () => {
    expect(turnLaneOffset(0, 0, 0.5)).toEqual({ x: LANE_WIDTH * 0.5, z: -0 });

    const midpoint = turnLaneOffset(-Math.PI / 4, 0, 0.5);
    expect(midpoint.x).toBeCloseTo(LANE_WIDTH * Math.SQRT1_2 * 0.5, 10);
    expect(midpoint.z).toBeCloseTo(LANE_WIDTH * Math.SQRT1_2 * 0.5, 10);

    const endpoint = turnLaneOffset(-Math.PI / 2, 0, 1);
    expect(endpoint.x).toBeCloseTo(0, 10);
    expect(endpoint.z).toBeCloseTo(LANE_WIDTH, 10);
  });
});
