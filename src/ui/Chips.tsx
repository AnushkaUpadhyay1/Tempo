import { useId } from 'react';
import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from '../lib/cx';
import f from './field.module.css';
import styles from './Chips.module.css';

export interface ChipOption {
  value: string;
  label: string;
  icon?: IconName;
  /** Small secondary text, e.g. a time. */
  detail?: string;
  /** A colour dot, for accent pickers. Decorative: the label names the colour. */
  swatch?: string;
}

interface ChipGroupProps {
  legend: string;
  hideLegend?: boolean;
  options: ChipOption[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  error?: string;
  hint?: string;
  children?: ReactNode;
}

/** Pill-shaped choices built on native radios or checkboxes. */
export function ChipGroup({
  legend,
  hideLegend,
  options,
  value,
  onChange,
  multiple,
  error,
  hint,
  children,
}: ChipGroupProps) {
  const id = useId();
  const values = Array.isArray(value) ? value : value ? [value] : [];
  const describedBy =
    [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  const toggle = (v: string) => {
    if (!multiple) onChange(v);
    else onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  };
  return (
    <fieldset className={f.fieldset} aria-describedby={describedBy}>
      <legend className={cx(f.label, f.legend, hideLegend && 't-sr-only')}>{legend}</legend>
      {hint && (
        <p id={`${id}-hint`} className={cx(f.hint, styles.below)}>
          {hint}
        </p>
      )}
      <div className={styles.chips}>
        {options.map((o) => {
          const checked = values.includes(o.value);
          const inputId = `${id}-${o.value.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
          return (
            <label
              key={o.value}
              htmlFor={inputId}
              className={cx(styles.chip, checked && styles.on)}
            >
              <input
                id={inputId}
                className={styles.input}
                type={multiple ? 'checkbox' : 'radio'}
                name={id}
                value={o.value}
                checked={checked}
                onChange={() => toggle(o.value)}
              />
              {o.swatch && (
                <span
                  className={styles.swatch}
                  style={{ background: o.swatch }}
                  aria-hidden="true"
                />
              )}
              {checked ? (
                <Icon name="check" size="sm" />
              ) : (
                o.icon && <Icon name={o.icon} size="sm" />
              )}
              <span>{o.label}</span>
              {o.detail && <span className={styles.detail}>{o.detail}</span>}
            </label>
          );
        })}
        {children}
      </div>
      {error && (
        <p id={`${id}-error`} className={cx(f.error, styles.above)}>
          <Icon name="error" size="sm" />
          {error}
        </p>
      )}
    </fieldset>
  );
}
