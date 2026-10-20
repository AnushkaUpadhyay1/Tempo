import type { ReactNode } from 'react';
import styles from './ProgressRing.module.css';

export interface ProgressRingProps {
  value: number;
  max: number;
  /** Spoken label, e.g. "Doses taken today". */
  label: string;
  /** Text read with the value, e.g. "3 of 4 taken". */
  valueText: string;
  size?: number;
  children?: ReactNode;
}

/** A circular progress meter with its value in the middle. */
export function ProgressRing({
  value,
  max,
  label,
  valueText,
  size = 132,
  children,
}: ProgressRingProps) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div
      className={styles.ring}
      style={{ width: size, height: size }}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
    >
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className={styles.track}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className={styles.fill}
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className={styles.center}>{children}</div>
    </div>
  );
}
