import { Application, Container, FillGradient, Graphics, type Ticker } from 'pixi.js';
import {
  BOARD_WIDTH,
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
import { CELL_STYLE, COLORS, PIECE_MATERIALS } from './theme';
import {
  approachPresentationPoint,
  exposedCellEdges,
  lineClearPresentationProgress,
  nextPreviewPiece,
  orthogonalCellComponents,
  type CellEdge,
} from './presentation';

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

interface GroupDrawOptions {
  originX: number;
  originY: number;
  unit: number;
  offsetX?: number;
  offsetY?: number;
  scale?: number;
  active?: boolean;
  ghost?: boolean;
  faceColor?: number;
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
  private readonly cellGradients = new Map<PieceType, FillGradient>();

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
    for (const gradient of this.cellGradients.values()) gradient.destroy();
    this.cellGradients.clear();
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
    const radius = Math.max(8, Math.min(12, layout.cell * 0.38));
    graphics
      .roundRect(layout.x, layout.y, layout.width, layout.height, radius)
      .fill({ color: COLORS.well, alpha: 1 })
      .stroke({ color: COLORS.edge, alpha: .86, width: Math.max(1, layout.cell * 0.035) });
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
    const lockedByType = new Map<PieceType, Cell[]>();

    state.board.forEach((row, boardY) => {
      if (boardY < VISIBLE_START_ROW) return;
      row.forEach((cell, x) => {
        if (!cell) return;
        visibleLockedCells += 1;
        const cells = lockedByType.get(cell) ?? [];
        cells.push({ x, y: boardY - VISIBLE_START_ROW });
        lockedByType.set(cell, cells);
      });
    });
    for (const [type, cells] of lockedByType) {
      this.drawCellGroups(graphics, cells, type, 1, {
        originX: layout.x,
        originY: layout.y,
        unit: layout.cell,
      });
    }

    if (this.trail && !this.options.reducedMotion) {
      const progress = Math.min(1, this.trail.elapsed / this.trail.duration);
      const echoCount = Math.min(6, Math.max(1, this.trail.distance));
      for (let echo = 1; echo <= echoCount; echo += 1) {
        const alpha = (1 - progress) * (0.16 / echo);
        const cells = this.trail.cells
          .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW }))
          .filter((cell) => cell.y >= 0);
        this.drawCellGroups(graphics, cells, this.trail.piece, alpha, {
          originX: layout.x,
          originY: layout.y,
          unit: layout.cell,
          offsetY: -echo * Math.max(1, Math.floor(this.trail.distance / echoCount)) * layout.cell,
        });
      }
    }

    const activeCells = state.status === 'ready' || !state.active ? [] : cellsForPiece(state.active);
    const ghostCells = state.active
      ? activeCells.map((cell) => ({ x: cell.x, y: cell.y + dropDistance(state) }))
      : [];
    if (state.status === 'ready' && state.active) {
      ghostCells.splice(0, ghostCells.length, ...cellsForPiece(state.active).map((cell) => ({ x: cell.x, y: cell.y + dropDistance(state) })));
    }

    const visibleGhostCells = ghostCells
      .filter((cell) => cell.y >= VISIBLE_START_ROW)
      .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW }));
    const ghostOffsetX = this.presentation && state.active
      ? (this.presentation.x - state.active.x) * layout.cell
      : 0;
    if (state.active) {
      this.drawCellGroups(graphics, visibleGhostCells, state.active.type, 0.82, {
        originX: layout.x,
        originY: layout.y,
        unit: layout.cell,
        offsetX: ghostOffsetX,
        ghost: true,
      });
    }

    const offsetX = this.presentation && state.active && !this.options.reducedMotion
      ? (this.presentation.x - state.active.x) * layout.cell
      : 0;
    const offsetY = this.presentation && state.active && !this.options.reducedMotion
      ? (this.presentation.y - state.active.y) * layout.cell
      : 0;
    const rotationScale = this.options.reducedMotion ? 1 : 1 + this.rotationPulse * 0.035;
    if (state.active) {
      this.drawCellGroups(
        graphics,
        activeCells
          .filter((cell) => cell.y >= VISIBLE_START_ROW)
          .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW })),
        state.active.type,
        1,
        {
          originX: layout.x,
          originY: layout.y,
          unit: layout.cell,
          offsetX,
          offsetY,
          active: true,
          scale: rotationScale,
        },
      );
    }

    this.snapshot.visibleLockedCells = visibleLockedCells;
    this.pieceGraphics.alpha = this.options.modeSwitch ? 0.34 : 1;
    this.effectGraphics.alpha = this.options.modeSwitch ? 0.2 : 1;
  }

  private drawCellGroups(
    graphics: Graphics,
    cells: readonly Cell[],
    type: PieceType,
    alpha: number,
    options: GroupDrawOptions,
  ): void {
    for (const component of orthogonalCellComponents(cells)) {
      this.drawCellComponent(graphics, component, type, alpha, options);
    }
  }

  private gradientFor(type: PieceType): FillGradient {
    const existing = this.cellGradients.get(type);
    if (existing) return existing;
    const material = PIECE_MATERIALS[type];
    const gradient = new FillGradient({
      type: 'linear',
      start: { x: 0, y: 0 },
      end: { x: 1, y: 1 },
      textureSpace: 'local',
      colorStops: [
        { offset: 0, color: material.fillStart },
        { offset: 1, color: material.fillEnd },
      ],
    });
    this.cellGradients.set(type, gradient);
    return gradient;
  }

  private drawCellComponent(
    graphics: Graphics,
    cells: readonly Cell[],
    type: PieceType,
    alpha: number,
    options: GroupDrawOptions,
  ): void {
    if (!cells.length) return;
    const scale = options.scale ?? 1;
    const offsetX = options.offsetX ?? 0;
    const offsetY = options.offsetY ?? 0;
    const minX = Math.min(...cells.map((cell) => cell.x));
    const maxX = Math.max(...cells.map((cell) => cell.x));
    const minY = Math.min(...cells.map((cell) => cell.y));
    const maxY = Math.max(...cells.map((cell) => cell.y));
    const centerX = options.originX + ((minX + maxX + 1) * options.unit) / 2;
    const centerY = options.originY + ((minY + maxY + 1) * options.unit) / 2;
    const scaledUnit = options.unit * scale;
    const baseGap = Math.max(0.7, Math.min(CELL_STYLE.gapMin, options.unit * CELL_STYLE.gapRatio));
    const ghostInset = options.ghost
      ? Math.max(CELL_STYLE.ghostInsetMin, options.unit * CELL_STYLE.ghostInsetRatio)
      : 0;
    const gap = (baseGap + ghostInset) * scale;
    const size = scaledUnit - gap * 2;
    const material = PIECE_MATERIALS[type];
    const radius = Math.max(CELL_STYLE.radiusMin, Math.min(CELL_STYLE.radiusMax, size * CELL_STYLE.radiusRatio));
    const borderWidth = Math.max(
      CELL_STYLE.edgeWidthMin,
      Math.min(CELL_STYLE.edgeWidthMax, size * CELL_STYLE.edgeWidthRatio),
    );
    const occupied = new Set(cells.map((cell) => `${cell.x},${cell.y}`));
    const geometry = exposedCellEdges(cells).map(({ cell, exposed }) => {
      const baseX = options.originX + cell.x * options.unit;
      const baseY = options.originY + cell.y * options.unit;
      return {
        cell,
        exposed,
        x: centerX + (baseX - centerX) * scale + offsetX + gap,
        y: centerY + (baseY - centerY) * scale + offsetY + gap,
      };
    });

    if (!options.ghost) {
      for (const entry of geometry) graphics.roundRect(entry.x, entry.y, size, size, radius);
      for (const entry of geometry) {
        if (!entry.exposed.right) graphics.rect(entry.x + size, entry.y, gap * 2, size);
        if (!entry.exposed.bottom) graphics.rect(entry.x, entry.y + size, size, gap * 2);
        if (
          !entry.exposed.right
          && !entry.exposed.bottom
          && occupied.has(`${entry.cell.x + 1},${entry.cell.y + 1}`)
        ) {
          graphics.rect(entry.x + size, entry.y + size, gap * 2, gap * 2);
        }
      }
      if (options.faceColor === undefined) graphics.fill({ fill: this.gradientFor(type), alpha });
      else graphics.fill({ color: options.faceColor, alpha });
      if (options.faceColor !== undefined) return;
    }

    const segments = new Map<CellEdge, Array<[number, number, number, number]>>([
      ['top', []], ['right', []], ['bottom', []], ['left', []],
    ]);
    for (const entry of geometry) {
      const left = entry.x;
      const top = entry.y;
      const right = entry.x + size;
      const bottom = entry.y + size;
      const corner = options.ghost ? 0 : radius * 0.55;
      if (entry.exposed.top) segments.get('top')!.push([
        left + (entry.exposed.left ? corner : -gap), top,
        right + (entry.exposed.right ? -corner : gap), top,
      ]);
      if (entry.exposed.right) segments.get('right')!.push([
        right, top + (entry.exposed.top ? corner : -gap),
        right, bottom + (entry.exposed.bottom ? -corner : gap),
      ]);
      if (entry.exposed.bottom) segments.get('bottom')!.push([
        right + (entry.exposed.right ? -corner : gap), bottom,
        left + (entry.exposed.left ? corner : -gap), bottom,
      ]);
      if (entry.exposed.left) segments.get('left')!.push([
        left, bottom + (entry.exposed.bottom ? -corner : gap),
        left, top + (entry.exposed.top ? corner : -gap),
      ]);
    }

    if (options.ghost) {
      this.strokeSegments(graphics, [...segments.values()].flat(), material.innerEdge,
        Math.min(CELL_STYLE.ghostStrokeAlpha, alpha), CELL_STYLE.ghostStrokeWidth);
    } else if (options.active) {
      this.strokeSegments(graphics, [...segments.values()].flat(), material.innerEdge, Math.min(1, alpha), borderWidth);
    } else {
      this.strokeSegments(graphics, [...segments.get('top')!, ...segments.get('left')!], material.innerEdge,
        Math.min(CELL_STYLE.reliefSignalAlpha, alpha), borderWidth);
      this.strokeSegments(graphics, [...segments.get('bottom')!, ...segments.get('right')!], material.edge,
        Math.min(CELL_STYLE.reliefDarkAlpha, alpha), borderWidth);
    }
  }

  private strokeSegments(
    graphics: Graphics,
    segments: ReadonlyArray<readonly [number, number, number, number]>,
    color: number,
    alpha: number,
    width: number,
  ): void {
    if (!segments.length || alpha <= 0) return;
    for (const [startX, startY, endX, endY] of segments) {
      graphics.moveTo(startX, startY).lineTo(endX, endY);
    }
    graphics.stroke({ color, alpha, width });
  }

  private drawEffects(state: GameState, layout: BoardLayout): void {
    const graphics = this.effectGraphics;
    graphics.clear();
    if (state.phase === 'line-clear' && !this.options.reducedMotion) {
      const progress = lineClearPresentationProgress(state.phaseTicks, false);
      const width = layout.width * Math.sin(progress * Math.PI);
      for (const row of state.pendingClearRows) {
        if (row < VISIBLE_START_ROW) continue;
        const y = layout.y + (row - VISIBLE_START_ROW) * layout.cell;
        graphics
          .rect(layout.x + (layout.width - width) / 2, y + layout.cell * 0.12, width, layout.cell * 0.76)
          .fill({ color: COLORS.classic, alpha: 0.18 + progress * 0.4 });
      }
    }

    if (this.lockPulse && !this.options.reducedMotion) {
      const progress = Math.min(1, this.lockPulse.elapsed / this.lockPulse.duration);
      const material = PIECE_MATERIALS[this.lockPulse.piece];
      const alpha = (1 - easeOutCubic(progress)) * CELL_STYLE.lockFillAlpha;
      this.drawCellGroups(
        graphics,
        this.lockPulse.cells
          .filter((cell) => cell.y >= VISIBLE_START_ROW)
          .map((cell) => ({ x: cell.x, y: cell.y - VISIBLE_START_ROW })),
        this.lockPulse.piece,
        alpha,
        {
          originX: layout.x,
          originY: layout.y,
          unit: layout.cell,
          faceColor: material.innerEdge,
        },
      );
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
    this.drawCellGroups(graphics, shape, type, 0.96, {
      originX: centerX - width / 2 - minX * unit,
      originY: centerY - height / 2 - minY * unit,
      unit,
    });
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
          duration: this.options.reducedMotion ? 1 : CELL_STYLE.lockFillDurationMs,
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
