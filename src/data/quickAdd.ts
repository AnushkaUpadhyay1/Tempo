import type { DoseUnit, FoodRule } from './types';

/**
 * Understands short medicine descriptions such as
 * "ibuprofen 200mg 2 tabs twice a day with food" or "melatonin 3mg at 10:30pm".
 * Returns only what it recognised, plus readable chips explaining each part.
 */

export interface QuickAddResult {
  name?: string;
  doseAmount?: number;
  doseUnit?: DoseUnit;
  times?: string[];
  food?: FoodRule;
  understood: string[];
}

const UNITS: Array<[RegExp, DoseUnit]> = [
  [/^(tabs?|tablets?|pills?)$/, 'tablet'],
  [/^(caps?|capsules?)$/, 'capsule'],
  [/^(ml|millilitres?|milliliters?)$/, 'ml'],
  [/^(puffs?|inhalations?)$/, 'puff'],
  [/^(drops?)$/, 'drop'],
  [/^(sachets?)$/, 'sachet'],
];

const FREQUENCY: Array<[RegExp, number]> = [
  [/\b(once( a day| daily)?|daily|1x|every day|od)\b/, 1],
  [/\b(twice( a day| daily)?|2x|two times( a day)?|bd|bid)\b/, 2],
  [/\b(three times( a day)?|3x|thrice|tds|tid)\b/, 3],
  [/\b(four times( a day)?|4x|qds|qid)\b/, 4],
];

const DEFAULT_TIMES: Record<number, string[]> = {
  1: ['08:00'],
  2: ['08:00', '20:00'],
  3: ['08:00', '14:00', '20:00'],
  4: ['08:00', '12:00', '17:00', '22:00'],
};

const MOMENTS: Array<[RegExp, string, string]> = [
  [/\b(morning|breakfast|am)\b/, '08:00', 'morning'],
  [/\b(midday|lunch|noon)\b/, '13:00', 'midday'],
  [/\b(evening|dinner|pm)\b/, '19:00', 'evening'],
  [/\b(night|bedtime|bed)\b/, '22:00', 'bedtime'],
];

const STRENGTH = /^(\d+(?:\.\d+)?)\s?(mg|mcg|µg|g|iu|units?)$/i;
const pad = (n: number) => String(n).padStart(2, '0');

function parseClock(text: string): string[] {
  const out: string[] = [];
  const re =
    /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\b(?:at\s+)?([01]?\d|2[0-3]):([0-5]\d)\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m[3]) {
      let h = Number(m[1]) % 12;
      if (m[3].toLowerCase() === 'pm') h += 12;
      out.push(`${pad(h)}:${pad(Number(m[2] ?? 0))}`);
    } else {
      out.push(`${pad(Number(m[4]))}:${m[5]}`);
    }
  }
  return out;
}

export function parseQuickAdd(input: string): QuickAddResult {
  const result: QuickAddResult = { understood: [] };
  let text = ` ${input.trim().toLowerCase().replace(/\s+/g, ' ')} `;
  if (!text.trim()) return result;

  // Food rule.
  if (/\b(with|after) (food|meals?|a meal|breakfast|dinner)\b/.test(text)) {
    result.food = 'with-food';
    result.understood.push('with food');
  } else if (/\b(before food|before meals?|empty stomach)\b/.test(text)) {
    result.food = 'empty-stomach';
    result.understood.push('before food');
  }
  text = text.replace(
    /\b(with|after|before) (food|meals?|a meal|breakfast|dinner)\b|\bon an empty stomach\b|\bempty stomach\b/g,
    ' ',
  );

  // Explicit clock times beat everything else.
  const clocks = parseClock(text);
  text = text.replace(
    /\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(am|pm)\b|\b(?:at\s+)?([01]?\d|2[0-3]):[0-5]\d\b/gi,
    ' ',
  );

  // Named moments of the day.
  const moments: string[] = [];
  for (const [re, time, label] of MOMENTS) {
    if (re.test(text)) {
      moments.push(time);
      result.understood.push(label);
      text = text.replace(new RegExp(re.source, 'g'), ' ');
    }
  }

  // How often.
  let count: number | undefined;
  for (const [re, n] of FREQUENCY) {
    if (re.test(text)) {
      count = n;
      result.understood.push(n === 1 ? 'once a day' : `${n}× a day`);
      text = text.replace(re, ' ');
      break;
    }
  }

  const times = [...new Set([...clocks, ...moments])].sort();
  if (clocks.length) result.understood.push(...clocks.map((c) => `at ${c}`));
  if (times.length) result.times = times;
  else if (count) result.times = DEFAULT_TIMES[count];

  // Amount and unit, e.g. "2 tabs".
  const words = text
    .replace(/\b(a day|daily|per day|every day|take|takes|of|and|at)\b/g, ' ')
    .split(' ')
    .filter(Boolean);
  const nameParts: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const unit = UNITS.find(([re]) => re.test(word));
    if (unit) {
      result.doseUnit = unit[1];
      const prev = Number(words[i - 1]);
      // "2 capsules" is an amount; "omega 3 capsule" keeps the 3 in the name.
      const plural = /s$/.test(word) || unit[1] === 'ml';
      if (
        Number.isFinite(prev) &&
        prev > 0 &&
        (plural || prev === 1) &&
        nameParts.at(-1) === words[i - 1]
      ) {
        nameParts.pop();
        result.doseAmount = prev;
      } else result.doseAmount ??= 1;
      result.understood.push(
        `${result.doseAmount} ${unit[1]}${result.doseAmount === 1 ? '' : 's'}`,
      );
      continue;
    }
    // Strength stays in the name: "200mg" becomes "200 mg".
    const joined =
      STRENGTH.exec(word) ??
      (Number.isFinite(Number(word)) && STRENGTH.exec(`${word}${words[i + 1] ?? ''}`));
    if (joined) {
      nameParts.push(
        `${joined[1]} ${joined[2].toLowerCase() === 'iu' ? 'IU' : joined[2].toLowerCase()}`,
      );
      if (!STRENGTH.test(word)) i++;
      continue;
    }
    nameParts.push(word);
  }
  const name = nameParts.join(' ').trim();
  if (name) result.name = name.charAt(0).toUpperCase() + name.slice(1);
  return result;
}
