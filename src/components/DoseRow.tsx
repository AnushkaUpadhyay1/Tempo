import { Icon, IconButton, Pill, SwipeAction } from '../ui';
import type { PillTone } from '../ui';
import { copy } from '../app/copy';
import { formatTime } from '../lib/time';
import { instructions } from '../data/schedule';
import type { DoseInstance, DoseStatus } from '../data/types';
import { cx } from '../lib/cx';
import styles from './DoseRow.module.css';

const TONE: Record<DoseStatus, PillTone> = {
  taken: 'success',
  due: 'accent',
  overdue: 'warning',
  upcoming: 'neutral',
  missed: 'danger',
};

const takenTime = (dose: DoseInstance) =>
  formatTime(new Date(dose.record!.takenAt).toTimeString().slice(0, 5));

export function DoseRow({
  dose,
  onLog,
  onUnlog,
}: {
  dose: DoseInstance;
  onLog: (d: DoseInstance) => void;
  onUnlog: (d: DoseInstance) => void;
}) {
  const taken = dose.status === 'taken';
  const time = formatTime(dose.time);
  const name = dose.medicine.name;
  const titleId = `dose-${dose.key.replace(/[^a-z0-9-]/gi, '-')}`;
  return (
    <li aria-labelledby={titleId}>
      <SwipeAction
        onSwipe={() => onLog(dose)}
        disabled={taken}
        hint={
          <>
            <Icon name="check" /> {copy.today.swipeHint}
          </>
        }
      >
        <div
          className={cx(
            styles.row,
            taken && styles.taken,
            dose.status === 'overdue' && styles.overdue,
          )}
        >
          <span className={cx(styles.time, 't-num')}>{time}</span>
          <div className={styles.body}>
            <h3 id={titleId} className={styles.name}>
              {name}
            </h3>
            <p className={styles.meta}>{instructions(dose.medicine)}</p>
            {dose.status === 'overdue' && (
              <p className={styles.note}>{copy.today.overdueNote(time)}</p>
            )}
            {(dose.status !== 'upcoming' || taken) && (
              <Pill
                tone={TONE[dose.status]}
                label={taken ? copy.today.logged(takenTime(dose)) : copy.today.status[dose.status]}
              />
            )}
          </div>
          {taken ? (
            <IconButton
              icon="undo"
              label={`${copy.today.unlog}: ${name}, ${time}`}
              onClick={() => onUnlog(dose)}
            />
          ) : (
            <button type="button" className={styles.log} onClick={() => onLog(dose)}>
              <Icon name="check" size="sm" />
              {copy.today.log}
              <span className="t-sr-only">
                : {name}, {time}
              </span>
            </button>
          )}
        </div>
      </SwipeAction>
    </li>
  );
}
