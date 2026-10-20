import { NavLink } from 'react-router';
import { Icon } from './Icon';
import type { IconName } from './Icon';
import { cx } from '../lib/cx';
import styles from './TabBar.module.css';

export interface Tab {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  badge?: number;
}

interface TabBarProps {
  label: string;
  tabs: [Tab, Tab, Tab, Tab];
  /** The raised centre button, e.g. "Add". */
  action: { label: string; icon: IconName; onClick: () => void };
}

/** Floating bottom navigation with four tabs and a centre action button. */
export function TabBar({ label, tabs, action }: TabBarProps) {
  const link = (tab: Tab) => (
    <li key={tab.to}>
      <NavLink
        to={tab.to}
        end={tab.end}
        className={({ isActive }) => cx(styles.tab, isActive && styles.active)}
      >
        <span className={styles.iconWrap}>
          <Icon name={tab.icon} />
          {tab.badge ? (
            <span className={styles.badge} aria-hidden="true">
              {tab.badge}
            </span>
          ) : null}
        </span>
        <span className={styles.label}>{tab.label}</span>
        {tab.badge ? <span className="t-sr-only">, {tab.badge} due</span> : null}
      </NavLink>
    </li>
  );
  return (
    <nav className={styles.bar} aria-label={label}>
      <ul className={styles.list}>
        {link(tabs[0])}
        {link(tabs[1])}
        <li className={styles.actionCell}>
          <button
            type="button"
            className={styles.action}
            onClick={action.onClick}
            aria-label={action.label}
          >
            <Icon name={action.icon} size="lg" />
          </button>
        </li>
        {link(tabs[2])}
        {link(tabs[3])}
      </ul>
    </nav>
  );
}
