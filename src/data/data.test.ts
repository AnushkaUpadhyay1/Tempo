import { describe, expect, it } from 'vitest';
import { createDemoData } from './demoData';
import { reducer } from './StoreProvider';
import { adherence, currentStreak, longestStreak, recentDays } from './stats';
import { applyQuickAdd, draftToMed, emptyMedDraft, validateMed } from './medForm';
import { parseQuickAdd } from './quickAdd';
import { parseTempoData } from './validate';
import { DEMO_PROFILE } from './demoData';
import { DATA_KEY, loadData } from './storage';

// Wednesday 21 October 2026, 7:00 AM: nothing due yet today.
const NOW = new Date(2026, 9, 21, 7, 0);
const TODAY = '2026-10-21';

describe('demo data', () => {
  it('is a fictional 24-year-old with four meds and two appointments, all marked demo', () => {
    const d = createDemoData(NOW);
    expect(d.profile).toMatchObject({ name: 'Riley', age: 24 });
    expect(d.medicines).toHaveLength(4);
    expect(d.appointments).toHaveLength(2);
    expect([...d.medicines, ...d.appointments].every((x) => x.demo)).toBe(true);
  });
});

describe('streaks and stats', () => {
  const d = createDemoData(NOW);

  it('counts the current streak without breaking it for an unfinished today', () => {
    // Days 1 to 8 ago are complete; 9 days ago one dose was missed.
    expect(currentStreak(d.medicines, d.doses, NOW)).toBe(8);
  });

  it('adds today once every dose is logged', () => {
    let data = d;
    for (const m of data.medicines) {
      for (const time of m.times)
        data = reducer(data, {
          type: 'take-dose',
          medicineId: m.id,
          date: TODAY,
          time,
          takenAt: NOW.toISOString(),
        });
    }
    expect(currentStreak(data.medicines, data.doses, NOW)).toBe(9);
  });

  it('finds the longest streak in the history', () => {
    // Complete runs: days 1–8 and 10–14 ago, and 17–21 ago.
    expect(longestStreak(d.medicines, d.doses, NOW)).toBe(8);
  });

  it('calculates 30-day adherence from past days only', () => {
    const a = adherence(d.medicines, d.doses, NOW, 30);
    // 27 days of history with 4 doses each, 5 missed; days 28–30 ago have no history.
    expect(a.scheduled).toBe(30 * 4);
    expect(a.taken).toBe(27 * 4 - 5);
    expect(a.percent).toBe(Math.round((103 / 120) * 100));
  });

  it('scores each recent day', () => {
    const week = recentDays(d.medicines, d.doses, NOW, 7);
    expect(week).toHaveLength(7);
    expect(week.at(-1)).toMatchObject({ date: TODAY, taken: 0, scheduled: 4 });
    expect(week.slice(0, 6).every((x) => x.ratio === 1)).toBe(true);
  });
});

describe('medicine form', () => {
  it('requires a name, an amount, a time and a food answer', () => {
    expect(Object.keys(validateMed({ ...emptyMedDraft(), times: [] }))).toEqual([
      'name',
      'times',
      'food',
    ]);
    expect(validateMed({ ...emptyMedDraft(), name: 'X', food: 'any' })).toEqual({});
  });

  it('applies quick add on top of the draft', () => {
    const draft = applyQuickAdd(
      emptyMedDraft(),
      parseQuickAdd('ibuprofen 200mg 2 tabs twice a day with food'),
    );
    expect(draft).toMatchObject({
      name: 'Ibuprofen 200 mg',
      doseAmount: 2,
      times: ['08:00', '20:00'],
      food: 'with-food',
      quantity: 30,
    });
  });

  it('cleans a draft into a medicine', () => {
    const m = draftToMed({
      ...emptyMedDraft(),
      name: ' Melatonin 3 mg ',
      times: ['22:30', 'bad', '22:30'],
      food: 'any',
    });
    expect(m).toMatchObject({ name: 'Melatonin 3 mg', times: ['22:30'], demo: false });
  });
});

describe('storage and import', () => {
  it('uses the Tempo storage key and survives damage', () => {
    expect(DATA_KEY).toBe('tempo.data.v1');
    localStorage.setItem(DATA_KEY, '{nope');
    expect(loadData(NOW).problem).toBe('unreadable');
  });

  it('accepts an exported backup and rejects other JSON', () => {
    const backup = JSON.parse(JSON.stringify(createDemoData(NOW)));
    expect(parseTempoData(backup, DEMO_PROFILE)?.data.medicines).toHaveLength(4);
    expect(parseTempoData({ hello: 'world' }, DEMO_PROFILE)).toBeNull();
  });
});
