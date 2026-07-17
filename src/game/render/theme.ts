import type { PieceType } from '../core';

export interface PieceMaterial {
  fill: number;
  lowerEdge: number;
  outline: number;
}

export const COLORS = {
  background: 0xf6fcff,
  surface: 0xffffff,
  cyanSurface: 0xe5f8fa,
  blueSurface: 0xedf4ff,
  well: 0xeff9fd,
  grid: 0xd4eaf1,
  edge: 0x9cc9d8,
  text: 0x0c2b3a,
  muted: 0x526e7a,
  cyan: 0x087f8c,
  blue: 0x2866c7,
  focus: 0x004fce,
  success: 0x176b54,
  danger: 0xa33a55,
  scrim: 0x0c3d4a,
} as const;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { fill: 0x44ced9, lowerEdge: 0x20aebd, outline: 0x168795 },
  O: { fill: 0xf1c75b, lowerEdge: 0xd6a83d, outline: 0xa97919 },
  T: { fill: 0xa98be0, lowerEdge: 0x8d6dc7, outline: 0x6847a5 },
  S: { fill: 0x72d2a6, lowerEdge: 0x4fb789, outline: 0x2b8b63 },
  Z: { fill: 0xf18c8d, lowerEdge: 0xd56b70, outline: 0xa94752 },
  J: { fill: 0x6c9be7, lowerEdge: 0x4b7fd1, outline: 0x2d5da9 },
  L: { fill: 0xf2a566, lowerEdge: 0xd68748, outline: 0xa95c26 },
};
