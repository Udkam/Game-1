import { describe, expect, it } from 'vitest';
import { PIECE_MATERIALS } from './theme';

describe('T5 mineral-signal piece palette', () => {
  it('keeps the exact frozen four-value material for every piece', () => {
    expect(PIECE_MATERIALS).toEqual({
      I: { fillStart: 0xc7486c, fillEnd: 0xa83858, edge: 0x6e2139, innerEdge: 0xea93a8 },
      O: { fillStart: 0x2c7e80, fillEnd: 0x176a70, edge: 0x0d474e, innerEdge: 0x8dcac8 },
      T: { fillStart: 0xb2701f, fillEnd: 0x965a12, edge: 0x603709, innerEdge: 0xe4be78 },
      S: { fillStart: 0x5063b5, fillEnd: 0x3e4e9b, edge: 0x273164, innerEdge: 0xaab5e5 },
      Z: { fillStart: 0x6e8637, fillEnd: 0x596e28, edge: 0x394819, innerEdge: 0xbacb82 },
      J: { fillStart: 0x9a4f9e, fillEnd: 0x813d85, edge: 0x542255, innerEdge: 0xd5a0d2 },
      L: { fillStart: 0x2875a1, fillEnd: 0x1c608a, edge: 0x103e5c, innerEdge: 0x91c3d9 },
    });
  });
});
