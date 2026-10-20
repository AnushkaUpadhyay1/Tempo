export type DoseUnit = 'tablet' | 'capsule' | 'ml' | 'puff' | 'drop' | 'sachet';
export type FoodRule = 'with-food' | 'empty-stomach' | 'any';

export const DOSE_UNITS: DoseUnit[] = ['tablet', 'capsule', 'ml', 'puff', 'drop', 'sachet'];
export const FOOD_RULES: FoodRule[] = ['with-food', 'empty-stomach', 'any'];

export interface Medicine {
  id: string;
  /** Name as on the box, e.g. "Amlodipine 5 mg". */
  name: string;
  /** Optional plain reason, e.g. "For blood pressure". */
  purpose: string;
  doseAmount: number;
  doseUnit: DoseUnit;
  /** Daily times, "HH:MM" 24-hour, sorted. */
  times: string[];
  food: FoodRule;
  /** Doses left in the box, for refill reminders. */
  quantity: number;
  /** Show a refill message at or below this many. */
  refillAt: number;
  /** Small data: URL, or null. */
  photo: string | null;
  demo: boolean;
}

/** One dose marked as taken. Untaken doses have no record. */
export interface DoseRecord {
  medicineId: string;
  /** Local date "YYYY-MM-DD". */
  date: string;
  /** Scheduled time "HH:MM". */
  time: string;
  /** ISO timestamp of when it was marked. */
  takenAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Appointment {
  id: string;
  title: string;
  /** Who it is with, e.g. "Dr Okafor". */
  withWhom: string;
  date: string;
  time: string;
  place: string;
  notes: string;
  checklist: ChecklistItem[];
  demo: boolean;
}

export interface Profile {
  name: string;
  age: number;
  /** Accountability buddy who sees the shared weekly summary. */
  buddyName: string;
}

export interface TempoData {
  version: 1;
  profile: Profile;
  medicines: Medicine[];
  doses: DoseRecord[];
  appointments: Appointment[];
}

export type DoseStatus = 'taken' | 'due' | 'overdue' | 'upcoming' | 'missed';
export type Period = 'morning' | 'midday' | 'evening' | 'bedtime';
export const PERIODS: Period[] = ['morning', 'midday', 'evening', 'bedtime'];

/** A scheduled dose on a particular day, with its current status. */
export interface DoseInstance {
  key: string;
  medicine: Medicine;
  date: string;
  time: string;
  period: Period;
  status: DoseStatus;
  record?: DoseRecord;
}
