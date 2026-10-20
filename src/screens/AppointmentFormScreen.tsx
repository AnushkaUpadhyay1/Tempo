import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Banner, Button, ChipGroup, Field, Icon, useToast } from '../ui';
import { copy } from '../app/copy';
import { useStore } from '../data/StoreProvider';
import { createId } from '../data/ids';
import { validateAppointment } from '../data/appointmentForm';
import type { AppointmentErrors, AppointmentValues } from '../data/appointmentForm';
import { PRESET_TIMES } from '../data/medForm';
import type { Appointment } from '../data/types';
import { addDays, dateKey, formatTime } from '../lib/time';
import { usePageTitle } from '../lib/usePageTitle';
import s from './screen.module.css';

const f = copy.calendar.form;

export default function AppointmentFormScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, dispatch } = useStore();
  const existing = id ? data.appointments.find((a) => a.id === id) : undefined;
  const today = dateKey(new Date());
  const [values, setValues] = useState<AppointmentValues>(() =>
    existing
      ? {
          title: existing.title,
          withWhom: existing.withWhom,
          date: existing.date,
          time: existing.time,
          place: existing.place,
          notes: existing.notes,
        }
      : { title: '', withWhom: '', date: addDays(today, 7), time: '10:00', place: '', notes: '' },
  );
  const [errors, setErrors] = useState<AppointmentErrors>({});
  const summary = useRef<HTMLDivElement>(null);
  usePageTitle(existing ? f.editTitle : f.addTitle, 'Tempo');

  if (id && !existing) {
    return (
      <div className={s.page}>
        <h1 className={s.title}>{copy.notFound.title}</h1>
        <p>{copy.calendar.notFound}</p>
      </div>
    );
  }
  const set = (patch: Partial<AppointmentValues>) => setValues((v) => ({ ...v, ...patch }));
  const back = existing ? `/calendar/${existing.id}` : '/calendar';

  const save = () => {
    const found = validateAppointment(
      values,
      existing && existing.date < today ? '0000-00-00' : today,
    );
    setErrors(found);
    if (Object.keys(found).length) {
      window.requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    const appointment: Appointment = {
      id: existing?.id ?? createId('appt'),
      title: values.title.trim(),
      withWhom: values.withWhom.trim(),
      date: values.date,
      time: values.time,
      place: values.place.trim(),
      notes: values.notes.trim(),
      checklist: existing?.checklist ?? [],
      demo: existing?.demo ?? false,
    };
    dispatch({ type: 'save-appointment', appointment });
    toast.show({ message: f.saved(appointment.title) });
    navigate(`/calendar/${appointment.id}`, { replace: true });
  };

  return (
    <div className={s.page}>
      <Link to={back} className={s.back}>
        <Icon name="chevron-left" size="sm" />
        {copy.calendar.back}
      </Link>
      <h1 className={s.title}>{existing ? f.editTitle : f.addTitle}</h1>
      <form
        className={s.form}
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        {Object.keys(errors).length > 0 && (
          <div ref={summary} tabIndex={-1}>
            <Banner tone="danger" title={copy.form.errors} live="assertive">
              <ul>
                {Object.values(errors).map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </Banner>
          </div>
        )}
        <section className={s.card} aria-label={f.title}>
          <Field
            label={f.title}
            placeholder={f.titleHint}
            value={values.title}
            error={errors.title}
            onChange={(title) => set({ title })}
          />
          <Field
            label={f.with}
            optional
            value={values.withWhom}
            onChange={(withWhom) => set({ withWhom })}
          />
          <Field
            label={f.place}
            value={values.place}
            error={errors.place}
            onChange={(place) => set({ place })}
          />
        </section>
        <section className={s.card} aria-label={f.date}>
          <Field
            label={f.date}
            type="date"
            value={values.date}
            error={errors.date}
            onChange={(date) => set({ date })}
          />
          <Field
            label={f.time}
            type="time"
            value={values.time}
            onChange={(time) => set({ time })}
          />
          <ChipGroup
            legend={`${f.time} presets`}
            hideLegend
            value={PRESET_TIMES.some((p) => p.value === values.time) ? values.time : ''}
            onChange={(v) => set({ time: v as string })}
            options={PRESET_TIMES.map((p) => ({
              value: p.value,
              label: p.label,
              detail: formatTime(p.value),
            }))}
          />
        </section>
        <section className={s.card} aria-label={f.notes}>
          <Field
            label={f.notes}
            optional
            multiline
            value={values.notes}
            onChange={(notes) => set({ notes })}
          />
        </section>
        <div className={s.formActions}>
          <Button variant="ghost" onClick={() => navigate(back)}>
            {copy.form.cancel}
          </Button>
          <Button type="submit" size="lg" icon="check">
            {f.save}
          </Button>
        </div>
      </form>
    </div>
  );
}
