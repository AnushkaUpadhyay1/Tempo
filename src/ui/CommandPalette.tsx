import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from '../lib/cx';
import styles from './CommandPalette.module.css';

export interface Command {
  id: string;
  label: string;
  group: string;
  icon: IconName;
  hint?: string;
  keywords?: string;
  run: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

const matches = (c: Command, q: string) => {
  const hay = `${c.label} ${c.group} ${c.keywords ?? ''} ${c.hint ?? ''}`.toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((part) => hay.includes(part));
};

/**
 * Search and run anything with the keyboard (⌘K or Ctrl+K). A combobox with
 * a listbox: arrows move, Enter runs, Escape closes.
 */
export function CommandPalette({ open, onClose, commands }: CommandPaletteProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const id = useId();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const results = useMemo(
    () => commands.filter((c) => matches(c, query)).slice(0, 12),
    [commands, query],
  );

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      setQuery('');
      setActive(0);
      d.showModal();
      input.current?.focus();
    } else if (!open && d.open) {
      d.close();
      if (opener.current && document.contains(opener.current)) opener.current.focus();
    }
  }, [open]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    c.run();
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (results.length ? (a + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[active]);
    }
  };

  const optionId = (i: number) => `${id}-o${i}`;
  let lastGroup = '';

  return (
    <dialog
      ref={dialog}
      className={styles.palette}
      aria-label="Command menu"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      {open && (
        <div className={styles.panel}>
          <div className={styles.search}>
            <Icon name="search" />
            <input
              ref={input}
              className={styles.input}
              role="combobox"
              aria-expanded="true"
              aria-controls={`${id}-list`}
              aria-activedescendant={results[active] ? optionId(active) : undefined}
              aria-autocomplete="list"
              aria-label="Search commands and medicines"
              placeholder="Search or jump to…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKey}
            />
            <kbd className={styles.kbd}>esc</kbd>
          </div>
          <div id={`${id}-list`} role="listbox" aria-label="Results" className={styles.list}>
            {results.map((c, i) => {
              const header = c.group !== lastGroup ? c.group : null;
              lastGroup = c.group;
              return (
                <div key={c.id} role="presentation">
                  {header && (
                    <div className={styles.group} aria-hidden="true">
                      {header}
                    </div>
                  )}
                  {/* Options are reached with the arrow keys from the search box; clicks are a convenience. */}
                  {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
                  <div
                    id={optionId(i)}
                    role="option"
                    aria-selected={i === active}
                    tabIndex={-1}
                    className={cx(styles.option, i === active && styles.active)}
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(c)}
                  >
                    <Icon name={c.icon} size="sm" />
                    <span className={styles.label}>{c.label}</span>
                    {c.hint && <span className={styles.hint}>{c.hint}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          {results.length === 0 && (
            <p className={styles.empty} role="status">
              Nothing matches “{query}”.
            </p>
          )}
        </div>
      )}
    </dialog>
  );
}
