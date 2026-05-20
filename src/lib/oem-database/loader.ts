import type { DTCCode } from '@/types';
import type { CompactDTCRow, OEMDTCBundle, OEMLookupResult } from './types';
import { applyOverlayToBundle } from './merge';

const BUNDLE_URL = '/data/oem/dtc-bundle.json';
const STORAGE_KEY = 'cardiag-oem-bundle-cache';

let bundle: OEMDTCBundle | null = null;
let loadPromise: Promise<OEMDTCBundle | null> | null = null;
let loadError: string | null = null;

function normalizeMake(make?: string): string | undefined {
  if (!make) return undefined;
  return make.trim().toUpperCase().replace(/[^A-Z0-9]/g, ' ');
}

function makeAliases(make: string): string[] {
  const u = normalizeMake(make) || '';
  const aliases: Record<string, string[]> = {
    CHEVROLET: ['CHEVY', 'CHEVROLET', 'GM'],
    CHEVY: ['CHEVY', 'CHEVROLET', 'GM'],
    VOLKSWAGEN: ['VOLKSWAGEN', 'VW'],
    VW: ['VOLKSWAGEN', 'VW'],
    MERCEDES: ['MERCEDES', 'MERCEDES BENZ'],
    'MERCEDES BENZ': ['MERCEDES', 'MERCEDES BENZ'],
    GMC: ['GMC', 'GM'],
    BUICK: ['BUICK', 'GM'],
    CADILLAC: ['CADILLAC', 'GM'],
    PONTIAC: ['PONTIAC', 'GM'],
    OLDSMOBILE: ['OLDSMOBILE', 'GM'],
    SATURN: ['SATURN', 'GM'],
    HONDA: ['HONDA', 'ACURA'],
    ACURA: ['HONDA', 'ACURA'],
    TOYOTA: ['TOYOTA', 'LEXUS'],
    LEXUS: ['TOYOTA', 'LEXUS'],
    NISSAN: ['NISSAN', 'INFINITI'],
    INFINITI: ['NISSAN', 'INFINITI'],
    FORD: ['FORD', 'LINCOLN', 'MERCURY'],
    LINCOLN: ['FORD', 'LINCOLN', 'MERCURY'],
    MERCURY: ['FORD', 'LINCOLN', 'MERCURY'],
    CHRYSLER: ['CHRYSLER', 'DODGE', 'JEEP'],
    DODGE: ['CHRYSLER', 'DODGE', 'JEEP'],
    JEEP: ['CHRYSLER', 'DODGE', 'JEEP'],
    HYUNDAI: ['HYUNDAI', 'KIA'],
    KIA: ['HYUNDAI', 'KIA'],
  };
  return aliases[u] || [u];
}

function rowToLookup(code: string, row: CompactDTCRow): OEMLookupResult {
  return {
    code,
    manufacturer: row[0],
    description: row[1],
    category: row[2],
    severity: row[3],
  };
}

function pickBestRow(rows: CompactDTCRow[], vehicleMake?: string): CompactDTCRow {
  if (!vehicleMake || rows.length === 1) return rows[0];

  const aliases = makeAliases(vehicleMake);
  const specific = rows.find((r) => aliases.includes(r[0]));
  if (specific) return specific;

  const generic = rows.find((r) => r[0] === 'GENERIC');
  return generic || rows[0];
}

export function isOEMDatabaseLoaded(): boolean {
  return bundle !== null;
}

export function getOEMLoadError(): string | null {
  return loadError;
}

export async function loadOEMDatabase(force = false): Promise<OEMDTCBundle | null> {
  if (bundle && !force) return bundle;
  if (loadPromise && !force) return loadPromise;

  loadPromise = (async () => {
    loadError = null;
    if (force) {
      bundle = null;
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
    }

    if (typeof window !== 'undefined' && !force) {
      try {
        const cached = sessionStorage.getItem(STORAGE_KEY);
        if (cached) {
          bundle = JSON.parse(cached) as OEMDTCBundle;
          return bundle;
        }
      } catch {
        /* ignore */
      }
    }

    try {
      const res = await fetch(BUNDLE_URL, { cache: 'force-cache' });
      if (!res.ok) {
        throw new Error(`Bundle not found (${res.status}). Run: npm run build:oem-db`);
      }
      const raw = (await res.json()) as OEMDTCBundle;
      bundle = applyOverlayToBundle(raw);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
        } catch {
          /* quota */
        }
      }
      return bundle;
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Failed to load OEM database';
      bundle = null;
      return null;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

export function getOEMDatabaseStats() {
  if (!bundle) return null;
  return bundle.stats;
}

export function lookupOEMDTC(code: string, vehicleMake?: string): OEMLookupResult | null {
  if (!bundle) return null;
  const normalized = code.toUpperCase().replace(/\s/g, '');
  const rows = bundle.codes[normalized];
  if (!rows?.length) return null;
  return rowToLookup(normalized, pickBestRow(rows, vehicleMake));
}

export function lookupAllOEMDefinitions(code: string): OEMLookupResult[] {
  if (!bundle) return [];
  const normalized = code.toUpperCase().replace(/\s/g, '');
  const rows = bundle.codes[normalized];
  if (!rows) return [];
  return rows.map((r) => rowToLookup(normalized, r));
}

export function searchOEMByKeyword(keyword: string, limit = 50): OEMLookupResult[] {
  if (!bundle || !keyword.trim()) return [];
  const lower = keyword.toLowerCase();
  const results: OEMLookupResult[] = [];

  for (const [code, rows] of Object.entries(bundle.codes)) {
    for (const row of rows) {
      if (
        code.toLowerCase().includes(lower) ||
        row[1].toLowerCase().includes(lower) ||
        row[0].toLowerCase().includes(lower)
      ) {
        results.push(rowToLookup(code, row));
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

export function oemToDTCCode(entry: OEMLookupResult): DTCCode {
  const isManufacturer = entry.manufacturer !== 'GENERIC';
  return {
    code: entry.code,
    description: isManufacturer
      ? `${entry.description} (${entry.manufacturer})`
      : entry.description,
    category: entry.category,
    severity: entry.severity,
    system: isManufacturer ? `${entry.manufacturer} OEM` : inferSystem(entry),
    possibleCauses: [
      isManufacturer
        ? `Manufacturer-specific definition (${entry.manufacturer})`
        : 'Generic OBD-II / SAE definition',
      'Refer to service manual for pinpoint tests',
    ],
    symptoms: ['Check engine or system warning lamp may illuminate'],
    solutions: [
      'Confirm code with freeze frame data',
      'Inspect related wiring and connectors',
      'Perform OEM pinpoint diagnostic procedure',
    ],
  };
}

function inferSystem(entry: OEMLookupResult): string {
  const d = entry.description.toLowerCase();
  if (d.includes('catalyst') || d.includes('o2') || d.includes('oxygen')) return 'Emissions';
  if (d.includes('transmission') || d.includes('gear')) return 'Transmission';
  if (d.includes('abs') || d.includes('brake')) return 'Brakes';
  if (d.includes('airbag') || d.includes('srs')) return 'Safety';
  if (d.includes('communication') || d.includes('can')) return 'Network';
  return entry.category === 'powertrain' ? 'Powertrain' : 'Body/Chassis';
}
