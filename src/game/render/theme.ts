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
  page: 0xdce7f2,
  surface: 0xf7fafd,
  raised: 0xeaf1f7,
  selected: 0xdce8f2,
  well: 0x0b1726,
  text: 0x14243a,
  muted: 0x52677f,
  line: 0xb5c5d5,
  edge: 0x879db3,
  classic: 0x357f78,
  race: 0x526eb0,
  puzzle: 0x80639d,
  selection: 0xa75e71,
  action: 0x315f96,
  hover: 0x3d70a8,
  focus: 0x245e9c,
  actionInk: 0xf7fafd,
  success: 0x3f7f5d,
  danger: 0xa64e61,
  scrim: 0x0b1726,
} as const;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { fillStart: 0xc85a72, fillEnd: 0xb14f65, edge: 0x713443, innerEdge: 0xe69aaa },
  O: { fillStart: 0x47aaa1, fillEnd: 0x3c918a, edge: 0x245b57, innerEdge: 0x91d4cf },
  T: { fillStart: 0xc58e4a, fillEnd: 0xad783d, edge: 0x694824, innerEdge: 0xe8bd83 },
  S: { fillStart: 0x647bc0, fillEnd: 0x576dae, edge: 0x354675, innerEdge: 0xa9b7e3 },
  Z: { fillStart: 0x83aa57, fillEnd: 0x6f914a, edge: 0x425a2b, innerEdge: 0xbcd79a },
  J: { fillStart: 0x9a65b1, fillEnd: 0x87579e, edge: 0x553663, innerEdge: 0xcfa9dc },
  L: { fillStart: 0x4d91ad, fillEnd: 0x407d99, edge: 0x295567, innerEdge: 0x95c8d9 },
};
