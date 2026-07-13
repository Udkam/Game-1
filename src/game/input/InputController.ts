export type RunnerAction = 'left' | 'right' | 'jump' | 'slide' | 'pause' | 'restart';

export interface SwipeSample {
  dx: number;
  dy: number;
  durationMs: number;
  viewportMin: number;
}

const KEY_BINDINGS: Record<string, RunnerAction> = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'jump',
  KeyW: 'jump',
  Space: 'jump',
  ArrowDown: 'slide',
  KeyS: 'slide',
  Escape: 'pause',
  KeyP: 'pause',
  KeyR: 'restart',
};

export function classifySwipe(sample: SwipeSample): RunnerAction | null {
  if (!Number.isFinite(sample.dx) || !Number.isFinite(sample.dy) || sample.durationMs < 0 || sample.durationMs > 1000) return null;
  const threshold = Math.max(28, sample.viewportMin * 0.05);
  const absX = Math.abs(sample.dx);
  const absY = Math.abs(sample.dy);
  if (Math.max(absX, absY) < threshold) return null;
  const speed = Math.hypot(sample.dx, sample.dy) / Math.max(1, sample.durationMs) * 1000;
  if (speed < 80) return null;
  if (absX >= absY * 1.25) return sample.dx < 0 ? 'left' : 'right';
  if (absY >= absX * 1.25) return sample.dy < 0 ? 'jump' : 'slide';
  return null;
}

interface PointerOrigin {
  id: number;
  x: number;
  y: number;
  time: number;
}

export class InputController {
  private pointer: PointerOrigin | null = null;

  constructor(
    private readonly emit: (action: RunnerAction) => void,
    private readonly keyboardTarget: Window | null = typeof window === 'undefined' ? null : window,
    private readonly gestureTarget: HTMLElement | null = null,
    private readonly suspend?: () => void,
  ) {
    this.keyboardTarget?.addEventListener('keydown', this.onKeyDown, { passive: false });
    this.keyboardTarget?.addEventListener('blur', this.onBlur);
    this.gestureTarget?.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    this.gestureTarget?.addEventListener('pointerup', this.onPointerUp, { passive: false });
    this.gestureTarget?.addEventListener('pointercancel', this.onPointerCancel);
    this.gestureTarget?.addEventListener('lostpointercapture', this.onPointerCancel);
    this.gestureTarget?.addEventListener('contextmenu', this.onContextMenu);
  }

  clear(): void {
    this.pointer = null;
  }

  destroy(): void {
    this.clear();
    this.keyboardTarget?.removeEventListener('keydown', this.onKeyDown);
    this.keyboardTarget?.removeEventListener('blur', this.onBlur);
    this.gestureTarget?.removeEventListener('pointerdown', this.onPointerDown);
    this.gestureTarget?.removeEventListener('pointerup', this.onPointerUp);
    this.gestureTarget?.removeEventListener('pointercancel', this.onPointerCancel);
    this.gestureTarget?.removeEventListener('lostpointercapture', this.onPointerCancel);
    this.gestureTarget?.removeEventListener('contextmenu', this.onContextMenu);
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    const action = KEY_BINDINGS[event.code];
    if (!action) return;
    const target = event.target;
    if (
      target instanceof Element &&
      target.closest('button,input,select,textarea,[contenteditable="true"],[role="button"]')
    ) return;
    event.preventDefault();
    if (!event.repeat) this.emit(action);
  };

  private readonly onBlur = (): void => {
    this.clear();
    this.suspend?.();
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault();
    this.pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
    this.gestureTarget?.setPointerCapture(event.pointerId);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const origin = this.pointer;
    if (!origin || origin.id !== event.pointerId) return;
    event.preventDefault();
    this.pointer = null;
    if (this.gestureTarget?.hasPointerCapture(event.pointerId)) this.gestureTarget.releasePointerCapture(event.pointerId);
    const action = classifySwipe({
      dx: event.clientX - origin.x,
      dy: event.clientY - origin.y,
      durationMs: Math.max(0, event.timeStamp - origin.time),
      viewportMin: Math.min(window.innerWidth, window.innerHeight),
    });
    if (action) this.emit(action);
  };

  private readonly onPointerCancel = (event: Event): void => {
    if (event instanceof PointerEvent && this.pointer?.id !== event.pointerId) return;
    this.pointer = null;
  };

  private readonly onContextMenu = (event: Event): void => event.preventDefault();
}
