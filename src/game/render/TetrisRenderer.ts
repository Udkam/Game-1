import { Application, Container, Graphics, type Ticker } from 'pixi.js';
import {
  BOARD_WIDTH,
  LINE_CLEAR_DELAY_TICKS,
  PIECE_SHAPES,
  VISIBLE_HEIGHT,
  VISIBLE_START_ROW,
  cellsForPiece,
  dropDistance,
  type Cell,
  type GameEvent,
  type GameState,
  type PieceType,
} from '../core';
import { COLORS, PIECE_MATERIALS } from './theme';
import { approachPresentationPoint, lineClearCellProgress, nextPreviewPiece } from './presentation';

interface RenderOptions {
  reducedMotion: boolean;
  modeSwitch: boolean;
}

interface BoardLayout {
  x: number;
  y: number;
  width: number;
  height: number;
  cell: number;
  compact: boolean;
}

interface PiecePresentation {
  type: PieceType;
  x: number;
  y: number;
  settleMs: number;
}

interface TrailState {
  cells: Cell[];
  distance: number;
  elapsed: number;
  duration: number;
  piece: PieceType;
}

interface LockPulse {
  cells: Cell[];
  elapsed: number;
  duration: number;
  piece: PieceType;
}

export interface RendererSnapshot {
  canvas: { width: number; height: number; resolution: number };
  board: { x: number; y: number; width: number; height: number; cell: number };
  preview: { x: number; y: number; width: number; height: number } | null;
  previewLayerVisible: boolean;
  previewPiece: PieceType | null;
  previewClearBounds: { x: number; y: number; width: number; height: number } | null;
  previewClearPiece: PieceType | null;
  scrim: { x: number; y: number; width: number; height: number } | null;
  activeCells: Cell[];
  ghostCells: Cell[];
  visibleLockedCells: number;
  presentation: { x: number; y: number; offsetX: number; offsetY: number } | null;
}

const easeOutCubic = (value: number): number => 1 - Math.pow(1 - value, 3);

export class TetrisRenderer {
  private app: Application | null = null;
  private host: HTMLElement | null = null;
  private readonly world = new Container();
  private readonly boardGraphics = new Graphics();
  private readonly pieceGraphics = new Graphics();
  private readonly effectGraphics = new Graphics();

  private frameCallback: ((deltaMs: number) => void) | null = null;
  private presentation: PiecePresentation | null = null;
  private trail: TrailState | null = null;
  private lockPulse: LockPulse | null = null;
  private impact = 0;
  private rotationPulse = 0;
  private options: RenderOptions = { reducedMotion: false, modeSwitch: false };
  private previewBounds: RendererSnapshot['preview'] = null;
  private previewLayerVisible = false;
  private previewPiece: PieceType | null = null;
  private lastPreviewBounds: RendererSnapshot['preview'] = null;
  private lastPreviewPiece: PieceType | null = null;
  private previewClearBounds: RendererSnapshot['previewClearBounds'] = null;
  private previewClearPiece: PieceType | null = null;
  private scrimBounds: RendererSnapshot['scrim'] = null;
  private snapshot: RendererSnapshot = {
    canvas: { width: 0, height: 0, resolution: 1 },
    board: { x: 0, y: 0, width: 0, height: 0, cell: 0 },
    preview: null,
    previewLayerVisible: false,
    previewPiece: null,
    previewClearBounds: null,
    previewClearPiece: null,
    scrim: null,
    activeCells: [],
    ghostCells: [],
    visibleLockedCells: 0,
    presentation: null,
  };

  async init(host: HTMLElement): Promise<void> {
    this.host = host;
    const app = new Application();
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      preference: 'webgl',
    });
    app.canvas.dataset.testid = 'game-canvas';
    app.canvas.setAttribute('aria-label', 'Tetris 10 × 20 游戏棋盘');
    app.canvas.setAttribute('role', 'img');
    app.canvas.tabIndex = 0;
    host.appendChild(app.canvas);
    this.world.addChild(this.boardGraphics, this.pieceGraphics, this.effectGraphics);
    app.stage.addChild(this.world);
    app.ticker.add(this.onTick);
    this.app = app;
  }

  setFrameCallback(callback: (deltaMs: number) => void): void {
    this.frameCallback = callback;
  }

  setOptions(options: Partial<RenderOptions>): void {
    this.options = { ...this.options, ...options };
    if (this.options.reducedMotion) {
      this.presentation = null;
      this.trail = null;
      this.lockPulse = null;
      this.impact = 0;
      this.rotationPulse = 0;
    }
  }

  render(state: GameState, events: readonly GameEvent[], deltaMs: number): void {
    const app = this.app;
    if (!app) return;
    this.consumeEvents(events);
    this.advanceEffects(deltaMs);
    this.advancePresentation(state, deltaMs);
    const layout = this.calculateLayout(app.screen.width, app.screen.height, state.status === 'ready');
    this.drawBoard(state, layout);
    this.drawPieces(state, layout);
    this.drawEffects(state, layout);
    this.drawPreviews(state, layout);
    this.updateSnapshot(state, layout, app);
  }

  getSnapshot(): RendererSnapshot {
    return structuredClone(this.snapshot);
  }

  benchmark(state: GameState, iterations = 120): { meanMs: number; p95Ms: number; maxMs: number } {
    const samples: number[] = [];
    const count = Math.max(1, Math.min(500, Math.floor(iterations)));
    for (let index = 0; index < count; index += 1) {
      const start = performance.now();
      this.render(state, [], 0);
      samples.push(performance.now() - start);
    }
    samples.sort((left, right) => left - right);
    const meanMs = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    return {
      meanMs,
      p95Ms: samples[Math.min(samples.length - 1, Math.floor(samples.length * 0.95))] ?? 0,
      maxMs: samples.at(-1) ?? 0,
    };
  }

  destroy(): void {
    if (!this.app) return;
    this.app.ticker.remove(this.onTick);
    this.frameCallback = null;
    this.app.destroy({ removeView: true }, { children: true });
    this.app = null;
    this.host = null;
    this.presentation = null;
    this.lockPulse = null;
  }

  private readonly onTick = (ticker: Ticker): void => {
    this.frameCallback?.(Math.min(ticker.deltaMS, 100));
  };

  private calculateLayout(width: number, height: number, ready: boolean): BoardLayout {
    const hostBounds = this.host?.getBoundingClientRect();
    const boardElement = document.querySelector<HTMLElement>('[data-testid="board-frame"]');
    const requestedBounds = boardElement?.getBoundingClientRect();
    if (hostBounds && requestedBounds && requestedBounds.width > 0 && requestedBounds.height > 0) {
      const boardWidth = requestedBounds.width;
      return {
        x: requestedBounds.left - hostBounds.left,
        y: requestedBounds.top - hostBounds.top,
        width: boardWidth,
        height: requestedBounds.height,
        cell: boardWidth / BOARD_WIDTH,
        compact: requestedBounds.width <= 260,
      };
    }
    const compact = width < 620 && height > width * 1.05;
    const topBand = compact && !ready ? Math.min(96, height * 0.19) : 0;
    const horizontalAllowance = compact ? 18 : Math.min(260, width * 0.34);
    const cell = Math.max(8, Math.min((height - topBand - 24) / VISIBLE_HEIGHT, (width - horizontalAllowance) / BOARD_WIDTH));
    const boardWidth = cell * BOARD_WIDTH;
    const boardHeight = cell * VISIBLE_HEIGHT;
    return {
      x: compact
        ? (width - boardWidth) / 2
        : Math.max(0, (width - boardWidth) / 2 - Math.min(130, width * 0.14)),
      y: compact ? topBand + (height - topBand - boardHeight) / 2 : (height - boardHeight) / 2,
      width: boardWidth,
      height: boardHeight,
      cell,
      compact,
    };
  }

  private drawBoard(state: GameState, layout: BoardLayout): void {
    const graphics = this.boardGraphics;
    graphics.clear();
    const radius = Math.max(10, Math.min(22, layout.cell * 0.55));
    graphics
      .roundRect(layout.x, layout.y, layout.width, layout.height, radius)
      .fill({ color: COLORS.well, alpha: 1 })
      .stroke({ color: COLORS.edge, width: Math.max(1.5, layout.cell * 0.065) });

    for (let column = 1; column < BOARD_WIDTH; column += 1) {
      const x = layout.x + column * layout.cell;
      graphics.moveTo(x, layout.y + 1).lineTo(x, layout.y + layout.height - 1)
        .stroke({ color: COLORS.grid, alpha: 0.62, width: 1 });
    }
    for (let row = 1; row < VISIBLE_HEIGHT; row += 1) {
      const y = layout.y + row * layout.cell;
      graphics.moveTo(layout.x + 1, y).lineTo(layout.x + layout.width - 1, y)
        .stroke({ color: COLORS.grid, alpha: 0.62, width: 1 });
    }
    this.scrimBounds = null;
    if (state.status === 'paused' || state.status === 'game-over' || state.status === 'finished' || this.options.modeSwitch) {
      const alpha = state.status === 'paused' ? 0.22 : this.options.modeSwitch ? 0.38 : 0.16;
      graphics.roundRect(layout.x, layout.y, layout.width, layout.height, radius).fill({ color: COLORS.scrim, alpha });
      this.scrimBounds = { x: layout.x, y: layout.y, width: layout.width, height: layout.height };
    }
  }

  private drawPieces(state: GameState, layout: BoardLayout): void {
    const graphics = this.pieceGraphics;
    graphics.clear();
    let visibleLockedCells = 0;

    state.board.forEach((row, boardY) => {
      if (boardY < VISIBLE_START_ROW) return;
      row.forEach((cell, x) => {
        if (!cell) return;
        visibleLockedCells += 1;
        const clearProgress = state.phase === 'line-clear' && state.pendingClearRows.includes(boardY)
          ? lineClearCellProgress(state.phaseTicks / LINE_CLEAR_DELAY_TICKS, x, BOARD_WIDTH)
          : 0;
        this.drawCell(
          graphics,
          layout,
          x,
          boardY - VISIBLE_START_ROW,
          cell,
          1 - clearProgress * 0.92,
          false,
          0,
          0,
          false,
          this.options.reducedMotion ? 1 : 1 - clearProgress * 0.72,
        );
      });
    });

    if (this.trail && !this.options.reducedMotion) {
      const progress = Math.min(1, this.trail.elapsed / this.trail.duration);
      const echoCount = Math.min(6, Math.max(1, this.trail.distance));
      for (let echo = 1; echo <= echoCount; echo += 1) {
        const alpha = (1 - progress) * (0.16 / echo);
        for (const cell of this.trail.cells) {
          const y = cell.y - VISIBLE_START_ROW - echo * Math.max(1, Math.floor(this.trail.distance / echoCount));
          if (y >= 0) this.drawCell(graphics, layout, cell.x, y, this.trail.piece, alpha, false, 0, 0);
        }
      }
    }

    const activeCells = state.status === 'ready' || !state.active ? [] : cellsForPiece(state.active);
    const ghostCells = state.active
      ? activeCells.map((cell) => ({ x: cell.x, y: cell.y + dropDistance(state) }))
      : [];
    if (state.status === 'ready' && state.active) {
      ghostCells.splice(0, ghostCells.length, ...cellsForPiece(state.active).map((cell) => ({ x: cell.x, y: cell.y + dropDistance(state) })));
    }

    for (const cell of ghostCells) {
      if (cell.y < VISIBLE_START_ROW) continue;
      const ghostOffsetX = this.presentation && state.active
        ? (this.presentation.x - state.active.x) * layout.cell
        : 0;
      this.drawCell(graphics, layout, cell.x, cell.y - VISIBLE_START_ROW, state.active!.type, 0.82, true, ghostOffsetX, 0);
    }

    const offsetX = this.presentation && state.active && !this.options.reducedMotion
      ? (this.presentation.x - state.active.x) * layout.cell
      : 0;
    const offsetY = this.presentation && state.active && !this.options.reducedMotion
      ? (this.presentation.y - state.active.y) * layout.cell
      : 0;
    const rotationScale = this.options.reducedMotion ? 1 : 1 + this.rotationPulse * 0.035;
    for (const cell of activeCells) {
      if (cell.y < VISIBLE_START_ROW) continue;
      this.drawCell(
        graphics,
        layout,
        cell.x,
        cell.y - VISIBLE_START_ROW,
        state.active!.type,
        1,
        false,
        offsetX,
        offsetY,
        true,
        rotationScale,
      );
    }

    this.snapshot.visibleLockedCells = visibleLockedCells;
    this.pieceGraphics.alpha = this.options.modeSwitch ? 0.34 : 1;
    this.effectGraphics.alpha = this.options.modeSwitch ? 0.2 : 1;
  }

  private drawCell(
    graphics: Graphics,
    layout: BoardLayout,
    gridX: number,
    gridY: number,
    type: PieceType,
    alpha: number,
    ghost: boolean,
    offsetX: number,
    offsetY: number,
    active = false,
    scale = 1,
  ): void {
    const gap = Math.max(1.25, layout.cell * 0.055);
    const size = (layout.cell - gap * 2) * scale;
    const scaleInset = (layout.cell - gap * 2 - size) / 2;
    const x = layout.x + gridX * layout.cell + gap + scaleInset + offsetX;
    const y = layout.y + gridY * layout.cell + gap + scaleInset + offsetY;
    if (ghost) {
      this.drawGhostCell(graphics, x, y, size, type, alpha);
      return;
    }
    this.drawCeramicCell(graphics, x, y, size, type, alpha, active);
  }

  private drawCeramicCell(
    graphics: Graphics,
    x: number,
    y: number,
    size: number,
    type: PieceType,
    alpha: number,
    active: boolean,
  ): void {
    const material = PIECE_MATERIALS[type];
    const radius = Math.max(2.5, Math.min(size * 0.2, 7));
    const borderWidth = active ? Math.max(1.6, size * 0.07) : Math.max(.65, size * 0.025);
    graphics
      .roundRect(x, y, size, size, radius)
      .fill({ color: material.lowerEdge, alpha })
      .stroke({
        color: active ? 0xffffff : material.outline,
        alpha: active ? Math.min(1, alpha * .95) : Math.min(.55, alpha * .5),
        width: borderWidth,
      });
    const faceHeight = size * .79;
    graphics
      .roundRect(x + borderWidth * .4, y + borderWidth * .4, size - borderWidth * .8, faceHeight, Math.max(2, radius - borderWidth * .25))
      .fill({ color: material.fill, alpha });
    graphics
      .roundRect(x + size * .16, y + size * .12, size * .68, Math.max(1.2, size * .075), Math.max(1, size * .04))
      .fill({ color: 0xffffff, alpha: alpha * (active ? .56 : .34) });
  }

  private drawGhostCell(
    graphics: Graphics,
    x: number,
    y: number,
    size: number,
    type: PieceType,
    alpha: number,
  ): void {
    const material = PIECE_MATERIALS[type];
    const inset = Math.max(1, size * 0.06);
    const ghostSize = size - inset * 2;
    const radius = Math.max(2, Math.min(ghostSize * .2, 6));
    graphics
      .roundRect(x + inset, y + inset, ghostSize, ghostSize, radius)
      .stroke({ color: material.outline, alpha: Math.min(.78, alpha), width: Math.max(1.15, size * 0.055) });
  }

  private drawEffects(state: GameState, layout: BoardLayout): void {
    const graphics = this.effectGraphics;
    graphics.clear();
    if (state.phase === 'line-clear') {
      const progress = Math.min(1, state.phaseTicks / LINE_CLEAR_DELAY_TICKS);
      const width = layout.width * Math.sin(progress * Math.PI);
      for (const row of state.pendingClearRows) {
        if (row < VISIBLE_START_ROW) continue;
        const y = layout.y + (row - VISIBLE_START_ROW) * layout.cell;
        graphics
          .rect(layout.x + (layout.width - width) / 2, y + layout.cell * 0.12, width, layout.cell * 0.76)
          .fill({ color: COLORS.cyan, alpha: this.options.reducedMotion ? 0.28 : 0.18 + progress * 0.4 });
      }
    }

    if (this.lockPulse && !this.options.reducedMotion) {
      const progress = Math.min(1, this.lockPulse.elapsed / this.lockPulse.duration);
      const material = PIECE_MATERIALS[this.lockPulse.piece];
      const alpha = (1 - easeOutCubic(progress)) * 0.72;
      for (const cell of this.lockPulse.cells) {
        if (cell.y < VISIBLE_START_ROW) continue;
        const x = layout.x + cell.x * layout.cell + layout.cell * 0.06;
        const y = layout.y + (cell.y - VISIBLE_START_ROW) * layout.cell + layout.cell * 0.06;
        graphics
          .roundRect(x, y, layout.cell * 0.88, layout.cell * 0.88, Math.max(2, layout.cell * .16))
          .stroke({ color: material.outline, alpha, width: Math.max(1, layout.cell * 0.06) });
      }
    }
  }

  private drawPreviews(state: GameState, layout: BoardLayout): void {
    const graphics = this.pieceGraphics;
    this.previewBounds = null;
    this.previewLayerVisible = false;
    this.previewPiece = null;
    if (state.status === 'ready' || state.status === 'finished' || state.status === 'game-over') {
      this.previewClearBounds = null;
      this.previewClearPiece = null;
      return;
    }
    if (this.options.modeSwitch) {
      // drawPieces clears its Graphics at the start of this same frame. Hiding the
      // preview and refusing fallback placement here prevents the old Pixi preview
      // from surviving after React removes the DOM slot for mode switching.
      this.previewClearBounds = this.lastPreviewBounds;
      this.previewClearPiece = this.lastPreviewPiece;
      return;
    }
    this.previewClearBounds = null;
    this.previewClearPiece = null;
    const hostBounds = this.host?.getBoundingClientRect();
    const slot = document.querySelector<HTMLElement>('[data-testid="next-slot"]')?.getBoundingClientRect();
    if (hostBounds && slot && slot.width > 0 && slot.height > 0) {
      const x = slot.left - hostBounds.left;
      const y = slot.top - hostBounds.top;
      const next = nextPreviewPiece(state);
      if (next) {
        const unit = Math.max(5, Math.min(15, slot.width / 5, slot.height / 3));
        this.drawPreviewPiece(graphics, next, x + slot.width / 2, y + slot.height / 2, unit);
      }
      this.previewBounds = { x, y, width: slot.width, height: slot.height };
      this.previewLayerVisible = next !== undefined;
      this.previewPiece = next ?? null;
      this.lastPreviewBounds = this.previewBounds;
      this.lastPreviewPiece = this.previewPiece;
      return;
    }
    const width = this.app?.screen.width ?? 0;
    if (layout.compact) {
      const topY = Math.max(7, layout.y - Math.min(92, layout.cell * 4.7));
      const unit = Math.max(4, Math.min(8, layout.cell * 0.24));
      const previewCenterX = layout.x + layout.cell * 2.5;
      const next = nextPreviewPiece(state);
      if (next) this.drawPreviewPiece(graphics, next, previewCenterX, topY + 25, unit);
      this.previewBounds = { x: layout.x, y: topY, width: layout.cell * 5, height: Math.max(42, layout.cell * 4) };
      this.previewLayerVisible = next !== undefined;
      this.previewPiece = next ?? null;
      this.lastPreviewBounds = this.previewBounds;
      this.lastPreviewPiece = this.previewPiece;
    } else {
      const sideWidth = Math.max(92, (width - layout.width) / 2 - 22);
      const leftX = Math.max(12, layout.x - sideWidth - 14);
      const cardWidth = Math.max(78, sideWidth);
      const next = nextPreviewPiece(state);
      if (next) this.drawPreviewPiece(graphics, next, leftX + cardWidth / 2, layout.y + layout.cell * 2.2, Math.min(14, layout.cell * 0.48));
      this.previewBounds = { x: leftX, y: layout.y, width: cardWidth, height: Math.max(52, layout.cell * 4) };
      this.previewLayerVisible = next !== undefined;
      this.previewPiece = next ?? null;
      this.lastPreviewBounds = this.previewBounds;
      this.lastPreviewPiece = this.previewPiece;
    }
  }

  private drawPreviewPiece(graphics: Graphics, type: PieceType, centerX: number, centerY: number, unit: number): void {
    const shape = PIECE_SHAPES[type][0];
    const minX = Math.min(...shape.map((cell) => cell.x));
    const maxX = Math.max(...shape.map((cell) => cell.x));
    const minY = Math.min(...shape.map((cell) => cell.y));
    const maxY = Math.max(...shape.map((cell) => cell.y));
    const width = (maxX - minX + 1) * unit;
    const height = (maxY - minY + 1) * unit;
    for (const cell of shape) {
      const x = centerX - width / 2 + (cell.x - minX) * unit;
      const y = centerY - height / 2 + (cell.y - minY) * unit;
      this.drawCeramicCell(graphics, x + 0.7, y + 0.7, unit - 1.4, type, 0.96, false);
    }
  }

  private consumeEvents(events: readonly GameEvent[]): void {
    for (const event of events) {
      if (event.type === 'piece-moved') {
        if (this.presentation) {
          const settleMs = event.cause === 'soft-drop' ? 26 : event.cause === 'gravity' ? 82 : 56;
          this.presentation.settleMs = Math.min(this.presentation.settleMs, settleMs);
        }
      } else if (event.type === 'piece-rotated') {
        this.rotationPulse = this.options.reducedMotion ? 0 : 1;
      } else if (event.type === 'restarted') {
        this.presentation = null;
      } else if (event.type === 'piece-locked') {
        this.lockPulse = {
          cells: event.cells,
          elapsed: 0,
          duration: this.options.reducedMotion ? 1 : 105,
          piece: event.piece,
        };
      } else if (event.type === 'hard-dropped') {
        this.impact = this.options.reducedMotion ? 0.25 : 1;
        const lock = events.find((candidate) => candidate.type === 'piece-locked');
        if (lock?.type === 'piece-locked') {
          this.trail = {
            cells: lock.cells,
            distance: event.distance,
            elapsed: 0,
            duration: this.options.reducedMotion ? 1 : 125,
            piece: event.piece,
          };
        }
      } else if (event.type === 'lines-cleared') {
        this.impact = this.options.reducedMotion ? 0.3 : Math.min(1.4, 0.55 + event.count * 0.2);
      } else if (event.type === 'level-up') {
        this.impact = this.options.reducedMotion ? 0.3 : 1.35;
      }
    }
  }

  private advanceEffects(deltaMs: number): void {
    if (this.trail) {
      this.trail.elapsed += deltaMs;
      if (this.trail.elapsed >= this.trail.duration) this.trail = null;
    }
    if (this.lockPulse) {
      this.lockPulse.elapsed += deltaMs;
      if (this.lockPulse.elapsed >= this.lockPulse.duration) this.lockPulse = null;
    }
    this.impact = Math.max(0, this.impact - deltaMs / 260);
    this.rotationPulse = Math.max(0, this.rotationPulse - deltaMs / 110);
  }

  private advancePresentation(state: GameState, deltaMs: number): void {
    const active = state.active;
    if (!active) {
      this.presentation = null;
      return;
    }
    if (
      !this.presentation
      || this.presentation.type !== active.type
      || Math.abs(this.presentation.x - active.x) + Math.abs(this.presentation.y - active.y) > 4
      || this.options.reducedMotion
    ) {
      this.presentation = { type: active.type, x: active.x, y: active.y, settleMs: 56 };
      return;
    }
    const next = approachPresentationPoint(
      this.presentation,
      active,
      deltaMs,
      this.presentation.settleMs,
    );
    this.presentation.x = next.x;
    this.presentation.y = next.y;
    this.presentation.settleMs += (64 - this.presentation.settleMs) * Math.min(1, deltaMs / 90);
  }

  private updateSnapshot(state: GameState, layout: BoardLayout, app: Application): void {
    const activeCells = state.active ? cellsForPiece(state.active) : [];
    const distance = dropDistance(state);
    const ghostCells = state.active ? activeCells.map((cell) => ({ x: cell.x, y: cell.y + distance })) : [];
    this.snapshot = {
      canvas: { width: app.screen.width, height: app.screen.height, resolution: app.renderer.resolution },
      board: { x: layout.x, y: layout.y, width: layout.width, height: layout.height, cell: layout.cell },
      preview: this.previewBounds,
      previewLayerVisible: this.previewLayerVisible,
      previewPiece: this.previewPiece,
      previewClearBounds: this.previewClearBounds,
      previewClearPiece: this.previewClearPiece,
      scrim: this.scrimBounds,
      activeCells,
      ghostCells,
      visibleLockedCells: this.snapshot.visibleLockedCells,
      presentation: state.active && this.presentation
        ? {
            x: this.presentation.x,
            y: this.presentation.y,
            offsetX: this.presentation.x - state.active.x,
            offsetY: this.presentation.y - state.active.y,
          }
        : null,
    };
  }
}
