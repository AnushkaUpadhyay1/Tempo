import { Link } from 'react-router';
import { Banner, ButtonLink, EmptyState, Icon, Pill, ProgressRing, useToast } from '../ui';
import { copy } from '../app/copy';
import { useNow, useStore } from '../data/StoreProvider';
import { amountText, dosesForDay, groupByPeriod, needsRefill } from '../data/schedule';
import { adherence, currentStreak, recentDays } from '../data/stats';
import type { DoseInstance } from '../data/types';
import { useSettings } from '../settings/SettingsProvider';
import { buzz } from '../settings/settings';
import { dateKey, formatTime } from '../lib/time';
import { usePageTitle } from '../lib/usePageTitle';
import { PageHeader } from '../components/PageHeader';
import { DoseRow } from '../components/DoseRow';
import { WeekStrip } from '../components/WeekStrip';
import { LoadNotice } from '../components/LoadNotice';
import s from './screen.module.css';
import local from './TodayScreen.module.css';

export default function TodayScreen() {
  usePageTitle(copy.tabs.today, 'Tempo');
  const { data, dispatch } = useStore();
  const { settings } = useSettings();
  const toast = useToast();
  const now = useNow();
  const today = dateKey(now);
  const doses = dosesForDay(data.medicines, data.doses, today, now);
  const taken = doses.filter((d) => d.status === 'taken').length;
  const overdue = doses.filter((d) => d.status === 'overdue').length;
  const allDone = doses.length > 0 && taken === doses.length;
  const streak = currentStreak(data.medicines, data.doses, now);
  const month = adherence(data.medicines, data.doses, now, 30);
  const next = doses.find(
    (d) => d.status === 'due' || d.status === 'upcoming' || d.status === 'overdue',
  );
  const low = data.medicines.filter(needsRefill);

  const log = (dose: DoseInstance) => {
    const target = { medicineId: dose.medicine.id, date: dose.date, time: dose.time };
    dispatch({ type: 'take-dose', ...target, takenAt: new Date().toISOString() });
    buzz(settings);
    toast.show({
      message: copy.today.loggedToast(dose.medicine.name),
      actionLabel: copy.today.undo,
      onAction: () => dispatch({ type: 'untake-dose', ...target }),
    });
  };
  const unlog = (dose: DoseInstance) => {
    dispatch({
      type: 'untake-dose',
      medicineId: dose.medicine.id,
      date: dose.date,
      time: dose.time,
    });
    toast.show({ message: copy.today.unloggedToast(dose.medicine.name), icon: 'undo' });
  };

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow={now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        })}
        title={copy.today.greeting(data.profile.name, now.getHours())}
      />
      <LoadNotice />

      {doses.length > 0 && (
        <section className={local.hero} aria-label="Summary">
          <ProgressRing
            value={taken}
            max={doses.length}
            label={copy.today.ringLabel}
            valueText={copy.today.ringValue(taken, doses.length)}
          >
            <span className={local.ringValue}>
              {taken}
              <span className={local.ringOf}>/{doses.length}</span>
            </span>
            <span className={local.ringLabel}>{copy.today.today}</span>
          </ProgressRing>
          <div className={local.heroStats}>
            <p className={local.streak}>
              <Icon name="flame" />
              <span>{streak > 0 ? copy.today.streak(streak) : copy.today.noStreak}</span>
            </p>
            <p className={local.next}>
              {next
                ? copy.today.next(next.medicine.name, formatTime(next.time))
                : copy.today.nextNone}
            </p>
            {month.percent !== null && (
              <Pill tone="accent" icon="bolt" label={`${month.percent}% · 30 days`} />
            )}
          </div>
        </section>
      )}

      <section className={s.section} aria-labelledby="week-h">
        <h2 id="week-h" className="t-sr-only">
          {copy.today.week}
        </h2>
        <WeekStrip days={recentDays(data.medicines, data.doses, now, 7)} today={today} />
      </section>

      {allDone && (
        <Banner tone="success" title={copy.today.allDone} live="polite">
          <p>{copy.today.allDoneBody(streak)}</p>
        </Banner>
      )}
      {overdue > 0 && <Banner tone="warning" title={copy.today.overdueCount(overdue)} />}
      {low.map((m) => (
        <Banner
          key={m.id}
          tone="info"
          title={copy.today.low(m.name, amountText(m.quantity, m.doseUnit))}
          action={
            <Link to={`/meds/${m.id}`} className={local.inlineLink}>
              {copy.today.lowAction}
            </Link>
          }
        />
      ))}

      {doses.length === 0 ? (
        <EmptyState
          icon="pill"
          title={copy.today.empty}
          action={
            <ButtonLink to="/meds/new" icon="plus">
              {copy.today.addMed}
            </ButtonLink>
          }
        >
          {copy.today.emptyBody}
        </EmptyState>
      ) : (
        groupByPeriod(doses).map((group) => (
          <section key={group.period} className={s.section} aria-labelledby={`p-${group.period}`}>
            <h2 id={`p-${group.period}`} className={s.sectionTitle}>
              {copy.today.periods[group.period]}
              <span className={s.sectionMeta}>
                {group.doses.filter((d) => d.status === 'taken').length}/{group.doses.length}
              </span>
            </h2>
            <ul className={s.list}>
              {group.doses.map((dose) => (
                <DoseRow key={dose.key} dose={dose} onLog={log} onUnlog={unlog} />
              ))}
            </ul>
          </section>
        ))
      )}
      {doses.length > 0 && <p className={s.muted}>{copy.today.swipeTip}</p>}
      <p className={s.muted}>{copy.app.noBackground}</p>
    </div>
  );
}
