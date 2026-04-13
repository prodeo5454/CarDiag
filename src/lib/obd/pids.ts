import type { OBDPIDDefinition } from '@/types';

// ─── Standard OBD-II PIDs (Mode 01) ─────────────────────────────────────────
// These PIDs are mandated by SAE J1979 and supported by all OBD-II vehicles

export const STANDARD_PIDS: OBDPIDDefinition[] = [
  // ── Engine ──
  {
    pid: '0C', mode: '01', name: 'Engine RPM', description: 'Engine revolutions per minute',
    unit: 'RPM', min: 0, max: 16383.75, bytes: 2, category: 'Engine',
    formula: (b) => ((b[0] * 256) + b[1]) / 4,
  },
  {
    pid: '04', mode: '01', name: 'Engine Load', description: 'Calculated engine load value',
    unit: '%', min: 0, max: 100, bytes: 1, category: 'Engine',
    formula: (b) => (b[0] * 100) / 255,
  },
  {
    pid: '05', mode: '01', name: 'Coolant Temperature', description: 'Engine coolant temperature',
    unit: '°C', min: -40, max: 215, bytes: 1, category: 'Engine',
    formula: (b) => b[0] - 40,
  },
  {
    pid: '0F', mode: '01', name: 'Intake Air Temperature', description: 'Intake air temperature',
    unit: '°C', min: -40, max: 215, bytes: 1, category: 'Engine',
    formula: (b) => b[0] - 40,
  },
  {
    pid: '0B', mode: '01', name: 'Intake Manifold Pressure', description: 'Intake manifold absolute pressure',
    unit: 'kPa', min: 0, max: 255, bytes: 1, category: 'Engine',
    formula: (b) => b[0],
  },
  {
    pid: '0E', mode: '01', name: 'Timing Advance', description: 'Timing advance relative to #1 cylinder',
    unit: '°', min: -64, max: 63.5, bytes: 1, category: 'Engine',
    formula: (b) => (b[0] / 2) - 64,
  },
  {
    pid: '11', mode: '01', name: 'Throttle Position', description: 'Throttle position',
    unit: '%', min: 0, max: 100, bytes: 1, category: 'Engine',
    formula: (b) => (b[0] * 100) / 255,
  },
  {
    pid: '5C', mode: '01', name: 'Oil Temperature', description: 'Engine oil temperature',
    unit: '°C', min: -40, max: 210, bytes: 1, category: 'Engine',
    formula: (b) => b[0] - 40,
  },

  // ── Vehicle ──
  {
    pid: '0D', mode: '01', name: 'Vehicle Speed', description: 'Vehicle speed',
    unit: 'km/h', min: 0, max: 255, bytes: 1, category: 'Vehicle',
    formula: (b) => b[0],
  },
  {
    pid: '1F', mode: '01', name: 'Run Time', description: 'Run time since engine start',
    unit: 's', min: 0, max: 65535, bytes: 2, category: 'Vehicle',
    formula: (b) => (b[0] * 256) + b[1],
  },
  {
    pid: '21', mode: '01', name: 'Distance w/ MIL', description: 'Distance traveled with MIL on',
    unit: 'km', min: 0, max: 65535, bytes: 2, category: 'Vehicle',
    formula: (b) => (b[0] * 256) + b[1],
  },
  {
    pid: '31', mode: '01', name: 'Distance Since Clear', description: 'Distance since codes cleared',
    unit: 'km', min: 0, max: 65535, bytes: 2, category: 'Vehicle',
    formula: (b) => (b[0] * 256) + b[1],
  },
  {
    pid: '2F', mode: '01', name: 'Fuel Tank Level', description: 'Fuel tank level input',
    unit: '%', min: 0, max: 100, bytes: 1, category: 'Vehicle',
    formula: (b) => (b[0] * 100) / 255,
  },
  {
    pid: '46', mode: '01', name: 'Ambient Air Temperature', description: 'Ambient air temperature',
    unit: '°C', min: -40, max: 215, bytes: 1, category: 'Vehicle',
    formula: (b) => b[0] - 40,
  },
  {
    pid: '33', mode: '01', name: 'Barometric Pressure', description: 'Absolute barometric pressure',
    unit: 'kPa', min: 0, max: 255, bytes: 1, category: 'Vehicle',
    formula: (b) => b[0],
  },

  // ── Fuel System ──
  {
    pid: '10', mode: '01', name: 'MAF Air Flow', description: 'MAF air flow rate',
    unit: 'g/s', min: 0, max: 655.35, bytes: 2, category: 'Fuel',
    formula: (b) => ((b[0] * 256) + b[1]) / 100,
  },
  {
    pid: '23', mode: '01', name: 'Fuel Rail Pressure', description: 'Fuel rail gauge pressure (diesel/GDI)',
    unit: 'kPa', min: 0, max: 655350, bytes: 2, category: 'Fuel',
    formula: (b) => ((b[0] * 256) + b[1]) * 10,
  },
  {
    pid: '06', mode: '01', name: 'Short Term Fuel Trim B1', description: 'Short term fuel trim — Bank 1',
    unit: '%', min: -100, max: 99.2, bytes: 1, category: 'Fuel',
    formula: (b) => ((b[0] - 128) * 100) / 128,
  },
  {
    pid: '07', mode: '01', name: 'Long Term Fuel Trim B1', description: 'Long term fuel trim — Bank 1',
    unit: '%', min: -100, max: 99.2, bytes: 1, category: 'Fuel',
    formula: (b) => ((b[0] - 128) * 100) / 128,
  },
  {
    pid: '08', mode: '01', name: 'Short Term Fuel Trim B2', description: 'Short term fuel trim — Bank 2',
    unit: '%', min: -100, max: 99.2, bytes: 1, category: 'Fuel',
    formula: (b) => ((b[0] - 128) * 100) / 128,
  },
  {
    pid: '09', mode: '01', name: 'Long Term Fuel Trim B2', description: 'Long term fuel trim — Bank 2',
    unit: '%', min: -100, max: 99.2, bytes: 1, category: 'Fuel',
    formula: (b) => ((b[0] - 128) * 100) / 128,
  },
  {
    pid: '0A', mode: '01', name: 'Fuel Pressure', description: 'Fuel pressure (gauge)',
    unit: 'kPa', min: 0, max: 765, bytes: 1, category: 'Fuel',
    formula: (b) => b[0] * 3,
  },
  {
    pid: '03', mode: '01', name: 'Fuel System Status', description: 'Fuel system status',
    unit: '', min: 0, max: 0, bytes: 2, category: 'Fuel',
    formula: (b) => b[0],
  },
  {
    pid: '51', mode: '01', name: 'Fuel Type', description: 'Fuel type coding',
    unit: '', min: 0, max: 23, bytes: 1, category: 'Fuel',
    formula: (b) => b[0],
  },

  // ── Emissions / O2 ──
  {
    pid: '14', mode: '01', name: 'O2 Sensor Voltage B1S1', description: 'O2 sensor voltage — Bank 1 Sensor 1',
    unit: 'V', min: 0, max: 1.275, bytes: 2, category: 'Emissions',
    formula: (b) => b[0] / 200,
  },
  {
    pid: '15', mode: '01', name: 'O2 Sensor Voltage B1S2', description: 'O2 sensor voltage — Bank 1 Sensor 2',
    unit: 'V', min: 0, max: 1.275, bytes: 2, category: 'Emissions',
    formula: (b) => b[0] / 200,
  },
  {
    pid: '3C', mode: '01', name: 'Catalyst Temp B1S1', description: 'Catalyst temperature Bank 1 Sensor 1',
    unit: '°C', min: -40, max: 6513.5, bytes: 2, category: 'Emissions',
    formula: (b) => ((b[0] * 256) + b[1]) / 10 - 40,
  },
  {
    pid: '3E', mode: '01', name: 'Catalyst Temp B2S1', description: 'Catalyst temperature Bank 2 Sensor 1',
    unit: '°C', min: -40, max: 6513.5, bytes: 2, category: 'Emissions',
    formula: (b) => ((b[0] * 256) + b[1]) / 10 - 40,
  },

  // ── Electrical ──
  {
    pid: '42', mode: '01', name: 'Control Module Voltage', description: 'Control module voltage',
    unit: 'V', min: 0, max: 65.535, bytes: 2, category: 'Electrical',
    formula: (b) => ((b[0] * 256) + b[1]) / 1000,
  },

  // ── Transmission ──
  {
    pid: '5F', mode: '01', name: 'Emission Requirements', description: 'Emission requirements',
    unit: '', min: 0, max: 0, bytes: 1, category: 'Transmission',
    formula: (b) => b[0],
  },
];

// ─── DTC Mode Commands ──────────────────────────────────────────────────────

export const DTC_MODES = {
  READ_STORED:   { command: '03',   description: 'Read stored DTCs' },
  CLEAR_CODES:   { command: '04',   description: 'Clear DTCs and freeze frame data' },
  READ_PENDING:  { command: '07',   description: 'Read pending DTCs' },
  READ_PERMANENT:{ command: '0A',   description: 'Read permanent DTCs' },
  FREEZE_FRAME:  { command: '02',   description: 'Read freeze frame data' },
  READ_VIN:      { command: '0902', description: 'Read Vehicle Identification Number' },
  READ_CAL_ID:   { command: '0904', description: 'Read Calibration ID' },
  READ_ECU_NAME: { command: '090A', description: 'Read ECU name' },
};

// ─── PID Support Check ──────────────────────────────────────────────────────

export const PID_SUPPORT_COMMANDS = [
  { command: '0100', description: 'PIDs supported [01-20]', range: [0x01, 0x20] },
  { command: '0120', description: 'PIDs supported [21-40]', range: [0x21, 0x40] },
  { command: '0140', description: 'PIDs supported [41-60]', range: [0x41, 0x60] },
  { command: '0160', description: 'PIDs supported [61-80]', range: [0x61, 0x80] },
  { command: '0180', description: 'PIDs supported [81-A0]', range: [0x81, 0xA0] },
];

export function parseSupportedPIDs(response: string, startPID: number): string[] {
  const bytes = response.replace(/[\s41]/g, '').match(/.{1,2}/g);
  if (!bytes || bytes.length < 4) return [];
  const supported: string[] = [];
  for (let i = 0; i < 4; i++) {
    const byte = parseInt(bytes[i], 16);
    for (let bit = 7; bit >= 0; bit--) {
      if (byte & (1 << bit)) {
        const pid = startPID + (i * 8) + (7 - bit);
        supported.push(pid.toString(16).padStart(2, '0').toUpperCase());
      }
    }
  }
  return supported;
}

// ─── DTC Code Parser ─────────────────────────────────────────────────────────

const DTC_FIRST_CHAR: Record<string, string> = {
  '0': 'P0', '1': 'P1', '2': 'P2', '3': 'P3',
  '4': 'C0', '5': 'C1', '6': 'C2', '7': 'C3',
  '8': 'B0', '9': 'B1', 'A': 'B2', 'B': 'B3',
  'C': 'U0', 'D': 'U1', 'E': 'U2', 'F': 'U3',
};

export function parseDTCCodes(response: string): string[] {
  const cleaned = response.replace(/[\s\r\n43]/g, '');
  const codes: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    const codeHex = cleaned.substring(i, i + 4);
    if (codeHex.length < 4 || codeHex === '0000') continue;
    const firstChar = DTC_FIRST_CHAR[codeHex.charAt(0).toUpperCase()];
    if (firstChar) {
      codes.push(firstChar + codeHex.substring(1).toUpperCase());
    }
  }
  return codes;
}

// ─── Fuel Type Decoder ──────────────────────────────────────────────────────

export const FUEL_TYPES: Record<number, string> = {
  0: 'Not Available',
  1: 'Gasoline',
  2: 'Methanol',
  3: 'Ethanol',
  4: 'Diesel',
  5: 'LPG',
  6: 'CNG',
  7: 'Propane',
  8: 'Electric',
  9: 'Bifuel (Gasoline)',
  10: 'Bifuel (Methanol)',
  11: 'Bifuel (Ethanol)',
  12: 'Bifuel (LPG)',
  13: 'Bifuel (CNG)',
  14: 'Bifuel (Propane)',
  15: 'Bifuel (Electric)',
  16: 'Bifuel (Electric/Combustion)',
  17: 'Hybrid Gasoline',
  18: 'Hybrid Ethanol',
  19: 'Hybrid Diesel',
  20: 'Hybrid Electric',
  21: 'Hybrid (Combustion)',
  22: 'Hybrid Regenerative',
  23: 'Bifuel (Diesel)',
};

export function getPIDByName(name: string): OBDPIDDefinition | undefined {
  return STANDARD_PIDS.find(p => p.name.toLowerCase().includes(name.toLowerCase()));
}

export function getPIDsByCategory(category: string): OBDPIDDefinition[] {
  return STANDARD_PIDS.filter(p => p.category === category);
}

export function getAllCategories(): string[] {
  return Array.from(new Set(STANDARD_PIDS.map(p => p.category))).sort();
}
