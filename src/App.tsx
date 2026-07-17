import { useCallback, useEffect, useRef, useState } from 'react';
import {
  PIECE_TYPES,
  raceSpeedTier,
  type GameEvent,
  type GameMode,
  type GameState,
  type PieceType,
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
import { PIECE_MATERIALS } from './game/render/theme';
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
    label: '经典',
    detail: '分数 · 消行 · 等级',
    action: '开始',
  },
  race: {
    label: '竞速',
    detail: '速度递增 · 无终点',
    action: '开始',
  },
  puzzle: {
    label: '解谜',
    detail: `${CAMPAIGN_LEVELS.length} 关残局 · 清空棋盘`,
    action: '选关',
  },
};

const MODE_ORDER: readonly GameMode[] = ['marathon', 'race', 'puzzle'];

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
      return { title: '棋盘已清空', detail: `${state.pieceCount} 方块 · ${state.lines} 消行`, success: true };
    }
    if (state.puzzleCompletion && state.puzzleCompletion !== 'active') {
      return { title: '堆叠到顶', detail: `${state.pieceCount} 方块 · ${state.lines} 消行`, success: false };
    }
    return null;
  }
  if (state.status !== 'game-over') return null;
  if (state.mode === 'race') {
    return {
      title: '竞速结束',
      detail: `${state.lines} 消行 · ${state.pieceCount} 方块 · 速度 ${raceSpeedTier(state.pieceCount, state.lines) + 1}`,
      success: false,
    };
  }
  return { title: '堆叠到顶', detail: `${formatScore(state.score)} 分 · ${state.lines} 消行`, success: false };
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brand ${compact ? 'brand--compact' : ''}`} data-testid="brand">
      <strong>Tetris</strong>
    </div>
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

export function ModeHome({ onEnter }: { onEnter: (mode: GameMode) => void }) {
  const [previewMode, setPreviewMode] = useState<GameMode>('marathon');
  return (
    <main id="game" className="landing-shell" data-testid="mode-home">
      <header className="landing-header">
        <Brand />
      </header>
      <section className="landing-stage" aria-labelledby="home-title">
        <section className="mode-chooser">
          <div className="landing-intro">
            <h1 id="home-title">选择模式</h1>
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
                  aria-pressed={active}
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

function cssHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}

export function puzzleSilhouettePaths(id: PuzzleId): ReadonlyMap<PieceType, string> {
  const board = createInitialState(APP_SEED, 'puzzle', id).board.slice(-12);
  const unit = 4;
  const face = 3.8;
  const paths = new Map<PieceType, string>();
  for (const type of PIECE_TYPES) {
    const path = board.flatMap((row, y) => row.map((cell, x) => (
      cell === type ? `M${x * unit + .1} ${y * unit + .1}h${face}v${face}h-${face}z` : ''
    ))).join('');
    if (path) paths.set(type, path);
  }
  return paths;
}

function PuzzleSilhouette({ id, name }: { id: PuzzleId; name: string }) {
  return (
    <svg className="puzzle-silhouette" viewBox="0 0 40 48" role="img" aria-label={`${name}棋盘轮廓`}>
      {[...puzzleSilhouettePaths(id)].map(([type, path]) => {
        const material = PIECE_MATERIALS[type];
        return (
          <path
            key={type}
            data-piece-type={type}
            d={path}
            fill={cssHex(material.fillStart)}
            stroke={cssHex(material.edge)}
          />
        );
      })}
    </svg>
  );
}

export function PuzzleLibrary({
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
        <button className="text-action" type="button" aria-label="返回模式首页" onClick={onBack}>← 返回</button>
      </header>
      <section className="library-intro" aria-labelledby="library-title">
        <h1 id="library-title">解谜</h1>
      </section>
      <section className="library-content" aria-label="全部解谜关卡">
        <div className="level-list" aria-label={`${CAMPAIGN_LEVELS.length} 个可用解谜关卡`} data-testid="level-list">
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
                  aria-label={`${String(level.index).padStart(2, '0')} ${level.name}${complete ? '，已完成' : ''}`}
                  onClick={() => onSelect(level.id)}
                >
                  <span className="level-entry__number">{String(level.index).padStart(2, '0')}</span>
                  <span className="level-entry__copy">
                    <strong>{level.name}</strong>
                    {complete && <small>已完成</small>}
                  </span>
                </button>
              </article>
            );
          })}
        </div>
        <section className="level-inline-detail" aria-live="polite" aria-label={`已选关卡：${selected.name}`}>
          <PuzzleSilhouette id={selected.id} name={selected.name} />
          <div>
            <small>{String(selected.index).padStart(2, '0')} / {String(selected.total).padStart(2, '0')}</small>
            <h2>{selected.name}</h2>
            <p><span>目标</span><strong>清空棋盘</strong></p>
          </div>
          <button className="primary-action" type="button" data-testid="start-selected-puzzle-mobile" aria-label={`开始 ${selected.name}`} onClick={onStart}>开始</button>
        </section>
        <aside className="level-detail" aria-live="polite">
          <div className="level-detail__visual">
            <PuzzleSilhouette id={selected.id} name={selected.name} />
          </div>
          <div className="level-detail__heading">
            <span className="level-detail__count">{String(selected.index).padStart(2, '0')} / {String(selected.total).padStart(2, '0')}</span>
            <h2>{selected.name}</h2>
          </div>
          <p className="level-detail__objective"><span>目标</span><strong>清空棋盘</strong></p>
          <button className="primary-action" type="button" data-testid="start-selected-puzzle" aria-label={`开始 ${selected.name}`} onClick={onStart}>开始</button>
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
        <article className="run-stats__wide"><span>目标</span><strong>清空棋盘</strong></article>
      </section>
    );
  }
  return (
    <section className="run-stats" data-testid="stats" aria-label="经典模式数据">
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
          aria-label={state.mode === 'puzzle' ? '返回解谜关卡' : '返回模式首页'}
        >← 返回</button>
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
              <RunStats state={state} />
            </div>
            <div className="preview-rail">
              <p className="rail-label">Next</p>
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
        title="已暂停"
        description=""
        onCancel={resumeRun}
      >
        <button className="primary-action" data-autofocus type="button" onClick={resumeRun}>继续游戏</button>
        <button className="secondary-action" type="button" onClick={restartRun}>重新开始</button>
        <button className="text-action" type="button" onClick={requestExit}>离开本局</button>
      </ActionSheet>

      <ActionSheet
        open={exitOpen}
        title="离开本局？"
        description=""
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
