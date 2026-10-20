import { copy } from '../app/copy';
import { isTime } from '../lib/time';
import { createId } from './ids';
import type { QuickAddResult } from './quickAdd';
import type { DoseUnit, FoodRule, Medicine } from './types';

export interface MedDraft {
  name: string;
  purpose: string;
  doseAmount: number;
  doseUnit: DoseUnit;
  times: string[];
  food: FoodRule | '';
  quantity: number;
  refillAt: number;
}

export type MedErrors = Partial<Record<'name' | 'doseAmount' | 'times' | 'food', string>>;

export const PRESET_TIMES = [
  { value: '08:00', label: 'Morning' },
  { value: '13:00', label: 'Afternoon' },
  { value: '19:00', label: 'Evening' },
  { value: '22:00', label: 'Night' },
];

export const emptyMedDraft = (): MedDraft => ({
  name: '',
  purpose: '',
  doseAmount: 1,
  doseUnit: 'tablet',
  times: ['08:00'],
  food: '',
  quantity: 30,
  refillAt: 7,
});

export const medToDraft = (m: Medicine): MedDraft => ({
  name: m.name,
  purpose: m.purpose,
  doseAmount: m.doseAmount,
  doseUnit: m.doseUnit,
  times: [...m.times],
  food: m.food,
  quantity: m.quantity,
  refillAt: m.refillAt,
});

/** Apply what quick add understood, keeping everything else. */
export function applyQuickAdd(draft: MedDraft, parsed: QuickAddResult): MedDraft {
  return {
    ...draft,
    ...(parsed.name ? { name: parsed.name } : {}),
    ...(parsed.doseAmount ? { doseAmount: parsed.doseAmount } : {}),
    ...(parsed.doseUnit ? { doseUnit: parsed.doseUnit } : {}),
    ...(parsed.times ? { times: parsed.times } : {}),
    ...(parsed.food ? { food: parsed.food } : {}),
  };
}

export function validateMed(d: MedDraft): MedErrors {
  const f = copy.form;
  const e: MedErrors = {};
  if (!d.name.trim()) e.name = f.nameRequired;
  if (!(d.doseAmount >= 1)) e.doseAmount = f.amountRequired;
  if (d.times.filter(isTime).length === 0) e.times = f.timesRequired;
  if (!d.food) e.food = f.foodRequired;
  return e;
}

export function draftToMed(d: MedDraft, existing?: Medicine): Medicine {
  return {
    id: existing?.id ?? createId('med'),
    name: d.name.trim(),
    purpose: d.purpose.trim(),
    doseAmount: d.doseAmount,
    doseUnit: d.doseUnit,
    times: [...new Set(d.times.filter(isTime))].sort(),
    food: d.food || 'any',
    quantity: Math.max(0, Math.floor(d.quantity)),
    refillAt: Math.max(0, Math.floor(d.refillAt)),
    photo: existing?.photo ?? null,
    demo: existing?.demo ?? false,
  };
}

export const draftKey = (id?: string) => (id ? `tempo.draft.${id}` : 'tempo.draft.new');

export function loadMedDraft(key: string): MedDraft | null {
  try {
    const raw = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!raw || typeof raw.name !== 'string' || !Array.isArray(raw.times)) return null;
    return { ...emptyMedDraft(), ...raw, times: raw.times.filter(isTime) };
  } catch {
    return null;
  }
}

export function saveMedDraft(key: string, draft: MedDraft) {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    // Not fatal: the form still works without a saved draft.
  }
}

export function clearMedDraft(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    // Storage blocked.
  }
}
