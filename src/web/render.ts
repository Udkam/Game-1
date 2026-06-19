// Board renderer. The grid is a CSS Grid of static terrain cells; the player and
// crates are absolutely-positioned pieces moved with CSS transforms, so ordinary
// steps and long ice slides both animate for free. Dynamic tile states (filled
// pits, open gates, pressed plates, seated crates) are reconciled each update.

import type { Cell, Color, Crate, GameState, Level, MoveEffect } from '../engine/types.js';
import { computeOpenGates } from '../engine/rules.js';

const STEP_MS = 120;
const SINK_MS = 240;
const slideDur = (dist: number) => Math.min(380, Math.max(140, dist * 70));

const colorClass = (c: Color) => (c === 'natural' ? '' : `color-${c}`);
const groupClass = (g: string | null) => (g ? `g${g}` : '');

function seated(cell: Cell, crate: Crate): boolean {
  return !!cell.goal && (cell.goal === 'natural' || cell.goal === crate.color);
}

export class BoardRenderer {
  readonly board: HTMLDivElement;
  private level!: Level;
  private cellEls: HTMLDivElement[] = [];
  private pits: { i: number; el: HTMLDivElement }[] = [];
  private gates: { i: number; el: HTMLDivElement; group: string }[] = [];
  private plates: { el: HTMLDivElement; x: number; y: number; group: string }[] = [];
  private cracks: { i: number; el: HTMLDivElement }[] = [];
  private keysEls: { i: number; el: HTMLDivElement; group: string }[] = [];
  private locks: { el: HTMLDivElement; group: string }[] = [];
  private crateEls = new Map<number, HTMLDivElement>();
  private playerEl!: HTMLDivElement;

  constructor(private wrap: HTMLDivElement) {
    this.board = document.createElement('div');
    this.board.className = 'board';
    wrap.appendChild(this.board);
  }

  mount(level: Level): void {
    this.level = level;
    this.board.replaceChildren();
    this.cellEls = [];
    this.pits = [];
    this.gates = [];
    this.plates = [];
    this.cracks = [];
    this.keysEls = [];
    this.locks = [];
    this.crateEls.clear();
    this.board.style.setProperty('--cols', String(level.width));
    this.board.style.setProperty('--rows', String(level.height));

    for (let i = 0; i < level.cells.length; i++) {
      const cell = level.cells[i]!;
      const el = document.createElement('div');
      const x = i % level.width;
      const y = Math.floor(i / level.width);
      el.className = this.staticCellClass(cell);
      this.board.appendChild(el);
      this.cellEls.push(el);
      if (cell.terrain === 'pit') this.pits.push({ i, el });
      if (cell.gateGroup) this.gates.push({ i, el, group: cell.gateGroup });
      if (cell.plateGroup) this.plates.push({ el, x, y, group: cell.plateGroup });
      if (cell.cracked) this.cracks.push({ i, el });
      if (cell.key) this.keysEls.push({ i, el, group: cell.key });
      if (cell.lock) this.locks.push({ el, group: cell.lock });
    }

    // player
    this.playerEl = document.createElement('div');
    this.playerEl.className = 'piece player';
    this.playerEl.innerHTML = '<div class="body"></div>';
    this.board.appendChild(this.playerEl);

    this.sizeToViewport();
  }

  private staticCellClass(cell: Cell): string {
    const parts = ['cell'];
    if (cell.terrain === 'wall') parts.push('wall');
    else if (cell.terrain === 'ice') parts.push('ice');
    else if (cell.terrain === 'pit') parts.push('pit');
    else parts.push('floor');
    if (cell.goal) {
      parts.push('goal');
      if (cell.goal !== 'natural') parts.push(`c-${cell.goal}`);
    }
    if (cell.plateGroup) parts.push('plate', groupClass(cell.plateGroup));
    if (cell.gateGroup) parts.push('gate', groupClass(cell.gateGroup));
    if (cell.portal) parts.push('portal', `p-${cell.portal}`);
    if (cell.arrow) parts.push('arrow', `a-${cell.arrow}`);
    if (cell.cracked) parts.push('cracked');
    if (cell.key) parts.push('key', `k-${cell.key}`);
    if (cell.lock) parts.push('lock', `l-${cell.lock}`);
    return parts.join(' ');
  }

  private makeCrate(c: Crate): HTMLDivElement {
    const el = document.createElement('div');
    el.className = `piece crate ${colorClass(c.color)}`.trim();
    el.innerHTML = '<div class="body"></div>';
    return el;
  }

  private setPos(el: HTMLElement, x: number, y: number, dur: number): void {
    el.style.setProperty('--dur', `${dur}ms`);
    el.style.setProperty('--px', String(x));
    el.style.setProperty('--py', String(y));
  }

  /** Render a state. Pass `effect` to animate a single move; omit for instant. */
  update(state: GameState, effect?: MoveEffect): void {
    const instant = !effect;
    const stepDur = instant ? 0 : STEP_MS;

    if (effect?.teleported) {
      // Warp: snap to the partner cell (no slide across the board) with a pulse.
      this.setPos(this.playerEl, state.playerX, state.playerY, 0);
      this.playerEl.classList.remove('warp');
      void this.playerEl.offsetWidth; // restart the animation
      this.playerEl.classList.add('warp');
      window.setTimeout(() => this.playerEl.classList.remove('warp'), 320);
    } else {
      this.setPos(this.playerEl, state.playerX, state.playerY, stepDur);
    }

    const present = new Set(state.crates.map((c) => c.id));

    // Remove crates no longer present (sunk into a pit, or undone-away rebuilds).
    for (const [id, el] of [...this.crateEls]) {
      if (present.has(id)) continue;
      if (effect?.crate?.sank && effect.crate.id === id) {
        const dist = Math.abs(effect.crate.from.x - effect.crate.to.x) +
          Math.abs(effect.crate.from.y - effect.crate.to.y);
        const dur = effect.crate.slid ? slideDur(dist) : STEP_MS;
        this.setPos(el, effect.crate.to.x, effect.crate.to.y, dur);
        window.setTimeout(() => el.classList.add('sinking'), Math.max(0, dur - 60));
        window.setTimeout(() => el.remove(), dur + SINK_MS);
      } else {
        el.remove();
      }
      this.crateEls.delete(id);
    }

    // Position present crates (creating any that are missing, e.g. after undo).
    for (const c of state.crates) {
      let el = this.crateEls.get(c.id);
      if (!el) {
        el = this.makeCrate(c);
        this.board.appendChild(el);
        this.crateEls.set(c.id, el);
        this.setPos(el, c.x, c.y, 0);
      }
      let dur = stepDur;
      if (effect?.crate && effect.crate.id === c.id && !effect.crate.sank) {
        const dist = Math.abs(effect.crate.from.x - c.x) + Math.abs(effect.crate.from.y - c.y);
        dur = effect.crate.slid ? slideDur(dist) : STEP_MS;
      }
      this.setPos(el, c.x, c.y, dur);
      el.classList.toggle('seated', seated(this.level.cells[c.y * this.level.width + c.x]!, c));
    }

    this.updateDynamicCells(state);
  }

  private updateDynamicCells(state: GameState): void {
    for (const p of this.pits) p.el.classList.toggle('filled', state.filled.includes(p.i));
    for (const c of this.cracks) {
      c.el.classList.toggle('collapsed', state.collapsed.includes(c.i));
      c.el.classList.toggle('filled', state.filled.includes(c.i));
    }
    for (const k of this.keysEls) k.el.classList.toggle('taken', state.keys.includes(k.group));
    for (const l of this.locks) l.el.classList.toggle('open', state.keys.includes(l.group));
    const open = computeOpenGates(this.level, state);
    for (const g of this.gates) g.el.classList.toggle('open', open.has(g.group));
    for (const p of this.plates) {
      const weighed =
        (state.playerX === p.x && state.playerY === p.y) ||
        state.crates.some((c) => c.x === p.x && c.y === p.y);
      p.el.classList.toggle('pressed', weighed);
    }
  }

  sizeToViewport(): void {
    if (!this.level) return;
    const availW = Math.min(window.innerWidth * 0.94, 760) - 28;
    const availH = window.innerHeight - 300;
    const cell = Math.max(
      26,
      Math.floor(Math.min(availW / this.level.width, availH / this.level.height, 64)),
    );
    this.board.style.setProperty('--cell', `${cell}px`);
  }
}
