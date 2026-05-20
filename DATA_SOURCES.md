# CarDiag Offline Data Sources

CarDiag bundles diagnostic and vehicle data for **fully offline** use. We do **not** scrape paywalled dealer systems (Autel, Mitchell, OEM subscription portals).

## DTC / OEM codes

| Source | License | Content |
|--------|---------|---------|
| [Wal33D/dtc-database](https://github.com/Wal33D/dtc-database) | MIT | ~12k unique DTCs, generic SAE + 33 manufacturer text sources |
| CarDiag `src/lib/dtc-database.ts` | Project | Curated codes with causes, symptoms, solutions |

**Refresh:** `npm run build:oem-db` → writes `public/data/oem/dtc-bundle.json`

## Vehicle makes (reference)

| Source | License | Content |
|--------|---------|---------|
| [NHTSA vPIC API](https://vpic.nhtsa.dot.gov/api/) | US public data | Vehicle make list |

**Output:** `public/data/nhtsa/makes.json`

## How lookup works

1. Built-in enriched database (highest detail).
2. Offline OEM bundle (manufacturer-specific + generic).
3. Minimal synthesized entry from SAE code structure if unknown.

Vehicle make (from your profile) selects Ford vs GM vs GENERIC definitions when multiple exist.

## Adding your own data

Place a JSON file matching `OEMDTCBundle` shape and import via future Settings → Import, or extend `scripts/sync-oem-database.mjs` with additional MIT/PD sources.

## Legal note

Only use data you have the right to redistribute. Do not commit proprietary OEM service manual extracts.
