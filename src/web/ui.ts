// Screens and interaction. Plain DOM — no framework — kept small and explicit.

import type { Dir, Level, MoveToken } from '../engine/types.js';
import { CHAPTER_OF } from '../engine/levels.js';
import { Game, DiptychGame } from './game.js';
import { BoardRenderer } from './render.js';
import { IsoRenderer } from './iso.js';
import { makeDemoLevel } from './demo.js';
import {
  loadProgress,
  recordClear,
  setLastPlayed,
  isUnlocked,
  submitScore,
  chapterStats,
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

// Level gating is OFF for now (free practice of every level). Flip to true to
// restore sequential unlocking before a public launch — nothing else changes.
const LEVELS_LOCKED = false;

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

// Mechanic codex. Each entry unlocks once its anchor level (the level that first
// introduces the mechanic) becomes reachable — rule + typical use, never a
// per-level solution.
interface CodexEntry {
  icon: string;
  name: string;
  rule: string;
  use: string;
  anchor: string;
}
const CODEX: CodexEntry[] = [
  { icon: 'ic-crate', name: '推箱 / 目标点', anchor: 'l1',
    rule: '把每个箱子推到目标点（○）即过关。只能推、不能拉。',
    use: '箱子推进死角就再也拉不回——先想好落点，撤销（Z）随时反悔。' },
  { icon: 'ic-ice', name: '冰面', anchor: 'l5',
    rule: '箱子推上冰面会一直滑行，直到撞墙或滑出冰面；你穿防滑靴，不受影响。',
    use: '用墙或目标点当“刹车”，一次推动就锁定一整条轨迹。' },
  { icon: 'ic-pit', name: '深坑', anchor: 'l8',
    rule: '你无法踏入深坑（视作墙）；把箱子推进坑会将其填平，坑变成可通行地面。',
    use: '箱子是稀缺资源：哪些去填坑搭路、哪些去达标，是取舍。' },
  { icon: 'ic-portal', name: '折跃门', anchor: 'l17',
    rule: '踩上折跃门会瞬移到同色的另一扇；箱子无法进入折跃门。',
    use: '当你够不到箱子的可推一侧时，借门绕到另一边。' },
  { icon: 'ic-cracked', name: '脆地', anchor: 'l22',
    rule: '你一旦离开脆地，它就塌成深坑，只能走一次；箱子压着它不会塌。',
    use: '通往某处的脆地是一次性的——确认顺序再迈步。' },
  { icon: 'ic-pull', name: '拉 / 抓', anchor: 'pull1',
    rule: '按住 Shift + 方向会拉动你正后方的箱子，随你一起后退一格——推翻了「只能推」。',
    use: '把贴着墙、卡在角落里只能拉不能推的箱子拽出来。' },
  { icon: 'ic-gravity', name: '倾斜 / 重力', anchor: 'grav1',
    rule: '倾斜关没有行走：每按一个方向，整个盘面朝那边倾倒，所有箱子与你一起滑到底、撞墙才停。',
    use: '你也会滑动——把自己滑到合适位置当“挡块”，让箱子停在该停的地方。' },
  { icon: 'ic-mirror', name: '镜面格', anchor: 'mir1',
    rule: '站在镜面格（◄►）上时，你的左右被反转：按「左」实际向右、按「右」实际向左；上下不变。',
    use: '穿越镜面区时反着想——要往左走就按右。推箱方向也跟着反。' },
];

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

  private levelCard(lvl: Level, i: number, current: boolean): HTMLElement {
    const unlocked = !LEVELS_LOCKED || isUnlocked(this.order, lvl.id, this.progress);
    const done = !!this.progress.completed[lvl.id];
    const best = this.progress.best[lvl.id];
    const push = this.progress.bestPush[lvl.id];
    const bestText =
      best !== undefined
        ? `最佳 ${best} 步${push !== undefined ? ` · ${push} 推` : ''}`
        : unlocked
          ? current
            ? '从这里继续'
            : '未通关'
          : '';
    const isLast = this.progress.lastPlayed?.id === lvl.id;
    const cls = `level-card${unlocked ? '' : ' locked'}${current ? ' current' : ''}${isLast ? ' last' : ''}`;
    const card = h(
      'div',
      { class: cls },
      h('div', { class: 'idx' }, String(i + 1).padStart(2, '0')),
      h('div', { class: 'name wordmark' }, unlocked ? lvl.name : '· · ·'),
      h('div', { class: 'sub' }, unlocked ? lvl.subtitle : 'locked'),
      h('div', { class: 'best' }, bestText),
    );
    if (done) {
      const medals = h('div', { class: 'medals' });
      if (this.progress.parHit[lvl.id]) medals.append(h('span', { class: 'medal par', title: '达到参考最优' }, '✦'));
      if (this.progress.clean[lvl.id]) medals.append(h('span', { class: 'medal clean', title: '零撤销通关' }, '⟳'));
      if (medals.childElementCount) card.append(medals);
      card.append(h('div', { class: 'seal', title: '已通关' }));
    }
    if (unlocked) card.onclick = () => this.openLevel(lvl.id);
    return card;
  }

  /** True if there is an unfinished saved board for this level to resume. */
  private resumable(id: string): boolean {
    const lp = this.progress.lastPlayed;
    return !!lp && lp.id === id && !lp.won && lp.log.length > 0;
  }

  /** Open a level, offering "continue / restart" if a board is mid-progress. */
  private openLevel(id: string): void {
    if (!this.resumable(id)) {
      this.playLevel(id);
      return;
    }
    const lp = this.progress.lastPlayed!;
    const actions = h('div', { class: 'actions' });
    const resume = h('button', { class: 'primary' }, `继续当前局面（${lp.log.length} 步）`);
    const fresh = h('button', {}, '从头开始');
    actions.append(resume, fresh);
    const card = h(
      'div',
      { class: 'card' },
      h('h2', { class: 'wordmark' }, '继续上次？'),
      h('p', { class: 'result' }, `你上次在这一关走了 ${lp.log.length} 步还没解开。`),
      actions,
    );
    const overlay = h('div', { class: 'overlay' }, card);
    resume.onclick = () => { overlay.remove(); this.playLevel(id, lp.log.slice()); };
    fresh.onclick = () => { overlay.remove(); this.playLevel(id); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    this.root.append(overlay);
  }

  private showMenu(): void {
    const codex = h('button', { class: 'ghost help-link' }, '玩法 / 图鉴');
    codex.onclick = () => this.showCodex();

    const total = this.levels.length;
    const cleared = this.levels.filter((l) => this.progress.completed[l.id]).length;

    const menu = h(
      'div',
      { class: 'menu' },
      h('h1', {}, '推移'),
      h('div', { class: 'tagline' }, 'Driftbox'),
      h('p', { class: 'lede' }, '层层叠加的机制，渐次加难的关卡。多数关卡没有提示——自己读懂这张棋盘。'),
      h('p', { class: 'overall' }, `已通关 ${cleared} / ${total}`),
      h('div', { class: 'menu-actions' }, codex),
    );

    // "继续上次" — the level the player most recently opened/left.
    const lp = this.progress.lastPlayed;
    const lpLevel = lp ? this.levels.find((l) => l.id === lp.id) : undefined;
    if (lp && lpLevel) {
      const ch = CHAPTER_OF[lp.id] ?? '';
      const status = lp.won ? '已通关 · 可重玩' : lp.log.length ? `进行中 · ${lp.log.length} 步` : '未通关';
      const cont = h('button', { class: 'continue-card' },
        h('span', { class: 'cont-label' }, '继续上次'),
        h('span', { class: 'cont-name wordmark' }, `${ch} · ${lpLevel.name}`),
        h('span', { class: 'cont-status' }, status));
      cont.onclick = () => this.openLevel(lp.id);
      menu.append(cont);
    }

    // The recommended level: the first reachable-but-uncleared level in order.
    const currentId =
      this.levels.find(
        (l) => (!LEVELS_LOCKED || isUnlocked(this.order, l.id, this.progress)) && !this.progress.completed[l.id],
      )?.id ?? '';

    const stats = chapterStats(this.order, CHAPTER_OF, this.progress);
    const chapters: string[] = [];
    for (const l of this.levels) {
      const c = CHAPTER_OF[l.id] ?? '';
      if (!chapters.includes(c)) chapters.push(c);
    }
    let dividerShown = false;
    for (const ch of chapters) {
      const s = stats[ch];
      const is3d = ch.startsWith('立体');
      // a one-time divider before the first 3D chapter separates them from Classic
      if (is3d && !dividerShown) {
        menu.append(h('div', { class: 'chapter-divider' }, '— 立体章节 · 2.5D —'));
        dividerShown = true;
      }
      const head = h('div', { class: `chapter-head${is3d ? ' is3d' : ''}` }, h('h2', { class: 'chapter' }, ch));
      if (is3d) head.append(h('span', { class: 'ch-3d-badge' }, '▲ 3D'));
      if (s) {
        head.append(h('span', { class: 'ch-progress' }, `${s.cleared}/${s.total}`));
        if (s.perfect) head.append(h('span', { class: 'ch-badge perfect', title: '全章达到参考最优' }, '✦ 大师'));
        else if (s.complete) head.append(h('span', { class: 'ch-badge done', title: '本章全部通关' }, '✓ 通章'));
      }
      menu.append(head);
      const grid = h('div', { class: 'level-grid' });
      this.levels.forEach((lvl, i) => {
        if ((CHAPTER_OF[lvl.id] ?? '') === ch) grid.append(this.levelCard(lvl, i, lvl.id === currentId));
      });
      menu.append(grid);
    }
    const dev = h('button', { class: 'ghost dev-link' }, '▦ 立体演示 (dev)');
    dev.onclick = () => this.playLevel('demo');
    menu.append(dev);
    this.swap(menu);
  }

  private showCodex(): void {
    const list = h('div', { class: 'codex' });
    for (const e of CODEX) {
      const entry = h(
        'div',
        { class: 'codex-row' },
        h('span', { class: `legend-ic ${e.icon}` }),
        h('div', { class: 'codex-body' },
          h('b', {}, e.name),
          h('span', { class: 'codex-rule' }, e.rule),
          h('span', { class: 'codex-use' }, e.use)),
      );
      list.append(entry);
    }
    const card = h(
      'div',
      { class: 'card help' },
      h('h2', { class: 'wordmark' }, '玩法 / 图鉴'),
      h('p', { class: 'result' }, '方向键 / WASD 移动，只能推不能拉（除非按住 Shift 拉箱）。Z 撤销 · R 重开 · Esc 返回。下面是每种机制的规则与典型用法。'),
      list,
      h('div', { class: 'actions' }, (() => {
        const b = h('button', { class: 'primary' }, '返回');
        b.onclick = () => overlay.remove();
        return b;
      })()),
    );
    const overlay = h('div', { class: 'overlay' }, card);
    overlay.addEventListener('click', (ev) => {
      if (ev.target === overlay) overlay.remove();
    });
    this.root.append(overlay);
  }

  // ---------------- game ----------------

  private playLevel(id: string, resumeLog?: MoveToken[]): void {
    const level = this.levels.find((l) => l.id === id) ?? (id === 'demo' ? makeDemoLevel() : undefined);
    if (!level) return;
    if (level.twin) {
      this.playDiptych(level, resumeLog);
      return;
    }
    const game = new Game(level);
    if (resumeLog && resumeLog.length) game.loadTokens(resumeLog);
    const saveVisit = () => {
      if (id !== 'demo') setLastPlayed(this.progress, { id, at: Date.now(), log: [...game.log], won: game.solved });
    };
    saveVisit();

    const title = h(
      'div',
      { class: 'title wordmark' },
      level.name,
      h('small', {}, level.subtitle),
    );
    const back = h('button', { class: 'ghost' }, '← 关卡');
    back.onclick = () => { saveVisit(); this.showMenu(); };
    const helpBtn = h('button', { class: 'ghost', title: '机制图鉴' }, '?');
    helpBtn.onclick = () => this.showCodex();
    const topbar = h('div', { class: 'topbar' }, title, h('div', { class: 'top-actions' }, helpBtn, back));

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

    const boardWrap = h('div', { class: `board-wrap${level.is3D ? ' iso' : ''}` });
    const renderer: BoardRenderer | IsoRenderer = level.is3D
      ? new IsoRenderer(boardWrap)
      : new BoardRenderer(boardWrap);
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
      h('span', { class: 'hint-keys' }, 'WASD/方向键 移动 · Shift+方向 拉箱 · Z 撤销 · R 重开'),
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
    // Only first-appearance mechanic levels carry an `intro`. Show that one terse
    // rule line until the level is cleared — never an empty banner.
    if (level.intro && !this.progress.completed[id]) screen.append(this.introBanner(level));
    screen.append(boardWrap, controls, dpad);
    this.swap(screen);

    const refreshControls = () => {
      (undoBtn as HTMLButtonElement).disabled = !game.canUndo;
      movesEl.textContent = String(game.moves);
      pushesEl.textContent = String(game.pushes);
    };
    refreshControls();

    let locked = false; // hard lock during win sequence only
    const doMove = (dir: Dir, pull = false) => {
      // No input throttling: the engine is pure/synchronous and renderer.update
      // always reconciles the DOM to the latest state, so rapid or repeated keys
      // can never corrupt state — they just retarget the CSS transition. We only
      // freeze input during the brief win hand-off below.
      if (locked) return;
      const res = game.move(dir, pull);
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
        doMove(KEY_DIR[e.key]!, e.shiftKey);
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
        saveVisit();
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

  // Diptych: two boards, one input drives both, win only when both are solved.
  private playDiptych(level: Level, resumeLog?: MoveToken[]): void {
    const id = level.id;
    const game = new DiptychGame(level);
    if (resumeLog && resumeLog.length) game.loadTokens(resumeLog);
    const saveVisit = () => setLastPlayed(this.progress, { id, at: Date.now(), log: [...game.log], won: game.solved });
    saveVisit();

    const title = h('div', { class: 'title wordmark' }, level.name, h('small', {}, level.subtitle));
    const back = h('button', { class: 'ghost' }, '← 关卡');
    back.onclick = () => { saveVisit(); this.showMenu(); };
    const helpBtn = h('button', { class: 'ghost', title: '机制图鉴' }, '?');
    helpBtn.onclick = () => this.showCodex();
    const topbar = h('div', { class: 'topbar' }, title, h('div', { class: 'top-actions' }, helpBtn, back));

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

    const wrapA = h('div', { class: 'board-wrap' });
    const wrapB = h('div', { class: 'board-wrap' });
    const rendererA = new BoardRenderer(wrapA);
    const rendererB = new BoardRenderer(wrapB);
    rendererA.mount(level);
    rendererB.mount(level.twin!);
    rendererA.update(game.a);
    rendererB.update(game.b);
    const pair = h('div', { class: 'diptych' }, wrapA, wrapB);

    const undoBtn = h('button', {}, '撤销');
    const restartBtn = h('button', {}, '重开');
    const hint = level.mirrorTwin
      ? '两块棋盘一起动 · 右盘左右相反 · Shift+方向 拉箱 · Z 撤销 · R 重开'
      : '一次输入，两块棋盘一起动 · 两边都要解开 · Z 撤销 · R 重开';
    const controls = h('div', { class: 'controls' }, undoBtn, restartBtn,
      h('span', { class: 'spacer' }), h('span', { class: 'hint-keys' }, hint));

    const dpad = h('div', { class: 'dpad' },
      h('button', { class: 'up' }, '↑'), h('button', { class: 'left' }, '←'),
      h('button', { class: 'right' }, '→'), h('button', { class: 'down' }, '↓'));
    const [upB, leftB, rightB, downB] = dpad.querySelectorAll('button');

    const screen = h('div', { class: 'game' }, topbar, hud);
    if (level.intro && !this.progress.completed[id]) screen.append(this.introBanner(level));
    screen.append(pair, controls, dpad);
    this.swap(screen);

    const refreshControls = () => {
      (undoBtn as HTMLButtonElement).disabled = !game.canUndo;
      movesEl.textContent = String(game.moves);
      pushesEl.textContent = String(game.pushes);
    };
    refreshControls();

    let locked = false;
    const doMove = (dir: Dir, pull = false) => {
      if (locked) return;
      const res = game.move(dir, pull);
      if (!res) return;
      rendererA.update(game.a, res.a.effect);
      rendererB.update(game.b, res.b.effect);
      refreshControls();
      if (game.solved) {
        locked = true;
        window.setTimeout(() => this.win(level, game), 360);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key in KEY_DIR) {
        e.preventDefault();
        doMove(KEY_DIR[e.key]!, e.shiftKey);
      } else if (e.key === 'z' || e.key === 'Z') {
        if (game.undo()) { rendererA.update(game.a); rendererB.update(game.b); refreshControls(); }
      } else if (e.key === 'r' || e.key === 'R') {
        game.restart(); rendererA.update(game.a); rendererB.update(game.b); refreshControls();
      } else if (e.key === 'Escape') {
        saveVisit();
        this.showMenu();
      }
    };
    window.addEventListener('keydown', onKey);

    undoBtn.onclick = () => { if (game.undo()) { rendererA.update(game.a); rendererB.update(game.b); refreshControls(); } };
    restartBtn.onclick = () => { game.restart(); rendererA.update(game.a); rendererB.update(game.b); refreshControls(); };
    upB!.onclick = () => doMove('up');
    downB!.onclick = () => doMove('down');
    leftB!.onclick = () => doMove('left');
    rightB!.onclick = () => doMove('right');

    let sx = 0, sy = 0;
    const onTouchStart = (e: TouchEvent) => { const t = e.changedTouches[0]!; sx = t.clientX; sy = t.clientY; };
    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]!;
      const dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    };
    pair.addEventListener('touchstart', onTouchStart, { passive: true });
    pair.addEventListener('touchend', onTouchEnd, { passive: true });

    const sizeBoth = () => {
      const half = Math.min(window.innerWidth * 0.94, 720) / 2;
      rendererA.sizeToViewport(half);
      rendererB.sizeToViewport(half);
    };
    sizeBoth();
    const onResize = () => sizeBoth();
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

  private win(level: Level, game: Game | DiptychGame): void {
    setLastPlayed(this.progress, { id: level.id, at: Date.now(), log: [...game.log], won: true });
    const par = level.par ?? Infinity;
    const outcome = recordClear(this.progress, level.id, {
      moves: game.moves,
      pushes: game.pushes,
      par,
      usedUndo: game.usedUndo,
    });
    void submitScore(level.id, game.moves, game.pushes, game.log);

    const idx = this.order.indexOf(level.id);
    const nextId = idx >= 0 ? this.order[idx + 1] : undefined;

    const badge =
      outcome.parHit
        ? h('div', { class: 'badge' }, '达到参考最优 ✦')
        : h('div', { class: 'badge' }, `参考 ${level.par} 步`);

    // Challenge medals: par (≤ par moves) and clean (no undo). Newly earned ones
    // get a highlight; these never gate progress — just replay value.
    const medals = h('div', { class: 'win-medals' });
    medals.append(
      h('span', { class: `chip${outcome.parHit ? ' on' : ''}${outcome.firstParHit ? ' fresh' : ''}` },
        `达标 ✦ ${outcome.parHit ? '已达成' : '未达成'}`),
      h('span', { class: `chip${outcome.clean ? ' on' : ''}${outcome.firstClean ? ' fresh' : ''}` },
        `零撤销 ⟳ ${outcome.clean ? '已达成' : '本局有撤销'}`),
    );

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
          ...(outcome.fresh ? [h('br'), h('span', {}, '刷新了你的最佳记录。')] : []),
          ...(outcome.newPush && !outcome.fresh ? [h('br'), h('span', {}, '刷新了最少推动数。')] : []),
        ],
      ),
      medals,
      actions,
    );
    const overlay = h('div', { class: 'overlay' }, card);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    this.root.append(overlay);
  }
}
