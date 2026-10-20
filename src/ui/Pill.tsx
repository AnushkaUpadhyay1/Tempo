import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from '../lib/cx';
import styles from './Pill.module.css';

export type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'accent';
const ICON: Record<PillTone, IconName> = {
  success: 'check',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  neutral: 'clock',
  accent: 'sparkle',
};

/** A small status label: always an icon and words, never colour alone. */
export function Pill({ tone, label, icon }: { tone: PillTone; label: string; icon?: IconName }) {
  return (
    <span className={cx(styles.pill, styles[tone])}>
      <Icon name={icon ?? ICON[tone]} size="sm" />
      {label}
    </span>
  );
}
