import type { PieceType } from '../core';

export interface PieceMaterial {
  outer: number;
  inner: number;
  highlight: number;
}

export const COLORS = {
  background: 0xf7f4ec,
  well: 0xe1e5dc,
  panel: 0xfdfcf8,
  edge: 0x31413e,
  text: 0x31413e,
  muted: 0x6d7a74,
  signal: 0x6d879b,
  danger: 0xc56e4f,
  mineralHighlight: 0xfdfcf8,
  mineralDeep: 0xc7cfc3,
} as const;

export const PIECE_MATERIALS: Record<PieceType, PieceMaterial> = {
  I: { outer: 0x6d879b, inner: 0xa9bbc8, highlight: 0xfdfcf8 },
  O: { outer: 0xc56e4f, inner: 0xe3a48d, highlight: 0xfdfcf8 },
  T: { outer: 0x8b8270, inner: 0xb7ae9b, highlight: 0xfdfcf8 },
  S: { outer: 0x718569, inner: 0xa7b99f, highlight: 0xfdfcf8 },
  Z: { outer: 0xab775e, inner: 0xd4a98e, highlight: 0xfdfcf8 },
  J: { outer: 0x77728f, inner: 0xa7a2bc, highlight: 0xfdfcf8 },
  L: { outer: 0x9a916e, inner: 0xc3ba95, highlight: 0xfdfcf8 },
};
