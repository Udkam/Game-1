// Screens and interaction. Plain DOM — no framework — kept small and explicit.

import type { Dir, Level } from '../engine/types.js';
import { Game } from './game.js';
import { BoardRenderer } from './render.js';
import {
  loadProgress,
  recordClear,
  isUnlocked,
  submitScore,
  type Progress,
} from './progress.js';

// tiny hyperscript helper
function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> & { class?: string } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  const { class: cls, ...rest } = props as Record<string, unknown> & { class?: string };
  if (cls) el.className = cls;
  Object.assign(el, rest);
  for (const c of children) el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return el;
}

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

export class App {
  private root: HTMLElement;
  private levels: Level[];
  private order: string[];
  private progress: Progress;
  private cleanup: (() => void) | null = null;

  constructor(root: HTMLElement, levels: Level[]) {
    this.root = root;
    this.levels = levels;
    this.order = levels.map((l) => l.id);
    this.progress = loadProgress();
  }

  start(): void {
    this.showMenu();
  }

  private swap(view: HTMLElement): void {
    this.cleanup?.();
    this.cleanup = null;
    this.root.replaceChildren(view);
  }

  // ---------------- menu ----------------

  private showMenu(): void {
    const grid = h('div', { class: 'level-grid' });
    this.levels.forEach((lvl, i) => {
      const unlocked = isUnlocked(this.order, lvl.id, this.progress);
      const done = !!this.progress.completed[lvl.id];
      const best = this.progress.best[lvl.id];
      const card = h(
        'div',
        { class: `level-card${unlocked ? '' : ' locked'}` },
        h('div', { class: 'idx' }, String(i + 1).padStart(2, '0')),
        h('div', { class: 'name wordmark' }, unlocked ? lvl.name : '· · ·'),
        h('div', { class: 'sub' }, unlocked ? lvl.subtitle : 'locked'),
        h('div', { class: 'best' }, best !== undefined ? `最佳 ${best} 步` : unlocked ? '未通关' : ''),
      );
      if (done) card.append(h('div', { class: 'seal', title: '已通关' }));
      if (unlocked) card.onclick = () => this.playLevel(lvl.id);
      grid.append(card);
    });

    const menu = h(
      'div',
      { class: 'menu' },
      h('h1', {}, '推移'),
      h('div', { class: 'tagline' }, 'Driftbox'),
      h(
        'p',
        { class: 'lede' },
        '把箱子推到它该去的地方。冰会让箱子滑走，深坑要用箱子填平，闸门要有重物顶住，颜色必须各归其位。',
      ),
      grid,
    );
    this.swap(menu);
  }

  // ---------------- game ----------------

  private playLevel(id: string): void {
    const level = this.levels.find((l) => l.id === id)!;
    const game = new Game(level);

    const title = h(
      'div',
      { class: 'title wordmark' },
      level.name,
      h('small', {}, level.subtitle),
    );
    const back = h('button', { class: 'ghost' }, '← 关卡');
    back.onclick = () => this.showMenu();
    const topbar = h('div', { class: 'topbar' }, title, back);

    const movesEl = h('b', {}, '0');
    const pushesEl = h('b', {}, '0');
    const bestVal = this.progress.best[id];
    const hud = h(
      'div',
      { class: 'hud' },
      h('span', { class: 'stat' }, '步数 ', movesEl),
      h('span', { class: 'stat' }, '推动 ', pushesEl),
      h('span', { class: 'spacer' }),
      h('span', { class: 'stat' }, `参考 ${level.par ?? '—'}`),
      h('span', { class: 'stat' }, bestVal !== undefined ? `最佳 ${bestVal}` : ''),
    );

    const boardWrap = h('div', { class: 'board-wrap' });
    const renderer = new BoardRenderer(boardWrap);
    renderer.mount(level);
    renderer.update(game.state);

    const undoBtn = h('button', {}, '撤销');
    const restartBtn = h('button', {}, '重开');
    const controls = h(
      'div',
      { class: 'controls' },
      undoBtn,
      restartBtn,
      h('span', { class: 'spacer' }),
      h('span', { class: 'hint-keys' }, '方向键 / WASD 移动 · Z 撤销 · R 重开'),
    );

    const dpad = h(
      'div',
      { class: 'dpad' },
      h('button', { class: 'up' }, '↑'),
      h('button', { class: 'left' }, '←'),
      h('button', { class: 'right' }, '→'),
      h('button', { class: 'down' }, '↓'),
    );
    const [upB, leftB, rightB, downB] = dpad.querySelectorAll('button');

    const screen = h('div', { class: 'game' }, topbar, hud);
    if (!this.progress.completed[id]) screen.append(this.introBanner(level));
    screen.append(boardWrap, controls, dpad);
    this.swap(screen);

    const refreshControls = () => {
      (undoBtn as HTMLButtonElement).disabled = !game.canUndo;
      movesEl.textContent = String(game.moves);
      pushesEl.textContent = String(game.pushes);
    };
    refreshControls();

    let locked = false; // brief input lock during win sequence
    const doMove = (dir: Dir) => {
      if (locked) return;
      const res = game.move(dir);
      if (!res) return;
      renderer.update(game.state, res.effect);
      refreshControls();
      if (game.solved) {
        locked = true;
        const slid = res.effect?.crate?.slid;
        window.setTimeout(() => this.win(level, game), slid ? 460 : 320);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key in KEY_DIR) {
        e.preventDefault();
        doMove(KEY_DIR[e.key]!);
      } else if (e.key === 'z' || e.key === 'Z') {
        if (game.undo()) {
          renderer.update(game.state);
          refreshControls();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        game.restart();
        renderer.update(game.state);
        refreshControls();
      } else if (e.key === 'Escape') {
        this.showMenu();
      }
    };
    window.addEventListener('keydown', onKey);

    undoBtn.onclick = () => {
      if (game.undo()) {
        renderer.update(game.state);
        refreshControls();
      }
    };
    restartBtn.onclick = () => {
      game.restart();
      renderer.update(game.state);
      refreshControls();
    };
    upB!.onclick = () => doMove('up');
    downB!.onclick = () => doMove('down');
    leftB!.onclick = () => doMove('left');
    rightB!.onclick = () => doMove('right');

    // swipe
    let sx = 0;
    let sy = 0;
    const onTouchStart = (e: TouchEvent) => {
      const t = e.changedTouches[0]!;
      sx = t.clientX;
      sy = t.clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]!;
      const dx = t.clientX - sx;
      const dy = t.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    };
    boardWrap.addEventListener('touchstart', onTouchStart, { passive: true });
    boardWrap.addEventListener('touchend', onTouchEnd, { passive: true });

    const onResize = () => renderer.sizeToViewport();
    window.addEventListener('resize', onResize);

    this.cleanup = () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
    };
  }

  private introBanner(level: Level): HTMLElement {
    const dismiss = h('button', { class: 'ghost' }, '知道了');
    const banner = h(
      'div',
      { class: 'intro' },
      h('span', {}, level.intro),
      dismiss,
    );
    dismiss.onclick = () => banner.remove();
    return banner;
  }

  // ---------------- win ----------------

  private win(level: Level, game: Game): void {
    const fresh = recordClear(this.progress, level.id, game.moves);
    void submitScore(level.id, game.moves, game.pushes, game.log);

    const par = level.par ?? Infinity;
    const beatPar = game.moves <= par;
    const idx = this.order.indexOf(level.id);
    const nextId = this.order[idx + 1];

    const badge =
      beatPar
        ? h('div', { class: 'badge' }, '达到参考最优 ✦')
        : h('div', { class: 'badge' }, `参考 ${level.par} 步`);

    const actions = h('div', { class: 'actions' });
    const menuBtn = h('button', {}, '关卡列表');
    menuBtn.onclick = () => {
      overlay.remove();
      this.showMenu();
    };
    actions.append(menuBtn);
    if (nextId) {
      const nextBtn = h('button', { class: 'primary' }, '下一关 →');
      nextBtn.onclick = () => {
        overlay.remove();
        this.playLevel(nextId);
      };
      actions.append(nextBtn);
    } else {
      const doneBtn = h('button', { class: 'primary' }, '完成全部 ✓');
      doneBtn.onclick = () => {
        overlay.remove();
        this.showMenu();
      };
      actions.append(doneBtn);
    }

    const card = h(
      'div',
      { class: 'card' },
      h('h2', { class: 'wordmark' }, nextId ? '过关' : '通关全部'),
      badge,
      h(
        'p',
        { class: 'result' },
        ...[
          h('span', {}, '用 '),
          h('b', {}, String(game.moves)),
          h('span', {}, ' 步、'),
          h('b', {}, String(game.pushes)),
          h('span', {}, ' 次推动完成。'),
          ...(fresh ? [h('br'), h('span', {}, '刷新了你的最佳记录。')] : []),
        ],
      ),
      actions,
    );
    const overlay = h('div', { class: 'overlay' }, card);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    this.root.append(overlay);
  }
}
