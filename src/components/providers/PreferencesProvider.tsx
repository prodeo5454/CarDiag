'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  getPreferences,
  getResolvedTheme,
  savePreferences,
  type CarDiagPreferences,
  DEFAULT_PREFERENCES,
  PREFERENCES_KEY,
} from '@/lib/preferences';

interface PreferencesContextValue {
  preferences: CarDiagPreferences;
  setPreferences: (next: CarDiagPreferences) => void;
  patchPreferences: (patch: Partial<CarDiagPreferences>) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<CarDiagPreferences>(DEFAULT_PREFERENCES);

  const applyTheme = useCallback((prefs: CarDiagPreferences) => {
    const theme = getResolvedTheme(prefs);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle(
      'no-animations',
      prefs.display?.animations === false
    );
  }, []);

  useEffect(() => {
    const prefs = getPreferences();
    setPreferencesState(prefs);
    applyTheme(prefs);

    const onStorage = (e: StorageEvent) => {
      if (e.key === PREFERENCES_KEY) {
        const next = getPreferences();
        setPreferencesState(next);
        applyTheme(next);
      }
    };
    window.addEventListener('storage', onStorage);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onScheme = () => {
      if (getPreferences().theme === 'auto') applyTheme(getPreferences());
    };
    mq.addEventListener('change', onScheme);

    return () => {
      window.removeEventListener('storage', onStorage);
      mq.removeEventListener('change', onScheme);
    };
  }, [applyTheme]);

  const setPreferences = useCallback(
    (next: CarDiagPreferences) => {
      savePreferences(next);
      setPreferencesState(next);
      applyTheme(next);
    },
    [applyTheme]
  );

  const patchPreferences = useCallback(
    (patch: Partial<CarDiagPreferences>) => {
      const next = { ...getPreferences(), ...patch };
      setPreferences(next);
    },
    [setPreferences]
  );

  return (
    <PreferencesContext.Provider value={{ preferences, setPreferences, patchPreferences }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    return {
      preferences: DEFAULT_PREFERENCES,
      setPreferences: () => {},
      patchPreferences: () => {},
    };
  }
  return ctx;
}
