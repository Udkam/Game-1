// Screens and interaction. Plain DOM — no framework — kept small and explicit.

import type { Dir, Level, MoveToken } from '../engine/types.js';
import { CHAPTER_OF } from '../engine/levels.js';
import { Game, DiptychGame } from './game.js';
import { BoardRenderer } from './render.js';
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
  { icon: 'ic-crate', name: '能量核心', anchor: 'v7-001',
    rule: '把发光能量核心推入同频接口即可完成实验。无人机只能推，不能穿过核心。',
    use: '先判断核心最终落点，再决定从哪一侧进入推线。死角仍然是死角。' },
  { icon: 'ic-portal', name: '量子门', anchor: 'v7-006',
    rule: '量子门只传送无人机，不传送能量核心。门用于改变无人机的接近侧。',
    use: '当核心的可推侧被隔离时，先折跃到另一舱室，再从新方向施力。' },
  { icon: 'ic-sync', name: '同步体', anchor: 'v7-009',
    rule: '一次输入会同时驱动多个无人机舱室；所有舱室都达成目标才算通过。',
    use: '不要只看当前舱室。一次无效移动也可能是在给另一个舱室排位。' },
  { icon: 'ic-mirror', name: '镜像同步', anchor: 'v7-010',
    rule: '镜像同步体会左右反向响应同一次输入，上下保持一致。',
    use: '把输入看成协议而不是方向：右键可能同时代表右推和左推。' },
  { icon: 'ic-shadow', name: '时间残影', anchor: 'v7-012',
    rule: '残影会延迟复制无人机位置。它能压住量子压板，也会成为实体阻挡。',
    use: '先把残影留在需要维持的开关上，再趁门保持开启穿过。' },
  { icon: 'ic-gate', name: '量子压板', anchor: 'v7-012',
    rule: '压板被无人机、核心或残影压住时，会打开同组量子门闩。',
    use: '读清压板到门闩之间的距离；时间差本身就是谜题。' },
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
    view.classList.add('screen-view', 'enter');
    this.root.replaceChildren(view);
    const enter = () => view.classList.add('entered');
    if (window.requestAnimationFrame) window.requestAnimationFrame(enter);
    else window.setTimeout(enter, 0);
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
    const total = this.levels.length;
    const cleared = this.levels.filter((l) => this.progress.completed[l.id]).length;
    const pct = total ? Math.round((cleared / total) * 100) : 0;

    // The recommended level: the first reachable-but-uncleared level in order.
    const currentId =
      this.levels.find(
        (l) => (!LEVELS_LOCKED || isUnlocked(this.order, l.id, this.progress)) && !this.progress.completed[l.id],
      )?.id ?? this.levels[0]?.id ?? '';
    const current = this.levels.find((l) => l.id === currentId);

    const continueBtn = h('button', { class: 'primary command' }, '继续实验');
    continueBtn.onclick = () => this.openLevel(currentId);
    const mapBtn = h('button', { class: 'command' }, '章节星图');
    const codexBtn = h('button', { class: 'command' }, '机制档案');
    codexBtn.onclick = () => this.showCodex();
    const recordsBtn = h('button', { class: 'command' }, '挑战记录');
    recordsBtn.onclick = () => this.showRecords();
    const settingsBtn = h('button', { class: 'command' }, '设置');
    settingsBtn.onclick = () => this.showSettings();
    const progressRing = h('span', { class: 'progress-ring' }, `${pct}%`);
    progressRing.style.setProperty('--pct', String(pct));

    const menu = h(
      'div',
      { class: 'menu' },
      h(
        'section',
        { class: 'home-deck' },
        h('div', { class: 'scanline' }),
        h('div', { class: 'eyebrow' }, 'QUANTUM DRIFT PROTOCOL'),
        h('h1', {}, 'DRIFTBOX'),
        h('p', { class: 'lede' }, '在量子实验舱中调度能量核心、同步体与折跃链路。读懂规则，重写路径。'),
        h(
          'div',
          { class: 'progress-cluster' },
          progressRing,
          h('span', {}, `完成 ${cleared} / ${total}`),
          h('span', {}, current ? `推荐 ${current.name}` : '等待实验载入'),
        ),
        h('div', { class: 'command-row' }, continueBtn, mapBtn, codexBtn, recordsBtn, settingsBtn),
      ),
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

    const stats = chapterStats(this.order, CHAPTER_OF, this.progress);
    const chapters: string[] = [];
    for (const l of this.levels) {
      const c = CHAPTER_OF[l.id] ?? '';
      if (!chapters.includes(c)) chapters.push(c);
    }
    const chapterMap = h('section', { class: 'chapter-map', id: 'chapter-map' },
      h('div', { class: 'map-heading' },
        h('span', {}, 'CHAPTER STAR MAP'),
        h('b', {}, '章节星图')));
    mapBtn.onclick = () => chapterMap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    for (const ch of chapters) {
      const s = stats[ch];
      const head = h('div', { class: 'chapter-head' }, h('h2', { class: 'chapter' }, ch));
      if (s) {
        head.append(h('span', { class: 'ch-progress' }, `${s.cleared}/${s.total}`));
        if (s.perfect) head.append(h('span', { class: 'ch-badge perfect', title: '全章达到参考最优' }, '✦ 大师'));
        else if (s.complete) head.append(h('span', { class: 'ch-badge done', title: '本章全部通关' }, '✓ 通章'));
      }
      chapterMap.append(head);
      const grid = h('div', { class: 'level-grid' });
      this.levels.forEach((lvl, i) => {
        if ((CHAPTER_OF[lvl.id] ?? '') === ch) grid.append(this.levelCard(lvl, i, lvl.id === currentId));
      });
      chapterMap.append(grid);
    }
    menu.append(chapterMap);
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

  private showRecords(): void {
    const rows = this.levels
      .filter((l) => this.progress.completed[l.id])
      .slice(-8)
      .map((l) => h('div', { class: 'record-row' },
        h('span', {}, l.name),
        h('b', {}, `${this.progress.best[l.id] ?? '-'} 步`),
        h('small', {}, `${this.progress.bestPush[l.id] ?? '-'} 推`)));
    const card = h(
      'div',
      { class: 'card help' },
      h('h2', { class: 'wordmark' }, '挑战记录'),
      h('p', { class: 'result' }, '本地记录会在离线状态继续保存，通关后会尝试同步到后端排行榜。'),
      h('div', { class: 'records' }, ...(rows.length ? rows : [h('p', { class: 'result' }, '暂无通关记录。')])),
      h('div', { class: 'actions' }, (() => {
        const b = h('button', { class: 'primary' }, '返回');
        b.onclick = () => overlay.remove();
        return b;
      })()),
    );
    const overlay = h('div', { class: 'overlay' }, card);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
    this.root.append(overlay);
  }

  private showSettings(): void {
    const card = h(
      'div',
      { class: 'card help' },
      h('h2', { class: 'wordmark' }, '设置'),
      h('p', { class: 'result' }, 'v7 将加入高对比度、减少动态、输入偏好和进度管理。当前阶段先保留稳定操作路径。'),
      h('div', { class: 'settings-list' },
        h('label', {}, h('input', { type: 'checkbox', disabled: true }), ' 高对比度模式'),
        h('label', {}, h('input', { type: 'checkbox', disabled: true }), ' 减少动态效果'),
        h('label', {}, h('input', { type: 'checkbox', disabled: true }), ' 触控方向键')),
      h('div', { class: 'actions' }, (() => {
        const b = h('button', { class: 'primary' }, '返回');
        b.onclick = () => overlay.remove();
        return b;
      })()),
    );
    const overlay = h('div', { class: 'overlay' }, card);
    overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
    this.root.append(overlay);
  }

  // ---------------- game ----------------

  private playLevel(id: string, resumeLog?: MoveToken[]): void {
    const level = this.levels.find((l) => l.id === id);
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

    const boardWrap = h('div', { class: 'board-wrap' });
    const renderer = new BoardRenderer(boardWrap);
    renderer.mount(level);
    renderer.update(game.state);

    const toLogical = (d: Dir): Dir => d;

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
        doMove(toLogical(KEY_DIR[e.key]!), e.shiftKey);
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
    upB!.onclick = () => doMove(toLogical('up'));
    downB!.onclick = () => doMove(toLogical('down'));
    leftB!.onclick = () => doMove(toLogical('left'));
    rightB!.onclick = () => doMove(toLogical('right'));

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
      doMove(toLogical(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'));
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
