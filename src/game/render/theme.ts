import type { PieceType } from '../core';

export interface PieceMaterial {
  fillStart: number;
  fillEnd: number;
  edge: number;
  innerEdge: number;
}

export const COLORS = {
  background: 0xf4fafd,
  surface: 0xffffff,
  cyanSurface: 0xe7f7fa,
  blueSurface: 0xebf2ff,
  well: 0xeff8fc,
  edge: 0x79b7c7,
  text: 0x071e2b,
  muted: 0x526d7a,
  cyan: 0x059aa8,
  blue: 0x2f67d8,
  focus: 0x0b5bd7,
  success: 0x176b54,
  danger: 0xa33a55,
  scrim: 0x071e2b,
} as const;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { fillStart: 0xc7486c, fillEnd: 0xa83858, edge: 0x6e2139, innerEdge: 0xea93a8 },
  O: { fillStart: 0x2c7e80, fillEnd: 0x176a70, edge: 0x0d474e, innerEdge: 0x8dcac8 },
  T: { fillStart: 0xb2701f, fillEnd: 0x965a12, edge: 0x603709, innerEdge: 0xe4be78 },
  S: { fillStart: 0x5063b5, fillEnd: 0x3e4e9b, edge: 0x273164, innerEdge: 0xaab5e5 },
  Z: { fillStart: 0x6e8637, fillEnd: 0x596e28, edge: 0x394819, innerEdge: 0xbacb82 },
  J: { fillStart: 0x9a4f9e, fillEnd: 0x813d85, edge: 0x542255, innerEdge: 0xd5a0d2 },
  L: { fillStart: 0x2875a1, fillEnd: 0x1c608a, edge: 0x103e5c, innerEdge: 0x91c3d9 },
};
