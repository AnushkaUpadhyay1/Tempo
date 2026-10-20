import { useId } from 'react';
import { cx } from '../lib/cx';
import styles from './Switch.module.css';

export interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Switch({ label, description, checked, onChange, disabled }: SwitchProps) {
  const id = useId();
  return (
    <div className={styles.row}>
      <span className={styles.text}>
        <span id={`${id}-l`} className={styles.label}>
          {label}
        </span>
        {description && (
          <span id={`${id}-d`} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-l`}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        className={cx(styles.switch, checked && styles.on)}
        onClick={() => onChange(!checked)}
      >
        <span className={styles.thumb} aria-hidden="true" />
      </button>
    </div>
  );
}
