import { createDemoData, DEMO_PROFILE } from './demoData';
import { parseTempoData } from './validate';
import type { TempoData } from './types';

export const DATA_KEY = 'tempo.data.v1';

export type LoadProblem =
  'none' | 'first-visit' | 'unreadable' | 'partly-unreadable' | 'storage-blocked';

export interface LoadResult {
  data: TempoData;
  problem: LoadProblem;
  dropped: number;
}

export function loadData(now: Date = new Date()): LoadResult {
  let stored: string | null;
  try {
    stored = localStorage.getItem(DATA_KEY);
  } catch {
    return { data: createDemoData(now), problem: 'storage-blocked', dropped: 0 };
  }
  if (stored === null) return { data: createDemoData(now), problem: 'first-visit', dropped: 0 };

  let json: unknown;
  try {
    json = JSON.parse(stored);
  } catch {
    return { data: createDemoData(now), problem: 'unreadable', dropped: 0 };
  }
  const parsed = parseTempoData(json, DEMO_PROFILE);
  if (!parsed) return { data: createDemoData(now), problem: 'unreadable', dropped: 0 };
  return {
    data: parsed.data,
    problem: parsed.dropped > 0 ? 'partly-unreadable' : 'none',
    dropped: parsed.dropped,
  };
}

/** Returns false if the browser refused to save (full or blocked storage). */
export function saveData(data: TempoData): boolean {
  try {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
