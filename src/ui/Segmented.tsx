import { useId, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from '../lib/cx';
import f from './field.module.css';
import styles from './Segmented.module.css';

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: IconName;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** A row of mutually exclusive options. Radio group semantics with arrow keys. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const id = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const onKey = (event: KeyboardEvent) => {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div className={f.field}>
      <span id={id} className={f.label}>
        {label}
      </span>
      {/* eslint-disable-next-line jsx-a11y/interactive-supports-focus -- focus lives on the radios inside */}
      <div role="radiogroup" aria-labelledby={id} className={styles.track} onKeyDown={onKey}>
        {options.map((o, i) => (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            tabIndex={i === index ? 0 : -1}
            className={cx(styles.option, o.value === value && styles.on)}
            onClick={() => onChange(o.value)}
          >
            {o.icon && <Icon name={o.icon} size="sm" />}
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
