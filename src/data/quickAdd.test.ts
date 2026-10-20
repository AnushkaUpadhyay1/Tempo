import { describe, expect, it } from 'vitest';
import { parseQuickAdd } from './quickAdd';

describe('quick add parser', () => {
  it('understands a full description', () => {
    expect(parseQuickAdd('ibuprofen 200mg 2 tabs twice a day with food')).toMatchObject({
      name: 'Ibuprofen 200 mg',
      doseAmount: 2,
      doseUnit: 'tablet',
      times: ['08:00', '20:00'],
      food: 'with-food',
    });
  });

  it('reads clock times', () => {
    expect(parseQuickAdd('Melatonin 3 mg at 10:30pm').times).toEqual(['22:30']);
    expect(parseQuickAdd('Vitamin C 21:15').times).toEqual(['21:15']);
    expect(parseQuickAdd('Iron 8am and 6pm with breakfast').times).toEqual(['08:00', '18:00']);
  });

  it('reads moments of the day', () => {
    const r = parseQuickAdd('cetirizine 10mg at night');
    expect(r).toMatchObject({ name: 'Cetirizine 10 mg', times: ['22:00'] });
    expect(r.understood).toContain('bedtime');
  });

  it('reads units and amounts', () => {
    expect(parseQuickAdd('salbutamol 2 puffs')).toMatchObject({
      name: 'Salbutamol',
      doseAmount: 2,
      doseUnit: 'puff',
    });
    expect(parseQuickAdd('omega 3 capsule daily')).toMatchObject({
      doseAmount: 1,
      doseUnit: 'capsule',
      times: ['08:00'],
    });
    expect(parseQuickAdd('vitamin d 1000 iu').name).toBe('Vitamin d 1000 IU');
  });

  it('reads food rules', () => {
    expect(parseQuickAdd('omeprazole 20mg before food').food).toBe('empty-stomach');
    expect(parseQuickAdd('omeprazole 20mg on an empty stomach').food).toBe('empty-stomach');
  });

  it('returns nothing for empty input', () => {
    expect(parseQuickAdd('   ')).toEqual({ understood: [] });
  });
});
