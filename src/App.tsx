import { useCallback, useEffect, useRef, useState } from 'react';
import {
  raceSpeedTier,
  type GameEvent,
  type GameMode,
  type GameState,
  type PuzzleId,
  createInitialState,
} from './game/core';
import { type InputAction } from './game/input/InputController';
import { GameRuntime } from './game/runtime/GameRuntime';
import {
  CAMPAIGN_LEVELS,
  LEGACY_PUZZLE_PROGRESS_KEY,
  PUZZLE_PROGRESS_KEY,
  defaultPuzzleProgress,
  migrateLegacyPuzzleProgress,
  parsePuzzleProgress,
  recordCanonicalPuzzleCompletion,
  type PuzzleProgress,
} from './puzzleProgress';
import { ActionSheet } from './ui/ActionSheet';

type AppScreen = 'home' | 'puzzle-library' | 'game';
type ExitDestination = 'home' | 'puzzle-library';

const APP_SEED = 0x51a1f00d;

const MODE_COPY: Record<GameMode, {
  label: string;
  detail: string;
  action: string;
}> = {
  marathon: {
    label: '马拉松',
    detail: '持续消行，刷新分数与等级。',
    action: '开始',
  },
  race: {
    label: '竞速',
    detail: '速度持续提升｜无终点｜主动退出或堆叠到顶结束',
    action: '开始',
  },
  puzzle: {
    label: '解谜',
    detail: '六关全开，连续七袋方块，目标是清空棋盘。',
    action: '选关',
  },
};

const MODE_ORDER: readonly GameMode[] = ['marathon', 'race', 'puzzle'];

const MODE_SIGNAL_CELLS: Record<GameMode, readonly (readonly [number, number])[]> = {
  marathon: [[0, 0], [1, 0], [2, 0], [1, 1]],
  race: [[0, 0], [1, 0], [1, 1], [2, 1]],
  puzzle: [[0, 1], [1, 1], [2, 1], [2, 0]],
};

export function cloneQaState(state: GameState): GameState {
  return structuredClone(state);
}

function readPuzzleProgress(): PuzzleProgress {
  try {
    const current = localStorage.getItem(PUZZLE_PROGRESS_KEY);
    if (current !== null) return parsePuzzleProgress(current);
    return migrateLegacyPuzzleProgress(localStorage.getItem(LEGACY_PUZZLE_PROGRESS_KEY));
  } catch {
    return defaultPuzzleProgress();
  }
}

function formatScore(value: number): string {
  return Math.max(0, value).toLocaleString('zh-CN');
}

function campaignLevel(id: PuzzleId | null) {
  return CAMPAIGN_LEVELS.find((level) => level.id === id) ?? CAMPAIGN_LEVELS[0]!;
}

function terminalCopy(state: GameState): { title: string; detail: string; success: boolean } | null {
  if (state.mode === 'puzzle') {
    if (state.puzzleCompletion === 'finished') {
      return { title: '棋盘已清空', detail: `使用 ${state.pieceCount} 个方块，完成 ${state.lines} 次消行。`, success: true };
    }
    if (state.puzzleCompletion && state.puzzleCompletion !== 'active') {
      return { title: '本局在这里结束', detail: '堆叠触及顶部，可以重新整理清空方法。', success: false };
    }
    return null;
  }
  if (state.status !== 'game-over') return null;
  if (state.mode === 'race') {
    return {
      title: '本轮竞速结束',
      detail: `${state.lines} 行 · ${state.pieceCount} 个方块 · 速度 ${raceSpeedTier(state.pieceCount, state.lines) + 1} 档`,
      success: false,
    };
  }
  return { title: '堆叠触及顶部', detail: `${formatScore(state.score)} 分 · ${state.lines} 行`, success: false };
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} data-testid="brand">
      <strong>Tetris</strong>
    </div>
  );
}

function ModeSignal({ mode }: { mode: GameMode }) {
  return (
    <svg className={`mode-signal mode-signal--${mode}`} viewBox="0 0 152 104" role="img" aria-label={`${MODE_COPY[mode].label}方块示意`}>
      <defs>
        <linearGradient id="mode-signal-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e7f7fa" />
          <stop offset="1" stopColor="#dfefff" />
        </linearGradient>
      </defs>
      <g transform="translate(22 18)">
        {MODE_SIGNAL_CELLS[mode].map(([x, y], index) => (
          <rect
            key={`${x}:${y}`}
            className={`mode-signal__cell mode-signal__cell--${index + 1}`}
            x={x * 36}
            y={y * 36}
            width="32"
            height="32"
            rx="3"
          />
        ))}
      </g>
    </svg>
  );
}

function ModeGlyph({ mode }: { mode: GameMode }) {
  if (mode === 'marathon') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M7 31h9V22h9v-9h8" /></svg>;
  }
  if (mode === 'race') {
    return <svg viewBox="0 0 40 40" aria-hidden="true"><path className="mode-glyph__soft" d="M5 12h12M5 19h9M5 26h6" /><path d="M19 13h7v7h8v8H19z" /></svg>;
  }
  return <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M5 30h8v-8h7v8h7V14h8v16" /></svg>;
}

function ModeHome({ onEnter }: { onEnter: (mode: GameMode) => void }) {
  const [previewMode, setPreviewMode] = useState<GameMode>('marathon');
  const preview = MODE_COPY[previewMode];
  return (
    <main id="game" className="landing-shell" data-testid="mode-home">
      <header className="landing-header">
        <Brand />
        <span>选择模式</span>
      </header>
      <section className="landing-stage" aria-labelledby="home-title">
        <section className="mode-preview" aria-live="polite">
          <div className="mode-preview__copy">
            <small>当前选择</small>
            <h2>{preview.label}</h2>
            <p>{preview.detail}</p>
          </div>
          <ModeSignal mode={previewMode} />
          <p className="mode-preview__input"><i aria-hidden="true" />键盘与触控均可操作</p>
        </section>
        <section className="mode-chooser">
          <div className="landing-intro">
            <div>
              <small>三种玩法</small>
              <h1 id="home-title">选择模式</h1>
            </div>
            <p>随时开始，也可随时退出。</p>
          </div>
          <div
            className="mode-gates"
            data-selection={previewMode}
            aria-label="选择游戏模式"
            data-testid="mode-list"
          >
            <span className="phase-seam" data-testid="phase-seam" aria-hidden="true" />
            {MODE_ORDER.map((mode) => {
              const item = MODE_COPY[mode];
              const active = previewMode === mode;
              return (
                <button
                  key={mode}
                  className={`mode-gate mode-gate--${mode} ${active ? 'mode-gate--active' : ''}`}
                  type="button"
                  data-testid={`enter-${mode}`}
                  data-selected={active || undefined}
                  onPointerEnter={() => setPreviewMode(mode)}
                  onFocus={() => setPreviewMode(mode)}
                  onClick={() => onEnter(mode)}
                >
                  <span className="mode-gate__glyph"><ModeGlyph mode={mode} /></span>
                  <span className="mode-gate__body">
                    <strong>{item.label}</strong>
                    <span>{item.detail}</span>
                  </span>
                  <span className="mode-gate__action"><span>{item.action}</span><b aria-hidden="true">→</b></span>
                </button>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}

function puzzleSilhouettePath(id: PuzzleId): string {
  const board = createInitialState(APP_SEED, 'puzzle', id).board.slice(-12);
  const unit = 4;
  const face = 3.25;
  return board.flatMap((row, y) => row.map((cell, x) => (
    cell ? `M${x * unit + .375} ${y * unit + .375}h${face}v${face}h-${face}z` : ''
  ))).join('');
}

function PuzzleSilhouette({ id, name }: { id: PuzzleId; name: string }) {
  return (
    <svg className="puzzle-silhouette" viewBox="0 0 40 48" role="img" aria-label={`${name}起始棋盘轮廓`}>
      <path d={puzzleSilhouettePath(id)} />
    </svg>
  );
}

function PuzzleLibrary({
  progress,
  selectedId,
  onSelect,
  onStart,
  onBack,
}: {
  progress: PuzzleProgress;
  selectedId: PuzzleId;
  onSelect: (id: PuzzleId) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const selected = campaignLevel(selectedId);
  return (
    <main id="game" className="library-shell" data-testid="puzzle-library">
      <header className="library-header">
        <Brand compact />
        <button className="text-action" type="button" onClick={onBack}>← 返回模式首页</button>
      </header>
      <section className="library-intro" aria-labelledby="library-title">
        <h1 id="library-title">解谜关卡</h1>
        <p>六关全部开放。方块持续补充，操作与普通模式一致；目标是清空完整棋盘。</p>
      </section>
      <section className="library-content" aria-label="全部解谜关卡">
        <div className="level-list" aria-label="六个可用解谜关卡" data-testid="level-list">
          {CAMPAIGN_LEVELS.map((level) => {
            const complete = progress.completedLevelIds.includes(level.id);
            const selectedLevel = selectedId === level.id;
            return (
              <article className={`level-item ${selectedLevel ? 'level-item--selected' : ''}`} key={level.id}>
                <button
                  className="level-entry"
                  type="button"
                  data-testid="level-row"
                  data-level-id={level.id}
                  aria-pressed={selectedLevel}
                  onClick={() => onSelect(level.id)}
                >
                  <span className="level-entry__number">{String(level.index).padStart(2, '0')}</span>
                  <span className="level-entry__copy">
                    <strong>{level.name}</strong>
                    <small>{complete ? '已完成 · 可重玩' : '可直接进入'}</small>
                  </span>
                  <span className="level-entry__chevron" aria-hidden="true">›</span>
                </button>
                {selectedLevel && (
                  <div className="level-inline-detail" aria-live="polite">
                    <PuzzleSilhouette id={selected.id} name={selected.name} />
                    <div>
                      <p>清空完整棋盘</p>
                      <span>连续七袋方块 · 不限定唯一解法</span>
                    </div>
                    <button className="primary-action" type="button" data-testid="start-selected-puzzle-mobile" onClick={onStart}>开始这一关</button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
        <aside className="level-detail" aria-live="polite">
          <div className="level-detail__visual">
            <PuzzleSilhouette id={selected.id} name={selected.name} />
            <span>起始棋盘</span>
          </div>
          <div className="level-detail__heading">
            <span className="level-detail__count">{String(selected.index).padStart(2, '0')} / {String(selected.total).padStart(2, '0')}</span>
            <div>
              <small>当前选择</small>
              <h2>{selected.name}</h2>
            </div>
          </div>
          <dl>
            <div><dt>目标</dt><dd>清空完整棋盘</dd></div>
            <div><dt>方块</dt><dd>持续补充的七袋序列</dd></div>
            <div><dt>规则</dt><dd>与普通模式一致，不限定唯一解法</dd></div>
          </dl>
          <button className="primary-action" type="button" data-testid="start-selected-puzzle" onClick={onStart}>开始这一关</button>
        </aside>
      </section>
    </main>
  );
}

interface TouchButtonProps {
  action: InputAction;
  label: string;
  glyph: string;
  runtime: GameRuntime | null;
}

function TouchButton({ action, label, glyph, runtime }: TouchButtonProps) {
  const release = useCallback(() => runtime?.release(action), [action, runtime]);
  return (
    <button
      className="touch-key"
      type="button"
      data-testid={`touch-${action}`}
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        runtime?.press(action);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(event) => event.preventDefault()}
    >
      <b aria-hidden="true">{glyph}</b><small>{label}</small>
    </button>
  );
}

function RunStats({ state }: { state: GameState }) {
  if (state.mode === 'race') {
    return (
      <section className="run-stats" data-testid="stats" aria-label="竞速模式数据">
        <article><span>分数</span><strong>{formatScore(state.score)}</strong></article>
        <article><span>消行</span><strong>{state.lines}</strong></article>
        <article><span>速度档</span><strong>{raceSpeedTier(state.pieceCount, state.lines) + 1}</strong></article>
      </section>
    );
  }
  if (state.mode === 'puzzle') {
    const level = campaignLevel(state.puzzleId);
    return (
      <section className="run-stats run-stats--puzzle" data-testid="stats" aria-label="解谜模式数据">
        <article className="run-stats__wide"><span>关卡 {level.index}/{level.total}</span><strong>{level.name}</strong></article>
        <article><span>已放置</span><strong>{state.pieceCount}</strong></article>
        <article><span>消行</span><strong>{state.lines}</strong></article>
        <article className="run-stats__wide"><span>目标</span><strong>清空完整棋盘</strong></article>
      </section>
    );
  }
  return (
    <section className="run-stats" data-testid="stats" aria-label="马拉松模式数据">
      <article><span>分数</span><strong>{formatScore(state.score)}</strong></article>
      <article><span>消行</span><strong>{state.lines}</strong></article>
      <article><span>等级</span><strong>{state.level}</strong></article>
    </section>
  );
}

function eventMessage(event: GameEvent): string {
  if (event.type === 'lines-cleared') return `消除了 ${event.count} 行。`;
  if (event.type === 'paused') return '本局已暂停。';
  if (event.type === 'resumed') return '继续本局。';
  if (event.type === 'finished') return '棋盘已清空。';
  if (event.type === 'game-over') return '本局结束。';
  return '';
}

function serialiseRect(element: Element | null) {
  if (!(element instanceof HTMLElement)) return null;
  const value = element.getBoundingClientRect();
  if (value.width <= 0 || value.height <= 0) return null;
  return { left: value.left, top: value.top, right: value.right, bottom: value.bottom, width: value.width, height: value.height };
}

declare global {
  interface Window {
    __TETRIS_D4_QA__?: { collect: () => unknown };
    render_game_to_text?: () => string;
    advanceTime?: (ms: number) => void;
  }
}

function GameSession({
  mode,
  puzzleId,
  onExit,
  onCanonicalCompletion,
}: {
  mode: GameMode;
  puzzleId: PuzzleId;
  onExit: (destination: ExitDestination) => void;
  onCanonicalCompletion: (state: GameState) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const exitWasPlayingRef = useRef(false);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState(APP_SEED, mode, mode === 'puzzle' ? puzzleId : undefined));
  const [exitOpen, setExitOpen] = useState(false);
  const [liveMessage, setLiveMessage] = useState('Tetris 已开始。');

  const focusBoard = useCallback(() => {
    requestAnimationFrame(() => hostRef.current?.querySelector('canvas')?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const nextRuntime = new GameRuntime({
      seed: APP_SEED,
      mode,
      puzzleId: mode === 'puzzle' ? puzzleId : undefined,
      reducedMotion: motionQuery.matches,
      onState: (nextState, events) => {
        if (disposed) return;
        setState(nextState);
        const notable = [...events].reverse().find((event) => (
          event.type === 'lines-cleared'
          || event.type === 'paused'
          || event.type === 'resumed'
          || event.type === 'finished'
          || event.type === 'game-over'
        ));
        if (notable) setLiveMessage(eventMessage(notable));
        if (nextState.mode === 'puzzle' && nextState.puzzleCompletion === 'finished') {
          onCanonicalCompletion(nextState);
        }
      },
    });
    const handleMotionChange = (event: MediaQueryListEvent) => nextRuntime.setReducedMotion(event.matches);
    motionQuery.addEventListener('change', handleMotionChange);
    runtimeRef.current = nextRuntime;
    setRuntime(nextRuntime);
    void nextRuntime.mount(host).then(() => {
      if (disposed) return;
      nextRuntime.setReducedMotion(motionQuery.matches);
      nextRuntime.start();
      focusBoard();
    });

    return () => {
      disposed = true;
      motionQuery.removeEventListener('change', handleMotionChange);
      nextRuntime.destroy();
      if (runtimeRef.current === nextRuntime) runtimeRef.current = null;
    };
  }, [focusBoard, mode, onCanonicalCompletion, puzzleId]);

  useEffect(() => {
    if (!import.meta.env.DEV || !runtime) return;
    window.render_game_to_text = () => JSON.stringify({
      coordinateSystem: 'board origin is top-left; x increases right; y increases down; visible board is 10 columns by 20 rows',
      screen: 'game',
      mode: state.mode,
      status: state.status,
      phase: state.phase,
      puzzleId: state.puzzleId,
      puzzleCompletion: state.puzzleCompletion,
      score: state.score,
      lines: state.lines,
      level: state.level,
      placedPieces: state.pieceCount,
      active: state.active ? { type: state.active.type, x: state.active.x, y: state.active.y, rotation: state.active.rotation } : null,
      next: state.queue[0] ?? null,
      visibleBoard: state.board.slice(-20).map((row) => row.map((cell) => cell ?? '.').join('')),
    });
    window.advanceTime = (ms: number) => {
      const ticks = Math.max(1, Math.round(Math.max(0, ms) / (1000 / 60)));
      window.__SIGNAL_FOUNDRY_QA__?.advanceTicks(ticks);
    };
    window.__TETRIS_D4_QA__ = {
      collect: () => {
        const buttons = [...document.querySelectorAll<HTMLElement>('button')].map((button) => button.getBoundingClientRect());
        return {
          screen: 'game',
          state: cloneQaState(runtime.getState()),
          renderer: runtime.getRendererSnapshot(),
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
          },
          bounds: {
            board: serialiseRect(document.querySelector('[data-testid="board-frame"]')),
            stats: serialiseRect(document.querySelector('[data-testid="stats"]')),
            next: serialiseRect(document.querySelector('[data-testid="next-slot"]')),
            touch: serialiseRect(document.querySelector('[data-testid="touch-rail"]')),
          },
          assertions: {
            canvasCount: document.querySelectorAll('canvas').length,
            domCellCount: document.querySelectorAll('[data-game-cell]').length,
            minButtonWidth: buttons.length ? Math.min(...buttons.map((item) => item.width)) : null,
            minButtonHeight: buttons.length ? Math.min(...buttons.map((item) => item.height)) : null,
            noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
            noVerticalOverflow: document.documentElement.scrollHeight <= window.innerHeight,
          },
        };
      },
    };
    return () => {
      delete window.render_game_to_text;
      delete window.advanceTime;
      delete window.__TETRIS_D4_QA__;
    };
  }, [runtime, state]);

  const restartRun = useCallback(() => {
    setExitOpen(false);
    runtime?.restart();
    runtime?.start();
    focusBoard();
  }, [focusBoard, runtime]);

  const resumeRun = useCallback(() => {
    if (runtime?.getState().status === 'paused') runtime.togglePause();
  }, [runtime]);

  const requestExit = useCallback(() => {
    exitWasPlayingRef.current = runtime?.getState().status === 'playing';
    if (exitWasPlayingRef.current) runtime?.togglePause();
    setExitOpen(true);
  }, [runtime]);

  const cancelExit = useCallback(() => {
    setExitOpen(false);
    if (exitWasPlayingRef.current && runtime?.getState().status === 'paused') runtime.togglePause();
    exitWasPlayingRef.current = false;
  }, [runtime]);

  const terminal = terminalCopy(state);
  const level = state.mode === 'puzzle' ? campaignLevel(state.puzzleId) : null;
  const exitDestination: ExitDestination = state.mode === 'puzzle' ? 'puzzle-library' : 'home';
  const pauseOpen = state.status === 'paused' && !exitOpen;
  const resultOpen = terminal !== null && !exitOpen;

  return (
    <main id="game" className="play-shell" data-testid="game-screen">
      <header className="play-topbar" data-testid="cluster-header">
        <button
          className="topbar-action"
          type="button"
          onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true });
            requestExit();
          }}
        >← 模式首页</button>
        <div className="play-identity">
          <Brand compact />
          <h1 data-testid="current-mode">{MODE_COPY[state.mode].label}</h1>
          {level && <small>{level.index}/{level.total} · {level.name}</small>}
        </div>
        <button
          className="topbar-action"
          type="button"
          onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true });
            runtime?.togglePause();
          }}
          disabled={state.status !== 'playing' && state.status !== 'paused'}
        >{state.status === 'paused' ? '继续' : '暂停'}</button>
      </header>

      <section className="play-surface" aria-label={`${MODE_COPY[state.mode].label}游戏面板`}>
        <section className="game-arena" data-testid="game-cluster" aria-label={`${MODE_COPY[state.mode].label}游戏区`}>
          <div ref={hostRef} className="canvas-host" data-testid="canvas-host" />
          <section className="board-frame" data-testid="board-frame" aria-label="10 × 20 游戏棋盘" />
          <aside className="game-side-panel" data-testid="side-rail">
            <div className="info-rail" data-testid="context-top">
              <p className="rail-label">本局数据</p>
              <RunStats state={state} />
              <p className="mode-rule">{MODE_COPY[state.mode].detail}</p>
            </div>
            <div className="preview-rail">
              <p className="rail-label">下一个</p>
              <div className="next-slot" data-testid="next-slot" aria-label="下一个方块" />
            </div>
            <p className="keyboard-map"><b>键盘</b><span>← → 移动</span><span>↑ 旋转</span><span>↓ 快速下落</span><span>空格 直接落底</span></p>
          </aside>
        </section>

        <section className="touch-deck" data-testid="touch-rail" aria-label="触控操作">
          <TouchButton action="left" label="左移" glyph="←" runtime={runtime} />
          <TouchButton action="right" label="右移" glyph="→" runtime={runtime} />
          <TouchButton action="rotate-cw" label="旋转" glyph="↻" runtime={runtime} />
          <TouchButton action="soft-drop" label="快速下落" glyph="↓" runtime={runtime} />
          <TouchButton action="hard-drop" label="直接落底" glyph="⇣" runtime={runtime} />
        </section>
      </section>

      <ActionSheet
        open={pauseOpen}
        title="本局已暂停"
        description="棋盘状态已保留。继续、重新开始，或离开本局。"
        onCancel={resumeRun}
      >
        <button className="primary-action" data-autofocus type="button" onClick={resumeRun}>继续游戏</button>
        <button className="secondary-action" type="button" onClick={restartRun}>重新开始</button>
        <button className="text-action" type="button" onClick={requestExit}>离开本局</button>
      </ActionSheet>

      <ActionSheet
        open={exitOpen}
        title="要离开本局吗？"
        description="本局尚未保存；已完成的解谜记录不会受影响。"
        tone="danger"
        onCancel={cancelExit}
      >
        <button className="primary-action" data-autofocus type="button" onClick={cancelExit}>留在本局</button>
        <button className="secondary-action" type="button" onClick={() => onExit(exitDestination)}>
          {exitDestination === 'puzzle-library' ? '返回关卡库' : '返回模式首页'}
        </button>
      </ActionSheet>

      <ActionSheet
        open={resultOpen}
        title={terminal?.title ?? '本局结束'}
        description={terminal?.detail ?? ''}
        tone={terminal?.success ? 'success' : 'danger'}
      >
        <button className="primary-action" data-autofocus type="button" onClick={restartRun}>再来一局</button>
        <button className="secondary-action" type="button" onClick={() => onExit(exitDestination)}>
          {exitDestination === 'puzzle-library' ? '返回关卡库' : '返回模式首页'}
        </button>
      </ActionSheet>

      <div className="sr-only" aria-live="polite">{liveMessage}</div>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [mode, setMode] = useState<GameMode>('marathon');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<PuzzleId>(CAMPAIGN_LEVELS[0]!.id);
  const [progress, setProgress] = useState<PuzzleProgress>(readPuzzleProgress);

  const enterMode = useCallback((nextMode: GameMode) => {
    setMode(nextMode);
    setScreen(nextMode === 'puzzle' ? 'puzzle-library' : 'game');
  }, []);

  const startPuzzle = useCallback(() => {
    setMode('puzzle');
    setScreen('game');
  }, []);

  const recordCompletion = useCallback((state: GameState) => {
    setProgress((current) => {
      const updated = recordCanonicalPuzzleCompletion(current, state);
      if (updated !== current) {
        try { localStorage.setItem(PUZZLE_PROGRESS_KEY, JSON.stringify(updated)); } catch { /* optional local completion record */ }
      }
      return updated;
    });
  }, []);

  const exitGame = useCallback((destination: ExitDestination) => {
    setScreen(destination === 'puzzle-library' ? 'puzzle-library' : 'home');
  }, []);

  return (
    <div className="app">
      {screen === 'home' && <ModeHome onEnter={enterMode} />}
      {screen === 'puzzle-library' && (
        <PuzzleLibrary
          progress={progress}
          selectedId={selectedPuzzleId}
          onSelect={setSelectedPuzzleId}
          onStart={startPuzzle}
          onBack={() => setScreen('home')}
        />
      )}
      {screen === 'game' && (
        <GameSession
          key={`${mode}:${selectedPuzzleId}`}
          mode={mode}
          puzzleId={selectedPuzzleId}
          onExit={exitGame}
          onCanonicalCompletion={recordCompletion}
        />
      )}
    </div>
  );
}
