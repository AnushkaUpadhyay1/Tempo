import { addDays, dateKey } from '../lib/time';
import { dosesForDay } from './schedule';
import type { DoseRecord, Medicine } from './types';

export interface DayScore {
  date: string;
  scheduled: number;
  taken: number;
  /** 0 to 1; null when nothing was scheduled. */
  ratio: number | null;
}

export function dayScore(
  medicines: Medicine[],
  doses: DoseRecord[],
  date: string,
  now: Date,
): DayScore {
  const day = dosesForDay(medicines, doses, date, now);
  const taken = day.filter((d) => d.status === 'taken').length;
  return { date, scheduled: day.length, taken, ratio: day.length ? taken / day.length : null };
}

/** The last `days` days, oldest first, including today. */
export function recentDays(
  medicines: Medicine[],
  doses: DoseRecord[],
  now: Date,
  days: number,
): DayScore[] {
  const today = dateKey(now);
  return Array.from({ length: days }, (_, i) =>
    dayScore(medicines, doses, addDays(today, i - days + 1), now),
  );
}

const complete = (d: DayScore) => d.scheduled > 0 && d.taken === d.scheduled;

/**
 * Days in a row with every dose logged. Today counts once it is complete;
 * an unfinished today does not break the streak.
 */
export function currentStreak(
  medicines: Medicine[],
  doses: DoseRecord[],
  now: Date,
  lookback = 365,
): number {
  const today = dateKey(now);
  let streak = complete(dayScore(medicines, doses, today, now)) ? 1 : 0;
  for (let i = 1; i <= lookback; i++) {
    const day = dayScore(medicines, doses, addDays(today, -i), now);
    if (day.scheduled === 0) continue;
    if (!complete(day)) break;
    streak++;
  }
  return streak;
}

export function longestStreak(
  medicines: Medicine[],
  doses: DoseRecord[],
  now: Date,
  lookback = 90,
): number {
  let best = 0;
  let run = 0;
  for (const day of recentDays(medicines, doses, now, lookback)) {
    if (day.scheduled === 0) continue;
    if (complete(day)) {
      run++;
      best = Math.max(best, run);
    } else if (day.date !== dateKey(now)) {
      run = 0;
    }
  }
  return best;
}

/** Share of past doses logged over the last `days` days, not counting today. */
export function adherence(
  medicines: Medicine[],
  doses: DoseRecord[],
  now: Date,
  days = 30,
  medicineId?: string,
) {
  const meds = medicineId ? medicines.filter((m) => m.id === medicineId) : medicines;
  const past = recentDays(meds, doses, now, days + 1).slice(0, -1);
  const scheduled = past.reduce((n, d) => n + d.scheduled, 0);
  const taken = past.reduce((n, d) => n + d.taken, 0);
  return { scheduled, taken, percent: scheduled ? Math.round((taken / scheduled) * 100) : null };
}
