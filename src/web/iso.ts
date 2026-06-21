// Isometric 2.5D renderer for levels with height (Cell.height > 0). It is a
// SEPARATE renderer from the classic 2D BoardRenderer — flat levels keep the 2D
// grid untouched. It consumes only Level + GameState (no game rules here).
//
// Technique: a 2:1 isometric screen projection (sx,sy from grid x,y + height),
// each tile drawn as a diamond TOP face plus two skewed parallelogram SIDE faces
// (real extruded geometry, not box-shadow). Painter-ordered z-index by grid depth
// gives reliable occlusion (CSS 3D has no per-pixel z-buffer). Pieces animate
// their projected position, so height changes glide instead of teleporting.

import type { Cell, Color, Crate, Dir, GameState, Level, MoveEffect } from '../engine/types.js';
import { OPPOSITE } from '../engine/types.js';

// Tile geometry (screen px at scale 1). 2:1 dimetric diamond + per-layer rise.
const TW = 64; // diamond width
const TH = 32; // diamond height
const ZH = 26; // px the tile rises per height layer
const BASE = 12; // slab thickness for a height-0 tile
const WALL_RISE = 1.7; // walls stand this many layers above their floor
const PIT_DROP = 0.55; // pits sink this far
const LIFT_RISE = 2; // matches the engine: a lift rises this far while occupied

const colorVar = (c: Color) => (c === 'natural' ? '' : `iso-c-${c}`);

/** Visual top layer of a cell (walls rise, pits sink, ramps sit mid-slope). */
function topLayer(cell: Cell): number {
  if (cell.terrain === 'wall') return cell.height + WALL_RISE;
  if (cell.terrain === 'pit') return cell.height - PIT_DROP;
  if (cell.ramp) return cell.height + 0.5;
  return cell.height;
}

export class IsoRenderer {
  readonly board: HTMLDivElement;
  private scene: HTMLDivElement;
  private level!: Level;
  private cellEls = new Map<number, HTMLDivElement>();
  private goalEls: { i: number; el: HTMLDivElement; color: Color }[] = [];
  private lifts: { x: number; y: number; el: HTMLDivElement; base: number }[] = [];
  private crateEls = new Map<number, HTMLDivElement>();
  private playerEl!: HTMLDivElement;
  private ghostEl!: HTMLDivElement;
  private facing: Dir = 'down';
  private lastPX = 0;
  private lastPY = 0;

  constructor(private wrap: HTMLDivElement) {
    this.board = document.createElement('div');
    this.board.className = 'iso-board';
    this.scene = document.createElement('div');
    this.scene.className = 'iso-scene';
    this.board.appendChild(this.scene);
    wrap.appendChild(this.board);
  }

  // Screen position (top-diamond centre) for a grid cell at a given layer.
  private projX(gx: number, gy: number): number {
    return (gx - gy) * (TW / 2);
  }
  private projY(gx: number, gy: number, layer: number): number {
    return (gx + gy) * (TH / 2) - layer * ZH;
  }
  private depthZ(gx: number, gy: number, layer: number): number {
    return Math.round((gx + gy) * 1000 + layer * 10);
  }

  mount(level: Level): void {
    this.level = level;
    this.scene.replaceChildren();
    this.cellEls.clear();
    this.goalEls = [];
    this.lifts = [];
    this.crateEls.clear();

    // Centre the board: shift so the projected bounds sit in a positive box.
    let minX = 0, maxX = 0, maxY = 0, minY = 0;
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const px = this.projX(x, y);
        const py = this.projY(x, y, 0);
        minX = Math.min(minX, px - TW / 2);
        maxX = Math.max(maxX, px + TW / 2);
        minY = Math.min(minY, py - TH);
        maxY = Math.max(maxY, py + TH / 2 + (level.height + level.width) * 0); // padded below
      }
    }
    const padTop = (this.maxHeight() * ZH) + TH + 24;
    const w = maxX - minX + 24;
    const h = maxY - minY + padTop + 80;
    this.scene.style.setProperty('--ox', `${-minX + 12}px`);
    this.scene.style.setProperty('--oy', `${-minY + padTop}px`);
    this.scene.style.setProperty('--bw', `${w}px`);
    this.scene.style.setProperty('--bh', `${h}px`);

    for (let i = 0; i < level.cells.length; i++) {
      const cell = level.cells[i]!;
      if (this.isVoid(cell)) continue;
      const x = i % level.width;
      const y = Math.floor(i / level.width);
      const el = this.makeTile(cell, x, y);
      this.scene.appendChild(el);
      this.cellEls.set(i, el);
      if (cell.goal) this.goalEls.push({ i, el, color: cell.goal });
      if (cell.terrain === 'lift') this.lifts.push({ x, y, el, base: cell.height });
    }

    // ghost outline (shown when the player is hidden behind a taller tile)
    this.ghostEl = document.createElement('div');
    this.ghostEl.className = 'iso-ghost';
    this.scene.appendChild(this.ghostEl);

    this.playerEl = this.makePlayer();
    this.scene.appendChild(this.playerEl);
    this.facing = 'down';
    this.lastPX = level.start.x;
    this.lastPY = level.start.y;

    this.sizeToViewport();
  }

  private maxHeight(): number {
    let m = 0;
    for (const c of this.level.cells) m = Math.max(m, topLayer(c));
    return m;
  }

  // A "void" cell: nothing to draw (outside the playfield). We still draw walls.
  private isVoid(cell: Cell): boolean {
    return false && !!cell; // every parsed cell is part of the board; keep all
  }

  private place(el: HTMLElement, gx: number, gy: number, layer: number, lift = 0): void {
    el.style.setProperty('--sx', `${this.projX(gx, gy)}px`);
    el.style.setProperty('--sy', `${this.projY(gx, gy, layer) - lift}px`);
    el.style.zIndex = String(this.depthZ(gx, gy, layer));
  }

  private makeTile(cell: Cell, x: number, y: number): HTMLDivElement {
    const el = document.createElement('div');
    el.className = `iso-cell ${this.tileClass(cell)}`;
    const layer = topLayer(cell);
    const ext = Math.max(2, layer * ZH + BASE); // side height in px
    el.style.setProperty('--ext', `${ext}px`);
    el.innerHTML =
      '<div class="iso-face left"></div>' +
      '<div class="iso-face right"></div>' +
      '<div class="iso-face top"></div>';
    this.place(el, x, y, layer);
    return el;
  }

  private tileClass(cell: Cell): string {
    const parts: string[] = [];
    if (cell.terrain === 'wall') parts.push('t-wall');
    else if (cell.terrain === 'ice') parts.push('t-ice');
    else if (cell.terrain === 'pit') parts.push('t-pit');
    else if (cell.terrain === 'bridge') parts.push('t-bridge');
    else if (cell.terrain === 'lift') parts.push('t-lift');
    else parts.push('t-floor');
    if (cell.ramp) parts.push('t-ramp', `r-${cell.ramp}`);
    if (cell.goal) parts.push('t-goal', cell.goal !== 'natural' ? colorVar(cell.goal) : '');
    if (cell.portal) parts.push('t-portal', `p-${cell.portal}`);
    if (cell.cracked) parts.push('t-cracked');
    if (cell.mirror) parts.push('t-mirror');
    return parts.filter(Boolean).join(' ');
  }

  private makePlayer(): HTMLDivElement {
    const el = document.createElement('div');
    el.className = 'iso-piece player face-down';
    el.innerHTML = `<svg class="iso-av" viewBox="0 0 64 80" aria-hidden="true">
      <ellipse class="av-sh" cx="32" cy="74" rx="17" ry="5"/>
      <path class="av-foot" d="M22 64h8v8h-8z"/><path class="av-foot" d="M34 64h8v8h-8z"/>
      <rect class="av-body" x="19" y="40" width="26" height="30" rx="12"/>
      <ellipse class="av-head" cx="32" cy="26" rx="18" ry="17"/>
      <g class="av-face">
        <circle class="av-cheek" cx="19" cy="31" r="2.6"/><circle class="av-cheek" cx="45" cy="31" r="2.6"/>
        <circle class="av-eye" cx="25" cy="26" r="3.4"/><circle class="av-eye" cx="39" cy="26" r="3.4"/>
        <circle class="av-glint" cx="26.3" cy="24.6" r="1.1"/><circle class="av-glint" cx="40.3" cy="24.6" r="1.1"/>
      </g>
      <rect class="av-ant" x="30.5" y="4" width="3" height="8" rx="1.5"/>
      <circle class="av-tip" cx="32" cy="5" r="3"/>
    </svg>`;
    return el;
  }

  private makeCrate(c: Crate): HTMLDivElement {
    const el = document.createElement('div');
    el.className = `iso-piece crate ${colorVar(c.color)}`.trim();
    el.innerHTML =
      '<div class="cr-face left"></div><div class="cr-face right"></div><div class="cr-face top"></div>';
    return el;
  }

  /** Render a state. Pass effect to animate a single move; omit for instant. */
  update(state: GameState, effect?: MoveEffect): void {
    // facing (same derivation as the 2D renderer)
    if (effect && !effect.teleported) {
      const dx = state.playerX - this.lastPX;
      const dy = state.playerY - this.lastPY;
      let dir: Dir | null = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : dy < 0 ? 'up' : null;
      if (effect.pulled && dir) dir = OPPOSITE[dir];
      if (dir) this.setFacing(dir);
      this.pulse(effect.crate && !effect.crate.sank ? 'pushing' : 'stepping');
    }
    this.lastPX = state.playerX;
    this.lastPY = state.playerY;

    const pH = this.effHeight(state.playerX, state.playerY);
    this.place(this.playerEl, state.playerX, state.playerY, pH, 2);
    // lift the player's z so it sits above its own tile
    this.playerEl.style.zIndex = String(this.depthZ(state.playerX, state.playerY, pH) + 5);
    if (effect?.teleported) {
      this.playerEl.classList.remove('warp');
      void this.playerEl.offsetWidth;
      this.playerEl.classList.add('warp');
    }

    const present = new Set(state.crates.map((c) => c.id));
    for (const [id, el] of [...this.crateEls]) {
      if (present.has(id)) continue;
      if (effect?.crate?.sank && effect.crate.id === id) {
        const cell = this.cellAt(effect.crate.to.x, effect.crate.to.y);
        this.place(el, effect.crate.to.x, effect.crate.to.y, cell.height);
        window.setTimeout(() => el.classList.add('sinking'), 60);
        window.setTimeout(() => el.remove(), 320);
      } else {
        el.remove();
      }
      this.crateEls.delete(id);
    }
    for (const c of state.crates) {
      let el = this.crateEls.get(c.id);
      const cell = this.cellAt(c.x, c.y);
      if (!el) {
        el = this.makeCrate(c);
        this.scene.appendChild(el);
        this.crateEls.set(c.id, el);
      }
      const cH = this.effHeight(c.x, c.y);
      this.place(el, c.x, c.y, cH, 1);
      el.style.zIndex = String(this.depthZ(c.x, c.y, cH) + 3);
      const sat = !!cell.goal && (cell.goal === 'natural' || cell.goal === c.color);
      el.classList.toggle('seated', sat);
    }

    this.updateLifts(state);
    this.updateDynamicCells(state);
    this.updateGhost(state);

    if (effect?.collapsed !== undefined) {
      const c = this.cellEls.get(effect.collapsed);
      if (c) { c.classList.remove('collapsing'); void c.offsetWidth; c.classList.add('collapsing'); }
    }
  }

  private updateDynamicCells(state: GameState): void {
    for (const [i, el] of this.cellEls) {
      if (state.filled.includes(i)) el.classList.add('filled');
      el.classList.toggle('collapsed', state.collapsed.includes(i));
    }
    for (const g of this.goalEls) {
      const x = g.i % this.level.width;
      const y = Math.floor(g.i / this.level.width);
      const crate = state.crates.find((c) => c.x === x && c.y === y);
      const sat = !!crate && (g.color === 'natural' || g.color === crate.color);
      g.el.classList.toggle('satisfied', sat);
    }
  }

  // If a taller tile sits directly in front of the player, show an outline so the
  // player is never fully lost behind geometry.
  private updateGhost(state: GameState): void {
    const here = this.cellAt(state.playerX, state.playerY).height;
    const occluders: [number, number][] = [
      [state.playerX + 1, state.playerY],
      [state.playerX, state.playerY + 1],
      [state.playerX + 1, state.playerY + 1],
    ];
    let hidden = false;
    for (const [x, y] of occluders) {
      if (x >= this.level.width || y >= this.level.height) continue;
      const c = this.cellAt(x, y);
      if (topLayer(c) >= here + 1.4) hidden = true;
    }
    this.ghostEl.classList.toggle('show', hidden);
    this.playerEl.classList.toggle('occluded', hidden);
    if (hidden) {
      this.place(this.ghostEl, state.playerX, state.playerY, here, 2);
      this.ghostEl.style.zIndex = '999999';
      this.playerEl.style.zIndex = '999998'; // show the player through the occluder
    }
  }

  private cellAt(x: number, y: number): Cell {
    return this.level.cells[y * this.level.width + x]!;
  }

  /** Standing height of a cell for a piece on it (a lift reads raised). */
  private effHeight(x: number, y: number): number {
    const c = this.cellAt(x, y);
    return c.terrain === 'lift' ? c.height + LIFT_RISE : c.height;
  }

  /** Lifts rise while occupied — reposition their tiles (and side faces) each move. */
  private updateLifts(state: GameState): void {
    for (const lf of this.lifts) {
      const occupied =
        (state.playerX === lf.x && state.playerY === lf.y) ||
        state.crates.some((c) => c.x === lf.x && c.y === lf.y);
      const layer = occupied ? lf.base + LIFT_RISE : lf.base;
      lf.el.style.setProperty('--ext', `${Math.max(2, layer * ZH + BASE)}px`);
      this.place(lf.el, lf.x, lf.y, layer);
      lf.el.classList.toggle('raised', occupied);
    }
  }

  private setFacing(dir: Dir): void {
    if (dir === this.facing) return;
    this.playerEl.classList.remove(`face-${this.facing}`);
    this.playerEl.classList.add(`face-${dir}`);
    this.facing = dir;
  }
  private pulse(cls: string): void {
    this.playerEl.classList.remove(cls);
    void this.playerEl.offsetWidth;
    this.playerEl.classList.add(cls);
    window.setTimeout(() => this.playerEl.classList.remove(cls), 200);
  }

  sizeToViewport(availWidth?: number): void {
    if (!this.level) return;
    const w = parseFloat(this.scene.style.getPropertyValue('--bw')) || 400;
    const h = parseFloat(this.scene.style.getPropertyValue('--bh')) || 400;
    const availW = (availWidth ?? Math.min(window.innerWidth * 0.94, 760)) - 28;
    const availH = window.innerHeight - 300;
    const scale = Math.min(availW / w, availH / h, 1.15);
    this.board.style.setProperty('--iso-scale', String(Math.max(0.4, scale)));
    this.board.style.width = `${w * Math.max(0.4, scale)}px`;
    this.board.style.height = `${h * Math.max(0.4, scale)}px`;
  }
}
