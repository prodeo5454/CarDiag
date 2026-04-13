import type { OBDProtocol, OBDCommand, AdapterCapabilities } from '@/types';

// ─── ELM327 AT Command Set ──────────────────────────────────────────────────

export const ELM327_COMMANDS = {
  // Reset & Init
  RESET:            { command: 'ATZ',    description: 'Reset adapter to defaults' },
  DEFAULTS:         { command: 'ATD',    description: 'Set all to defaults' },
  ECHO_OFF:         { command: 'ATE0',   description: 'Disable echo' },
  ECHO_ON:          { command: 'ATE1',   description: 'Enable echo' },
  LINEFEED_OFF:     { command: 'ATL0',   description: 'Disable line feeds' },
  LINEFEED_ON:      { command: 'ATL1',   description: 'Enable line feeds' },
  SPACES_OFF:       { command: 'ATS0',   description: 'Disable spaces in responses' },
  SPACES_ON:        { command: 'ATS1',   description: 'Enable spaces in responses' },
  HEADERS_OFF:      { command: 'ATH0',   description: 'Hide headers' },
  HEADERS_ON:       { command: 'ATH1',   description: 'Show headers' },

  // Info
  DEVICE_ID:        { command: 'ATI',    description: 'Print device ID string' },
  READ_VOLTAGE:     { command: 'ATRV',   description: 'Read battery voltage' },
  FIRMWARE_VERSION: { command: 'AT@1',   description: 'Read firmware version' },
  DEVICE_DESC:      { command: 'AT@2',   description: 'Read device description' },
  PROTOCOL_NUMBER:  { command: 'ATDPN',  description: 'Describe protocol by number' },
  PROTOCOL_DESC:    { command: 'ATDP',   description: 'Describe current protocol' },

  // Protocol
  AUTO_PROTOCOL:    { command: 'ATSP0',  description: 'Set protocol to auto' },
  SET_PROTOCOL_1:   { command: 'ATSP1',  description: 'Set SAE J1850 PWM (41.6 kbaud)' },
  SET_PROTOCOL_2:   { command: 'ATSP2',  description: 'Set SAE J1850 VPW (10.4 kbaud)' },
  SET_PROTOCOL_3:   { command: 'ATSP3',  description: 'Set ISO 9141-2 (5 baud init)' },
  SET_PROTOCOL_4:   { command: 'ATSP4',  description: 'Set ISO 14230-4 KWP (5 baud init)' },
  SET_PROTOCOL_5:   { command: 'ATSP5',  description: 'Set ISO 14230-4 KWP (fast init)' },
  SET_PROTOCOL_6:   { command: 'ATSP6',  description: 'Set ISO 15765-4 CAN (11 bit, 500 kbaud)' },
  SET_PROTOCOL_7:   { command: 'ATSP7',  description: 'Set ISO 15765-4 CAN (29 bit, 500 kbaud)' },
  SET_PROTOCOL_8:   { command: 'ATSP8',  description: 'Set ISO 15765-4 CAN (11 bit, 250 kbaud)' },
  SET_PROTOCOL_9:   { command: 'ATSP9',  description: 'Set ISO 15765-4 CAN (29 bit, 250 kbaud)' },
  SET_PROTOCOL_A:   { command: 'ATSPA',  description: 'Set SAE J1939 CAN (29 bit, 250 kbaud)' },
  TRY_PROTOCOL:     { command: 'ATTP',   description: 'Try protocol (with auto search)' },

  // Timing
  ADAPTIVE_TIMING_OFF:  { command: 'ATAT0',  description: 'Disable adaptive timing' },
  ADAPTIVE_TIMING_1:    { command: 'ATAT1',  description: 'Adaptive timing auto 1' },
  ADAPTIVE_TIMING_2:    { command: 'ATAT2',  description: 'Adaptive timing auto 2' },
  SET_TIMEOUT:          { command: 'ATST',   description: 'Set timeout (x * 4ms)' },

  // CAN
  CAN_AUTO_FORMAT_ON:   { command: 'ATCAF1', description: 'Enable CAN auto formatting' },
  CAN_AUTO_FORMAT_OFF:  { command: 'ATCAF0', description: 'Disable CAN auto formatting' },
  CAN_FLOW_CONTROL:     { command: 'ATFCSH', description: 'Set CAN flow control header' },
  CAN_FILTER:           { command: 'ATCF',   description: 'Set CAN ID filter' },
  CAN_MASK:             { command: 'ATCM',   description: 'Set CAN ID mask' },
  MONITOR_ALL:          { command: 'ATMA',   description: 'Monitor all CAN traffic' },

  // Memory
  MEMORY_OFF:       { command: 'ATM0',   description: 'Disable memory' },
  MEMORY_ON:        { command: 'ATM1',   description: 'Enable memory' },
  WARM_START:       { command: 'ATWS',   description: 'Warm start (no full reset)' },
} as const;

// ─── Protocol Mapping ────────────────────────────────────────────────────────

export const PROTOCOL_MAP: Record<string, OBDProtocol> = {
  '0': 'AUTO',
  '1': 'SAE_J1850_PWM',
  '2': 'SAE_J1850_VPW',
  '3': 'ISO_9141_2',
  '4': 'ISO_14230_4_KWP_5BAUD',
  '5': 'ISO_14230_4_KWP_FAST',
  '6': 'ISO_15765_4_CAN_11BIT_500K',
  '7': 'ISO_15765_4_CAN_29BIT_500K',
  '8': 'ISO_15765_4_CAN_11BIT_250K',
  '9': 'ISO_15765_4_CAN_29BIT_250K',
  'A': 'SAE_J1939_CAN',
};

export const PROTOCOL_NAMES: Record<OBDProtocol, string> = {
  AUTO: 'Automatic',
  SAE_J1850_PWM: 'SAE J1850 PWM (Ford)',
  SAE_J1850_VPW: 'SAE J1850 VPW (GM)',
  ISO_9141_2: 'ISO 9141-2 (Chrysler/EU/Asia)',
  ISO_14230_4_KWP_5BAUD: 'ISO 14230-4 KWP (5 baud)',
  ISO_14230_4_KWP_FAST: 'ISO 14230-4 KWP (fast)',
  ISO_15765_4_CAN_11BIT_500K: 'CAN 11-bit 500kbps',
  ISO_15765_4_CAN_29BIT_500K: 'CAN 29-bit 500kbps',
  ISO_15765_4_CAN_11BIT_250K: 'CAN 11-bit 250kbps',
  ISO_15765_4_CAN_29BIT_250K: 'CAN 29-bit 250kbps',
  SAE_J1939_CAN: 'SAE J1939 CAN (Heavy Duty)',
};

export const PROTOCOL_VEHICLE_COMPAT: Record<OBDProtocol, string[]> = {
  AUTO: ['All vehicles - auto detect'],
  SAE_J1850_PWM: ['Ford (pre-2008)', 'Lincoln', 'Mercury', 'Mazda (some)'],
  SAE_J1850_VPW: ['GM (pre-2008)', 'Chevrolet', 'Buick', 'Cadillac', 'Chrysler (some)'],
  ISO_9141_2: ['Chrysler (pre-2004)', 'European (pre-2004)', 'Asian (pre-2004)', 'Honda', 'Toyota', 'Hyundai'],
  ISO_14230_4_KWP_5BAUD: ['European (2003-2008)', 'Subaru', 'Hyundai', 'Kia'],
  ISO_14230_4_KWP_FAST: ['European (2003-2008)', 'Subaru', 'Hyundai', 'Kia'],
  ISO_15765_4_CAN_11BIT_500K: ['Most 2008+ vehicles', 'All US 2008+', 'Most EU 2004+'],
  ISO_15765_4_CAN_29BIT_500K: ['Some Ford', 'Some GM trucks', 'Extended addressing vehicles'],
  ISO_15765_4_CAN_11BIT_250K: ['Some European vehicles', 'Volvo', 'Saab'],
  ISO_15765_4_CAN_29BIT_250K: ['Heavy equipment', 'Some commercial vehicles'],
  SAE_J1939_CAN: ['Heavy-duty trucks', 'Buses', 'Construction equipment', 'Marine engines'],
};

// ─── ELM327 Response Parser ─────────────────────────────────────────────────

export function parseELMResponse(raw: string): string {
  return raw
    .replace(/\r/g, '')
    .replace(/>/g, '')
    .replace(/\n+/g, '\n')
    .trim();
}

export function parseHexBytes(response: string): number[] {
  const cleaned = response.replace(/[\s\r\n>]/g, '');
  const bytes: number[] = [];
  for (let i = 0; i < cleaned.length; i += 2) {
    const hex = cleaned.substring(i, i + 2);
    const val = parseInt(hex, 16);
    if (!isNaN(val)) bytes.push(val);
  }
  return bytes;
}

export function isELMError(response: string): boolean {
  const errors = ['?', 'UNABLE TO CONNECT', 'NO DATA', 'BUS INIT', 'BUS ERROR', 'CAN ERROR', 'BUFFER FULL', 'DATA ERROR', 'ACT ALERT', 'LV RESET', 'STOPPED'];
  const upper = response.toUpperCase().trim();
  return errors.some(err => upper.includes(err));
}

export function parseVIN(response: string): string | null {
  const lines = response.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('0902'));
  const hexString = lines.join('').replace(/[\s]/g, '');
  const bytes = parseHexBytes(hexString);
  if (bytes.length < 17) return null;
  const vinChars = bytes.slice(0, 17).map(b => String.fromCharCode(b));
  const vin = vinChars.join('');
  if (/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return vin;
  return null;
}

export function parseVoltage(response: string): number | null {
  const match = response.match(/([\d.]+)\s*V/i);
  return match ? parseFloat(match[1]) : null;
}

export function parseProtocolNumber(response: string): OBDProtocol | null {
  const cleaned = response.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  const lastChar = cleaned.charAt(cleaned.length - 1);
  return PROTOCOL_MAP[lastChar] || null;
}

// ─── ELM327 Initialization Sequence ─────────────────────────────────────────

export function getInitSequence(): OBDCommand[] {
  return [
    { command: 'ATZ',    description: 'Reset adapter' },
    { command: 'ATE0',   description: 'Echo off' },
    { command: 'ATL0',   description: 'Linefeeds off' },
    { command: 'ATS0',   description: 'Spaces off' },
    { command: 'ATH0',   description: 'Headers off' },
    { command: 'ATAT1',  description: 'Adaptive timing on' },
    { command: 'ATSP0',  description: 'Auto-detect protocol' },
    { command: 'ATRV',   description: 'Read voltage' },
    { command: 'ATDPN',  description: 'Get protocol' },
  ];
}

export function getCapabilities(chipset: string): AdapterCapabilities {
  switch (chipset.toUpperCase()) {
    case 'STN1110':
    case 'STN2120':
      return {
        protocols: Object.values(PROTOCOL_MAP),
        maxBaudRate: 10000000,
        canFiltering: true,
        batteryVoltage: true,
        adaptiveTiming: true,
        j1939Support: true,
        canMonitor: true,
      };
    case 'OBDLINK':
      return {
        protocols: Object.values(PROTOCOL_MAP),
        maxBaudRate: 5000000,
        canFiltering: true,
        batteryVoltage: true,
        adaptiveTiming: true,
        j1939Support: true,
        canMonitor: true,
      };
    default: // ELM327
      return {
        protocols: Object.values(PROTOCOL_MAP),
        maxBaudRate: 500000,
        canFiltering: true,
        batteryVoltage: true,
        adaptiveTiming: true,
        j1939Support: false,
        canMonitor: true,
      };
  }
}
