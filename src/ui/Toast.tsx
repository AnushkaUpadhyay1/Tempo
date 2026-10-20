import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { usePausableTimer } from './ToastProvider';
import styles from './Toast.module.css';

export interface ToastOptions {
  message: string;
  /** Usually "Undo". Leave out for a plain confirmation. */
  actionLabel?: string;
  onAction?: () => void;
  /** Milliseconds before the toast hides. Defaults to 8000. */
  duration?: number;
  icon?: IconName;
}

export interface ToastData extends ToastOptions {
  id: number;
  duration: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: () => void;
}

/**
 * The visible toast. Announcements go through the provider's live region so
 * the message is read once, without the buttons. Hovering or focusing the
 * toast pauses its timer (WCAG 2.2.1 Timing Adjustable).
 */
export function Toast({ toast, onDismiss }: ToastProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const ref = useRef<HTMLDivElement>(null);

  // Pause while the pointer is over the toast or focus is inside it. These
  // listeners only pause the timer; the toast's controls are its buttons.
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const enter = () => setHovered(true);
    const leave = () => setHovered(false);
    const focusIn = () => setFocused(true);
    const focusOut = (event: FocusEvent) => {
      if (!node.contains(event.relatedTarget as Node | null)) setFocused(false);
    };
    node.addEventListener('pointerenter', enter);
    node.addEventListener('pointerleave', leave);
    node.addEventListener('focusin', focusIn);
    node.addEventListener('focusout', focusOut);
    return () => {
      node.removeEventListener('pointerenter', enter);
      node.removeEventListener('pointerleave', leave);
      node.removeEventListener('focusin', focusIn);
      node.removeEventListener('focusout', focusOut);
    };
  }, []);
  usePausableTimer(onDismiss, toast.duration, paused);
  const closeOnEscape = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') onDismiss();
  };

  return (
    <div className={styles.toast} ref={ref} role="group" aria-label="Notification">
      <Icon name={toast.icon ?? 'check-circle'} size="md" className={styles.icon} />
      <p className={styles.message}>{toast.message}</p>
      <div className={styles.actions}>
        {toast.actionLabel && (
          <button
            type="button"
            className={styles.action}
            onKeyDown={closeOnEscape}
            onClick={() => {
              toast.onAction?.();
              onDismiss();
            }}
          >
            <Icon name="undo" size="sm" />
            {toast.actionLabel}
          </button>
        )}
        <button
          type="button"
          className={styles.close}
          aria-label="Close notification"
          onClick={onDismiss}
          onKeyDown={closeOnEscape}
        >
          <Icon name="close" size="md" />
        </button>
      </div>
      <span
        className={styles.timer}
        style={{
          animationDuration: `${toast.duration}ms`,
          animationPlayState: paused ? 'paused' : 'running',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
