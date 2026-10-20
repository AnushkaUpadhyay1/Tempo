import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMinutes,
  daysBetween,
  formatTime,
  fromMinutes,
  isDateKey,
  isTime,
  relativeDay,
} from './time';

describe('time helpers', () => {
  it('formats times for reading aloud', () => {
    expect(formatTime('08:00')).toBe('8:00 AM');
    expect(formatTime('13:15')).toBe('1:15 PM');
    expect(formatTime('00:30')).toBe('12:30 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
  });

  it('wraps around midnight', () => {
    expect(addMinutes('23:45', 15)).toBe('00:00');
    expect(addMinutes('00:00', -15)).toBe('23:45');
    expect(fromMinutes(-60)).toBe('23:00');
  });

  it('validates times and dates', () => {
    expect(isTime('08:00')).toBe(true);
    expect(isTime('8:00')).toBe(false);
    expect(isTime('24:00')).toBe(false);
    expect(isDateKey('2026-10-21')).toBe(true);
    expect(isDateKey('21/10/2026')).toBe(false);
  });

  it('does date arithmetic on local dates', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(daysBetween('2026-10-21', '2026-10-25')).toBe(4);
    expect(relativeDay('2026-10-22', '2026-10-21')).toBe('Tomorrow');
    expect(relativeDay('2026-10-25', '2026-10-21')).toBe('In 4 days');
  });
});
