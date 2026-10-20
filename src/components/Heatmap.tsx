import { copy } from '../app/copy';
import type { DayScore } from '../data/stats';
import { parseDateKey } from '../lib/time';
import styles from './Heatmap.module.css';

/** Four weeks of days, shaded by the share of doses logged. Each day is labelled in words. */
export function Heatmap({ days, today }: { days: DayScore[]; today: string }) {
  return (
    <ol className={styles.grid} aria-label={copy.you.heatmap}>
      {days.map((d) => {
        const label = parseDateKey(d.date).toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        });
        const level =
          d.ratio === null
            ? 'none'
            : d.ratio === 1
              ? '4'
              : d.ratio >= 0.75
                ? '3'
                : d.ratio >= 0.5
                  ? '2'
                  : d.ratio > 0
                    ? '1'
                    : '0';
        return (
          <li
            key={d.date}
            className={styles.cell}
            data-level={level}
            data-today={d.date === today || undefined}
          >
            <span className="t-sr-only">{copy.today.dayLabel(label, d.taken, d.scheduled)}</span>
          </li>
        );
      })}
    </ol>
  );
}
