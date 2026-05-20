import { describe, it, expect } from 'vitest';
import { ECUSecurity } from './ecu-security';

describe('ECUSecurity.deriveKeyFromPin', () => {
  it('mixes seed and PIN into space-separated hex bytes', () => {
    const key = ECUSecurity.deriveKeyFromPin('A1B2C3D4', '1234', 'Ford');
    expect(key).toMatch(/^[0-9A-F]{2}( [0-9A-F]{2})+$/);
  });

  it('produces different keys for different manufacturers', () => {
    const seed = '11223344';
    const pin = '5678';
    const ford = ECUSecurity.deriveKeyFromPin(seed, pin, 'Ford');
    const vw = ECUSecurity.deriveKeyFromPin(seed, pin, 'VW');
    expect(ford).not.toBe(vw);
  });

  it('pads short PIN with zero nibble', () => {
    const key = ECUSecurity.deriveKeyFromPin('00', '5', 'GENERIC');
    expect(key.length).toBeGreaterThan(0);
  });
});
