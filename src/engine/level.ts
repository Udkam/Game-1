// Parses a compact ASCII level definition into the runtime `Level` model.
//
// ASCII legend
// ------------
//   #            wall
//   (space)      floor
//   .            goal (natural / accepts any crate)
//   $            crate (natural)
//   *            crate (natural) resting on a natural goal
//   @            player
//   +            player on a natural goal
//   ~            ice            (crates slide; the player does not)
//   ^            pit            (player blocked; a pushed crate fills it)
//   R G B Y      colored crate  -> rose / sage / slate / amber
//   r g b y      colored goal   -> rose / sage / slate / amber
//   1..9         pressure plate (group = the digit)
//   D E F        gate, closed   (controlled by plate group 1 / 2 / 3)
//   o p q        portal pair    (each letter appears exactly twice; player-only)
//   > < A V      one-way arrow  (enter only when moving right/left/up/down)
//   %            cracked floor  (collapses into a pit after the player leaves)
//   k j          key            (collect to open same-letter locks)
//   K J          lock           (blocks like a wall until the key is collected)
//
// A gate opens when the number of pressed plates in its group reaches the
// group threshold (default = number of plates in the group, i.e. AND).

import type { Cell, Color, Crate, Dir, Level, MoveToken } from './types.js';

export interface LevelDef {
  id: string;
  name: string;
  subtitle: string;
  intro: string;
  map: string[];
  /** Override gate thresholds, e.g. { '1': 1 } to make group 1 an OR gate. */
  gateThreshold?: Record<string, number>;
  par?: number;
  /** A pre-verified solution (used by generated levels; tokens so pull levels fit). */
  solution?: MoveToken[];
}

const CRATE_COLOR: Record<string, Color> = { R: 'rose', G: 'sage', B: 'slate', Y: 'amber' };
const GOAL_COLOR: Record<string, Color> = { r: 'rose', g: 'sage', b: 'slate', y: 'amber' };
const GATE_GROUP: Record<string, string> = { D: '1', E: '2', F: '3' };
const PORTAL_IDS = new Set(['o', 'p', 'q']);
const ARROW_DIR: Record<string, Dir> = { '>': 'right', '<': 'left', A: 'up', V: 'down' };
const KEY_IDS = new Set(['k', 'j']);
const LOCK_GROUP: Record<string, string> = { K: 'k', J: 'j' };

function blankCell(): Cell {
  return {
    terrain: 'floor',
    goal: null,
    plateGroup: null,
    gateGroup: null,
    portal: null,
    arrow: null,
    cracked: false,
    key: null,
    lock: null,
  };
}

export function parseLevel(def: LevelDef): Level {
  const height = def.map.length;
  const width = Math.max(...def.map.map((r) => r.length));
  const cells: Cell[] = [];
  const crates: Crate[] = [];
  let start: { x: number; y: number } | null = null;
  let crateId = 0;
  const plateGroups = new Set<string>();
  const gateGroups = new Set<string>();

  for (let y = 0; y < height; y++) {
    const row = def.map[y] ?? '';
    for (let x = 0; x < width; x++) {
      const ch = row[x] ?? ' ';
      const cell = blankCell();

      if (ch === '#') {
        cell.terrain = 'wall';
      } else if (ch === '~') {
        cell.terrain = 'ice';
      } else if (ch === '^') {
        cell.terrain = 'pit';
      } else if (ch === '.' || ch === '*' || ch === '+') {
        cell.goal = 'natural';
      } else if (GOAL_COLOR[ch]) {
        cell.goal = GOAL_COLOR[ch]!;
      } else if (/[1-9]/.test(ch)) {
        cell.plateGroup = ch;
        plateGroups.add(ch);
      } else if (GATE_GROUP[ch]) {
        cell.gateGroup = GATE_GROUP[ch]!;
        gateGroups.add(GATE_GROUP[ch]!);
      } else if (PORTAL_IDS.has(ch)) {
        cell.portal = ch;
      } else if (ARROW_DIR[ch]) {
        cell.arrow = ARROW_DIR[ch]!;
      } else if (ch === '%') {
        cell.cracked = true;
      } else if (KEY_IDS.has(ch)) {
        cell.key = ch;
      } else if (LOCK_GROUP[ch]) {
        cell.lock = LOCK_GROUP[ch]!;
      }

      // Object layer (player / crates).
      if (ch === '@' || ch === '+') {
        start = { x, y };
      } else if (ch === '$' || ch === '*') {
        crates.push({ id: crateId++, x, y, color: 'natural' });
      } else if (CRATE_COLOR[ch]) {
        crates.push({ id: crateId++, x, y, color: CRATE_COLOR[ch]! });
      }

      cells.push(cell);
    }
  }

  if (!start) throw new Error(`Level ${def.id}: no player start (@) found`);

  // Validate that every gate has a controlling plate group.
  for (const g of gateGroups) {
    if (!plateGroups.has(g)) {
      throw new Error(`Level ${def.id}: gate group ${g} has no pressure plate`);
    }
  }

  // Default gate threshold = number of plates in the group.
  const gateThreshold: Record<string, number> = {};
  for (const g of gateGroups) {
    const plateCount = cells.filter((c) => c.plateGroup === g).length;
    gateThreshold[g] = def.gateThreshold?.[g] ?? plateCount;
  }

  // Portal partners: each portal id must appear exactly twice; link the two cells.
  const portalPartner = new Array<number>(cells.length).fill(-1);
  const byId = new Map<string, number[]>();
  cells.forEach((c, i) => {
    if (c.portal) (byId.get(c.portal) ?? byId.set(c.portal, []).get(c.portal)!).push(i);
  });
  for (const [id, list] of byId) {
    if (list.length !== 2) {
      throw new Error(`Level ${def.id}: portal '${id}' must appear exactly twice (found ${list.length})`);
    }
    portalPartner[list[0]!] = list[1]!;
    portalPartner[list[1]!] = list[0]!;
  }

  return {
    id: def.id,
    name: def.name,
    subtitle: def.subtitle,
    intro: def.intro,
    width,
    height,
    cells,
    start,
    crates,
    gateThreshold,
    portalPartner,
    par: def.par,
    solution: def.solution,
  };
}

/** Fresh mutable state from a level's initial layout. */
export function initialState(level: Level) {
  return {
    playerX: level.start.x,
    playerY: level.start.y,
    crates: level.crates.map((c) => ({ ...c })),
    filled: [] as number[],
    collapsed: [] as number[],
    keys: [] as string[],
    moves: 0,
    pushes: 0,
  };
}
