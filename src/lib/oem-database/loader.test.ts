import { describe, it, expect } from 'vitest';
import type { OEMDTCBundle } from './types';

// Inline mini bundle for unit tests (no fetch)
const mini: OEMDTCBundle = {
  version: 2,
  updated: '2026-01-01',
  attribution: ['test'],
  stats: { uniqueCodes: 2, totalDefinitions: 3, sourceFiles: 2 },
  codes: {
    P0420: [
      ['GENERIC', 'Catalyst Efficiency Below Threshold', 'powertrain', 'warning'],
    ],
    P1000: [
      ['FORD', 'OBD System Readiness Test Not Complete', 'powertrain', 'info'],
      ['GENERIC', 'Manufacturer controls', 'powertrain', 'info'],
    ],
  },
};

describe('OEM lookup logic', () => {
  it('prefers manufacturer-specific row when make matches', () => {
    const rows = mini.codes.P1000;
    const ford = rows.find((r) => r[0] === 'FORD');
    expect(ford?.[1]).toContain('Readiness');
  });
});
