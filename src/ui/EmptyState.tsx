import type { ReactNode } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import styles from './EmptyState.module.css';

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: IconName;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.empty}>
      <span className={styles.icon}>
        <Icon name={icon} size="lg" />
      </span>
      <h2 className={styles.title}>{title}</h2>
      {children && <p className={styles.body}>{children}</p>}
      {action}
    </div>
  );
}
