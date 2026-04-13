import { SensorData } from '@/types';

function generateHistory(baseValue: number, variance: number, points: number = 60): { time: number; value: number }[] {
  const now = Date.now();
  const history: { time: number; value: number }[] = [];
  for (let i = points; i >= 0; i--) {
    history.push({
      time: now - i * 1000,
      value: baseValue + (Math.random() - 0.5) * variance * 2,
    });
  }
  return history;
}

export function generateSensorData(): SensorData[] {
  return [
    {
      id: 'rpm', name: 'Engine RPM', unit: 'RPM', value: 780, min: 0, max: 8000,
      normalRange: { min: 600, max: 1000 },
      history: generateHistory(780, 50),
      category: 'Engine',
    },
    {
      id: 'speed', name: 'Vehicle Speed', unit: 'km/h', value: 0, min: 0, max: 260,
      normalRange: { min: 0, max: 200 },
      history: generateHistory(0, 2),
      category: 'Vehicle',
    },
    {
      id: 'coolant_temp', name: 'Coolant Temperature', unit: '°C', value: 90, min: -40, max: 150,
      normalRange: { min: 80, max: 105 },
      history: generateHistory(90, 3),
      category: 'Engine',
    },
    {
      id: 'intake_temp', name: 'Intake Air Temperature', unit: '°C', value: 35, min: -40, max: 120,
      normalRange: { min: 10, max: 60 },
      history: generateHistory(35, 5),
      category: 'Engine',
    },
    {
      id: 'throttle', name: 'Throttle Position', unit: '%', value: 15.5, min: 0, max: 100,
      normalRange: { min: 0, max: 100 },
      history: generateHistory(15.5, 3),
      category: 'Engine',
    },
    {
      id: 'engine_load', name: 'Engine Load', unit: '%', value: 22.4, min: 0, max: 100,
      normalRange: { min: 0, max: 80 },
      history: generateHistory(22.4, 8),
      category: 'Engine',
    },
    {
      id: 'maf', name: 'MAF Air Flow Rate', unit: 'g/s', value: 4.2, min: 0, max: 300,
      normalRange: { min: 2, max: 250 },
      history: generateHistory(4.2, 1),
      category: 'Fuel',
    },
    {
      id: 'fuel_pressure', name: 'Fuel Rail Pressure', unit: 'kPa', value: 350, min: 0, max: 800,
      normalRange: { min: 300, max: 450 },
      history: generateHistory(350, 20),
      category: 'Fuel',
    },
    {
      id: 'short_ft1', name: 'Short Term Fuel Trim - Bank 1', unit: '%', value: 1.5, min: -25, max: 25,
      normalRange: { min: -10, max: 10 },
      history: generateHistory(1.5, 3),
      category: 'Fuel',
    },
    {
      id: 'long_ft1', name: 'Long Term Fuel Trim - Bank 1', unit: '%', value: 2.3, min: -25, max: 25,
      normalRange: { min: -10, max: 10 },
      history: generateHistory(2.3, 1),
      category: 'Fuel',
    },
    {
      id: 'o2_voltage', name: 'O2 Sensor Voltage (B1S1)', unit: 'V', value: 0.45, min: 0, max: 1.1,
      normalRange: { min: 0.1, max: 0.9 },
      history: generateHistory(0.45, 0.3),
      category: 'Emissions',
    },
    {
      id: 'cat_temp', name: 'Catalyst Temperature (B1S1)', unit: '°C', value: 420, min: 0, max: 1000,
      normalRange: { min: 300, max: 800 },
      history: generateHistory(420, 30),
      category: 'Emissions',
    },
    {
      id: 'map', name: 'Intake Manifold Pressure', unit: 'kPa', value: 33, min: 0, max: 255,
      normalRange: { min: 20, max: 105 },
      history: generateHistory(33, 5),
      category: 'Engine',
    },
    {
      id: 'timing_advance', name: 'Timing Advance', unit: '°', value: 14.5, min: -64, max: 64,
      normalRange: { min: 5, max: 40 },
      history: generateHistory(14.5, 3),
      category: 'Engine',
    },
    {
      id: 'battery_voltage', name: 'Control Module Voltage', unit: 'V', value: 14.2, min: 0, max: 18,
      normalRange: { min: 13.5, max: 14.8 },
      history: generateHistory(14.2, 0.3),
      category: 'Electrical',
    },
    {
      id: 'abs_fuel_level', name: 'Fuel Level', unit: '%', value: 65, min: 0, max: 100,
      normalRange: { min: 10, max: 100 },
      history: generateHistory(65, 0.5),
      category: 'Vehicle',
    },
    {
      id: 'baro_pressure', name: 'Barometric Pressure', unit: 'kPa', value: 101, min: 0, max: 255,
      normalRange: { min: 80, max: 110 },
      history: generateHistory(101, 1),
      category: 'Environment',
    },
    {
      id: 'ambient_temp', name: 'Ambient Air Temperature', unit: '°C', value: 24, min: -40, max: 60,
      normalRange: { min: -20, max: 45 },
      history: generateHistory(24, 1),
      category: 'Environment',
    },
    {
      id: 'oil_temp', name: 'Engine Oil Temperature', unit: '°C', value: 95, min: -40, max: 200,
      normalRange: { min: 80, max: 120 },
      history: generateHistory(95, 4),
      category: 'Engine',
    },
    {
      id: 'trans_temp', name: 'Transmission Fluid Temperature', unit: '°C', value: 85, min: -40, max: 200,
      normalRange: { min: 60, max: 110 },
      history: generateHistory(85, 5),
      category: 'Transmission',
    },
  ];
}

export function getSensorCategories(): string[] {
  const sensors = generateSensorData();
  return Array.from(new Set(sensors.map(s => s.category))).sort();
}

export function updateSensorValue(sensor: SensorData): SensorData {
  const variance = (sensor.max - sensor.min) * 0.005;
  const newValue = Math.max(sensor.min, Math.min(sensor.max,
    sensor.value + (Math.random() - 0.5) * variance * 2
  ));
  const now = Date.now();
  const newHistory = [...sensor.history.slice(1), { time: now, value: newValue }];
  return { ...sensor, value: newValue, history: newHistory };
}
