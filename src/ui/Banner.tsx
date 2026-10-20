import type { ReactNode } from 'react';
import { Icon } from './Icon';
import { cx } from '../lib/cx';
import styles from './Banner.module.css';

const ICONS = {
  info: 'info',
  warning: 'warning',
  danger: 'error',
  success: 'check-circle',
} as const;

/** An inline message. Pass live="polite" or "assertive" when it appears because of something the person did. */
export function Banner({
  tone = 'info',
  title,
  children,
  action,
  live,
}: {
  tone?: keyof typeof ICONS;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  live?: 'polite' | 'assertive';
}) {
  return (
    <div
      className={cx(styles.banner, styles[tone])}
      role={live === 'assertive' ? 'alert' : live ? 'status' : undefined}
    >
      <Icon name={ICONS[tone]} className={styles.icon} />
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        {children}
      </div>
      {action}
    </div>
  );
}
