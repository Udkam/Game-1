// Screens and interaction. Plain DOM — no framework — kept small and explicit.

import type { Dir, Level } from '../engine/types.js';
import { CHAPTER_OF } from '../engine/levels.js';
import { Game } from './game.js';
import { BoardRenderer } from './render.js';
import { sfx, soundEnabled, setSound } from './sfx.js';
import {
  loadProgress,
  recordClear,
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
  { icon: 'ic-plate', name: '压力板 / 闸门', anchor: 'l11',
    rule: '闸门默认关闭挡路；同组压力板被重物（你或箱子）压住时开启，松开即关。',
    use: '停一个箱子在板上长期顶门，再用别的箱子穿门。' },
  { icon: 'ic-color', name: '颜色匹配', anchor: 'l14',
    rule: '彩色箱子必须推到同色目标点；中性目标点接受任意箱子。',
    use: '狭窄通道里谁去哪个目标点不能乱来——这是指派问题。' },
  { icon: 'ic-portal', name: '折跃门', anchor: 'l17',
    rule: '踩上折跃门会瞬移到同色的另一扇；箱子无法进入折跃门。',
    use: '当你够不到箱子的可推一侧时，借门绕到另一边。' },
  { icon: 'ic-arrow', name: '单向格', anchor: 'l21',
    rule: '单向格只能顺着箭头方向进入，逆向进不去；你和箱子都受限。',
    use: '箭头制造不可逆的单向选择，走错就回不来。' },
  { icon: 'ic-cracked', name: '脆地', anchor: 'l22',
    rule: '你一旦离开脆地，它就塌成深坑，只能走一次；箱子压着它不会塌。',
    use: '通往某处的脆地是一次性的——确认顺序再迈步。' },
  { icon: 'ic-key', name: '钥匙 / 锁', anchor: 'l23',
    rule: '走到钥匙上即可拾取，同色的锁随之打开（变成可通行）。',
    use: '先取钥匙再开锁，规划取钥与推箱的先后。' },
  { icon: 'ic-pull', name: '拉 / 抓', anchor: 'pull1',
    rule: '按住 Shift + 方向（或先点「抓」）会拉动你正后方的箱子，随你一起后退一格——推翻了「只能推」。',
    use: '把贴着墙、卡在角落里只能拉不能推的箱子拽出来。' },
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
    const cls = `level-card${unlocked ? '' : ' locked'}${current ? ' current' : ''}`;
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
    if (unlocked) card.onclick = () => this.playLevel(lvl.id);
    return card;
  }

  private showMenu(): void {
    const help = h('button', { class: 'ghost help-link' }, '玩法 / 图例');
    help.onclick = () => this.showHelp();
    const codex = h('button', { class: 'ghost help-link' }, '机制图鉴');
    codex.onclick = () => this.showCodex();

    const total = this.levels.length;
    const cleared = this.levels.filter((l) => this.progress.completed[l.id]).length;

    const menu = h(
      'div',
      { class: 'menu' },
      h('h1', {}, '推移'),
      h('div', { class: 'tagline' }, 'Driftbox'),
      h('p', { class: 'lede' }, '六十关，九类机制层层叠加，十一章渐次加难。多数关卡没有提示——自己读懂这张棋盘。'),
      h('p', { class: 'overall' }, `已通关 ${cleared} / ${total}`),
      h('div', { class: 'menu-actions' }, help, codex),
    );

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
    for (const ch of chapters) {
      const s = stats[ch];
      const head = h('div', { class: 'chapter-head' }, h('h2', { class: 'chapter' }, ch));
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
    this.swap(menu);
  }

  private showHelp(): void {
    const sw = (cls: string) => h('span', { class: `legend-ic ${cls}` });
    const row = (icon: HTMLElement, title: string, desc: string) =>
      h('div', { class: 'legend-row' }, icon, h('div', {}, h('b', {}, title), h('span', {}, desc)));

    const card = h(
      'div',
      { class: 'card help' },
      h('h2', { class: 'wordmark' }, '玩法 / 图例'),
      h('div', { class: 'legend' },
        row(sw('ic-player'), '你', '方向键 / WASD 移动。只能推、不能拉。'),
        row(sw('ic-crate'), '箱子 → 目标点', '把每个箱子推到目标点（○）即过关。'),
        row(sw('ic-ice'), '冰面', '箱子推上去会一直滑到撞墙；你不受影响。'),
        row(sw('ic-pit'), '深坑', '你过不去；推箱入坑可将其填平（箱子消耗）。'),
        row(sw('ic-plate'), '压力板 / 闸门', '重物压住压力板时，同色闸门开启。'),
        row(sw('ic-color'), '颜色匹配', '彩色箱子要送到同色目标点。'),
        row(sw('ic-portal'), '折跃门', '踩上去瞬移到同色的另一扇；箱子过不去。'),
        row(sw('ic-arrow'), '单向格', '只能顺着箭头方向进入，逆向进不去。'),
        row(sw('ic-cracked'), '脆地', '离开后塌成深坑，只能走一次。'),
        row(sw('ic-key'), '钥匙 / 锁', '拾取钥匙打开同色的锁。'),
        row(sw('ic-pull'), '拉 / 抓', '按住 Shift + 方向（或点「抓」）拉动身后的箱子；贴墙的箱子只能拉。'),
      ),
      h('p', { class: 'result' }, 'Z 撤销 · R 重开 · Esc 返回。可无限撤销，没有死亡惩罚。'),
      h('div', { class: 'actions' },
        (() => {
          const c = h('button', {}, '机制图鉴 →');
          c.onclick = () => {
            overlay.remove();
            this.showCodex();
          };
          return c;
        })(),
        (() => {
          const b = h('button', { class: 'primary' }, '明白了');
          b.onclick = () => overlay.remove();
          return b;
        })(),
      ),
    );
    const overlay = h('div', { class: 'overlay' }, card);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
    this.root.append(overlay);
  }

  private showCodex(): void {
    const list = h('div', { class: 'codex' });
    for (const e of CODEX) {
      const unlocked = isUnlocked(this.order, e.anchor, this.progress);
      const entry = h(
        'div',
        { class: `codex-row${unlocked ? '' : ' locked'}` },
        h('span', { class: `legend-ic ${e.icon}` }),
        unlocked
          ? h('div', { class: 'codex-body' },
              h('b', {}, e.name),
              h('span', { class: 'codex-rule' }, e.rule),
              h('span', { class: 'codex-use' }, e.use))
          : h('div', { class: 'codex-body' },
              h('b', {}, '未解锁'),
              h('span', { class: 'codex-rule' }, '在后续章节首次遇到该机制后解锁。')),
      );
      list.append(entry);
    }
    const card = h(
      'div',
      { class: 'card help' },
      h('h2', { class: 'wordmark' }, '机制图鉴'),
      h('p', { class: 'result' }, '每种机制在首次遇到后解锁，这里只讲规则与典型用法，不剧透关卡解法。'),
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
    const helpBtn = h('button', { class: 'ghost', title: '玩法 / 图例' }, '?');
    helpBtn.onclick = () => this.showHelp();
    const soundBtn = h('button', { class: 'ghost', title: '音效开关' }, soundEnabled() ? '🔈' : '🔇');
    soundBtn.onclick = () => {
      setSound(!soundEnabled());
      soundBtn.textContent = soundEnabled() ? '🔈' : '🔇';
    };
    const topbar = h('div', { class: 'topbar' }, title, h('div', { class: 'top-actions' }, soundBtn, helpBtn, back));

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
    const grabBtn = h('button', { class: 'grab', title: '抓取：开启后移动会拉动身后的箱子（也可按住 Shift + 方向）' }, '抓 ⇲');
    const controls = h(
      'div',
      { class: 'controls' },
      undoBtn,
      restartBtn,
      grabBtn,
      h('span', { class: 'spacer' }),
      h('span', { class: 'hint-keys' }, 'WASD/方向键 移动 · Shift+方向 拉 · Z 撤销 · R 重开'),
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
    let grabMode = false; // touch/click grab toggle; Shift also pulls per-move
    const doMove = (dir: Dir, pull = false) => {
      // No input throttling: the engine is pure/synchronous and renderer.update
      // always reconciles the DOM to the latest state, so rapid or repeated keys
      // can never corrupt state — they just retarget the CSS transition. We only
      // freeze input during the brief win hand-off below.
      if (locked) return;
      const res = game.move(dir, pull);
      if (!res) {
        sfx('blocked');
        return;
      }
      renderer.update(game.state, res.effect);
      refreshControls();

      const e = res.effect;
      if (e?.crate?.sank) sfx('fill');
      else if (e?.teleported) sfx('warp');
      else if (e?.crate?.slid) sfx('slide');
      else if (e?.crate) sfx('push');
      else sfx('move');

      if (game.solved) {
        locked = true;
        sfx('win');
        const slid = res.effect?.crate?.slid;
        window.setTimeout(() => this.win(level, game), slid ? 460 : 320);
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key in KEY_DIR) {
        e.preventDefault();
        doMove(KEY_DIR[e.key]!, e.shiftKey || grabMode);
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
    grabBtn.onclick = () => {
      grabMode = !grabMode;
      grabBtn.classList.toggle('on', grabMode);
    };
    upB!.onclick = () => doMove('up', grabMode);
    downB!.onclick = () => doMove('down', grabMode);
    leftB!.onclick = () => doMove('left', grabMode);
    rightB!.onclick = () => doMove('right', grabMode);

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
      doMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up', grabMode);
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
    const par = level.par ?? Infinity;
    const outcome = recordClear(this.progress, level.id, {
      moves: game.moves,
      pushes: game.pushes,
      par,
      usedUndo: game.usedUndo,
    });
    void submitScore(level.id, game.moves, game.pushes, game.log);

    const idx = this.order.indexOf(level.id);
    const nextId = this.order[idx + 1];

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
