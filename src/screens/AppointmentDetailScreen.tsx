import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Banner,
  Button,
  ButtonLink,
  Checkbox,
  Field,
  Icon,
  IconButton,
  Sheet,
  useToast,
} from '../ui';
import { copy } from '../app/copy';
import { useStore } from '../data/StoreProvider';
import { appointmentToIcs, downloadFile } from '../lib/ics';
import { formatDate, formatTime } from '../lib/time';
import { usePageTitle } from '../lib/usePageTitle';
import s from './screen.module.css';
import local from './AppointmentDetailScreen.module.css';

const c = copy.calendar;

export default function AppointmentDetailScreen() {
  const { id } = useParams();
  const { data, dispatch } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [item, setItem] = useState('');
  const [itemError, setItemError] = useState('');
  const [confirm, setConfirm] = useState(false);
  const a = data.appointments.find((x) => x.id === id);
  usePageTitle(a?.title ?? c.notFound, 'Tempo');

  if (!a) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>{copy.notFound.title}</h1>
        <p>{c.notFound}</p>
        <ButtonLink to="/calendar" variant="secondary">
          {c.back}
        </ButtonLink>
      </div>
    );
  }
  const done = a.checklist.filter((x) => x.done).length;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.place)}`;

  return (
    <div className={s.page}>
      <Link to="/calendar" className={s.back}>
        <Icon name="chevron-left" size="sm" />
        {c.back}
      </Link>
      <header className={s.headerText}>
        <span className={s.eyebrow}>
          {formatDate(a.date)} · {formatTime(a.time)}
        </span>
        <h1 className={s.title}>{a.title}</h1>
      </header>

      <section className={s.card} aria-label={c.when}>
        <dl className={s.details}>
          {a.withWhom && (
            <div>
              <dt>{c.with}</dt>
              <dd>{a.withWhom}</dd>
            </div>
          )}
          <div>
            <dt>{c.where}</dt>
            <dd>{a.place}</dd>
          </div>
          {a.notes && (
            <div>
              <dt>{c.notes}</dt>
              <dd>{a.notes}</dd>
            </div>
          )}
        </dl>
        <div className={s.row}>
          <Button
            icon="calendar-plus"
            onClick={() => {
              const ok = downloadFile(
                `${a.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`,
                appointmentToIcs(a),
                'text/calendar',
              );
              if (ok) toast.show({ message: c.icsDone, icon: 'download' });
            }}
          >
            {c.ics}
          </Button>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={local.external}>
            <Icon name="place" size="sm" />
            {c.directions}
            <span className="t-sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </section>

      <section className={s.section} aria-labelledby="bring-h">
        <h2 id="bring-h" className={s.sectionTitle}>
          {c.checklist}
          <span className={s.sectionMeta} aria-live="polite">
            {done}/{a.checklist.length}
          </span>
        </h2>
        {a.checklist.length === 0 ? (
          <p className={s.muted}>{c.checklistEmpty}</p>
        ) : (
          <ul className={`${s.card} ${local.checklist}`}>
            {a.checklist.map((x) => (
              <li key={x.id} className={local.item}>
                <Checkbox
                  label={x.label}
                  checked={x.done}
                  onChange={() =>
                    dispatch({ type: 'toggle-checklist', appointmentId: a.id, itemId: x.id })
                  }
                />
                <IconButton
                  icon="close"
                  label={c.removeItem(x.label)}
                  onClick={() =>
                    dispatch({ type: 'remove-checklist', appointmentId: a.id, itemId: x.id })
                  }
                />
              </li>
            ))}
          </ul>
        )}
        {a.checklist.length > 0 && done === a.checklist.length && (
          <Banner tone="success" title={c.allPacked} live="polite" />
        )}
        <form
          className={local.add}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!item.trim()) return setItemError(c.addItemRequired);
            dispatch({ type: 'add-checklist', appointmentId: a.id, label: item });
            setItem('');
            setItemError('');
          }}
        >
          <Field label={c.addItemLabel} value={item} error={itemError} onChange={setItem} />
          <Button type="submit" variant="secondary" icon="plus">
            {c.addItem}
          </Button>
        </form>
      </section>

      <div className={s.row}>
        <ButtonLink to={`/calendar/${a.id}/edit`} variant="secondary" icon="edit">
          {c.edit}
        </ButtonLink>
        <Button variant="ghost" icon="trash" onClick={() => setConfirm(true)}>
          {c.delete}
        </Button>
      </div>

      <Sheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title={c.deleteTitle(a.title)}
        description={c.deleteBody}
        footer={
          <>
            <Button variant="secondary" data-autofocus="" onClick={() => setConfirm(false)}>
              {copy.meds.keep}
            </Button>
            <Button
              variant="danger"
              icon="trash"
              onClick={() => {
                dispatch({ type: 'delete-appointment', id: a.id });
                setConfirm(false);
                toast.show({ message: c.deleted(a.title), icon: 'trash' });
                navigate('/calendar');
              }}
            >
              {c.delete}
            </Button>
          </>
        }
      />
    </div>
  );
}
