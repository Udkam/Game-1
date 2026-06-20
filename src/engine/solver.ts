// A* solver over game states. Doubles as level QA: proves a level is solvable,
// reports a strong (optimal for obstacle-free / non-ice cases) solution length as
// `par`, and surfaces the solution path. Crate layouts are canonicalized by
// `stateKey`, so symmetric/interchangeable states collapse.
//
// Heuristic: minimum-cost assignment of goals to distinct color-matching crates,
// summing Manhattan distances. This is a lower bound on pushes (hence on moves)
// for non-ice motion, and it prunes dead states (a goal whose only matching
// crates have all sunk into pits yields +Infinity).

import type { Color, Dir, GameState, Level } from './types.js';
import { OPPOSITE } from './types.js';
import { applyMove, applyToken, parseToken, isSolved, stateKey } from './rules.js';
import { initialState } from './level.js';

const ALL_DIRS: Dir[] = ['up', 'down', 'left', 'right'];

export interface SolveResult {
  solvable: boolean;
  /** Length of the solution found (moves), or -1. */
  moves: number;
  /** Pushes along that solution, or -1. */
  pushes: number;
  solution: Dir[];
  explored: number;
  truncated: boolean;
}

interface Goal {
  x: number;
  y: number;
  color: Color;
}

function collectGoals(level: Level): Goal[] {
  const goals: Goal[] = [];
  for (let i = 0; i < level.cells.length; i++) {
    const g = level.cells[i]!.goal;
    if (g) goals.push({ x: i % level.width, y: Math.floor(i / level.width), color: g });
  }
  return goals;
}

function heuristic(goals: Goal[], state: GameState): number {
  const crates = state.crates;
  // Minimum-cost injective assignment goals -> matching crates (goals <= 4).
  const rec = (gi: number, used: Set<number>): number => {
    if (gi >= goals.length) return 0;
    const g = goals[gi]!;
    let best = Infinity;
    for (const c of crates) {
      if (used.has(c.id)) continue;
      if (g.color !== 'natural' && c.color !== g.color) continue;
      used.add(c.id);
      const sub = rec(gi + 1, used);
      used.delete(c.id);
      if (sub !== Infinity) {
        best = Math.min(best, Math.abs(c.x - g.x) + Math.abs(c.y - g.y) + sub);
      }
    }
    return best;
  };
  return rec(0, new Set());
}

/** Binary min-heap keyed by f, tie-broken by h (prefer states closer to goal). */
class Heap {
  private f: number[] = [];
  private h: number[] = [];
  private id: number[] = [];
  get size() {
    return this.id.length;
  }
  push(f: number, h: number, id: number) {
    this.f.push(f);
    this.h.push(h);
    this.id.push(id);
    let i = this.id.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.f[p]! < this.f[i]! || (this.f[p] === this.f[i] && this.h[p]! <= this.h[i]!)) break;
      this.swap(i, p);
      i = p;
    }
  }
  pop(): number {
    const top = this.id[0]!;
    const last = this.id.length - 1;
    this.swap(0, last);
    this.f.pop();
    this.h.pop();
    this.id.pop();
    let i = 0;
    const n = this.id.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let s = i;
      if (l < n && (this.f[l]! < this.f[s]! || (this.f[l] === this.f[s] && this.h[l]! < this.h[s]!))) s = l;
      if (r < n && (this.f[r]! < this.f[s]! || (this.f[r] === this.f[s] && this.h[r]! < this.h[s]!))) s = r;
      if (s === i) break;
      this.swap(i, s);
      i = s;
    }
    return top;
  }
  private swap(a: number, b: number) {
    [this.f[a], this.f[b]] = [this.f[b]!, this.f[a]!];
    [this.h[a], this.h[b]] = [this.h[b]!, this.h[a]!];
    [this.id[a], this.id[b]] = [this.id[b]!, this.id[a]!];
  }
}

export function solve(level: Level, opts: { maxStates?: number } = {}): SolveResult {
  const maxStates = opts.maxStates ?? 2_000_000;
  const goals = collectGoals(level);
  const start = initialState(level);
  if (isSolved(level, start)) {
    return { solvable: true, moves: 0, pushes: 0, solution: [], explored: 0, truncated: false };
  }

  // Node store: parallel arrays indexed by node id.
  const states: GameState[] = [start];
  const parent: number[] = [-1];
  const viaDir: (Dir | null)[] = [null];
  const gScore = new Map<string, number>();
  const startKey = stateKey(start);
  gScore.set(startKey, 0);

  const heap = new Heap();
  heap.push(heuristic(goals, start), 0, 0);
  let explored = 0;

  while (heap.size > 0) {
    if (explored >= maxStates) {
      return { solvable: false, moves: -1, pushes: -1, solution: [], explored, truncated: true };
    }
    const id = heap.pop();
    const cur = states[id]!;
    const curKey = stateKey(cur);
    const g = gScore.get(curKey)!;
    // Skip stale heap entries (a better path to this state was already settled).
    if (cur.moves > g) continue;
    explored++;

    if (isSolved(level, cur)) {
      const solution: Dir[] = [];
      let n = id;
      while (parent[n] !== -1) {
        solution.push(viaDir[n]!);
        n = parent[n]!;
      }
      solution.reverse();
      return {
        solvable: true,
        moves: cur.moves,
        pushes: cur.pushes,
        solution,
        explored,
        truncated: false,
      };
    }

    for (const dir of ALL_DIRS) {
      const res = applyMove(level, cur, dir);
      if (!res.changed) continue;
      const ns = res.state;
      const nKey = stateKey(ns);
      const prev = gScore.get(nKey);
      if (prev !== undefined && prev <= ns.moves) continue;
      gScore.set(nKey, ns.moves);
      const nid = states.length;
      states.push(ns);
      parent.push(id);
      viaDir.push(dir);
      const h = heuristic(goals, ns);
      if (h === Infinity) continue; // dead state — needed crate is gone
      heap.push(ns.moves + h, h, nid);
    }
  }

  return { solvable: false, moves: -1, pushes: -1, solution: [], explored, truncated: false };
}

/** Replay a move token sequence from the initial state; report whether it solves.
 *  Tokens may be plain dirs (push/walk) or `@dir` (pull/grab). */
export function replay(level: Level, moves: string[]): { solved: boolean; state: GameState } {
  let state = initialState(level);
  for (const token of moves) state = applyToken(level, state, token).state;
  return { solved: isSolved(level, state), state };
}

/** Flip a token's horizontal direction (for a mirrored twin board). */
export function mirrorToken(token: string): string {
  const p = parseToken(token);
  if (!p || (p.dir !== 'left' && p.dir !== 'right')) return token;
  const d = OPPOSITE[p.dir];
  return p.pull ? `@${d}` : d;
}

/** Replay a diptych: the same tokens drive both boards (twin input mirrored when
 *  level.mirrorTwin). Solved only when BOTH boards are solved. */
export function replayDiptych(level: Level, moves: string[]): {
  solved: boolean;
  a: GameState;
  b: GameState;
} {
  let a = initialState(level);
  let b = initialState(level.twin!);
  for (const token of moves) {
    a = applyToken(level, a, token).state;
    b = applyToken(level.twin!, b, level.mirrorTwin ? mirrorToken(token) : token).state;
  }
  return { solved: isSolved(level, a) && isSolved(level.twin!, b), a, b };
}
