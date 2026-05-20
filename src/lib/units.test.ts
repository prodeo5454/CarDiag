import { describe, it, expect } from 'vitest';
import { formatSensorValue, celsiusToFahrenheit, kmhToMph } from './units';

describe('units', () => {
  it('converts temperature for imperial', () => {
    const r = formatSensorValue(20, '°C', 'imperial');
    expect(r.unitLabel).toBe('°F');
    expect(Number(r.display)).toBeCloseTo(68, 0);
  });

  it('converts speed for imperial', () => {
    const r = formatSensorValue(100, 'km/h', 'imperial');
    expect(r.unitLabel).toBe('mph');
    expect(Number(r.display)).toBeCloseTo(kmhToMph(100), 0);
  });

  it('keeps metric values', () => {
    const r = formatSensorValue(90, '°C', 'metric');
    expect(r.display).toBe('90.0');
    expect(r.unitLabel).toBe('°C');
  });
});
