import type { ButtonHTMLAttributes, Ref } from 'react';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from '../lib/cx';
import styles from './IconButton.module.css';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: IconName;
  /** Required accessible name. */
  label: string;
  variant?: 'ghost' | 'secondary' | 'primary';
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  className,
  type = 'button',
  ref,
  ...rest
}: IconButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cx(styles.button, styles[variant], className)}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
