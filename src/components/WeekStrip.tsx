import { copy } from '../app/copy';
import { parseDateKey } from '../lib/time';
import type { DayScore } from '../data/stats';
import { cx } from '../lib/cx';
import styles from './WeekStrip.module.css';

/** Seven days, each a small ring showing how much was logged. */
export function WeekStrip({ days, today }: { days: DayScore[]; today: string }) {
  return (
    <ol className={styles.strip} aria-label={copy.today.week}>
      {days.map((d) => {
        const date = parseDateKey(d.date);
        const short = date.toLocaleDateString('en-GB', { weekday: 'narrow' });
        const long = date.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        });
        const ratio = d.ratio ?? 0;
        const full = d.scheduled > 0 && d.taken === d.scheduled;
        return (
          <li key={d.date} className={cx(styles.day, d.date === today && styles.today)}>
            <span className={styles.label} aria-hidden="true">
              {short}
            </span>
            <span
              className={cx(styles.dot, full && styles.full)}
              style={{ ['--p' as string]: `${Math.round(ratio * 100)}%` }}
              aria-hidden="true"
            >
              {date.getDate()}
            </span>
            <span className="t-sr-only">
              {copy.today.dayLabel(
                d.date === today ? `Today, ${long}` : long,
                d.taken,
                d.scheduled,
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
