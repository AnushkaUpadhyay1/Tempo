import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { applySettings, loadSettings, saveSettings } from './settings';
import type { Settings } from './settings';

interface SettingsApi {
  settings: Settings;
  update: (patch: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsApi | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings);

  useEffect(() => {
    applySettings(settings);
    saveSettings(settings);
    if (settings.theme !== 'system' || !window.matchMedia) return;
    // Follow the device when it switches between light and dark.
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applySettings(settings);
    query.addEventListener?.('change', onChange);
    return () => query.removeEventListener?.('change', onChange);
  }, [settings]);

  const update = useCallback(
    (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch })),
    [],
  );
  const value = useMemo(() => ({ settings, update }), [settings, update]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsApi {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used inside a SettingsProvider');
  return context;
}
