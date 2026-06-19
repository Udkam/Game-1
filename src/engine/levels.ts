// The level catalog — 20 levels across six chapters, difficulty rising throughout.
// Every layout is verified by scripts/verify-levels.ts (`npm run verify`); `par`
// is the solver's reported optimal move count.
//
// Legend (see level.ts): # wall · space floor · . goal · $ crate · @ player
//   ~ ice · ^ pit · R/G/B/Y colored crate · r/g/b/y colored goal
//   1..9 pressure plate · D/E/F gate (group 1/2/3) · o/p/q portal pair
//
// Most levels carry NO in-game hint — only the first appearance of each mechanic
// gets one terse line (the rule, never the solution). The rest is for the player
// to read off the board.

import type { LevelDef } from './level.js';
import { parseLevel } from './level.js';

interface Chaptered extends LevelDef {
  chapter: string;
}

export const LEVEL_DEFS: Chaptered[] = [
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

export const LEVELS = LEVEL_DEFS.map(parseLevel);
export const CHAPTER_OF: Record<string, string> = Object.fromEntries(
  LEVEL_DEFS.map((d) => [d.id, d.chapter]),
);

export function getLevel(id: string) {
  return LEVELS.find((l) => l.id === id);
}
