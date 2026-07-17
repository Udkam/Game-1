import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ActionSheetProps {
  open: boolean;
  title: string;
  description: string;
  tone?: 'default' | 'success' | 'danger';
  onCancel?: () => void;
  children: ReactNode;
}

const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function ActionSheet({
  open,
  title,
  description,
  tone = 'default',
  onCancel,
  children,
}: ActionSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusInitial = () => {
      const preferred = panel?.querySelector<HTMLElement>('[data-autofocus]');
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      (preferred ?? first ?? panel)?.focus({ preventScroll: true });
    };
    const frame = requestAnimationFrame(focusInitial);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onCancel) {
        event.preventDefault();
        event.stopPropagation();
        onCancel();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;
      const focusable = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown, true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => previouslyFocused?.focus({ preventScroll: true }));
      });
    };
  }, [onCancel, open]);

  if (!open) return null;

  return (
    <div className="sheet-backdrop" data-testid="action-sheet-backdrop">
      <section
        ref={panelRef}
        className={`action-sheet action-sheet--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="action-sheet__actions">{children}</div>
      </section>
    </div>
  );
}
