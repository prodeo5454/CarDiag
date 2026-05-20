/**
 * Syncs open OEM/DTC catalogs into offline bundles for CarDiag.
 * Sources (MIT / public domain):
 * - https://github.com/Wal33D/dtc-database (manufacturer + generic txt)
 * - https://vpic.nhtsa.dot.gov (US government vehicle makes)
 *
 * Run: node scripts/sync-oem-database.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_OEM = path.join(ROOT, 'public', 'data', 'oem');
const OUT_NHTSA = path.join(ROOT, 'public', 'data', 'nhtsa');

const WAL33D_BASE =
  'https://raw.githubusercontent.com/Wal33D/dtc-database/main/data/source-data';
const SOURCE_LIST_URL =
  'https://api.github.com/repos/Wal33D/dtc-database/contents/data/source-data?ref=main';

const GENERIC_FILES = new Set(['p_codes.txt', 'b_codes.txt', 'c_codes.txt', 'u_codes.txt', 'other_codes.txt']);

function manufacturerFromFilename(filename) {
  if (GENERIC_FILES.has(filename)) return 'GENERIC';
  const base = filename.replace(/_codes\.txt$/i, '');
  return base.toUpperCase().replace(/-/g, ' ');
}

function categoryFromCode(code) {
  const p = code[0]?.toUpperCase();
  if (p === 'P') return 'powertrain';
  if (p === 'B') return 'body';
  if (p === 'C') return 'chassis';
  if (p === 'U') return 'network';
  return 'powertrain';
}

function severityFromCode(code, description) {
  const d = description.toLowerCase();
  if (code.startsWith('U') || d.includes('communication') || d.includes('no communication')) {
    return 'critical';
  }
  if (d.includes('misfire') || d.includes('catalyst') && d.includes('below')) return 'critical';
  if (d.includes('circuit low') || d.includes('circuit high') || d.includes('malfunction')) {
    return 'warning';
  }
  return 'info';
}

function parseLines(text, manufacturer) {
  const entries = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^([PBCUpCuU][0-9A-Fa-f]{4})\s*[-–—:]\s*(.+)$/i);
    if (!match) continue;
    const code = match[1].toUpperCase();
    const description = match[2].trim();
    if (!description) continue;
    entries.push({
      code,
      description,
      manufacturer,
      category: categoryFromCode(code),
      severity: severityFromCode(code, description),
    });
  }
  return entries;
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

async function syncDTC() {
  console.log('Fetching Wal33D source file list...');
  const listRes = await fetch(SOURCE_LIST_URL);
  if (!listRes.ok) throw new Error('Failed to list source-data files');
  const list = await listRes.json();
  const files = list.filter((f) => f.type === 'file' && f.name.endsWith('.txt')).map((f) => f.name);

  /** @type {Map<string, Array<{code:string,description:string,manufacturer:string,category:string,severity:string}>>} */
  const byCode = new Map();
  let totalRows = 0;

  for (const file of files) {
    const manufacturer = manufacturerFromFilename(file);
    const url = `${WAL33D_BASE}/${file}`;
    process.stdout.write(`  ${file} (${manufacturer})... `);
    try {
      const text = await fetchText(url);
      const parsed = parseLines(text, manufacturer);
      console.log(parsed.length);
      for (const row of parsed) {
        if (!byCode.has(row.code)) byCode.set(row.code, []);
        byCode.get(row.code).push(row);
        totalRows++;
      }
    } catch (err) {
      console.log(`SKIP (${err.message})`);
    }
  }

  // Compact bundle: code -> array of [manufacturer, description, category, severity]
  const codes = {};
  for (const [code, rows] of byCode.entries()) {
    codes[code] = rows.map((r) => [r.manufacturer, r.description, r.category, r.severity]);
  }

  const bundle = {
    version: 2,
    updated: new Date().toISOString(),
    attribution: [
      'Wal33D/dtc-database (MIT) — generic SAE + manufacturer DTC text sources',
      'CarDiag curated enrichment for causes/solutions on common codes',
    ],
    stats: {
      uniqueCodes: byCode.size,
      totalDefinitions: totalRows,
      sourceFiles: files.length,
    },
    codes,
  };

  fs.mkdirSync(OUT_OEM, { recursive: true });
  const outPath = path.join(OUT_OEM, 'dtc-bundle.json');
  fs.writeFileSync(outPath, JSON.stringify(bundle));

  const manifest = {
    version: 2,
    updated: bundle.updated,
    bundlePath: '/data/oem/dtc-bundle.json',
    uniqueCodes: bundle.stats.uniqueCodes,
    totalDefinitions: bundle.stats.totalDefinitions,
  };
  fs.writeFileSync(path.join(OUT_OEM, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const mb = (fs.statSync(outPath).size / 1024 / 1024).toFixed(2);
  console.log(`\nWrote ${outPath} (${mb} MB, ${bundle.stats.uniqueCodes} unique codes)`);
  return bundle.stats;
}

async function syncNHTSA() {
  console.log('\nFetching NHTSA vPIC makes (public domain)...');
  const res = await fetch('https://vpic.nhtsa.dot.gov/api/vehicles/getallmakes?format=json');
  if (!res.ok) throw new Error('NHTSA makes fetch failed');
  const data = await res.json();
  const makes = (data.Results || [])
    .map((r) => r.Make_Name)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  fs.mkdirSync(OUT_NHTSA, { recursive: true });
  const outPath = path.join(OUT_NHTSA, 'makes.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify({
      updated: new Date().toISOString(),
      source: 'https://vpic.nhtsa.dot.gov/api/',
      count: makes.length,
      makes,
    })
  );
  console.log(`Wrote ${outPath} (${makes.length} makes)`);
  return makes.length;
}

async function main() {
  const outPath = path.join(OUT_OEM, 'dtc-bundle.json');
  if (!process.env.FORCE_OEM_SYNC && fs.existsSync(outPath)) {
    const ageDays = (Date.now() - fs.statSync(outPath).mtimeMs) / 86400000;
    if (ageDays < 14) {
      console.log(`OEM bundle exists (${ageDays.toFixed(1)}d old). Set FORCE_OEM_SYNC=1 to refresh.`);
      await syncNHTSA();
      return;
    }
  }

  console.log('CarDiag OEM database sync\n');
  const dtcStats = await syncDTC();
  const makeCount = await syncNHTSA();
  console.log('\nDone.', { dtcStats, makeCount });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
