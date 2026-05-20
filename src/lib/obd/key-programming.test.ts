import { describe, it, expect, vi } from 'vitest';
import { KeyProgrammingService } from './key-programming';

describe('KeyProgrammingService', () => {
  const sendCommand = vi.fn().mockResolvedValue('OK');

  it('requires PIN for pin_code procedure', async () => {
    const svc = new KeyProgrammingService(sendCommand, 'Ford', '7E0');
    const r = await svc.runProcedure('pin_immo', { confirmRisk: true });
    expect(r.success).toBe(false);
    expect(r.message).toMatch(/PIN is required/i);
  });

  it('lists all procedures when make is generic', () => {
    const svc = new KeyProgrammingService(sendCommand, 'GENERIC', '7E0');
    const list = svc.getProceduresForVehicle('GENERIC');
    expect(list.length).toBeGreaterThan(3);
  });

  it('filters procedures by manufacturer', () => {
    const svc = new KeyProgrammingService(sendCommand, 'BMW', '7E0');
    const list = svc.getProceduresForVehicle('BMW');
    expect(list.some((p) => p.manufacturers.includes('BMW'))).toBe(true);
  });
});
