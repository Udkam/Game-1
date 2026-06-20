// The level catalog — 60 levels across eleven chapters, difficulty rising
// throughout (10 designed/generated chapters + the 淬炼 Crucible finale chapter).
// Every layout is verified by scripts/verify-levels.ts (`npm run verify`); `par`
// is the solver's reported optimal move count (generated/finale levels carry a
// stored, replay-verified solution).
//
// Legend (see level.ts): # wall · space floor · . goal · $ crate · @ player
//   ~ ice · ^ pit · % cracked floor · o/p/q portal pair
//   (gates/plates, colour-matching, keys/locks and one-way arrows were retired
//   in the v5 redesign in favour of more creative mechanics.)
//
// Most levels carry NO in-game hint — only the first appearance of each mechanic
// gets one terse line (the rule, never the solution). The rest is for the player
// to read off the board.

import type { LevelDef } from './level.js';
import type { Dir, MoveToken } from './types.js';
import { parseLevel } from './level.js';
import { GENERATED } from './generated.js';

interface Chaptered extends LevelDef {
  chapter: string;
}

const HAND_DEFS: Chaptered[] = [
  // ───────────── Chapter I · 基础 Foundations ─────────────
  {
    id: 'l1',
    name: '绕柱',
    subtitle: 'Pillars',
    chapter: '基础',
    par: 35,
    intro: '把每个箱子推到目标点（○）。只能推、不能拉——推进死角就撤销（Z）或重开（R）。',
    map: [
      '#########',
      '#@      #',
      '# $ $ $ #',
      '#       #',
      '## ### ##',
      '#       #',
      '# . . . #',
      '#       #',
      '#########',
    ],
  },
  {
    id: 'l2',
    name: '夹道',
    subtitle: 'Narrows',
    chapter: '基础',
    par: 42,
    intro: '',
    map: [
      '##########',
      '#@       #',
      '# $ $ $  #',
      '#        #',
      '## #### ##',
      '#        #',
      '#  . . . #',
      '##########',
    ],
  },
  {
    id: 'l3',
    name: '回廊',
    subtitle: 'Cloister',
    chapter: '基础',
    par: 23,
    intro: '',
    map: [
      '#######',
      '#  .  #',
      '# $ $ #',
      '#. @ .#',
      '# $ $ #',
      '#  .  #',
      '#######',
    ],
  },
  {
    id: 'l4',
    name: '错位',
    subtitle: 'Offset',
    chapter: '基础',
    par: 21,
    intro: '',
    map: [
      '#########',
      '###   ###',
      '#  $ $  #',
      '# #. .# #',
      '#  $@$  #',
      '# #. .# #',
      '#   $   #',
      '##  .  ##',
      '#########',
    ],
  },

  // ───────────── Chapter II · 薄冰 Ice ─────────────
  {
    id: 'l5',
    name: '滑面',
    subtitle: 'Glide',
    chapter: '薄冰',
    par: 18,
    intro: '箱子很沉，推上冰面（▒）会一直滑到撞墙才停；你穿着防滑靴，不受冰影响。',
    map: [
      '#########',
      '#.     .#',
      '# ~~~~~ #',
      '# ~~~~~ #',
      '# ~~~~~ #',
      '#  $ $  #',
      '#@      #',
      '#########',
    ],
  },
  {
    id: 'l6',
    name: '撞角',
    subtitle: 'Bumpers',
    chapter: '薄冰',
    par: 18,
    intro: '',
    map: [
      '##########',
      '#.      .#',
      '#~##~~##~#',
      '#~  ~~  ~#',
      '#~~ $$ ~~#',
      '#~  ~~  ~#',
      '#~##~~##~#',
      '#    @   #',
      '##########',
    ],
  },
  {
    id: 'l7',
    name: '冰窖',
    subtitle: 'Icehouse',
    chapter: '薄冰',
    par: 25,
    intro: '',
    map: [
      '##########',
      '#@ ..    #',
      '#  ## ## #',
      '# $~~~~~ #',
      '# ~~~~~~ #',
      '# $~~~~~ #',
      '#    ##  #',
      '##########',
    ],
  },

  // ───────────── Chapter III · 深坑 Pits ─────────────
  {
    id: 'l8',
    name: '断桥',
    subtitle: 'Broken Bridge',
    chapter: '深坑',
    par: 32,
    intro: '深坑（▦）你过不去，但把箱子推进坑里能填平它（箱子消耗）——箱子是稀缺资源。',
    map: [
      '############',
      '#          #',
      '#@$ $ $^^ .#',
      '#          #',
      '############',
    ],
  },
  {
    id: 'l9',
    name: '取舍',
    subtitle: 'Sacrifice',
    chapter: '深坑',
    par: 45,
    intro: '',
    map: [
      '############',
      '#          #',
      '#@$ $ ^  . #',
      '## ###### ##',
      '#  $ $ ^ . #',
      '#          #',
      '############',
    ],
  },
  {
    id: 'l10',
    name: '深渊',
    subtitle: 'The Abyss',
    chapter: '深坑',
    par: 35,
    intro: '',
    map: [
      '##########',
      '#   ##   #',
      '# $ ^^ $ #',
      '#@ ^..^  #',
      '# $ ^^ $ #',
      '#   ##   #',
      '##########',
    ],
  },

  // ───────────── Chapter VI · 折跃 Portals ─────────────
  {
    id: 'l17',
    name: '折跃',
    subtitle: 'Fold',
    chapter: '折跃',
    par: 10,
    intro: '踩上折跃门（◎）会瞬移到同色的另一扇门；箱子过不去——它只送你，不送箱子。',
    map: [
      '#########',
      '#@ o#   #',
      '##### # #',
      '#  .  $ #',
      '##### # #',
      '#   o   #',
      '#########',
    ],
  },
  {
    id: 'l18',
    name: '两界',
    subtitle: 'Two Worlds',
    chapter: '折跃',
    par: 14,
    intro: '',
    map: [
      '##########',
      '#@       #',
      '# $ .  o #',
      '##########',
      '#  o     #',
      '# $ .    #',
      '##########',
    ],
  },
  {
    id: 'l19',
    name: '机巧',
    subtitle: 'Contraption',
    chapter: '折跃',
    par: 29,
    intro: '',
    map: [
      '############',
      '#@         #',
      '# $ .   o  #',
      '############',
      '#o         #',
      '# $ $ ^ .  #',
      '############',
    ],
  },

  // ───────────── Chapter VII · 诡径 New tricks ─────────────
  {
    id: 'l22',
    name: '脆地',
    subtitle: 'Brittle',
    chapter: '诡径',
    par: 5,
    intro: '脆地（裂纹）你一旦离开就塌成深坑，只能走一次；箱子压着它不会塌。',
    map: [
      '########',
      '#@ %% $.#',
      '########',
    ],
  },
];

// Generated classic levels (reverse-pull, solver-optimal par + verified solution).
// Keep two distinct puzzles per shape (variants a/b) for variety without fatigue.
const GEN_DEFS: Chaptered[] = GENERATED.filter((g) => /[ab]$/.test(g.id)).map((g) => ({
  id: g.id,
  name: g.name,
  subtitle: g.subtitle,
  chapter: g.chapter,
  par: g.par,
  intro: '',
  map: g.map,
  solution: g.solution as Dir[],
}));

// ───────────── Chapter · 淬炼 Crucible ─────────────
// A combination chapter: no new mechanics, only pit / ice / spatial-scheduling
// puzzles (intro: ''), each with a single clear core idea. Hand-designed levels
// carry a solver-verified solution; the four 空间调度 levels were produced by the
// reverse-pull generator, hand-picked for a non-obvious reorder, then named.
const CRUCIBLE_DEFS: Chaptered[] = [
  {
    // Resource · one of the three crates must be spent filling the pit to reach
    // the far goal; pick the wrong one and a target goes unfillable.
    id: 'l25', name: '抉择', subtitle: 'The Choice', chapter: '淬炼', par: 24, intro: '',
    map: [
      '##########',
      '#        #',
      '#@$ $ ^ .#',
      '#   ###  #',
      '#  $  . ##',
      '#        #',
      '##########',
    ],
    solution: ['right','up','right','down','right','right','left','left','left','down','down','right','right','right','left','left','up','left','up','right','right','right','right','right'] as Dir[],
  },
  {
    // Spatial · two narrow bays per side; the crates interlock so the delivery
    // order is forced (generator-found, hand-picked).
    id: 'l26', name: '互锁', subtitle: 'Deadbolt', chapter: '淬炼', par: 25, intro: '',
    map: [
      '###########',
      '# $. . * ##',
      '# $# # # ##',
      '# $. .  $@#',
      '#        ##',
      '###########',
    ],
    solution: ['left','left','left','down','left','left','left','left','left','up','up','up','right','right','right','left','left','left','down','down','right','up','left','up','right'] as Dir[],
  },
  {
    // Spatial · a squeezed centre forces you to clear a lane before the last
    // crates can pass (generator-found, hand-picked).
    id: 'l27', name: '挤兑', subtitle: 'Squeeze', chapter: '淬炼', par: 28, intro: '',
    map: [
      '##########',
      '# $ .    #',
      '# . ## . #',
      '#  .  .  #',
      '# $$$##$ #',
      '#     @  #',
      '##########',
    ],
    solution: ['right','up','up','down','down','left','left','left','up','down','left','left','up','up','left','up','up','right','right','down','down','right','right','left','down','down','left','up'] as Dir[],
  },
  {
    // Spatial · offset steps; a crate parked on the wrong step blocks the rung
    // above it (generator-found, hand-picked).
    id: 'l28', name: '错阶', subtitle: 'Staircase', chapter: '淬炼', par: 29, intro: '',
    map: [
      '###########',
      '#    . $@##',
      '# .  ## * #',
      '#   .    ##',
      '## .$$$ ###',
      '#        ##',
      '###########',
    ],
    solution: ['left','left','right','down','down','down','down','left','up','right','up','left','left','left','left','down','left','up','down','down','right','right','right','up','left','right','right','up','left'] as Dir[],
  },
  {
    // Spatial · a coiled path around two pillars; crates must be threaded in
    // sequence or they jam the bend (generator-found, hand-picked).
    id: 'l29', name: '盘绕', subtitle: 'Coil', chapter: '淬炼', par: 29, intro: '',
    map: [
      '###########',
      '# $   .   #',
      '#  .$ #.  #',
      '#   #   . #',
      '# $. #$$  #',
      '#     @  ##',
      '###########',
    ],
    solution: ['up','down','left','left','left','left','left','up','right','up','up','left','up','right','right','right','right','down','left','right','down','right','down','right','up','down','down','right','up'] as Dir[],
  },
  {
    // Resource · twin moats, two upper + two lower crates: each moat eats one
    // crate, so exactly the right two reach the goals.
    id: 'l30', name: '重堑', subtitle: 'Twin Moats', chapter: '淬炼', par: 31, intro: '',
    map: [
      '############',
      '#          #',
      '#@$ $ ^ $ .#',
      '## ###### ##',
      '#  $ $ ^ . #',
      '#          #',
      '############',
    ],
    solution: ['up','right','right','down','right','right','right','right','right','right','left','left','left','left','up','left','left','left','left','down','right','right','right','right','right','right','right','up','right','down','down'] as Dir[],
  },
];

// ───────────── Chapter · 悖论 Paradox ─────────────
// Levels that overturn a core rule. Each new "heresy" mechanic gets one intro
// level; depth comes later from combining them. The A* solver doesn't model
// these, so every level carries a hand-authored, replay-verified solution.
const PARADOX_DEFS: Chaptered[] = [
  {
    // Pull / grab: the crate sits in a top niche — its only free side is below
    // and the push side is a wall, so it can ONLY be pulled out.
    id: 'pull1', name: '回拉', subtitle: 'Grab', chapter: '悖论', par: 4,
    intro: '按住 Shift + 方向（或先点「抓」）可以拉动身后的箱子——有些箱子贴着墙，只能拉、不能推。',
    map: [
      '#######',
      '###$###',
      '#     #',
      '#  .  #',
      '#  @  #',
      '#######',
    ],
    solution: ['up', 'up', '@down', '@down'] as MoveToken[],
  },
];

export const LEVEL_DEFS: Chaptered[] = [...HAND_DEFS, ...GEN_DEFS, ...PARADOX_DEFS, ...CRUCIBLE_DEFS];

export const LEVELS = LEVEL_DEFS.map(parseLevel);
export const CHAPTER_OF: Record<string, string> = Object.fromEntries(
  LEVEL_DEFS.map((d) => [d.id, d.chapter]),
);

export function getLevel(id: string) {
  return LEVELS.find((l) => l.id === id);
}
