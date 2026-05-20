import { describe, it, expect } from 'vitest';
import { mergeCodeMaps, importCustomOEMBundle } from './merge';
import type { CompactDTCRow } from './types';

describe('oem merge', () => {
  it('merges code maps without duplicating rows', () => {
    const base: Record<string, CompactDTCRow[]> = {
      P0420: [['GENERIC', 'Catalyst efficiency', 'powertrain', 'warning']],
    };
    const overlay: Record<string, CompactDTCRow[]> = {
      P0420: [['TOYOTA', 'Bank 1 catalyst', 'powertrain', 'warning']],
    };
    const merged = mergeCodeMaps(base, overlay);
    expect(merged.P0420).toHaveLength(2);
  });

  it('rejects invalid import payload', () => {
    const result = importCustomOEMBundle({ foo: 1 });
    expect(result.success).toBe(false);
  });
});
