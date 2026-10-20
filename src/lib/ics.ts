import type { Appointment } from '../data/types';

/** Escape text for an iCalendar property value (RFC 5545 3.3.11). */
const esc = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
const stamp = (d: Date) =>
  d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

/**
 * A one-event .ics file. Times are written as local "floating" times, so the
 * event shows at the same clock time in the person's calendar app.
 */
export function appointmentToIcs(a: Appointment, now = new Date(), durationMinutes = 60): string {
  const start = `${a.date.replace(/-/g, '')}T${a.time.replace(':', '')}00`;
  const [h, m] = a.time.split(':').map(Number);
  const endDate = new Date(`${a.date}T00:00:00`);
  endDate.setHours(h, m + durationMinutes);
  const pad = (n: number) => String(n).padStart(2, '0');
  const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
  const description = [
    a.withWhom && `With ${a.withWhom}`,
    a.notes,
    a.checklist.length ? `Bring: ${a.checklist.map((c) => c.label).join(', ')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tempo//Design concept//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${a.id}@tempo.local`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${esc(a.title)}`,
    a.place ? `LOCATION:${esc(a.place)}` : '',
    description ? `DESCRIPTION:${esc(description)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/** Save text as a file in the browser. Returns false if the browser cannot. */
export function downloadFile(filename: string, contents: string, type: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([contents], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
