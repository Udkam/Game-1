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
  I: { fillStart: 0x58d6dd, fillEnd: 0x4dced6, edge: 0x1599a6, innerEdge: 0x9be7ea },
  O: { fillStart: 0x93cbe8, fillEnd: 0x87c1e1, edge: 0x3c88b6, innerEdge: 0xc6e3f2 },
  T: { fillStart: 0x95acdf, fillEnd: 0x899fd6, edge: 0x536fb0, innerEdge: 0xc8d3ed },
  S: { fillStart: 0x73cdb9, fillEnd: 0x68c4ae, edge: 0x2d8d78, innerEdge: 0xa9e3d5 },
  Z: { fillStart: 0x7fadd0, fillEnd: 0x74a3c8, edge: 0x3f759f, innerEdge: 0xb5d4e6 },
  J: { fillStart: 0x6292dd, fillEnd: 0x5888d4, edge: 0x2f5fae, innerEdge: 0xa9c1ec },
  L: { fillStart: 0x6dbfd4, fillEnd: 0x62b5cb, edge: 0x287f97, innerEdge: 0xa7dae5 },
};
