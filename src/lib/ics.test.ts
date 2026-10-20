import { describe, expect, it } from 'vitest';
import { appointmentToIcs } from './ics';

describe('calendar export', () => {
  it('writes a valid single event with escaped text', () => {
    const ics = appointmentToIcs(
      {
        id: 'a1',
        title: 'Dentist, check-up',
        withWhom: 'Smile Studio',
        date: '2026-10-24',
        time: '16:15',
        place: 'Smile Studio; 88 Canal Street',
        notes: 'Ask about the retainer',
        checklist: [{ id: 'c', label: 'Retainer case', done: false }],
        demo: true,
      },
      new Date('2026-10-21T09:00:00Z'),
    );
    const lines = ics.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines.at(-1)).toBe('END:VCALENDAR');
    expect(lines).toContain('DTSTART:20261024T161500');
    expect(lines).toContain('DTEND:20261024T171500');
    expect(lines).toContain('SUMMARY:Dentist\\, check-up');
    expect(lines).toContain('LOCATION:Smile Studio\\; 88 Canal Street');
    expect(ics).toContain('Bring: Retainer case');
    expect(lines).toContain('DTSTAMP:20261021T090000Z');
  });
});
