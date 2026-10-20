/** Time and date helpers. Times are "HH:MM" 24-hour strings; dates are local "YYYY-MM-DD". */

export const MINUTES_PER_DAY = 24 * 60;

export function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function fromMinutes(total: number): string {
  const wrapped = ((Math.round(total) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function addMinutes(time: string, minutes: number): string {
  return fromMinutes(toMinutes(time) + minutes);
}

/** "08:00" -> "8:00 AM". Spelled out so it reads clearly and is announced well. */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function dateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDateKey(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(parseDateKey(value).getTime())
  );
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const date = parseDateKey(key);
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

export function daysBetween(fromKey: string, toKey: string): number {
  const ms = parseDateKey(toKey).getTime() - parseDateKey(fromKey).getTime();
  return Math.round(ms / 86_400_000);
}

/** "Tuesday 14 October" */
export function formatDate(key: string, options: { withYear?: boolean } = {}): string {
  return parseDateKey(key).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    ...(options.withYear ? { year: 'numeric' } : {}),
  });
}

/** "Today", "Tomorrow", "In 5 days" or the full date. */
export function relativeDay(key: string, todayKey: string): string {
  const diff = daysBetween(todayKey, key);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  return formatDate(key);
}

export function shortWeekday(key: string): string {
  return parseDateKey(key).toLocaleDateString('en-GB', { weekday: 'short' });
}
