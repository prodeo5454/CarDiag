import { loadOEMDatabase, getOEMDatabaseStats, isOEMDatabaseLoaded } from './loader';
import { getOEMSyncMeta, saveOEMSyncMeta } from './merge';

const MANIFEST_URL = '/data/oem/manifest.json';
const CHECK_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface OEMManifest {
  version: number;
  updated: string;
  bundlePath: string;
  uniqueCodes: number;
}

export async function fetchOEMManifest(): Promise<OEMManifest | null> {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as OEMManifest;
  } catch {
    return null;
  }
}

export async function runOEMAutoSyncIfDue(force = false): Promise<{
  ran: boolean;
  message: string;
}> {
  const meta = getOEMSyncMeta();
  if (!meta.autoSyncEnabled && !force) {
    return { ran: false, message: 'Auto-sync disabled in settings' };
  }

  const now = Date.now();
  const last = meta.lastChecked ? new Date(meta.lastChecked).getTime() : 0;
  if (!force && last && now - last < CHECK_INTERVAL_MS) {
    return { ran: false, message: 'Checked recently — bundle still current' };
  }

  saveOEMSyncMeta({ lastChecked: new Date().toISOString() });

  const manifest = await fetchOEMManifest();
  if (!manifest) {
    return { ran: false, message: 'No manifest — reload bundle from app install' };
  }

  if (!force && manifest.version <= meta.bundleVersion && isOEMDatabaseLoaded()) {
    return { ran: false, message: `Bundle v${meta.bundleVersion} is up to date` };
  }

  await loadOEMDatabase(true);
  const stats = getOEMDatabaseStats();

  saveOEMSyncMeta({
    lastUpdated: manifest.updated,
    bundleVersion: manifest.version,
  });

  return {
    ran: true,
    message: stats
      ? `Synced OEM database: ${stats.uniqueCodes.toLocaleString()} codes`
      : 'Reloaded OEM database',
  };
}
