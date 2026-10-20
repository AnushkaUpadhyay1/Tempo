import { useId } from 'react';
import { IconButton } from '../ui';
import { copy } from '../app/copy';
import styles from './NumberField.module.css';

/** A compact number input with minus and plus buttons. */
export function NumberField({
  label,
  value,
  onChange,
  min = 0,
  max = 999,
  suffix,
  error,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
  error?: string;
}) {
  const id = useId();
  const clamp = (n: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
  return (
    <div className={styles.field}>
      <label htmlFor={id} className={styles.label}>
        {label}
      </label>
      <div className={styles.row}>
        <IconButton
          icon="minus"
          label={copy.form.less(label)}
          variant="secondary"
          disabled={value <= min}
          onClick={() => onChange(clamp(value - 1))}
        />
        <input
          id={id}
          className={styles.input}
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            [suffix && `${id}-s`, error && `${id}-e`].filter(Boolean).join(' ') || undefined
          }
          onChange={(e) => onChange(clamp(Math.round(Number(e.target.value))))}
        />
        <IconButton
          icon="plus"
          label={copy.form.more(label)}
          variant="secondary"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + 1))}
        />
        {suffix && (
          <span id={`${id}-s`} className={styles.suffix}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span id={`${id}-e`} className={styles.error}>
          {error}
        </span>
      )}
    </div>
  );
}
