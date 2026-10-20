import { useState } from 'react';
import { Link } from 'react-router';
import { ButtonLink, EmptyState, Field, Icon, Pill } from '../ui';
import { copy } from '../app/copy';
import { useStore } from '../data/StoreProvider';
import { amountText, daysLeft, instructions, needsRefill } from '../data/schedule';
import { formatTime } from '../lib/time';
import { usePageTitle } from '../lib/usePageTitle';
import { PageHeader } from '../components/PageHeader';
import s from './screen.module.css';
import local from './MedsScreen.module.css';

export default function MedsScreen() {
  usePageTitle(copy.meds.title, 'Tempo');
  const { data } = useStore();
  const [query, setQuery] = useState('');
  const meds = [...data.medicines]
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter((m) => `${m.name} ${m.purpose}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className={s.page}>
      <PageHeader title={copy.meds.title} subtitle={copy.meds.count(data.medicines.length)} />
      {data.medicines.length === 0 ? (
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
        <>
          <Field
            label={copy.meds.search}
            hideLabel
            placeholder={`${copy.meds.search}…`}
            type="search"
            value={query}
            onChange={setQuery}
            optional
            showOptional={false}
          />
          {meds.length === 0 && (
            <p className={s.muted} role="status">
              {copy.meds.noMatch(query)}
            </p>
          )}
          <ul className={local.grid} aria-label={copy.meds.title}>
            {meds.map((m) => {
              const days = daysLeft(m);
              const pct = Math.min(100, Math.round((days / 30) * 100));
              return (
                <li key={m.id} className={local.card}>
                  <div className={local.top}>
                    <h2 className={local.name}>
                      <Link to={`/meds/${m.id}`} className={local.link}>
                        {m.name}
                      </Link>
                    </h2>
                    {needsRefill(m) && <Pill tone="warning" label={copy.meds.low} />}
                  </div>
                  <p className={local.meta}>
                    {m.purpose ? `${m.purpose} · ${instructions(m)}` : instructions(m)}
                  </p>
                  <ul className={local.times} aria-label={copy.meds.schedule}>
                    {m.times.map((t) => (
                      <li key={t} className={`${local.time} t-num`}>
                        <Icon name="clock" size="sm" />
                        {formatTime(t)}
                      </li>
                    ))}
                  </ul>
                  <div className={local.supply}>
                    <div className={local.supplyText}>
                      <span>{copy.meds.left(amountText(m.quantity, m.doseUnit))}</span>
                      <span className="t-num">{copy.meds.days(days)}</span>
                    </div>
                    <div
                      className={local.bar}
                      role="meter"
                      aria-label={`${copy.meds.supply}: ${m.name}`}
                      aria-valuemin={0}
                      aria-valuemax={30}
                      aria-valuenow={Math.min(days, 30)}
                      aria-valuetext={copy.meds.days(days)}
                    >
                      <span
                        className={needsRefill(m) ? local.fillLow : local.fill}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
