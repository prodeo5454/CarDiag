import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rememberAdapter, getKnownAdapters, getAdapterById } from './adapter-history';
import type { OBDAdapter } from '@/types';

const mockAdapter: OBDAdapter = {
  id: 'bt-test-1',
  name: 'OBDLink MX+',
  type: 'bluetooth',
  address: 'AA:BB:CC:DD:EE:FF',
  chipset: 'OBDLink',
};

describe('adapter-history', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const ls = {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    };
    vi.stubGlobal('localStorage', ls);
    vi.stubGlobal('window', { localStorage: ls });
  });

  it('remembers and retrieves adapters', () => {
    rememberAdapter(mockAdapter);
    expect(getKnownAdapters()).toHaveLength(1);
    expect(getAdapterById('bt-test-1')?.name).toBe('OBDLink MX+');
  });
});
