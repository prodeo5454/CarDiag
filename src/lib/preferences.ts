export const PREFERENCES_KEY = 'cardiag-preferences';
export const LAST_ADAPTER_KEY = 'cardiag-last-adapter';

export interface CarDiagPreferences {
  theme: 'dark' | 'light' | 'auto';
  language: string;
  units: 'metric' | 'imperial';
  notifications: {
    enabled: boolean;
    maintenance: boolean;
    diagnostics: boolean;
    connection: boolean;
    updates: boolean;
  };
  data: {
    autoBackup: boolean;
    backupInterval: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    compression: boolean;
  };
  display: {
    dashboardLayout: 'compact' | 'standard' | 'detailed';
    refreshRate: 'fast' | 'normal' | 'slow';
    showTooltips: boolean;
    animations: boolean;
  };
  obd: {
    autoConnect: boolean;
    preferredAdapter: string;
    scanInterval: number;
    timeout: number;
    retryAttempts: number;
  };
}

export const DEFAULT_PREFERENCES: CarDiagPreferences = {
  theme: 'dark',
  language: 'en',
  units: 'metric',
  notifications: {
    enabled: true,
    maintenance: true,
    diagnostics: true,
    connection: true,
    updates: true,
  },
  data: {
    autoBackup: true,
    backupInterval: 'weekly',
    retentionDays: 365,
    compression: true,
  },
  display: {
    dashboardLayout: 'standard',
    refreshRate: 'normal',
    showTooltips: true,
    animations: true,
  },
  obd: {
    autoConnect: false,
    preferredAdapter: '',
    scanInterval: 1000,
    timeout: 5000,
    retryAttempts: 3,
  },
};

export function getPreferences(): CarDiagPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: CarDiagPreferences): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

export function getResolvedTheme(prefs = getPreferences()): 'dark' | 'light' {
  if (prefs.theme === 'auto') {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }
  return prefs.theme;
}

export function getOBDCommandTimeout(prefs = getPreferences()): number {
  const t = prefs.obd?.timeout;
  return typeof t === 'number' && t >= 1000 ? t : DEFAULT_PREFERENCES.obd.timeout;
}

export function getPollingIntervalMs(prefs = getPreferences()): number {
  const rate = prefs.display?.refreshRate ?? 'normal';
  if (rate === 'fast') return 500;
  if (rate === 'slow') return 2000;
  return 1000;
}
