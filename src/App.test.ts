// @vitest-environment jsdom

import { act, createElement, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { createInitialState, type PuzzleId } from './game/core';
import { cloneQaState, ModeHome, PuzzleLibrary, puzzleSilhouettePaths } from './App';
import { CAMPAIGN_LEVELS, defaultPuzzleProgress } from './puzzleProgress';

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

function render(element: ReactNode): {
  container: HTMLDivElement;
  rerender: (next: ReactNode) => void;
  unmount: () => void;
} {
  const container = document.createElement('div');
  document.body.append(container);
  const root: Root = createRoot(container);
  act(() => root.render(element));
  return {
    container,
    rerender: (next) => act(() => root.render(next)),
    unmount: () => act(() => {
      root.unmount();
      container.remove();
    }),
  };
}

describe('DEV QA state snapshot isolation', () => {
  it('detaches scalar, active piece, queue, and nested board state', () => {
    const canonical = createInitialState(0x51a1f00d, 'puzzle', 't3r-shaft-01');
    const snapshot = cloneQaState(canonical);
    const original = structuredClone(canonical);

    expect(snapshot).not.toBe(canonical);
    expect(snapshot.active).not.toBe(canonical.active);
    expect(snapshot.queue).not.toBe(canonical.queue);
    expect(snapshot.board).not.toBe(canonical.board);
    expect(snapshot.board[0]).not.toBe(canonical.board[0]);

    snapshot.status = 'game-over';
    if (snapshot.active) snapshot.active.x += 3;
    snapshot.queue[0] = snapshot.queue[0] === 'I' ? 'T' : 'I';
    snapshot.board[0]![0] = snapshot.board[0]![0] === 'O' ? 'Z' : 'O';

    expect(canonical).toEqual(original);
  });
});

describe('T5 frontend campaign binding', () => {
  it('shows 经典 while retaining the internal marathon entry selector', () => {
    const onEnter = vi.fn();
    const view = render(createElement(ModeHome, { onEnter }));
    const classic = view.container.querySelector<HTMLButtonElement>('[data-testid="enter-marathon"]');

    expect(classic).not.toBeNull();
    expect(classic?.textContent).toContain('经典');
    expect(view.container.textContent).not.toContain('马拉松');
    expect(view.container.textContent?.match(/选择模式/g)).toHaveLength(1);
    expect(view.container.textContent).toContain('分数 · 消行 · 等级');
    expect(view.container.textContent).toContain('速度递增 · 无终点');
    expect(view.container.textContent).toContain('15 关残局 · 清空棋盘');
    expect(view.container.querySelector('.mode-preview')).toBeNull();

    for (const banned of ['当前选择', '三种玩法', '随时开始，也可随时退出。', '键盘与触控均可操作']) {
      expect(view.container.textContent).not.toContain(banned);
    }

    for (const selector of ['enter-marathon', 'enter-race', 'enter-puzzle']) {
      const entry = view.container.querySelector<HTMLButtonElement>(`[data-testid="${selector}"]`);
      act(() => entry?.focus());
      expect(entry?.getAttribute('aria-pressed')).toBe('true');
    }

    act(() => classic?.click());
    expect(onEnter).toHaveBeenCalledWith('marathon');
    view.unmount();
  });

  it('mounts all fifteen enabled levels and binds first, eighth, and fifteenth selections', () => {
    expect(CAMPAIGN_LEVELS).toHaveLength(15);
    const onSelect = vi.fn();
    const onStart = vi.fn();
    const selectedIndexes = [0, 7, CAMPAIGN_LEVELS.length - 1];
    const props = (selectedId: PuzzleId) => ({
      progress: defaultPuzzleProgress(),
      selectedId,
      onSelect,
      onStart,
      onBack: vi.fn(),
    });
    const view = render(createElement(PuzzleLibrary, props(CAMPAIGN_LEVELS[0]!.id)));

    const rows = [...view.container.querySelectorAll<HTMLButtonElement>('[data-testid="level-row"]')];
    expect(rows).toHaveLength(CAMPAIGN_LEVELS.length);
    expect(rows.map((row) => row.dataset.levelId)).toEqual(CAMPAIGN_LEVELS.map((level) => level.id));
    expect(rows.every((row) => !row.disabled && row.getAttribute('aria-pressed') !== null)).toBe(true);
    expect(view.container.querySelector('[data-testid="level-list"]')?.getAttribute('aria-label')).toBe('15 个可用解谜关卡');
    expect(rows[0]?.textContent).toBe(`01${CAMPAIGN_LEVELS[0]!.name}`);
    for (const banned of ['清空完整棋盘', '当前选择', '起始棋盘', '连续七袋方块', '不限定唯一解法']) {
      expect(view.container.textContent).not.toContain(banned);
    }
    expect(view.container.textContent).toContain('目标清空棋盘');

    act(() => rows[7]!.click());
    expect(onSelect).toHaveBeenCalledWith(CAMPAIGN_LEVELS[7]!.id);

    for (const index of selectedIndexes) {
      const level = CAMPAIGN_LEVELS[index]!;
      view.rerender(createElement(PuzzleLibrary, props(level.id)));
      const pressed = view.container.querySelector<HTMLButtonElement>('[data-testid="level-row"][aria-pressed="true"]');
      const canonical = createInitialState(0x51a1f00d, 'puzzle', level.id);
      const lockedTypes = new Set(canonical.board.flat().filter((cell): cell is NonNullable<typeof cell> => cell !== null));

      expect(pressed?.dataset.levelId).toBe(level.id);
      expect(view.container.querySelector('.level-detail h2')?.textContent).toBe(level.name);
      expect(canonical.puzzleId).toBe(level.id);
      expect(canonical.active?.type).toBeTruthy();
      expect(canonical.queue[0]).toBeTruthy();
      expect(lockedTypes.size).toBeGreaterThanOrEqual(5);
      expect(puzzleSilhouettePaths(level.id).size).toBe(lockedTypes.size);
      expect([...puzzleSilhouettePaths(level.id).values()].every((path) => path.includes('h3.8v3.8'))).toBe(true);
    }

    const desktopStart = view.container.querySelector<HTMLButtonElement>('[data-testid="start-selected-puzzle"]');
    const mobileStart = view.container.querySelector<HTMLButtonElement>('[data-testid="start-selected-puzzle-mobile"]');
    expect(desktopStart).not.toBeNull();
    expect(mobileStart).not.toBeNull();
    expect(desktopStart?.textContent).toBe('开始');
    expect(mobileStart?.textContent).toBe('开始');
    act(() => {
      desktopStart?.click();
      mobileStart?.click();
    });
    expect(onStart).toHaveBeenCalledTimes(2);
    view.unmount();
  });
});
