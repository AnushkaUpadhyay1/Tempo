import { copy } from '../app/copy';
import { isDateKey } from '../lib/time';

const f = copy.calendar.form;

export interface AppointmentValues {
  title: string;
  withWhom: string;
  date: string;
  time: string;
  place: string;
  notes: string;
}

export type AppointmentErrors = Partial<Record<'title' | 'date' | 'place', string>>;

export function validateAppointment(values: AppointmentValues, today: string): AppointmentErrors {
  const errors: AppointmentErrors = {};
  if (!values.title.trim()) errors.title = f.titleRequired;
  if (!isDateKey(values.date)) errors.date = f.dateRequired;
  else if (values.date < today) errors.date = f.datePast;
  if (!values.place.trim()) errors.place = f.placeRequired;
  return errors;
}
