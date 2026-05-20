import type { OEMDTCBundle, CompactDTCRow } from './types';

const CUSTOM_OVERLAY_KEY = 'cardiag-oem-custom-overlay';
const SYNC_META_KEY = 'cardiag-oem-sync-meta';

export interface OEMSyncMeta {
  lastChecked: string;
  lastUpdated: string;
  bundleVersion: number;
  autoSyncEnabled: boolean;
}

export function getOEMSyncMeta(): OEMSyncMeta {
  if (typeof window === 'undefined') {
    return {
      lastChecked: '',
      lastUpdated: '',
      bundleVersion: 0,
      autoSyncEnabled: true,
    };
  }
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return {
    lastChecked: '',
    lastUpdated: '',
    bundleVersion: 0,
    autoSyncEnabled: true,
  };
}

export function saveOEMSyncMeta(meta: Partial<OEMSyncMeta>): OEMSyncMeta {
  const merged = { ...getOEMSyncMeta(), ...meta };
  if (typeof window !== 'undefined') {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(merged));
  }
  return merged;
}

export function getCustomOverlay(): OEMDTCBundle['codes'] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CUSTOM_OVERLAY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveCustomOverlay(codes: OEMDTCBundle['codes']): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CUSTOM_OVERLAY_KEY, JSON.stringify(codes));
}

export function mergeCodeMaps(
  base: OEMDTCBundle['codes'],
  overlay: OEMDTCBundle['codes']
): OEMDTCBundle['codes'] {
  const merged = { ...base };
  for (const [code, rows] of Object.entries(overlay)) {
    const normalized = code.toUpperCase();
    if (!merged[normalized]) {
      merged[normalized] = rows;
    } else {
      const existing = new Set(merged[normalized].map((r) => `${r[0]}:${r[1]}`));
      const extra = rows.filter((r) => !existing.has(`${r[0]}:${r[1]}`));
      merged[normalized] = [...merged[normalized], ...extra];
    }
  }
  return merged;
}

export function importCustomOEMBundle(
  input: unknown
): { success: boolean; added: number; message: string } {
  try {
    const data = input as OEMDTCBundle | { codes: OEMDTCBundle['codes'] };
    const codes = 'codes' in data && data.codes ? data.codes : null;
    if (!codes || typeof codes !== 'object') {
      return { success: false, added: 0, message: 'Invalid format: expected { codes: { ... } }' };
    }

    const current = getCustomOverlay() || {};
    const merged = mergeCodeMaps(current, codes);
    const added = Object.keys(codes).length;
    saveCustomOverlay(merged);
    return {
      success: true,
      added,
      message: `Imported ${added} code entries into custom overlay`,
    };
  } catch (err) {
    return {
      success: false,
      added: 0,
      message: err instanceof Error ? err.message : 'Import failed',
    };
  }
}

export function clearCustomOverlay(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CUSTOM_OVERLAY_KEY);
  }
}

export function applyOverlayToBundle(bundle: OEMDTCBundle): OEMDTCBundle {
  const overlay = getCustomOverlay();
  if (!overlay) return bundle;
  return {
    ...bundle,
    codes: mergeCodeMaps(bundle.codes, overlay),
    stats: {
      ...bundle.stats,
      uniqueCodes: Object.keys(mergeCodeMaps(bundle.codes, overlay)).length,
    },
  };
}
