#!/usr/bin/env node
/**
 * Keep PWA cache names and manifest version aligned with package.json.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
const slug = version.replace(/\./g, '-');

const swPath = join(root, 'public', 'sw.js');
let sw = readFileSync(swPath, 'utf8');
sw = sw.replace(
  /const CACHE_NAME = 'cardiag-v[^']*';/,
  `const CACHE_NAME = 'cardiag-v${slug}';`
);
sw = sw.replace(
  /const STATIC_CACHE = 'cardiag-static-v[^']*';/,
  `const STATIC_CACHE = 'cardiag-static-v${slug}';`
);
sw = sw.replace(
  /const DYNAMIC_CACHE = 'cardiag-dynamic-v[^']*';/,
  `const DYNAMIC_CACHE = 'cardiag-dynamic-v${slug}';`
);
sw = sw.replace(
  /const API_CACHE = 'cardiag-api-v[^']*';/,
  `const API_CACHE = 'cardiag-api-v${slug}';`
);
writeFileSync(swPath, sw);

const manifestPath = join(root, 'public', 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.version = version;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Synced app version ${version} → manifest.json, sw.js caches`);
