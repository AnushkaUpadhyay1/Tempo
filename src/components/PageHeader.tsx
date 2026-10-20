import type { ReactNode } from 'react';
import { IconButton } from '../ui';
import { copy } from '../app/copy';
import { useShell } from '../app/ShellContext';
import s from '../screens/screen.module.css';

/** Screen title with the search (⌘K) shortcut on the right. */
export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  const { openPalette } = useShell();
  return (
    <header className={s.header}>
      <div className={s.headerText}>
        {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
        <h1 className={s.title}>{title}</h1>
        {subtitle && <p className={s.subtitle}>{subtitle}</p>}
      </div>
      <div className={s.headerActions}>
        {actions}
        <IconButton
          icon="search"
          label={copy.app.search}
          variant="secondary"
          onClick={openPalette}
        />
      </div>
    </header>
  );
}
