import { getPreferences } from './preferences';

export type UnitsSystem = 'metric' | 'imperial';

export function getUnitsSystem(): UnitsSystem {
  return getPreferences().units === 'imperial' ? 'imperial' : 'metric';
}

export function celsiusToFahrenheit(c: number): number {
  return (c * 9) / 5 + 32;
}

export function kmhToMph(kmh: number): number {
  return kmh * 0.621371;
}

/** Format a sensor value + unit label respecting user preference */
export function formatSensorValue(
  value: number,
  unit: string,
  units: UnitsSystem = getUnitsSystem()
): { display: string; unitLabel: string } {
  if (unit === '°C' && units === 'imperial') {
    return {
      display: celsiusToFahrenheit(value).toFixed(1),
      unitLabel: '°F',
    };
  }
  if (unit === 'km/h' && units === 'imperial') {
    return {
      display: kmhToMph(value).toFixed(1),
      unitLabel: 'mph',
    };
  }
  const decimals = unit === 'RPM' || unit === 'kPa' ? 0 : 1;
  return {
    display: value.toFixed(decimals),
    unitLabel: unit,
  };
}

export function formatRangeLabel(min: number, max: number, unit: string): string {
  const u = getUnitsSystem();
  if (unit === '°C' && u === 'imperial') {
    return `${celsiusToFahrenheit(min).toFixed(0)}–${celsiusToFahrenheit(max).toFixed(0)} °F`;
  }
  if (unit === 'km/h' && u === 'imperial') {
    return `${kmhToMph(min).toFixed(0)}–${kmhToMph(max).toFixed(0)} mph`;
  }
  return `${min}–${max} ${unit}`;
}
