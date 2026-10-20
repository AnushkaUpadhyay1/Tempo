import { ACCENT_NAMES } from '../lib/tokens';
import type { AccentName } from '../lib/tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Settings {
  theme: ThemePreference;
  accent: AccentName;
  /** Percent: 90 (compact), 100, 115 or 130. */
  textScale: number;
  reducedMotion: boolean;
  /** Short vibration on supported phones when a dose is logged. */
  haptics: boolean;
}

export const SETTINGS_KEY = 'tempo.settings.v1';
export const TEXT_SCALES = [90, 100, 115, 130] as const;
const THEMES: ThemePreference[] = ['system', 'light', 'dark'];

const prefers = (q: string) => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches;

export function defaultSettings(): Settings {
  return {
    theme: 'system',
    accent: 'tangerine',
    textScale: 100,
    reducedMotion: prefers('(prefers-reduced-motion: reduce)'),
    haptics: true,
  };
}

export function sanitiseSettings(raw: unknown): Settings {
  const d = defaultSettings();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Record<string, unknown>;
  return {
    theme: THEMES.includes(r.theme as ThemePreference) ? (r.theme as ThemePreference) : d.theme,
    accent: ACCENT_NAMES.includes(r.accent as AccentName) ? (r.accent as AccentName) : d.accent,
    textScale: TEXT_SCALES.includes(r.textScale as (typeof TEXT_SCALES)[number])
      ? (r.textScale as number)
      : d.textScale,
    reducedMotion: typeof r.reducedMotion === 'boolean' ? r.reducedMotion : d.reducedMotion,
    haptics: typeof r.haptics === 'boolean' ? r.haptics : d.haptics,
  };
}

export function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    return sanitiseSettings(stored ? JSON.parse(stored) : null);
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked: settings still apply for this visit.
  }
}

export function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme !== 'system') return theme;
  return prefers('(prefers-color-scheme: dark)') ? 'dark' : 'light';
}

export function applySettings(
  settings: Settings,
  root: HTMLElement = document.documentElement,
): void {
  root.setAttribute('data-theme', resolveTheme(settings.theme));
  root.setAttribute('data-accent', settings.accent);
  root.setAttribute('data-reduced-motion', String(settings.reducedMotion));
  root.style.setProperty('--t-text-scale', String(settings.textScale / 100));
}

/** A short buzz on phones that support it, when the person has haptics on. */
export function buzz(settings: Settings, pattern: number | number[] = 12): void {
  if (
    settings.haptics &&
    !settings.reducedMotion &&
    typeof navigator !== 'undefined' &&
    'vibrate' in navigator
  ) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Some browsers throw when vibration is blocked; it is only a nicety.
    }
  }
}
