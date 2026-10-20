import { useEffect, useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { IconButton } from './IconButton';
import styles from './Sheet.module.css';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  initialFocus?: RefObject<HTMLElement | null>;
}

/**
 * A bottom sheet on phones and a centred panel on wider screens. Built on the
 * native <dialog>: focus stays inside, Escape closes, and focus returns to the
 * control that opened it.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  initialFocus,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      const target =
        initialFocus?.current ??
        dialog.querySelector<HTMLElement>('[data-autofocus]') ??
        dialog.querySelector<HTMLElement>(
          'input, textarea, select, button:not([data-sheet-close])',
        );
      target?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocus]);

  // A tap on the dimmed backdrop (the dialog element itself) closes the sheet.
  // Escape and the Close button do the same for keyboard users.
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClick = (e: MouseEvent) => {
      if (e.target === dialog) onClose();
    };
    dialog.addEventListener('click', onClick);
    return () => dialog.removeEventListener('click', onClick);
  }, [onClose]);

  useEffect(() => {
    if (open) return;
    const target = opener.current;
    opener.current = null;
    if (target && document.contains(target)) target.focus();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-labelledby={`${id}-t`}
      aria-describedby={description ? `${id}-d` : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open && (
        <div className={styles.panel}>
          <span className={styles.handle} aria-hidden="true" />
          <div className={styles.header}>
            <h2 id={`${id}-t`} className={styles.title}>
              {title}
            </h2>
            <IconButton icon="close" label="Close" onClick={onClose} data-sheet-close="" />
          </div>
          {description && (
            <div id={`${id}-d`} className={styles.description}>
              {description}
            </div>
          )}
          {children && <div className={styles.body}>{children}</div>}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
