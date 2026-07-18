import type { PieceType } from '../core';

export interface PieceMaterial {
  fillStart: number;
  fillEnd: number;
  edge: number;
  innerEdge: number;
}

export const CELL_STYLE = {
  gapFloor: 0.7,
  gapMin: 1.25,
  gapRatio: 0.055,
  radiusMin: 1.25,
  radiusMax: 1.75,
  radiusRatio: 0.065,
  edgeWidthMin: 1,
  edgeWidthMax: 1.6,
  edgeWidthRatio: 0.045,
  reliefSignalAlpha: 0.38,
  reliefDarkAlpha: 0.92,
  faceInsetMin: 0.55,
  faceInsetMax: 1.15,
  faceInsetRatio: 0.035,
  faceBevelWidthMin: 0.65,
  faceBevelWidthMax: 1.6,
  faceBevelWidthRatio: 0.052,
  faceSignalAlpha: 0.24,
  faceDarkAlpha: 0.46,
  seamGrooveWidthMin: 0.6,
  seamGrooveWidthMax: 1.2,
  seamGrooveWidthRatio: 0.038,
  seamGrooveAlpha: 0.72,
  seamLipWidthMin: 0.45,
  seamLipWidthMax: 0.8,
  seamLipWidthRatio: 0.025,
  seamLipAlpha: 0.3,
  seamLipOffsetRatio: 0.55,
  ghostInsetMin: 0.75,
  ghostInsetRatio: 0.045,
  ghostStrokeWidth: 1,
  ghostStrokeAlpha: 0.45,
  ghostSeamWidth: 0.75,
  ghostSeamAlpha: 0.28,
  lockFillAlpha: 0.12,
  lockFillDurationMs: 90,
} as const;

export const COLORS = {
  page: 0x0b1422,
  surface: 0x111d2e,
  raised: 0x172538,
  selected: 0x1d2d43,
  well: 0x07101c,
  text: 0xedf2f7,
  muted: 0xaab5c4,
  line: 0x34445a,
  edge: 0x566981,
  classic: 0x5a918b,
  race: 0x6f87b7,
  puzzle: 0x9a81a8,
  selection: 0xb57686,
  action: 0x365b8d,
  hover: 0x426a9d,
  focus: 0x9abce6,
  success: 0x6f9a7d,
  danger: 0xb16a78,
  scrim: 0x07101c,
} as const;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { fillStart: 0xae4761, fillEnd: 0xa1445a, edge: 0x542532, innerEdge: 0xc78a99 },
  O: { fillStart: 0x3e988f, fillEnd: 0x347f78, edge: 0x204944, innerEdge: 0x80b9b4 },
  T: { fillStart: 0xad7d43, fillEnd: 0x946c3c, edge: 0x503a22, innerEdge: 0xc6a078 },
  S: { fillStart: 0x4f67b0, fillEnd: 0x5264a2, edge: 0x283653, innerEdge: 0x8795c2 },
  Z: { fillStart: 0x759a4c, fillEnd: 0x637f43, edge: 0x3a4a2a, innerEdge: 0xa0b584 },
  J: { fillStart: 0x8a53a2, fillEnd: 0x835294, edge: 0x432a4d, innerEdge: 0xaf8fba },
  L: { fillStart: 0x43829d, fillEnd: 0x386e86, edge: 0x244452, innerEdge: 0x81aabb },
};
