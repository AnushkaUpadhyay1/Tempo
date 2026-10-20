import { ICONS } from './icons';
import type { IconName } from './icons';
import { cx } from '../lib/cx';
import styles from './Icon.module.css';

export type { IconName } from './icons';

export interface IconProps {
  name: IconName;
  size?: 'sm' | 'md' | 'lg';
  /** Give a label only when the icon carries meaning on its own. */
  label?: string;
  className?: string;
}

export function Icon({ name, size = 'md', label, className }: IconProps) {
  return (
    <svg
      className={cx(styles.icon, styles[size], className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      {ICONS[name]}
    </svg>
  );
}
