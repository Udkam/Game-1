// @ts-expect-error Vitest runs this test in Node while the product tsconfig intentionally omits Node globals.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CELL_STYLE, COLORS, PIECE_MATERIALS } from './theme';

const styles = readFileSync(new URL('../../styles.css', import.meta.url), 'utf8');

function relativeLuminance(color: number): number {
  const channels = [16, 8, 0].map((shift) => ((color >> shift) & 0xff) / 255);
  return channels.reduce((sum, channel, index) => {
    const linear = channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index]!;
  }, 0);
}

function contrastRatio(first: number, second: number): number {
  const lighter = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darker = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (lighter + 0.05) / (darker + 0.05);
}

describe('T5 bright mineral matte material', () => {
  it('keeps the exact frozen four-value material for every piece', () => {
    expect(PIECE_MATERIALS).toEqual({
      I: { fillStart: 0xc85a72, fillEnd: 0xb14f65, edge: 0x713443, innerEdge: 0xe69aaa },
      O: { fillStart: 0x47aaa1, fillEnd: 0x3c918a, edge: 0x245b57, innerEdge: 0x91d4cf },
      T: { fillStart: 0xc58e4a, fillEnd: 0xad783d, edge: 0x694824, innerEdge: 0xe8bd83 },
      S: { fillStart: 0x647bc0, fillEnd: 0x576dae, edge: 0x354675, innerEdge: 0xa9b7e3 },
      Z: { fillStart: 0x83aa57, fillEnd: 0x6f914a, edge: 0x425a2b, innerEdge: 0xbcd79a },
      J: { fillStart: 0x9a65b1, fillEnd: 0x87579e, edge: 0x553663, innerEdge: 0xcfa9dc },
      L: { fillStart: 0x4d91ad, fillEnd: 0x407d99, edge: 0x295567, innerEdge: 0x95c8d9 },
    });
  });

  it('freezes the complete page and state palette', () => {
    expect(COLORS).toEqual({
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
    });
  });

  it('freezes the exact light CSS palette and uses action ink on every blue action state', () => {
    const tokens = {
      '--page': '#dce7f2',
      '--surface': '#f7fafd',
      '--raised': '#eaf1f7',
      '--selected': '#dce8f2',
      '--well': '#0b1726',
      '--ink': '#14243a',
      '--muted': '#52677f',
      '--line': '#b5c5d5',
      '--edge': '#879db3',
      '--classic': '#357f78',
      '--race': '#526eb0',
      '--puzzle': '#80639d',
      '--selection': '#a75e71',
      '--action': '#315f96',
      '--hover': '#3d70a8',
      '--focus': '#245e9c',
      '--action-ink': '#f7fafd',
      '--success': '#3f7f5d',
      '--danger': '#a64e61',
    } as const;

    for (const [token, value] of Object.entries(tokens)) {
      expect(styles).toContain(`${token}: ${value};`);
    }
    expect(styles).toContain('color-scheme: light;');
    expect(styles).toContain('--phase: linear-gradient(90deg, #357f78, #526eb0, #80639d);');
    expect(styles).toContain('--shadow: 0 18px 44px rgba(31, 59, 86, .14);');
    const actionTextRules = [
      /\.skip-link\s*\{[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
      /\.mode-gate:hover \.mode-gate__action b,[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
      /\.primary-action\s*\{[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
      /\.topbar-action:last-child\s*\{[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
      /\.touch-key:hover,[^}]*color: var\(--action-ink\);[^}]*background: var\(--action\);/s,
    ];
    for (const rule of actionTextRules) expect(styles).toMatch(rule);
  });

  it('retains AA text and action contrast plus three-to-one material contrast', () => {
    expect(contrastRatio(COLORS.text, COLORS.surface)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(COLORS.muted, COLORS.surface)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(COLORS.actionInk, COLORS.action)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(COLORS.actionInk, COLORS.hover)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(COLORS.focus, COLORS.surface)).toBeGreaterThanOrEqual(3);

    for (const material of Object.values(PIECE_MATERIALS)) {
      expect(contrastRatio(material.fillStart, COLORS.well)).toBeGreaterThanOrEqual(3);
      expect(contrastRatio(material.fillEnd, COLORS.well)).toBeGreaterThanOrEqual(3);
    }
  });

  it('freezes the matte plate, signal edge, zero-fill ghost, and lock response', () => {
    expect(CELL_STYLE).toEqual({
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
    });
    expect(CELL_STYLE.radiusMax).toBeLessThanOrEqual(1.75);
    expect(CELL_STYLE.edgeWidthMax).toBeLessThanOrEqual(1.6);
    expect((CELL_STYLE.gapFloor * 2) / CELL_STYLE.seamGrooveWidthMin).toBeGreaterThanOrEqual(1.6);
    expect((CELL_STYLE.gapMin * 2) / CELL_STYLE.seamGrooveWidthMax).toBeGreaterThanOrEqual(1.6);
    expect(CELL_STYLE.ghostStrokeWidth).toBe(1);
    expect(CELL_STYLE.lockFillDurationMs).toBeGreaterThanOrEqual(80);
    expect(CELL_STYLE.lockFillDurationMs).toBeLessThanOrEqual(100);
  });
});
