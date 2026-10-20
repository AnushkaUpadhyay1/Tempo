import { useId } from 'react';
import { Icon } from './Icon';
import { cx } from '../lib/cx';
import styles from './Checkbox.module.css';

export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Checkbox({ label, checked, onChange }: CheckboxProps) {
  const id = useId();
  return (
    <label htmlFor={id} className={cx(styles.row, checked && styles.on)}>
      <input
        id={id}
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.box} aria-hidden="true">
        {checked && <Icon name="check" size="sm" />}
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  );
}
