// The level catalog — 60 levels across eleven chapters, difficulty rising
// throughout (10 designed/generated chapters + the 淬炼 Crucible finale chapter).
// Every layout is verified by scripts/verify-levels.ts (`npm run verify`); `par`
// is the solver's reported optimal move count (generated/finale levels carry a
// stored, replay-verified solution).
//
// Legend (see level.ts): # wall · space floor · . goal · $ crate · @ player
//   ~ ice · ^ pit · R/G/B/Y colored crate · r/g/b/y colored goal
//   1..9 pressure plate · D/E/F gate (group 1/2/3) · o/p/q portal pair
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

  // ───────────── Chapter IV · 机关 Mechanisms ─────────────
  {
    id: 'l11',
    name: '顶门',
    subtitle: 'Doorstop',
    chapter: '机关',
    par: 12,
    intro: '压力板（◇）被重物压住时，同色闸门（▤）开启；你只有一个身位——停一个箱子顶门。',
    map: [
      '##########',
      '#   1    #',
      '#@$ $ D .#',
      '#   #  ###',
      '#   #    #',
      '##########',
    ],
  },
  {
    id: 'l12',
    name: '双枢',
    subtitle: 'Two Hinges',
    chapter: '机关',
    par: 24,
    intro: '',
    map: [
      '###########',
      '#  1   2  #',
      '#@ $ D $ E.#',
      '#  ### ### #',
      '#         #',
      '###########',
    ],
  },
  {
    id: 'l13',
    name: '连锁',
    subtitle: 'Interlock',
    chapter: '机关',
    par: 21,
    intro: '',
    map: [
      '###########',
      '#  1   1  #',
      '#  $   $  #',
      '#@        #',
      '##  ###  ##',
      '#   $   D.#',
      '#         #',
      '###########',
    ],
  },

  // ───────────── Chapter V · 色彩 Hues ─────────────
  {
    id: 'l14',
    name: '各归其位',
    subtitle: 'Sort',
    chapter: '色彩',
    par: 26,
    intro: '彩色箱子必须送到同色目标点（任意色目标接受任意箱子）。它们会互相挡道——想好顺序。',
    map: [
      '#########',
      '#       #',
      '#  R G  #',
      '#       #',
      '#   @   #',
      '#       #',
      '#  g r  #',
      '#       #',
      '#########',
    ],
  },
  {
    id: 'l15',
    name: '光谱',
    subtitle: 'Spectrum',
    chapter: '色彩',
    par: 41,
    intro: '',
    map: [
      '#########',
      '##     ##',
      '# R G B #',
      '#       #',
      '#   @   #',
      '#       #',
      '# b g r #',
      '##     ##',
      '#########',
    ],
  },
  {
    id: 'l16',
    name: '冰彩',
    subtitle: 'Frozen Hues',
    chapter: '色彩',
    par: 15,
    intro: '',
    map: [
      '#########',
      '#r     b#',
      '# ~~~~~ #',
      '#  R B  #',
      '#   @   #',
      '#########',
    ],
  },

  // ───────────── Chapter VI · 折跃 Portals & 终章 ─────────────
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
  {
    id: 'l20',
    name: '合流',
    subtitle: 'Confluence',
    chapter: '折跃',
    par: 26,
    intro: '终章：冰、坑、闸门、颜色、折跃齐至。资源恰好够用，每一步都要算清。',
    map: [
      '#########',
      '#  1    #',
      '# R$ D r#',
      '#@      #',
      '# B  ^ b#',
      '#  $    #',
      '#       #',
      '#########',
    ],
  },

  // ───────────── Chapter VII · 诡径 New tricks (intros) ─────────────
  {
    id: 'l21',
    name: '单行',
    subtitle: 'One Way',
    chapter: '诡径',
    par: 9,
    intro: '单向格（箭头）只能顺着箭头方向进入——逆向进不去。',
    map: [
      '#######',
      '#@    #',
      '#####V#',
      '#. $  #',
      '#######',
    ],
  },
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
  {
    id: 'l23',
    name: '锁钥',
    subtitle: 'Key & Lock',
    chapter: '诡径',
    par: 4,
    intro: '走到钥匙上即可拾取，同色的锁随之打开（变成可通行）。',
    map: [
      '########',
      '#@k $K.#',
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

// ───────────── Chapter XI · 淬炼 Crucible ─────────────
// The closing chapter: no new mechanics, only combinations. Every level is a
// pure "read the board" puzzle (intro: '') with a single clear core idea —
// combo, resource trade-off, or spatial scheduling — rising to a finale that
// folds colour + gate + pit + portal together. Hand-designed levels carry a
// solver-verified solution; the four 空间调度 levels were produced by the
// reverse-pull generator, hand-picked for a non-obvious reorder, then named.
const CRUCIBLE_DEFS: Chaptered[] = [
  {
    // Combo · ice + colour: each crate slides until a wall/centre pillar stops
    // it, so you must aim each colour at its own row from the right side.
    id: 'l24', name: '凝光', subtitle: 'Frostlight', chapter: '淬炼', par: 22, intro: '',
    map: [
      '#########',
      '#r  b  g#',
      '# ~~~~~ #',
      '# ~~#~~ #',
      '# R B G #',
      '#   @   #',
      '#########',
    ],
    solution: ['right','right','up','left','left','down','left','up','left','down','left','up','up','up','right','up','right','down','right','right','up','right'] as Dir[],
  },
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
  {
    // Combo · colour + gate + pit: park a crate on the plate to hold the gate,
    // sacrifice one to the pit, then deliver R/B to their own goals.
    id: 'l31', name: '枢机', subtitle: 'Linchpin', chapter: '淬炼', par: 38, intro: '',
    map: [
      '##########',
      '#  1     #',
      '# R$ D r #',
      '#@   #   #',
      '# B ^  b #',
      '#  $     #',
      '##########',
    ],
    solution: ['right','right','up','down','left','left','up','right','right','right','right','right','down','down','down','left','left','left','left','up','up','left','up','right','right','right','right','up','right','down','down','right','down','down','left','left','up','right'] as Dir[],
  },
  {
    // Finale · colour + gate + pit + portal all at once: the portal is the only
    // way to reach a crate's pushable side after the gate is held open.
    id: 'l32', name: '收束', subtitle: 'Convergence', chapter: '淬炼', par: 37, intro: '',
    map: [
      '###########',
      '#  1    o #',
      '# R$ D r  #',
      '#@   #    #',
      '# B ^  b  #',
      '#  $   o  #',
      '###########',
    ],
    solution: ['down','right','up','right','up','down','left','left','up','right','right','right','right','right','right','up','right','left','left','left','left','up','up','left','up','right','right','right','right','up','right','down','down','right','right','up','left'] as Dir[],
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
