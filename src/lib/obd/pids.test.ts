import { describe, it, expect } from 'vitest';
import { parseDTCCodes } from './pids';

describe('parseDTCCodes', () => {
  it('parses stored DTC hex response', () => {
    const codes = parseDTCCodes('43 01 33 00 00');
    expect(codes).toContain('P0100');
  });

  it('ignores padding zeros', () => {
    const codes = parseDTCCodes('0000');
    expect(codes).toHaveLength(0);
  });

  it('parses multiple codes', () => {
    const codes = parseDTCCodes('430133042000');
    expect(codes.length).toBeGreaterThanOrEqual(1);
  });
});
