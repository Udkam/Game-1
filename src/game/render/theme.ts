import { LANE_WIDTH } from '../core';

export const PALETTE = {
  void: 0x06141c,
  sky: 0x0a2630,
  basalt: 0x17272b,
  basaltEdge: 0x294247,
  porcelain: 0xd8e0da,
  verdigris: 0x2c827c,
  signal: 0x87f1dd,
  hazard: 0xff705a,
  brass: 0xb49758,
  ink: 0xeaf6f0,
  blackTide: 0x02070a,
} as const;

export const WORLD_METRICS = {
  laneWidth: LANE_WIDTH,
  roadWidth: 7.6,
  roadHeight: 0.48,
  railInset: 0.22,
  runnerHeight: 1.85,
} as const;
