# Changelog

## [2.0.1] — 2026-05-20

### Added

- **PIN-based immobilizer unlock** — `ECUSecurity.unlockWithPin` used when a PIN is entered on key programming procedures
- **`npm run android:bundle`** — static export, Cap sync, and signed `bundleRelease` (when `android/keystore.properties` exists)
- Gradle **release signing** wired from `android/keystore.properties` (optional, local only)

### Changed

- Light theme: broader overrides for `text-white` in main content and muted surfaces
- Key programming: show all procedures when vehicle make is generic or unmatched

## [2.0.0] — 2026-05-20

### Added

- **Advanced AI Diagnostics** (`/advanced`) — offline expert engine, optional cloud AI, EV/hybrid PID scan, guided workflows, J1939 bus probe, coverage stats
- **ECU Coding & Key Programming** (`/programming`) — UDS DID read/write, routines, ECU ID, security access, key procedure guides
- **Offline OEM DTC database** — ~12k codes from MIT-licensed sources + NHTSA makes; custom JSON import and weekly sync
- **Preferences** — theme (incl. light beta), units (metric/imperial), OBD timeout, poll rate, auto-connect, preferred adapter
- **Adapter history** — remembers scanned/connected adapters; star on preferred in Connection list
- **Mobile navigation** — 4 primary tabs + More sheet for Advanced, Programming, Vehicles, etc.
- **Vitest** suite and CI (`typecheck`, `test`, `android:build`)
- Android app **v2.0.0** (Capacitor 6, native BLE)

### Changed

- Dashboard promos for Advanced AI and Programming
- Live data respects unit preference and poll interval from Settings
- Settings layout responsive on phones (`col-span-12 lg:col-span-4`)
- PWA manifest shortcuts for Programming and Advanced

### Fixed

- Permanent DTC read path; maintenance tracker wiring; analytics from real connection events
- Android BLE permissions aligned with `neverForLocation`

### Removed

- Unused `sensor-data.ts` mock module

## [1.0.x] — Earlier

- Core OBD-II diagnostics, live data, vehicles, reports, maintenance, PWA shell
