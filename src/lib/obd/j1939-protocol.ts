import type { J1939Parameter } from '@/types';

// J1939 Protocol for Heavy-Duty Vehicles
export class J1939Protocol {
  private static readonly PGN_MAPPING: Record<number, J1939Parameter[]> = {
    // PGN 65265 - Address Claim
    65265: [
      {
        pgn: 65265,
        spn: 1919,
        name: 'ECU Name',
        unit: '',
        formula: (value: number) => value,
        min: 0,
        max: 0xFFFFFFFF
      },
      {
        pgn: 65265,
        spn: 1920,
        name: 'Address',
        unit: '',
        formula: (value: number) => value,
        min: 0,
        max: 253
      }
    ],
    // PGN 61444 - Engine Temperature 1
    61444: [
      {
        pgn: 61444,
        spn: 110,
        name: 'Engine Coolant Temperature',
        unit: '°C',
        formula: (value: number) => value - 40,
        min: -40,
        max: 210
      },
      {
        pgn: 61444,
        spn: 111,
        name: 'Engine Fuel Temperature',
        unit: '°C',
        formula: (value: number) => value - 40,
        min: -40,
        max: 210
      },
      {
        pgn: 61444,
        spn: 173,
        name: 'Engine Oil Temperature',
        unit: '°C',
        formula: (value: number) => value - 40,
        min: -40,
        max: 210
      },
      {
        pgn: 61444,
        spn: 190,
        name: 'Engine Intake Manifold Temperature',
        unit: '°C',
        formula: (value: number) => value - 40,
        min: -40,
        max: 210
      }
    ],
    // PGN 61443 - Engine Speed
    61443: [
      {
        pgn: 61443,
        spn: 190,
        name: 'Engine Speed',
        unit: 'RPM',
        formula: (value: number) => value * 0.125,
        min: 0,
        max: 8031.875
      }
    ],
    // PGN 65270 - Vehicle Speed
    65270: [
      {
        pgn: 65270,
        spn: 84,
        name: 'Vehicle Speed',
        unit: 'km/h',
        formula: (value: number) => value * 0.00390625,
        min: 0,
        max: 250.998
      },
      {
        pgn: 65270,
        spn: 92,
        name: 'Odometer',
        unit: 'km',
        formula: (value: number) => value * 5,
        min: 0,
        max: 2105510625
      }
    ],
    // PGN 65253 - Engine Fluid Pressure
    65253: [
      {
        pgn: 65253,
        spn: 100,
        name: 'Engine Oil Pressure',
        unit: 'kPa',
        formula: (value: number) => value * 4,
        min: 0,
        max: 1020
      },
      {
        pgn: 65253,
        spn: 108,
        name: 'Engine Fuel Pressure',
        unit: 'kPa',
        formula: (value: number) => value * 2,
        min: 0,
        max: 510
      },
      {
        pgn: 65253,
        spn: 163,
        name: 'Engine Boost Pressure',
        unit: 'kPa',
        formula: (value: number) => value,
        min: 0,
        max: 255
      }
    ],
    // PGN 65268 - Transmission Parameters
    65268: [
      {
        pgn: 65268,
        spn: 514,
        name: 'Transmission Oil Temperature',
        unit: '°C',
        formula: (value: number) => value - 40,
        min: -40,
        max: 210
      },
      {
        pgn: 65268,
        spn: 523,
        name: 'Transmission Gear',
        unit: '',
        formula: (value: number) => value,
        min: 0,
        max: 255
      }
    ],
    // PGN 65271 - Fuel Economy
    65271: [
      {
        pgn: 65271,
        spn: 183,
        name: 'Instantaneous Fuel Economy',
        unit: 'km/L',
        formula: (value: number) => value * 0.05,
        min: 0,
        max: 12.75
      },
      {
        pgn: 65271,
        spn: 184,
        name: 'Average Fuel Economy',
        unit: 'km/L',
        formula: (value: number) => value * 0.05,
        min: 0,
        max: 12.75
      }
    ],
    // PGN 65266 - Brake System
    65266: [
      {
        pgn: 65266,
        spn: 597,
        name: 'Brake Pedal Position',
        unit: '%',
        formula: (value: number) => value * 0.4,
        min: 0,
        max: 100
      },
      {
        pgn: 65266,
        spn: 598,
        name: 'Brake System Pressure',
        unit: 'kPa',
        formula: (value: number) => value * 4,
        min: 0,
        max: 1020
      }
    ],
    // PGN 65267 - Steering System
    65267: [
      {
        pgn: 65267,
        spn: 599,
        name: 'Steering Wheel Angle',
        unit: 'degrees',
        formula: (value: number) => value - 125,
        min: -125,
        max: 125
      },
      {
        pgn: 65267,
        spn: 603,
        name: 'Steering Axle Angle',
        unit: 'degrees',
        formula: (value: number) => value - 125,
        min: -125,
        max: 125
      }
    ],
    // PGN 65269 - Axle Information
    65269: [
      {
        pgn: 65269,
        spn: 166,
        name: 'Axle Temperature',
        unit: '°C',
        formula: (value: number) => value - 40,
        min: -40,
        max: 210
      },
      {
        pgn: 65269,
        spn: 168,
        name: 'Axle Oil Pressure',
        unit: 'kPa',
        formula: (value: number) => value * 4,
        min: 0,
        max: 1020
      }
    ],
    // PGN 65254 - Engine Parameters
    65254: [
      {
        pgn: 65254,
        spn: 96,
        name: 'Engine Load',
        unit: '%',
        formula: (value: number) => value * 0.1,
        min: 0,
        max: 100
      },
      {
        pgn: 65254,
        spn: 91,
        name: 'Throttle Position',
        unit: '%',
        formula: (value: number) => value * 0.4,
        min: 0,
        max: 100
      },
      {
        pgn: 65254,
        spn: 512,
        name: 'Engine Hours',
        unit: 'hours',
        formula: (value: number) => value * 0.05,
        min: 0,
        max: 2105510625
      }
    ],
    // PGN 65257 - Diagnostic Messages
    65257: [
      {
        pgn: 65257,
        spn: 923,
        name: 'Diagnostic Trouble Code 1',
        unit: '',
        formula: (value: number) => value,
        min: 0,
        max: 0xFFFFFFFF
      },
      {
        pgn: 65257,
        spn: 924,
        name: 'Diagnostic Trouble Code 2',
        unit: '',
        formula: (value: number) => value,
        min: 0,
        max: 0xFFFFFFFF
      },
      {
        pgn: 65257,
        spn: 925,
        name: 'Diagnostic Trouble Code 3',
        unit: '',
        formula: (value: number) => value,
        min: 0,
        max: 0xFFFFFFFF
      },
      {
        pgn: 65257,
        spn: 926,
        name: 'Diagnostic Trouble Code 4',
        unit: '',
        formula: (value: number) => value,
        min: 0,
        max: 0xFFFFFFFF
      }
    ],
    // PGN 65260 - Cruise Control
    65260: [
      {
        pgn: 65260,
        spn: 598,
        name: 'Cruise Control Set Speed',
        unit: 'km/h',
        formula: (value: number) => value * 0.00390625,
        min: 0,
        max: 250.998
      },
      {
        pgn: 65260,
        spn: 599,
        name: 'Cruise Control State',
        unit: '',
        formula: (value: number) => value,
        min: 0,
        max: 255
      }
    ],
    // PGN 65261 - Aftertreatment
    65261: [
      {
        pgn: 65261,
        spn: 324,
        name: 'Exhaust Gas Temperature 1',
        unit: '°C',
        formula: (value: number) => value - 40,
        min: -40,
        max: 210
      },
      {
        pgn: 65261,
        spn: 325,
        name: 'Exhaust Gas Temperature 2',
        unit: '°C',
        formula: (value: number) => value - 40,
        min: -40,
        max: 210
      },
      {
        pgn: 65261,
        spn: 433,
        name: 'DPF Differential Pressure',
        unit: 'kPa',
        formula: (value: number) => value,
        min: 0,
        max: 255
      },
      {
        pgn: 65261,
        spn: 434,
        name: 'SCR System Status',
        unit: '',
        formula: (value: number) => value,
        min: 0,
        max: 255
      }
    ]
  };

  static getParametersForPGN(pgn: number): J1939Parameter[] {
    return this.PGN_MAPPING[pgn] || [];
  }

  static getAllParameters(): J1939Parameter[] {
    const allParams: J1939Parameter[] = [];
    Object.values(this.PGN_MAPPING).forEach(params => {
      allParams.push(...params);
    });
    return allParams;
  }

  static getParameterBySPN(spn: number): J1939Parameter | null {
    for (const params of Object.values(this.PGN_MAPPING)) {
      const param = params.find(p => p.spn === spn);
      if (param) return param;
    }
    return null;
  }

  static parseJ1939Message(data: string): {
    pgn: number;
    priority: number;
    sourceAddress: number;
    destinationAddress: number;
    data: number[];
  } | null {
    // Parse J1939 CAN message format
    // Example: 0CF00400FFFFFFFFFFFFFFFF
    // 0C = Priority (3 bits) + Reserved (1 bit) + PGN (3 bits)
    // F004 = PGN (remaining 18 bits)
    // 00 = Source Address
    // FFFFFFFF = Data (8 bytes)
    
    if (data.length !== 16) return null;

    try {
      const identifier = parseInt(data.substring(0, 8), 16);
      const priority = (identifier >> 26) & 0x07;
      const pgn = (identifier >> 8) & 0x3FFFF;
      const sourceAddress = identifier & 0xFF;
      
      const dataBytes: number[] = [];
      for (let i = 8; i < 16; i += 2) {
        dataBytes.push(parseInt(data.substring(i, i + 2), 16));
      }

      return {
        pgn,
        priority,
        sourceAddress,
        destinationAddress: 0xFF, // Global address for broadcast
        data: dataBytes
      };
    } catch (error) {
      return null;
    }
  }

  static extractParameterValue(data: number[], spn: number): number | null {
    const param = this.getParameterBySPN(spn);
    if (!param) return null;

    // Extract value based on SPN position and length
    // This is a simplified implementation - real implementation would need
    // to handle bit-level extraction for multi-byte parameters
    const byteIndex = Math.floor((spn % 100) / 8);
    const bitIndex = (spn % 100) % 8;
    
    if (byteIndex >= data.length) return null;

    let value = data[byteIndex];
    
    // Apply bit mask if needed
    if (bitIndex > 0) {
      value = (value >> bitIndex) & (0xFF >> bitIndex);
    }

    return value;
  }

  static formatJ1939DTC(dtcCode: number): {
    code: string;
    description: string;
    subsystem: string;
    faultType: string;
  } {
    // J1939 DTC format: 29 bits
    // Bits 0-7: SPN (8 bits)
    // Bits 8-10: Failure Mode Indicator (3 bits)
    // Bits 11-18: Occurrence Count (8 bits)
    // Bits 19-28: SPN (remaining 10 bits)

    const spn = (dtcCode & 0x3FF) | ((dtcCode >> 19) & 0xFF00);
    const fmi = (dtcCode >> 11) & 0x1F;
    const occurrenceCount = (dtcCode >> 11) & 0xFF;

    const fmiDescriptions: Record<number, string> = {
      0: 'General Conditions',
      1: 'Battery Voltage - Low',
      2: 'Battery Voltage - High',
      3: 'Sensor Voltage - Low',
      4: 'Sensor Voltage - High',
      5: 'Current - Low',
      6: 'Current - High',
      7: 'Mechanical System - Not Responding',
      8: 'Mechanical System - Abnormal Frequency',
      9: 'Mechanical System - Abnormal Period',
      10: 'Mechanical System - Abnormal Pulse Width',
      11: 'Mechanical System - Abnormal Rate',
      12: 'Mechanical System - Errored',
      13: 'Mechanical System - Stuck',
      14: 'Parameter - Out of Calibration',
      15: 'Parameter - Out of Range',
      16: 'Special Instructions',
      17: 'Data Valid But Above Normal',
      18: 'Data Valid But Below Normal',
      19: 'Received Network Data',
      20: 'Data Drifted High',
      21: 'Data Drifted Low',
      22: 'Data Erratic',
      23: 'Component Failure',
      24: 'System Configuration',
      25: 'System Reset',
      26: 'System - Not Responding',
      27: 'System - Abnormal Frequency',
      28: 'System - Abnormal Period',
      29: 'System - Abnormal Pulse Width',
      30: 'System - Abnormal Rate',
      31: 'Reserved'
    };

    const subsystem = this.getSubsystemForSPN(spn);
    const faultType = fmiDescriptions[fmi] || 'Unknown';

    return {
      code: dtcCode.toString(16).toUpperCase().padStart(8, '0'),
      description: `SPN ${spn}: ${faultType}`,
      subsystem,
      faultType
    };
  }

  private static getSubsystemForSPN(spn: number): string {
    if (spn >= 100 && spn < 200) return 'Engine';
    if (spn >= 500 && spn < 600) return 'Transmission';
    if (spn >= 900 && spn < 1000) return 'Brakes';
    if (spn >= 300 && spn < 400) return 'Aftertreatment';
    if (spn >= 160 && spn < 170) return 'Axle';
    if (spn >= 590 && spn < 610) return 'Steering';
    return 'Unknown';
  }

  static getJ1939BaudRates(): number[] {
    return [125000, 250000, 500000, 1000000];
  }

  static getJ1939ConnectorTypes(): string[] {
    return ['DEUTSCH 9-pin', 'DEUTSCH 16-pin', 'OBD-II 9-pin', 'OBD-II 16-pin'];
  }

  static validateJ1939Message(message: string): boolean {
    // Basic validation for J1939 message format
    if (message.length !== 16) return false;
    
    // Check if it's a valid hex string
    const hexRegex = /^[0-9A-Fa-f]+$/;
    if (!hexRegex.test(message)) return false;

    // Check if priority is valid (0-7)
    const priority = parseInt(message.substring(0, 1), 16);
    if (priority > 7) return false;

    return true;
  }

  static createJ1939Request(pgn: number, sourceAddress: number = 0xF9): string {
    // Create a J1939 request message
    const priority = 6; // Default priority
    const destinationAddress = 0xFF; // Global
    
    // Build CAN identifier (29 bits)
    const identifier = (priority << 26) | (pgn << 8) | sourceAddress;
    
    // Request message format: 0x00EA00 + PGN + 0xFF + 0x00 0x00 0x00 0x00 0x00
    const requestData = 'EA00' + pgn.toString(16).padStart(4, '0').toUpperCase() + 'FF00000000000000';
    
    return identifier.toString(16).padStart(8, '0').toUpperCase() + requestData;
  }

  static getJ1939SourceAddresses(): Record<number, string> {
    return {
      0x00: 'Engine 1',
      0x01: 'Transmission 1',
      0x02: 'Brake System 1',
      0x03: 'Steering System 1',
      0x04: 'Aftertreatment 1',
      0x05: 'Cab Controller 1',
      0x06: 'Vehicle ECU 1',
      0x07: 'Display 1',
      0x08: 'Body Controller 1',
      0x09: 'Gateway 1',
      0x0A: 'Engine 2',
      0x0B: 'Transmission 2',
      0x0C: 'Brake System 2',
      0x0D: 'Steering System 2',
      0x0E: 'Aftertreatment 2',
      0x0F: 'Cab Controller 2',
      0x10: 'Vehicle ECU 2',
      0x11: 'Display 2',
      0x12: 'Body Controller 2',
      0x13: 'Gateway 2',
      0xF9: 'Diagnostic Tool',
      0xFA: 'Off-Board Diagnostic Tool',
      0xFB: 'Service Tool',
      0xFE: 'Global Address',
      0xFF: 'Broadcast Address'
    };
  }

  static getJ1939PGNDescriptions(): Record<number, string> {
    return {
      65265: 'Address Claim',
      61444: 'Engine Temperature 1',
      61443: 'Engine Speed',
      65270: 'Vehicle Speed',
      65253: 'Engine Fluid Pressure',
      65271: 'Fuel Economy',
      65266: 'Brake System',
      65267: 'Steering System',
      65269: 'Axle Information',
      65254: 'Engine Parameters',
      65257: 'Diagnostic Messages',
      65260: 'Cruise Control',
      65261: 'Aftertreatment'
    };
  }

  /** Probe bus with standard OBD requests (works on many J1939 vehicles via OBD port) */
  static async probeBus(sendCommand: (cmd: string) => Promise<string>): Promise<{
    log: string[];
    samples: Array<{ label: string; value: string }>;
  }> {
    const log: string[] = [];
    const samples: Array<{ label: string; value: string }> = [];

    const runStep = async (label: string, cmd: string) => {
      try {
        const resp = await sendCommand(cmd);
        const short = resp.replace(/\s+/g, ' ').trim().slice(0, 100);
        log.push(`${cmd} → ${short}`);
        samples.push({ label, value: short || '(no data)' });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'error';
        log.push(`${cmd} → ${msg}`);
        samples.push({ label, value: msg });
      }
    };

    await runStep('Adapter reset (ATZ)', 'ATZ');
    await runStep('J1939 CAN 250k (ATSP6)', 'ATSP6');
    await runStep('Headers on (ATH1)', 'ATH1');
    await runStep('Line feeds off (ATL0)', 'ATL0');

    const probes = [
      { label: 'Supported PIDs (0100)', cmd: '0100' },
      { label: 'Engine RPM (010C)', cmd: '010C' },
      { label: 'Vehicle speed (010D)', cmd: '010D' },
      { label: 'Coolant temp (0105)', cmd: '0105' },
      { label: 'Stored DTCs (03)', cmd: '03' },
    ];

    for (const p of probes) {
      await runStep(p.label, p.cmd);
    }

    await runStep('Restore auto protocol (ATSP0)', 'ATSP0');

    return { log, samples };
  }
}
