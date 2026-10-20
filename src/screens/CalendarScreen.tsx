import { Link } from 'react-router';
import { ButtonLink, EmptyState, Icon } from '../ui';
import { copy } from '../app/copy';
import { useNow, useStore } from '../data/StoreProvider';
import type { Appointment } from '../data/types';
import { addDays, dateKey, formatTime, parseDateKey, relativeDay } from '../lib/time';
import { usePageTitle } from '../lib/usePageTitle';
import { PageHeader } from '../components/PageHeader';
import s from './screen.module.css';
import local from './CalendarScreen.module.css';

const byTime = (a: Appointment, b: Appointment) =>
  `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`);

function AppointmentCard({ a, today }: { a: Appointment; today: string }) {
  const date = parseDateKey(a.date);
  const done = a.checklist.filter((c) => c.done).length;
  return (
    <li className={local.card}>
      <span className={local.date} aria-hidden="true">
        <span className={local.month}>{date.toLocaleDateString('en-GB', { month: 'short' })}</span>
        <span className={local.day}>{date.getDate()}</span>
      </span>
      <div className={local.body}>
        <h3 className={local.title}>
          <Link to={`/calendar/${a.id}`} className={local.link}>
            {a.title}
          </Link>
        </h3>
        <p className={local.when}>
          {relativeDay(a.date, today)} · <span className="t-num">{formatTime(a.time)}</span>
        </p>
        <p className={local.place}>
          <Icon name="place" size="sm" />
          {a.place}
        </p>
      </div>
      <span className={local.packed}>{copy.calendar.packed(done, a.checklist.length)}</span>
    </li>
  );
}

export default function CalendarScreen() {
  usePageTitle(copy.calendar.title, 'Tempo');
  const { data } = useStore();
  const today = dateKey(useNow());
  const weekEnd = addDays(today, 7);
  const sorted = [...data.appointments].sort(byTime);
  const groups = [
    {
      id: 'week',
      title: copy.calendar.thisWeek,
      items: sorted.filter((a) => a.date >= today && a.date <= weekEnd),
    },
    { id: 'later', title: copy.calendar.later, items: sorted.filter((a) => a.date > weekEnd) },
    {
      id: 'past',
      title: copy.calendar.past,
      items: sorted.filter((a) => a.date < today).reverse(),
    },
  ].filter((g) => g.items.length);

  return (
    <div className={s.page}>
      <PageHeader
        title={copy.calendar.title}
        actions={
          <ButtonLink to="/calendar/new" variant="secondary" icon="plus">
            <span className="t-sr-only">{copy.calendar.add}</span>
            <span aria-hidden="true">New</span>
          </ButtonLink>
        }
      />
      {groups.length === 0 ? (
        <EmptyState
          icon="calendar"
          title={copy.calendar.empty}
          action={
            <ButtonLink to="/calendar/new" icon="plus">
              {copy.calendar.add}
            </ButtonLink>
          }
        >
          {copy.calendar.emptyBody}
        </EmptyState>
      ) : (
        groups.map((g) => (
          <section key={g.id} className={s.section} aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`} className={s.sectionTitle}>
              {g.title}
            </h2>
            <ul className={s.list}>
              {g.items.map((a) => (
                <AppointmentCard key={a.id} a={a} today={today} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
