import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';
import { Link } from 'react-router';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from '../lib/cx';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface Shared {
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  block?: boolean;
  icon?: IconName;
  iconEnd?: IconName;
  children: ReactNode;
  className?: string;
}

export interface ButtonProps
  extends Shared, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  ref?: Ref<HTMLButtonElement>;
}

const classes = ({ variant = 'primary', size = 'md', block, className }: Shared) =>
  cx(styles.button, styles[variant], styles[size], block && styles.block, className);

function Content({ icon, iconEnd, children }: Pick<Shared, 'icon' | 'iconEnd' | 'children'>) {
  return (
    <>
      {icon && <Icon name={icon} />}
      <span className={styles.label}>{children}</span>
      {iconEnd && <Icon name={iconEnd} />}
    </>
  );
}

export function Button({
  variant,
  size,
  block,
  icon,
  iconEnd,
  children,
  className,
  type = 'button',
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      ref={ref}
      type={type}
      className={classes({ variant, size, block, className, children })}
      {...rest}
    >
      <Content icon={icon} iconEnd={iconEnd}>
        {children}
      </Content>
    </button>
  );
}

/** A link that looks like a button, for navigation actions. */
export function ButtonLink({
  to,
  variant,
  size,
  block,
  icon,
  iconEnd,
  children,
  className,
}: Shared & { to: string }) {
  return (
    <Link to={to} className={classes({ variant, size, block, className, children })}>
      <Content icon={icon} iconEnd={iconEnd}>
        {children}
      </Content>
    </Link>
  );
}
