import type { OBDAdapter } from '@/types';

const KNOWN_ADAPTERS_KEY = 'cardiag-known-adapters';
const MAX_ADAPTERS = 16;

export function getKnownAdapters(): OBDAdapter[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KNOWN_ADAPTERS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as OBDAdapter[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberAdapter(adapter: OBDAdapter): void {
  if (typeof window === 'undefined') return;
  const list = getKnownAdapters().filter((a) => a.id !== adapter.id);
  const entry: OBDAdapter = {
    ...adapter,
    lastConnected: new Date().toISOString(),
  };
  const next = [entry, ...list].slice(0, MAX_ADAPTERS);
  localStorage.setItem(KNOWN_ADAPTERS_KEY, JSON.stringify(next));
}

export function rememberAdapters(adapters: OBDAdapter[]): void {
  adapters.forEach((a) => rememberAdapter(a));
}

export function getAdapterById(id: string): OBDAdapter | null {
  if (!id) return null;
  return getKnownAdapters().find((a) => a.id === id) ?? null;
}

export function clearKnownAdapters(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(KNOWN_ADAPTERS_KEY);
  }
}
