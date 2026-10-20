import { isDateKey, isTime } from '../lib/time';
import { DOSE_UNITS, FOOD_RULES } from './types';
import type { Appointment, ChecklistItem, DoseRecord, Medicine, Profile, TempoData } from './types';

/**
 * Stored data can be missing, edited by hand, or written by an older version.
 * These guards keep every valid record and drop the rest, so one bad entry
 * never hides a person's whole medicine list.
 */

type Raw = Record<string, unknown>;
const isObject = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback: number): number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : fallback;

export function parseMedicine(raw: unknown): Medicine | null {
  if (!isObject(raw)) return null;
  const id = str(raw.id);
  const name = str(raw.name).trim();
  const times = Array.isArray(raw.times) ? raw.times.filter(isTime) : [];
  const doseAmount = num(raw.doseAmount, 0);
  if (!id || !name || times.length === 0 || doseAmount <= 0) return null;
  return {
    id,
    name,
    purpose: str(raw.purpose),
    doseAmount,
    doseUnit: DOSE_UNITS.includes(raw.doseUnit as Medicine['doseUnit'])
      ? (raw.doseUnit as Medicine['doseUnit'])
      : 'tablet',
    times: [...new Set(times)].sort(),
    food: FOOD_RULES.includes(raw.food as Medicine['food'])
      ? (raw.food as Medicine['food'])
      : 'any',
    quantity: Math.floor(num(raw.quantity, 0)),
    refillAt: Math.floor(num(raw.refillAt, 7)),
    photo: typeof raw.photo === 'string' && raw.photo.startsWith('data:image/') ? raw.photo : null,
    demo: raw.demo === true,
  };
}

export function parseDose(raw: unknown): DoseRecord | null {
  if (!isObject(raw)) return null;
  const takenAt = str(raw.takenAt);
  if (
    !str(raw.medicineId) ||
    !isDateKey(raw.date) ||
    !isTime(raw.time) ||
    Number.isNaN(Date.parse(takenAt))
  ) {
    return null;
  }
  return { medicineId: raw.medicineId as string, date: raw.date, time: raw.time, takenAt };
}

function parseChecklistItem(raw: unknown): ChecklistItem | null {
  if (!isObject(raw) || !str(raw.id) || !str(raw.label).trim()) return null;
  return { id: raw.id as string, label: (raw.label as string).trim(), done: raw.done === true };
}

export function parseAppointment(raw: unknown): Appointment | null {
  if (!isObject(raw)) return null;
  const title = str(raw.title).trim();
  if (!str(raw.id) || !title || !isDateKey(raw.date) || !isTime(raw.time)) return null;
  return {
    id: raw.id as string,
    title,
    withWhom: str(raw.withWhom),
    date: raw.date,
    time: raw.time,
    place: str(raw.place),
    notes: str(raw.notes),
    checklist: Array.isArray(raw.checklist)
      ? raw.checklist.map(parseChecklistItem).filter((x): x is ChecklistItem => x !== null)
      : [],
    demo: raw.demo === true,
  };
}

function parseProfile(raw: unknown, fallback: Profile): Profile {
  if (!isObject(raw)) return fallback;
  return {
    name: str(raw.name, fallback.name).trim() || fallback.name,
    age: num(raw.age, fallback.age),
    buddyName: str(raw.buddyName, fallback.buddyName).trim() || fallback.buddyName,
  };
}

export interface ParseResult {
  data: TempoData;
  /** Number of stored records that could not be used and were dropped. */
  dropped: number;
}

export function parseTempoData(raw: unknown, fallbackProfile: Profile): ParseResult | null {
  if (!isObject(raw) || raw.version !== 1) return null;
  let dropped = 0;
  const keep = <T>(list: unknown, parse: (x: unknown) => T | null): T[] => {
    if (!Array.isArray(list)) return [];
    const out: T[] = [];
    for (const item of list) {
      const parsed = parse(item);
      if (parsed) out.push(parsed);
      else dropped++;
    }
    return out;
  };
  const medicines = keep(raw.medicines, parseMedicine);
  const ids = new Set(medicines.map((m) => m.id));
  const doses = keep(raw.doses, parseDose).filter((d) => ids.has(d.medicineId));
  const appointments = keep(raw.appointments, parseAppointment);
  return {
    data: {
      version: 1,
      profile: parseProfile(raw.profile, fallbackProfile),
      medicines,
      doses,
      appointments,
    },
    dropped,
  };
}
