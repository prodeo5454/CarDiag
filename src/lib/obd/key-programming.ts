import { ECUSecurity } from './ecu-security';

export type KeyProgramCapability =
  | 'obd_add_key'
  | 'obd_all_keys_lost'
  | 'gateway_unlock'
  | 'pin_code'
  | 'dealer_only';

export interface KeyProgrammingProcedure {
  id: string;
  name: string;
  description: string;
  capability: KeyProgramCapability;
  manufacturers: string[];
  requiredHardware: 'elm327' | 'stn1110' | 'dealer_immo' | 'specialist';
  steps: string[];
  warnings: string[];
  udsRoutineId?: string;
}

export const KEY_PROGRAMMING_PROCEDURES: KeyProgrammingProcedure[] = [
  {
    id: 'add_spare_key',
    name: 'Add Spare Key (OBD)',
    description: 'Program an additional key when at least one working key is present',
    capability: 'obd_add_key',
    manufacturers: ['Ford', 'GM', 'Toyota', 'Honda', 'Nissan', 'Hyundai', 'VW', 'BMW'],
    requiredHardware: 'stn1110',
    steps: [
      'Ignition ON, engine OFF',
      'Connect approved OBD adapter (STN1110 / OBDLink recommended)',
      'Unlock immobilizer security gateway if required',
      'Run manufacturer key-learning routine via UDS',
      'Insert new key and follow dash prompts',
    ],
    warnings: [
      'ELM327 clones often cannot complete immobilizer routines',
      'Wrong procedure may lock immobilizer — have all keys ready',
    ],
    udsRoutineId: 'FF01',
  },
  {
    id: 'all_keys_lost',
    name: 'All Keys Lost',
    description: 'Recovery when no keys are programmed — highest risk',
    capability: 'obd_all_keys_lost',
    manufacturers: ['Ford', 'Toyota', 'GM'],
    requiredHardware: 'dealer_immo',
    steps: [
      'Obtain PIN/SKC from dealer or legal ownership documentation',
      'Use specialist immobilizer tool or dealer IDS/MDI equivalent',
      'Perform EEPROM/BSL backup where documented',
      'Program keys per OEM service procedure',
    ],
    warnings: [
      'Not supported on most ELM327 adapters',
      'May require module replacement if security lockout occurs',
    ],
  },
  {
    id: 'vw_gateway',
    name: 'VAG Security Gateway Unlock',
    description: 'Unlock SGW before coding or key functions on VW/Audi/Skoda/Seat',
    capability: 'gateway_unlock',
    manufacturers: ['VW', 'Audi', 'Skoda', 'Seat'],
    requiredHardware: 'stn1110',
    steps: [
      'Connect to OBD-II',
      'Authenticate to gateway (UDS 0x27)',
      'Enter OBD unlock code if prompted (from label or scan tool database)',
      'Verify sub-modules respond to extended session',
    ],
    warnings: ['Incorrect gateway coding disables vehicle networks'],
    udsRoutineId: '2701',
  },
  {
    id: 'pin_immo',
    name: 'Immobilizer PIN / SKC Entry',
    description: 'Manual PIN for seed-key or immobilizer learn',
    capability: 'pin_code',
    manufacturers: ['Ford', 'VW', 'BMW', 'Mercedes', 'Toyota'],
    requiredHardware: 'stn1110',
    steps: [
      'Retrieve PIN from secure owner records or dealer',
      'Enter PIN in programming tool',
      'Complete security access (0x27)',
      'Proceed with key learn or coding write',
    ],
    warnings: ['Three failed attempts may trigger long lockout'],
  },
  {
    id: 'bmw_cas',
    name: 'BMW CAS / FEM Key Sync',
    description: 'BMW comfort access / CAS alignment',
    capability: 'dealer_only',
    manufacturers: ['BMW', 'Mini'],
    requiredHardware: 'dealer_immo',
    steps: [
      'Use ISTA/D with approved interface',
      'CAS/FEM programming',
      'Key initialization and DME sync',
    ],
    warnings: ['Consumer ELM adapters cannot complete CAS programming'],
  },
];

export class KeyProgrammingService {
  constructor(
    private sendCommand: (cmd: string) => Promise<string>,
    private manufacturer: string = 'GENERIC',
    private ecuAddress: string = '7E0'
  ) {}

  getProceduresForVehicle(make?: string): KeyProgrammingProcedure[] {
    const m = (make || this.manufacturer).toUpperCase();
    if (m === 'GENERIC' || !m.trim()) {
      return KEY_PROGRAMMING_PROCEDURES;
    }
    const matched = KEY_PROGRAMMING_PROCEDURES.filter((p) =>
      p.manufacturers.some((brand) => m.includes(brand.toUpperCase()))
    );
    return matched.length > 0 ? matched : KEY_PROGRAMMING_PROCEDURES;
  }

  assessAdapterCapability(chipset?: string): {
    canAttemptKeyLearn: boolean;
    level: 'none' | 'limited' | 'good';
    message: string;
  } {
    if (chipset === 'STN1110' || chipset === 'STN2120' || chipset === 'OBDLink') {
      return {
        canAttemptKeyLearn: true,
        level: 'good',
        message: 'STN/OBDLink adapters support extended UDS for some key routines',
      };
    }
    if (chipset === 'ELM327') {
      return {
        canAttemptKeyLearn: false,
        level: 'limited',
        message: 'ELM327: read/clear codes OK; key programming usually requires STN or dealer tool',
      };
    }
    return {
      canAttemptKeyLearn: false,
      level: 'none',
      message: 'Unknown adapter — use STN1110, STN2120, or OBDLink MX+ for programming',
    };
  }

  async runProcedure(
    procedureId: string,
    options?: { pin?: string; confirmRisk: boolean }
  ): Promise<{
    success: boolean;
    log: string[];
    message: string;
  }> {
    const procedure = KEY_PROGRAMMING_PROCEDURES.find((p) => p.id === procedureId);
    if (!procedure) {
      return { success: false, log: [], message: 'Procedure not found' };
    }

    if (!options?.confirmRisk) {
      return {
        success: false,
        log: [],
        message: 'Confirm you accept immobilizer risk before proceeding',
      };
    }

    if (procedure.capability === 'pin_code' && !options?.pin?.trim()) {
      return {
        success: false,
        log: [],
        message: 'Immobilizer PIN is required for this procedure',
      };
    }

    const log: string[] = [];
    log.push(`Starting: ${procedure.name}`);

    if (procedure.requiredHardware === 'dealer_immo') {
      return {
        success: false,
        log: [...log, ...procedure.steps],
        message:
          'This procedure requires dealer/specialist hardware. CarDiag provides guided steps only.',
      };
    }

    const mfg = this.matchManufacturer(procedure);
    const pinDigits = options?.pin?.replace(/\D/g, '') ?? '';

    if (pinDigits) {
      log.push(`PIN provided (${pinDigits.length} digit(s)) — attempting immobilizer unlock`);
    }

    if (mfg) {
      log.push(`Attempting security unlock (${mfg})...`);
      let auth: { unlocked: boolean; message: string };
      if (pinDigits.length >= 4) {
        auth = await ECUSecurity.unlockWithPin(
          pinDigits,
          mfg,
          this.sendCommand,
          this.ecuAddress
        );
      } else {
        auth = await ECUSecurity.unlockECU(mfg, this.sendCommand, this.ecuAddress);
      }
      log.push(auth.message);
      if (!auth.unlocked && procedure.capability !== 'gateway_unlock') {
        return {
          success: false,
          log,
          message: pinDigits
            ? 'PIN-based security unlock failed — verify PIN and adapter'
            : 'Security unlock failed — cannot proceed with key routine',
        };
      }
    } else if (pinDigits.length >= 4) {
      log.push('No OEM match — trying generic PIN unlock on target ECU...');
      const auth = await ECUSecurity.unlockWithPin(
        pinDigits,
        this.manufacturer,
        this.sendCommand,
        this.ecuAddress
      );
      log.push(auth.message);
      if (!auth.unlocked && procedure.capability === 'pin_code') {
        return { success: false, log, message: 'PIN unlock failed on this ECU address' };
      }
    }

    if (procedure.udsRoutineId) {
      const rid = procedure.udsRoutineId.padStart(4, '0').slice(-4);
      const hi = rid.substring(0, 2);
      const lo = rid.substring(2, 4);
      log.push(`Sending routine 31 01 ${hi} ${lo}...`);
      try {
        const resp = await this.sendCommand(`${this.ecuAddress} 31 01 ${hi} ${lo}`);
        log.push(`ECU: ${resp}`);
        const ok = !resp.toUpperCase().includes('7F');
        return {
          success: ok,
          log,
          message: ok
            ? 'Routine sent — follow vehicle dash prompts to complete key learn'
            : `ECU rejected routine. Use STN adapter or dealer tool. Response: ${resp}`,
        };
      } catch (err) {
        log.push(err instanceof Error ? err.message : 'Error');
        return { success: false, log, message: 'Communication error during routine' };
      }
    }

    return {
      success: true,
      log: [...log, ...procedure.steps],
      message: 'Guided procedure loaded — complete steps manually per service manual',
    };
  }

  async testImmobilizerResponse(): Promise<{
    responds: boolean;
    requiresAuth: boolean;
    message: string;
  }> {
    const test = await ECUSecurity.testSecurityAccess(this.sendCommand, this.ecuAddress);
    return {
      responds: test.testResults.length > 0,
      requiresAuth: test.requiresAuth,
      message: test.requiresAuth
        ? `Immobilizer/security active (level: ${test.securityLevel})`
        : 'No security challenge on default ECU address',
    };
  }

  private matchManufacturer(procedure: KeyProgrammingProcedure): string {
    const m = this.manufacturer.toUpperCase();
    for (const brand of procedure.manufacturers) {
      if (m.includes(brand.toUpperCase())) {
        if (brand.toUpperCase() === 'VW') return 'VW';
        if (brand.toUpperCase() === 'AUDI') return 'Audi';
        return brand;
      }
    }
    return ECUSecurity.getSupportedManufacturers().find((b) =>
      m.includes(b.toUpperCase())
    ) || '';
  }
}
