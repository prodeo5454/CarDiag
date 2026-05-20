import { ECUSecurity } from './ecu-security';

export interface CodingValue {
  did: string;
  name: string;
  rawHex: string;
  ascii?: string;
}

export interface CodingWriteRequest {
  did: string;
  hexValue: string;
  confirmRisk: boolean;
}

/** Common adaptation / coding DIDs (manufacturer-dependent availability) */
export const COMMON_CODING_DIDS: Array<{ did: string; name: string; category: string }> = [
  { did: 'F190', name: 'VIN', category: 'Identity' },
  { did: 'F18C', name: 'Serial / ECU ID', category: 'Identity' },
  { did: 'F186', name: 'Active diagnostic session', category: 'Session' },
  { did: '0407', name: 'Service interval display', category: 'Maintenance' },
  { did: '0401', name: 'Oil service reset flag', category: 'Maintenance' },
  { did: '0600', name: 'TPMS configuration', category: 'Chassis' },
  { did: '0B00', name: 'Battery registration (BMS)', category: 'Electrical' },
  { did: '2A2B', name: 'Transport mode', category: 'Body' },
  { did: '300A', name: 'Daytime running lights', category: 'Lighting' },
  { did: '5F01', name: 'Unit / region coding', category: 'Regional' },
];

export class ECUCodingService {
  private ecuAddress: string;
  private manufacturer: string;
  private authenticated = false;

  constructor(
    private sendCommand: (cmd: string) => Promise<string>,
    options?: { ecuAddress?: string; manufacturer?: string }
  ) {
    this.ecuAddress = options?.ecuAddress || '7E0';
    this.manufacturer = options?.manufacturer || 'GENERIC';
  }

  setTarget(ecuAddress: string, manufacturer?: string) {
    this.ecuAddress = ecuAddress;
    if (manufacturer) this.manufacturer = manufacturer;
    this.authenticated = false;
  }

  async enterExtendedDiagnosticSession(): Promise<{ success: boolean; message: string }> {
    try {
      const resp = await this.sendCommand(`${this.ecuAddress} 10 03`);
      const ok =
        resp.toUpperCase().includes('50 03') ||
        resp.toUpperCase().includes('5003') ||
        !resp.toUpperCase().includes('7F');
      return {
        success: ok,
        message: ok ? 'Extended diagnostic session active' : `Session rejected: ${resp}`,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Session failed',
      };
    }
  }

  async ensureSecurityUnlock(): Promise<{ success: boolean; message: string }> {
    if (this.authenticated) {
      return { success: true, message: 'Already authenticated' };
    }

    const mfg = this.normalizeManufacturer(this.manufacturer);
    if (mfg && ECUSecurity.getSupportedManufacturers().includes(mfg)) {
      const result = await ECUSecurity.unlockECU(mfg, this.sendCommand, this.ecuAddress);
      if (result.unlocked) {
        this.authenticated = true;
        return { success: true, message: result.message };
      }
      return { success: false, message: result.message };
    }

    return {
      success: false,
      message:
        'No seed-key profile for this make. Use Programming → Security or a dealer tool.',
    };
  }

  async readDataByIdentifier(did: string): Promise<{
    success: boolean;
    value?: CodingValue;
    message: string;
  }> {
    const didHex = did.replace(/\s/g, '').toUpperCase();
    if (!/^[0-9A-F]{4}$/.test(didHex)) {
      return { success: false, message: 'DID must be 4 hex characters' };
    }

    try {
      const hi = didHex.substring(0, 2);
      const lo = didHex.substring(2, 4);
      const resp = await this.sendCommand(`${this.ecuAddress} 22 ${hi} ${lo}`);
      const parsed = this.parseReadResponse(resp, didHex);
      if (!parsed) {
        const err = ECUSecurity.getSecurityErrorDescription(resp.trim());
        return { success: false, message: err || `Read failed: ${resp}` };
      }
      const catalog = COMMON_CODING_DIDS.find((d) => d.did === didHex);
      return {
        success: true,
        value: {
          did: didHex,
          name: catalog?.name || `DID ${didHex}`,
          rawHex: parsed,
          ascii: this.hexToAscii(parsed),
        },
        message: 'Read successful',
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Read failed',
      };
    }
  }

  async writeDataByIdentifier(req: CodingWriteRequest): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!req.confirmRisk) {
      return {
        success: false,
        message: 'User must confirm write risk — incorrect coding can brick modules',
      };
    }

    const didHex = req.did.replace(/\s/g, '').toUpperCase();
    const valueHex = req.hexValue.replace(/\s/g, '').toUpperCase();
    if (!/^[0-9A-F]{4}$/.test(didHex)) {
      return { success: false, message: 'Invalid DID' };
    }
    if (!valueHex || valueHex.length % 2 !== 0) {
      return { success: false, message: 'Value must be even-length hex' };
    }

    const session = await this.enterExtendedDiagnosticSession();
    if (!session.success) return session;

    const unlock = await this.ensureSecurityUnlock();
    if (!unlock.success) return unlock;

    try {
      const hi = didHex.substring(0, 2);
      const lo = didHex.substring(2, 4);
      const bytes = valueHex.match(/.{1,2}/g) || [];
      const payload = bytes.join(' ');
      const resp = await this.sendCommand(`${this.ecuAddress} 2E ${hi} ${lo} ${payload}`);
      const ok =
        resp.toUpperCase().includes('6E') ||
        resp.toUpperCase().includes('OK') ||
        (!resp.toUpperCase().includes('7F') && resp.length > 0);

      return {
        success: ok,
        message: ok ? `Wrote DID ${didHex}` : `Write rejected: ${resp}`,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Write failed',
      };
    }
  }

  async runRoutineControl(
    routineId: string,
    subFunction: '01' | '02' | '03' = '01'
  ): Promise<{ success: boolean; message: string; response: string }> {
    const rid = routineId.replace(/\s/g, '').toUpperCase();
    if (!/^[0-9A-F]{4}$/.test(rid)) {
      return { success: false, message: 'Routine ID must be 4 hex chars', response: '' };
    }

    const unlock = await this.ensureSecurityUnlock();
    if (!unlock.success) {
      return { success: false, message: unlock.message, response: '' };
    }

    try {
      const hi = rid.substring(0, 2);
      const lo = rid.substring(2, 4);
      const resp = await this.sendCommand(
        `${this.ecuAddress} 31 ${subFunction} ${hi} ${lo}`
      );
      const ok = resp.toUpperCase().includes('71') || !resp.toUpperCase().includes('7F');
      return {
        success: ok,
        message: ok ? 'Routine accepted' : `Routine failed: ${resp}`,
        response: resp,
      };
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Routine error',
        response: '',
      };
    }
  }

  async readEcuIdentification(): Promise<{
    success: boolean;
    parts: Record<string, string>;
    message: string;
  }> {
    const parts: Record<string, string> = {};
    const ids = ['F190', 'F18C', 'F191', 'F194'];

    for (const did of ids) {
      const r = await this.readDataByIdentifier(did);
      if (r.success && r.value) parts[did] = r.value.rawHex;
    }

    return {
      success: Object.keys(parts).length > 0,
      parts,
      message:
        Object.keys(parts).length > 0
          ? 'Partial ECU identification read'
          : 'No identification DIDs responded',
    };
  }

  private parseReadResponse(response: string, did: string): string | null {
    const clean = response.replace(/\s+/g, ' ').trim().toUpperCase();
    const tokens = clean.split(' ').filter(Boolean);
    const didParts = [did.substring(0, 2), did.substring(2, 4)];
    const idx = tokens.findIndex(
      (t, i) => t === '62' || (t === didParts[0] && tokens[i + 1] === didParts[1])
    );
    if (idx === -1) {
      if (clean.includes('NO DATA') || clean.includes('7F')) return null;
      const hexOnly = tokens.filter((t) => /^[0-9A-F]{2}$/.test(t));
      return hexOnly.length ? hexOnly.join('') : null;
    }
    const start = tokens[idx] === '62' ? idx + 3 : idx + 2;
    return tokens.slice(start).join('');
  }

  private hexToAscii(hex: string): string {
    let out = '';
    for (let i = 0; i < hex.length; i += 2) {
      const c = parseInt(hex.substring(i, i + 2), 16);
      out += c >= 32 && c <= 126 ? String.fromCharCode(c) : '.';
    }
    return out;
  }

  private normalizeManufacturer(make: string): string {
    const u = make.toUpperCase();
    if (u.includes('VW') || u.includes('VOLKSWAGEN')) return 'VW';
    if (u.includes('AUDI')) return 'Audi';
    if (u.includes('BMW')) return 'BMW';
    if (u.includes('MERCEDES')) return 'Mercedes';
    if (u.includes('TOYOTA') || u.includes('LEXUS')) return 'Toyota';
    if (u.includes('HONDA') || u.includes('ACURA')) return 'Honda';
    if (u.includes('FORD') || u.includes('LINCOLN')) return 'Ford';
    if (u.includes('GM') || u.includes('CHEV') || u.includes('CADILLAC')) return 'GM';
    if (u.includes('NISSAN') || u.includes('INFINITI')) return 'Nissan';
    if (u.includes('HYUNDAI') || u.includes('KIA')) return 'Hyundai';
    return '';
  }
}
