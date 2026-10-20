import { useRef, useState } from 'react';
import type { PointerEvent, ReactNode } from 'react';
import { cx } from '../lib/cx';
import styles from './SwipeAction.module.css';

export interface SwipeActionProps {
  /** Runs when the row is swiped far enough to the right. */
  onSwipe: () => void;
  /** Shown behind the row while swiping, e.g. "Taken". */
  hint: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}

const THRESHOLD = 96;

/**
 * Swipe right to run an action. Swiping is a shortcut only: the same action
 * must also be available as a visible button inside the row (WCAG 2.5.1), so
 * keyboard, switch and screen reader users never need the gesture.
 */
export function SwipeAction({ onSwipe, hint, disabled, children }: SwipeActionProps) {
  const [dx, setDx] = useState(0);
  const start = useRef<{ x: number; y: number; id: number } | null>(null);
  const locked = useRef<'x' | 'y' | null>(null);
  // The latest distance, read on release even if React has not re-rendered yet.
  const distance = useRef(0);

  const down = (e: PointerEvent) => {
    if (
      disabled ||
      e.pointerType === 'mouse' ||
      (e.target as HTMLElement).closest('button, a, input')
    )
      return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    locked.current = null;
  };
  const move = (e: PointerEvent) => {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const x = e.clientX - s.x;
    const y = e.clientY - s.y;
    if (!locked.current && Math.hypot(x, y) > 8)
      locked.current = Math.abs(x) > Math.abs(y) ? 'x' : 'y';
    if (locked.current === 'x') {
      distance.current = Math.max(0, Math.min(x, 160));
      setDx(distance.current);
    }
  };
  const up = () => {
    if (start.current && distance.current >= THRESHOLD) onSwipe();
    start.current = null;
    distance.current = 0;
    locked.current = null;
    setDx(0);
  };

  return (
    <div className={styles.wrap}>
      <div className={cx(styles.hint, dx >= THRESHOLD && styles.armed)} aria-hidden="true">
        {hint}
      </div>
      <div
        className={cx(styles.row, dx > 0 && styles.dragging)}
        style={{ transform: dx ? `translateX(${dx}px)` : undefined }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {children}
      </div>
    </div>
  );
}
