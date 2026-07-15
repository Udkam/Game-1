import { useCallback, useEffect, useRef, useState } from 'react';
import {
  RACE_TARGET_LINES,
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
  PUZZLE_PROGRESS_KEY,
  defaultPuzzleProgress,
  isPuzzleUnlocked,
  parsePuzzleProgress,
  recordCanonicalPuzzleCompletion,
  type PuzzleProgress,
} from './puzzleProgress';

const MODE_COPY: Record<GameMode, { label: string; goal: string; end: string }> = {
  marathon: { label: '马拉松模式', goal: '目标：累积得分', end: '结束：堆叠到顶' },
  race: { label: '竞速模式', goal: '目标：完成 20 行', end: '结束：完成目标' },
  puzzle: { label: '解谜模式', goal: '目标：清空棋盘', end: '结束：方块用尽' },
};

function readPuzzleProgress(): PuzzleProgress {
  try {
    return parsePuzzleProgress(localStorage.getItem(PUZZLE_PROGRESS_KEY));
  } catch {
    return defaultPuzzleProgress();
  }
}

function formatScore(value: number): string {
  return Math.max(0, value).toLocaleString('zh-CN');
}

function formatDuration(ticks: number): string {
  const totalSeconds = Math.max(0, Math.floor(ticks / 60));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function terminalCopy(state: GameState): { title: string; detail: string } | null {
  if (state.mode === 'puzzle') {
    if (state.puzzleCompletion === 'finished') return { title: '解谜完成', detail: '棋盘已清空' };
    if (state.puzzleCompletion === 'failed-top-out') return { title: '未完成', detail: '堆叠到顶' };
    if (state.puzzleCompletion === 'failed-invalid-spawn') return { title: '未完成', detail: '无法生成方块' };
    if (state.puzzleCompletion === 'failed-budget') return { title: '未完成', detail: '方块已用尽' };
    return null;
  }
  if (state.status === 'finished' && state.mode === 'race') {
    return { title: '20 行完成', detail: `${formatDuration(state.elapsedTicks)} · ${state.pieceCount} 块` };
  }
  if (state.status === 'game-over') {
    if (state.mode === 'race') return { title: '竞速未完成', detail: `还差 ${Math.max(0, RACE_TARGET_LINES - state.lines)} 行` };
    return { title: '堆叠到顶', detail: `${formatScore(state.score)} 分 · ${state.lines} 行` };
  }
  return null;
}

function campaignLevel(id: PuzzleId | null) {
  return CAMPAIGN_LEVELS.find((level) => level.id === id) ?? CAMPAIGN_LEVELS[0]!;
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

function ModeRail({ selected, onSelect, label }: { selected: GameMode; onSelect: (mode: GameMode) => void; label: string }) {
  return (
    <section className="mode-rail" data-testid="mode-list" aria-label={label}>
      {(Object.keys(MODE_COPY) as GameMode[]).map((mode) => (
        <button key={mode} type="button" aria-pressed={selected === mode} onClick={() => onSelect(mode)}>
          {MODE_COPY[mode].label}
        </button>
      ))}
    </section>
  );
}

function ModeFact({ mode }: { mode: GameMode }) {
  return <p className="mode-fact"><strong>{MODE_COPY[mode].label}</strong><span>{MODE_COPY[mode].goal}　{MODE_COPY[mode].end}</span></p>;
}

function RunStats({ state }: { state: GameState }) {
  if (state.mode === 'race') {
    return (
      <section className="run-stats" data-testid="stats" aria-label="竞速模式数据">
        <article><span>计时</span><strong>{formatDuration(state.elapsedTicks)}</strong></article>
        <article><span>剩余行</span><strong>{Math.max(0, RACE_TARGET_LINES - state.lines)}</strong></article>
        <article><span>速度档</span><strong>{Math.floor(state.pieceCount / 5) + 1}</strong></article>
      </section>
    );
  }
  if (state.mode === 'puzzle') {
    const level = campaignLevel(state.puzzleId);
    return (
      <section className="run-stats run-stats--puzzle" data-testid="stats" aria-label="解谜模式数据">
        <article><span>关卡</span><strong>{level.index}/{level.total}　{level.name}</strong></article>
        <article><span>难度</span><strong>{level.difficulty}</strong></article>
        <article><span>剩余方块</span><strong>{Math.max(0, (state.puzzlePieceBudget ?? 0) - state.pieceCount)}</strong></article>
        <article><span>目标</span><strong>清空棋盘</strong></article>
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

function PuzzleLevelSelect({
  progress, selectedId, onSelect, onStart, onReturn,
}: {
  progress: PuzzleProgress;
  selectedId: PuzzleId;
  onSelect: (id: PuzzleId) => void;
  onStart: () => void;
  onReturn: () => void;
}) {
  const selected = campaignLevel(selectedId);
  const unlocked = isPuzzleUnlocked(progress, selected.id);
  return (
    <section className="puzzle-select" data-testid="puzzle-select" aria-label="解谜模式选择关卡">
      <p className="section-kicker">解谜模式 · 选择关卡</p>
      <div className="level-list" data-testid="level-list">
        {CAMPAIGN_LEVELS.map((level) => {
          const available = isPuzzleUnlocked(progress, level.id);
          return (
            <button
              key={level.id}
              type="button"
              className="level-row"
              data-testid="level-row"
              data-level-id={level.id}
              aria-pressed={selectedId === level.id}
              disabled={!available}
              onClick={() => onSelect(level.id)}
            >
              <span>关卡 {level.index}/{level.total}</span><strong>{level.name}</strong><span>难度 {level.difficulty}</span>
              <small>{available ? '已解锁' : '未解锁'}　目标：清空棋盘</small>
            </button>
          );
        })}
      </div>
      <p className="selection-fact">已选：关卡 {selected.index}/{selected.total}　{selected.name} · 难度 {selected.difficulty}　目标：清空棋盘</p>
      <div className="select-actions">
        <button className="primary-action" type="button" disabled={!unlocked} onClick={onStart}>开始关卡</button>
        <button className="secondary-action" type="button" onClick={onReturn}>返回模式选择</button>
      </div>
    </section>
  );
}

function rect(element: Element | null): DOMRect | null {
  return element instanceof HTMLElement ? element.getBoundingClientRect() : null;
}

function serialiseRect(value: DOMRect | null) {
  return value && value.width > 0 && value.height > 0
    ? { left: value.left, top: value.top, width: value.width, height: value.height, right: value.right, bottom: value.bottom }
    : null;
}

function intersectionArea(left: DOMRect | null, right: DOMRect | null): number {
  if (!left || !right) return 0;
  return Math.max(0, Math.min(left.right, right.right) - Math.max(left.left, right.left))
    * Math.max(0, Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top));
}

declare global {
  interface Window {
    __TETRIS_D4_QA__?: { collect: () => unknown };
  }
}

export default function App() {
  const hostRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<GameRuntime | null>(null);
  const modeSwitchResumesRef = useRef(false);
  const [runtime, setRuntime] = useState<GameRuntime | null>(null);
  const [state, setState] = useState<GameState>(() => createInitialState(0x51a1f00d));
  const [progress, setProgress] = useState<PuzzleProgress>(readPuzzleProgress);
  const [modeSwitchOpen, setModeSwitchOpen] = useState(false);
  const [puzzleSelectOpen, setPuzzleSelectOpen] = useState(false);
  const [pendingMode, setPendingMode] = useState<GameMode>('marathon');
  const [selectedPuzzleId, setSelectedPuzzleId] = useState<PuzzleId>('t3r-shaft-01');
  const [liveMessage, setLiveMessage] = useState('Tetris 已准备好。');

  const focusBoard = useCallback(() => {
    requestAnimationFrame(() => hostRef.current?.querySelector('canvas')?.focus({ preventScroll: true }));
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    const nextRuntime = new GameRuntime({
      seed: 0x51a1f00d,
      reducedMotion: typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches,
      onState: (nextState, events) => {
        if (disposed) return;
        setState(nextState);
        const notable = [...events].reverse().find((event) => event.type === 'lines-cleared' || event.type === 'paused'
          || event.type === 'resumed' || event.type === 'finished' || event.type === 'game-over');
        if (notable) setLiveMessage(eventMessage(notable));
        if (nextState.mode === 'puzzle' && nextState.puzzleCompletion === 'finished') {
          setProgress((current) => {
            const updated = recordCanonicalPuzzleCompletion(current, nextState);
            if (updated !== current) {
              try { localStorage.setItem(PUZZLE_PROGRESS_KEY, JSON.stringify(updated)); } catch { /* optional presentation storage */ }
            }
            return updated;
          });
        }
      },
    });
    runtimeRef.current = nextRuntime;
    setRuntime(nextRuntime);
    void nextRuntime.mount(host);
    return () => {
      disposed = true;
      nextRuntime.destroy();
      if (runtimeRef.current === nextRuntime) runtimeRef.current = null;
      setRuntime(null);
    };
  }, []);

  useEffect(() => {
    runtime?.setModeSwitch(modeSwitchOpen);
  }, [modeSwitchOpen, runtime]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__TETRIS_D4_QA__ = {
      collect: () => {
        const board = rect(document.querySelector('[data-testid="board-frame"]'));
        const pause = rect(document.querySelector('[data-testid="pause-strip"]'));
        const context = rect(document.querySelector('[data-testid="context-top"]'));
        const side = rect(document.querySelector('[data-testid="side-rail"]'));
        const stats = rect(document.querySelector('[data-testid="stats"]'));
        const touch = rect(document.querySelector('[data-testid="touch-rail"]'));
        const next = rect(document.querySelector('[data-testid="next-slot"]'));
        const canvas = document.querySelector<HTMLCanvasElement>('[data-testid="game-canvas"]');
        return {
          state,
          renderer: runtime?.getRendererSnapshot() ?? null,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            scrollWidth: document.documentElement.scrollWidth,
            scrollHeight: document.documentElement.scrollHeight,
          },
          bounds: {
            header: serialiseRect(rect(document.querySelector('[data-testid="cluster-header"]'))),
            brand: serialiseRect(rect(document.querySelector('[data-testid="brand"]'))),
            board: serialiseRect(board), context: serialiseRect(context), side: serialiseRect(side), stats: serialiseRect(stats),
            next: serialiseRect(next), pauseStrip: serialiseRect(pause), touchRail: serialiseRect(touch),
            modeList: serialiseRect(rect(document.querySelector('[data-testid="mode-list"]'))),
            touchZones: [...document.querySelectorAll('[data-testid^="touch-"]:not([data-testid="touch-rail"])')].map((item) => serialiseRect(rect(item))),
          },
          assertions: {
            boardRatio: board ? board.height / board.width : null,
            pauseStripRatio: pause && board ? pause.height / board.height : null,
            pauseInsideBoard: pause && board ? pause.left >= board.left && pause.right <= board.right && pause.top >= board.top && pause.bottom <= board.bottom : true,
            structuralPairwiseIntersection: [[context, board], [side, board], [stats, board], [touch, board]].map(([left, right]) => intersectionArea(left, right)),
            touchMinWidth: Math.min(...[...document.querySelectorAll<HTMLElement>('[data-testid^="touch-"]:not([data-testid="touch-rail"])')].map((item) => item.getBoundingClientRect().width)),
            touchMinHeight: Math.min(...[...document.querySelectorAll<HTMLElement>('[data-testid^="touch-"]:not([data-testid="touch-rail"])')].map((item) => item.getBoundingClientRect().height)),
            canvasCount: document.querySelectorAll('canvas').length,
            domCellCount: document.querySelectorAll('[data-game-cell]').length,
            levelRows: document.querySelectorAll('[data-testid="level-row"]').length,
            nextCount: document.querySelectorAll('[data-testid="next-slot"]').length,
            noOverflow: document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= Math.max(document.documentElement.clientHeight, window.innerHeight),
            boardText: document.querySelector('[data-testid="board-frame"]')?.textContent?.trim() ?? '',
            previewLayerHidden: modeSwitchOpen ? runtime?.getRendererSnapshot().previewLayerVisible === false : true,
            canvasSize: canvas ? { width: canvas.width, height: canvas.height } : null,
          },
        };
      },
    };
    return () => { delete window.__TETRIS_D4_QA__; };
  }, [modeSwitchOpen, runtime, state]);

  const isReady = state.status === 'ready';
  const isTerminal = state.status === 'game-over' || state.status === 'finished';
  const terminal = terminalCopy(state);
  const stageClass = [
    'game-cluster',
    isReady ? 'game-cluster--ready' : '',
    modeSwitchOpen ? 'game-cluster--switching' : '',
    puzzleSelectOpen ? 'game-cluster--selecting' : '',
    state.mode === 'puzzle' ? 'game-cluster--puzzle' : '',
  ].filter(Boolean).join(' ');

  const openModeSwitch = () => {
    modeSwitchResumesRef.current = state.status === 'playing';
    if (state.status === 'playing') runtime?.togglePause();
    setPendingMode(state.mode);
    setModeSwitchOpen(true);
  };
  const returnToRun = () => {
    setModeSwitchOpen(false);
    if (modeSwitchResumesRef.current) runtime?.togglePause();
  };
  const applyModeSwitch = () => {
    runtime?.restart(state.seed, pendingMode);
    setModeSwitchOpen(false);
    if (pendingMode === 'puzzle') {
      setSelectedPuzzleId(state.puzzleId ?? CAMPAIGN_LEVELS[0]!.id);
      setPuzzleSelectOpen(true);
      return;
    }
    runtime?.start();
    focusBoard();
  };
  const startSelectedMode = () => {
    if (state.mode === 'puzzle') {
      setSelectedPuzzleId(state.puzzleId ?? CAMPAIGN_LEVELS[0]!.id);
      setPuzzleSelectOpen(true);
      return;
    }
    runtime?.start();
    focusBoard();
  };
  const startPuzzle = () => {
    runtime?.selectPuzzle(selectedPuzzleId);
    runtime?.start();
    setPuzzleSelectOpen(false);
    focusBoard();
  };
  const returnToModeSelect = () => {
    runtime?.restart(state.seed, 'puzzle', selectedPuzzleId);
    setPuzzleSelectOpen(false);
  };
  const returnToPuzzleSelect = () => {
    const id = state.puzzleId ?? selectedPuzzleId;
    runtime?.restart(state.seed, 'puzzle', id);
    setSelectedPuzzleId(id);
    setPuzzleSelectOpen(true);
  };
  const startNextPuzzle = () => {
    if (state.nextUnlockedLevelId) {
      setSelectedPuzzleId(state.nextUnlockedLevelId);
      runtime?.selectPuzzle(state.nextUnlockedLevelId);
      runtime?.start();
      focusBoard();
    } else {
      returnToPuzzleSelect();
    }
  };

  const liveSession = !isReady && !modeSwitchOpen && !puzzleSelectOpen && !isTerminal;
  return (
    <div className="app">
      <main id="game" className="game-shell">
        <header className="cluster-header" data-testid="cluster-header">
          <div className="brand-lockup" data-testid="brand"><h1>Tetris</h1></div>
        </header>
        <section className={stageClass} data-testid="game-cluster" aria-label="Tetris 棋盘">
          <div ref={hostRef} className="canvas-host" data-testid="canvas-host" />
          <aside className="context-top" data-testid="context-top">
            {puzzleSelectOpen ? (
              <PuzzleLevelSelect progress={progress} selectedId={selectedPuzzleId} onSelect={setSelectedPuzzleId} onStart={startPuzzle} onReturn={returnToModeSelect} />
            ) : isReady ? (
              <section className="ready-panel">
                <p className="section-kicker">选择模式</p>
                <ModeRail selected={state.mode} onSelect={(mode) => runtime?.selectMode(mode)} label="选择模式" />
                <ModeFact mode={state.mode} />
                <button className="primary-action ready-start" type="button" onClick={startSelectedMode}>{state.mode === 'puzzle' ? '选择关卡' : '开始'}</button>
              </section>
            ) : modeSwitchOpen ? (
              <section className="switch-panel">
                <p className="section-kicker">切换模式</p>
                <ModeRail selected={pendingMode} onSelect={setPendingMode} label="切换模式" />
                <ModeFact mode={pendingMode} />
                <div className="switch-actions">
                  <button className="primary-action" type="button" onClick={applyModeSwitch}>应用并重新开始</button>
                  <button className="secondary-action" type="button" onClick={returnToRun}>返回本局</button>
                </div>
              </section>
            ) : (
              <section className="run-context">
                <p className="section-kicker">当前模式</p>
                <strong data-testid="current-mode">{MODE_COPY[state.mode].label}</strong>
                <span>{MODE_COPY[state.mode].goal}</span>
                <button type="button" onClick={openModeSwitch}>切换模式</button>
                {state.mode === 'puzzle' && <button type="button" onClick={returnToPuzzleSelect}>返回关卡选择</button>}
              </section>
            )}
          </aside>
          <section className="board-frame" data-testid="board-frame" aria-label="10 × 20 棋盘">
            {state.status === 'paused' && !modeSwitchOpen && (
              <div className="pause-strip" data-testid="pause-strip">
                <strong>暂停</strong><span aria-hidden="true" />
                <button className="pause-strip__primary" type="button" onClick={() => { runtime?.togglePause(); focusBoard(); }}>继续</button>
                <button type="button" onClick={() => { runtime?.restart(); focusBoard(); }}>重新开始</button>
              </div>
            )}
            {terminal && !modeSwitchOpen && (
              <div className="end-strip" data-testid="end-strip">
                <strong>{terminal.title}</strong><span>{terminal.detail}</span>
                {state.mode === 'puzzle' ? (
                  <button type="button" onClick={state.puzzleCompletion === 'finished' ? startNextPuzzle : () => { runtime?.restart(); focusBoard(); }}>
                    {state.puzzleCompletion === 'finished' ? (state.nextUnlockedLevelId ? '下一关' : '返回关卡选择') : '重新开始关卡'}
                  </button>
                ) : <button type="button" onClick={() => { runtime?.restart(); focusBoard(); }}>再来一局</button>}
              </div>
            )}
          </section>
          {liveSession && (
            <aside className="side-rail" data-testid="side-rail">
              <div className="next-slot" data-testid="next-slot" aria-label="下一个方块" />
              {state.status === 'playing' && <button className="pause-action" type="button" onClick={() => runtime?.togglePause()}>暂停</button>}
              <p className="keyboard-map">← → 移动　↑ 旋转<br />↓ 快速下落　空格/⇣ 直接落底</p>
              <RunStats state={state} />
            </aside>
          )}
          {!isReady && !modeSwitchOpen && !puzzleSelectOpen && isTerminal && <RunStats state={state} />}
          <section className="touch-deck" data-testid="touch-rail" aria-label="触控操作">
            <TouchButton action="left" label="左移" glyph="←" runtime={runtime} />
            <TouchButton action="right" label="右移" glyph="→" runtime={runtime} />
            <TouchButton action="rotate-cw" label="旋转" glyph="↑" runtime={runtime} />
            <TouchButton action="soft-drop" label="快速下落" glyph="↓" runtime={runtime} />
            <TouchButton action="hard-drop" label="直接落底" glyph="⇣" runtime={runtime} />
          </section>
        </section>
      </main>
      <div className="sr-only" aria-live="polite">{liveMessage}</div>
    </div>
  );
}

function eventMessage(event: GameEvent): string {
  if (event.type === 'lines-cleared') return `消除了 ${event.count} 行。`;
  if (event.type === 'paused') return '暂停。';
  if (event.type === 'resumed') return '继续游戏。';
  if (event.type === 'finished') return '本局完成。';
  if (event.type === 'game-over') return event.reason === 'puzzle-budget' ? '方块已用尽。' : '本局结束。';
  return '';
}
