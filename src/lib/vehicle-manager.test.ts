import { describe, it, expect } from 'vitest';
import { VehicleManager } from './vehicle-manager';

describe('VehicleManager.validateVehicle', () => {
  it('rejects missing required fields', () => {
    const result = VehicleManager.validateVehicle({});
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('accepts valid vehicle data', () => {
    const result = VehicleManager.validateVehicle({
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: '1HGBH41JXMN109186',
      currentMileage: 50000,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid VIN length', () => {
    const result = VehicleManager.validateVehicle({
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      vin: 'SHORT',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('VIN'))).toBe(true);
  });
});
