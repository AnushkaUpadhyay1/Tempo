import { addDays, dateKey, toMinutes } from '../lib/time';
import { PERIODS } from './types';
import type { DoseInstance, DoseRecord, DoseStatus, Medicine, Period } from './types';

/** A dose counts as "due" from an hour before its time until an hour after; later it is overdue. */
export const DUE_WINDOW_MINUTES = 60;

export function periodOf(time: string): Period {
  const minutes = toMinutes(time);
  if (minutes >= 21 * 60 || minutes < 4 * 60) return 'bedtime';
  if (minutes < 11 * 60) return 'morning';
  if (minutes < 17 * 60) return 'midday';
  return 'evening';
}

export const doseKey = (medicineId: string, date: string, time: string) =>
  `${medicineId}|${date}|${time}`;

export function findRecord(doses: DoseRecord[], medicineId: string, date: string, time: string) {
  return doses.find((d) => d.medicineId === medicineId && d.date === date && d.time === time);
}

export function statusFor(date: string, time: string, taken: boolean, now: Date): DoseStatus {
  if (taken) return 'taken';
  const today = dateKey(now);
  if (date < today) return 'missed';
  if (date > today) return 'upcoming';
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const scheduled = toMinutes(time);
  if (minutesNow > scheduled + DUE_WINDOW_MINUTES) return 'overdue';
  if (minutesNow >= scheduled - DUE_WINDOW_MINUTES) return 'due';
  return 'upcoming';
}

export function dosesForDay(
  medicines: Medicine[],
  doses: DoseRecord[],
  date: string,
  now: Date,
): DoseInstance[] {
  const out: DoseInstance[] = [];
  for (const medicine of medicines) {
    for (const time of medicine.times) {
      const record = findRecord(doses, medicine.id, date, time);
      out.push({
        key: doseKey(medicine.id, date, time),
        medicine,
        date,
        time,
        period: periodOf(time),
        status: statusFor(date, time, !!record, now),
        record,
      });
    }
  }
  return out.sort(
    (a, b) =>
      toMinutes(a.time) - toMinutes(b.time) || a.medicine.name.localeCompare(b.medicine.name),
  );
}

export function groupByPeriod(
  instances: DoseInstance[],
): Array<{ period: Period; doses: DoseInstance[] }> {
  return PERIODS.map((period) => ({
    period,
    doses: instances.filter((d) => d.period === period),
  })).filter((group) => group.doses.length > 0);
}

const UNIT_WORDS: Record<Medicine['doseUnit'], [string, string]> = {
  tablet: ['tablet', 'tablets'],
  capsule: ['capsule', 'capsules'],
  ml: ['ml', 'ml'],
  puff: ['puff', 'puffs'],
  drop: ['drop', 'drops'],
  sachet: ['sachet', 'sachets'],
};

export function unitWords(unit: Medicine['doseUnit']): [string, string] {
  return UNIT_WORDS[unit];
}

export function amountText(amount: number, unit: Medicine['doseUnit']): string {
  const [one, many] = UNIT_WORDS[unit];
  return `${amount} ${amount === 1 ? one : many}`;
}

const FOOD_TEXT: Record<Medicine['food'], string> = {
  'with-food': 'with food',
  'empty-stomach': 'before food, on an empty stomach',
  any: 'with or without food',
};

export function foodText(food: Medicine['food']): string {
  return FOOD_TEXT[food];
}

/** "1 tablet, with food." */
export function instructions(medicine: Medicine): string {
  return `${amountText(medicine.doseAmount, medicine.doseUnit)}, ${foodText(medicine.food)}.`;
}

/** How many days of doses are left, rounded down. */
export function daysLeft(medicine: Medicine): number {
  const perDay = medicine.doseAmount * medicine.times.length;
  return perDay > 0 ? Math.floor(medicine.quantity / perDay) : 0;
}

export function needsRefill(medicine: Medicine): boolean {
  return medicine.quantity <= medicine.refillAt;
}

export interface DaySummary {
  date: string;
  scheduled: number;
  taken: number;
  missed: number;
  /** Today only: doses still to come. */
  upcoming: number;
}

/**
 * Weekly summary for the family view: the last `days` days including today.
 * Today's doses count as missed only once they are overdue.
 */
export function weeklySummary(
  medicines: Medicine[],
  doses: DoseRecord[],
  now: Date,
  days = 7,
): { days: DaySummary[]; taken: number; missed: number; scheduled: number } {
  const today = dateKey(now);
  const summaries: DaySummary[] = [];
  for (let offset = days - 1; offset >= 0; offset--) {
    const date = addDays(today, -offset);
    const instances = dosesForDay(medicines, doses, date, now);
    summaries.push({
      date,
      scheduled: instances.length,
      taken: instances.filter((d) => d.status === 'taken').length,
      missed: instances.filter((d) => d.status === 'missed' || d.status === 'overdue').length,
      upcoming: instances.filter((d) => d.status === 'due' || d.status === 'upcoming').length,
    });
  }
  return {
    days: summaries,
    taken: summaries.reduce((n, d) => n + d.taken, 0),
    missed: summaries.reduce((n, d) => n + d.missed, 0),
    scheduled: summaries.reduce((n, d) => n + d.scheduled, 0),
  };
}
