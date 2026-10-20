import { addDays, dateKey } from '../lib/time';
import type { Appointment, DoseRecord, Medicine, Profile, TempoData } from './types';

/**
 * Demo data for a fictional 24-year-old. Every record is flagged demo and the
 * interface labels it. Nothing here is medical advice.
 */

export const DEMO_PROFILE: Profile = { name: 'Riley', age: 24, buddyName: 'Jordan' };

export const DEMO_MEDICINES: Medicine[] = [
  {
    id: 'med-sertraline',
    name: 'Sertraline 50 mg',
    purpose: 'Mood',
    doseAmount: 1,
    doseUnit: 'tablet',
    times: ['08:30'],
    food: 'any',
    quantity: 21,
    refillAt: 7,
    photo: null,
    demo: true,
  },
  {
    id: 'med-vitamin-d',
    name: 'Vitamin D 1000 IU',
    purpose: 'Winter top-up',
    doseAmount: 1,
    doseUnit: 'capsule',
    times: ['08:30'],
    food: 'with-food',
    quantity: 44,
    refillAt: 7,
    photo: null,
    demo: true,
  },
  {
    id: 'med-iron',
    name: 'Ferrous fumarate 210 mg',
    purpose: 'Low iron',
    doseAmount: 1,
    doseUnit: 'tablet',
    times: ['13:00'],
    food: 'with-food',
    quantity: 38,
    refillAt: 10,
    photo: null,
    demo: true,
  },
  {
    id: 'med-cetirizine',
    name: 'Cetirizine 10 mg',
    purpose: 'Hay fever',
    doseAmount: 1,
    doseUnit: 'tablet',
    times: ['21:30'],
    food: 'any',
    quantity: 5,
    refillAt: 7,
    photo: null,
    demo: true,
  },
];

/** A few gaps in the history so streaks and the heatmap have something to show. */
const DEMO_MISSED: Array<{ daysAgo: number; medicineId: string }> = [
  { daysAgo: 9, medicineId: 'med-iron' },
  { daysAgo: 15, medicineId: 'med-cetirizine' },
  { daysAgo: 16, medicineId: 'med-vitamin-d' },
  { daysAgo: 22, medicineId: 'med-iron' },
  { daysAgo: 23, medicineId: 'med-iron' },
];

export const DEMO_HISTORY_DAYS = 27;

function history(today: string): DoseRecord[] {
  const records: DoseRecord[] = [];
  for (let daysAgo = DEMO_HISTORY_DAYS; daysAgo >= 1; daysAgo--) {
    const date = addDays(today, -daysAgo);
    for (const medicine of DEMO_MEDICINES) {
      for (const time of medicine.times) {
        if (DEMO_MISSED.some((m) => m.daysAgo === daysAgo && m.medicineId === medicine.id))
          continue;
        const [h, m] = time.split(':').map(Number);
        const taken = new Date(`${date}T00:00:00`);
        taken.setHours(h, m + ((daysAgo * 11 + h) % 25) - 6);
        records.push({ medicineId: medicine.id, date, time, takenAt: taken.toISOString() });
      }
    }
  }
  return records;
}

function appointments(today: string): Appointment[] {
  return [
    {
      id: 'appt-dentist',
      title: 'Dentist check-up',
      withWhom: 'Smile Studio',
      date: addDays(today, 3),
      time: '16:15',
      place: 'Smile Studio, 88 Canal Street',
      notes: 'Ask about the retainer.',
      checklist: [
        { id: 'c1', label: 'Retainer case', done: false },
        { id: 'c2', label: 'Card for payment', done: true },
        { id: 'c3', label: 'Phone charged', done: false },
      ],
      demo: true,
    },
    {
      id: 'appt-physio',
      title: 'Physio session',
      withWhom: 'Kinetic Physio',
      date: addDays(today, 9),
      time: '18:00',
      place: 'Kinetic Physio, Unit 4, Brick Lane',
      notes: 'Knee rehab, week 3.',
      checklist: [
        { id: 'c1', label: 'Gym kit', done: false },
        { id: 'c2', label: 'Water bottle', done: false },
        { id: 'c3', label: 'Exercise log', done: false },
      ],
      demo: true,
    },
  ];
}

export function createDemoData(now: Date = new Date()): TempoData {
  const today = dateKey(now);
  return {
    version: 1,
    profile: { ...DEMO_PROFILE },
    medicines: DEMO_MEDICINES.map((m) => ({ ...m, times: [...m.times] })),
    doses: history(today),
    appointments: appointments(today),
  };
}
