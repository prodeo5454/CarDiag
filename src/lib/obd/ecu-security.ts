import type { SecurityProcedure, SecurityStep } from '@/types';

// ECU Security and Authentication System
export class ECUSecurity {
  private static readonly SECURITY_ALGORITHMS: Record<string, (seed: string) => string> = {
    'BMW': this.bmwAlgorithm,
    'Mercedes': this.mercedesAlgorithm,
    'VW': this.vwAlgorithm,
    'Audi': this.audiAlgorithm,
    'Toyota': this.toyotaAlgorithm,
    'Honda': this.hondaAlgorithm,
    'Ford': this.fordAlgorithm,
    'GM': this.gmAlgorithm,
    'Nissan': this.nissanAlgorithm,
    'Hyundai': this.hyundaiAlgorithm
  };

  private static readonly SECURITY_PROCEDURES: Record<string, SecurityProcedure> = {
    'BMW': {
      name: 'BMW ECU Authentication',
      steps: [
        { command: '27 01', expectedResponse: 'BF', timeout: 1000 },
        { command: '27 02 XX', timeout: 1000 } // XX will be replaced with calculated key
      ],
      algorithm: this.SECURITY_ALGORITHMS['BMW']
    },
    'Mercedes': {
      name: 'Mercedes ECU Authentication',
      steps: [
        { command: '27 01', expectedResponse: 'BF', timeout: 1000 },
        { command: '27 02 XX', timeout: 1000 }
      ],
      algorithm: this.SECURITY_ALGORITHMS['Mercedes']
    },
    'VW': {
      name: 'VW ECU Authentication',
      steps: [
        { command: '27 01', expectedResponse: 'BF', timeout: 1000 },
        { command: '27 02 XX', timeout: 1000 }
      ],
      algorithm: this.SECURITY_ALGORITHMS['VW']
    },
    'Toyota': {
      name: 'Toyota ECU Authentication',
      steps: [
        { command: '27 01', expectedResponse: 'BF', timeout: 1000 },
        { command: '27 02 XX', timeout: 1000 }
      ],
      algorithm: this.SECURITY_ALGORITHMS['Toyota']
    },
    'Honda': {
      name: 'Honda ECU Authentication',
      steps: [
        { command: '27 01', expectedResponse: 'BF', timeout: 1000 },
        { command: '27 02 XX', timeout: 1000 }
      ],
      algorithm: this.SECURITY_ALGORITHMS['Honda']
    }
  };

  static async authenticateECU(
    manufacturer: string, 
    sendCommand: (command: string) => Promise<string>,
    ecuAddress: string = '7E0'
  ): Promise<{ success: boolean; message: string; authenticated: boolean }> {
    const procedure = this.SECURITY_PROCEDURES[manufacturer];
    
    if (!procedure) {
      return { 
        success: false, 
        message: `No security procedure available for ${manufacturer}`, 
        authenticated: false 
      };
    }

    try {
      // Step 1: Request seed
      const seedCommand = `${ecuAddress} ${procedure.steps[0].command}`;
      const seedResponse = await sendCommand(seedCommand);
      
      if (!seedResponse.includes('BF')) {
        return { 
          success: false, 
          message: 'ECU does not require authentication or authentication failed', 
          authenticated: false 
        };
      }

      // Extract seed from response
      const seed = this.extractSeed(seedResponse);
      if (!seed) {
        return { 
          success: false, 
          message: 'Failed to extract seed from ECU response', 
          authenticated: false 
        };
      }

      // Step 2: Calculate key
      if (!procedure.algorithm) {
        return { 
          success: false, 
          message: 'No algorithm available for this manufacturer', 
          authenticated: false 
        };
      }

      const key = procedure.algorithm(seed);
      
      // Step 3: Send key
      const keyCommand = `${ecuAddress} 27 02 ${key}`;
      const keyResponse = await sendCommand(keyCommand);

      if (keyResponse.includes('OK') || keyResponse.includes('00')) {
        return { 
          success: true, 
          message: 'ECU authentication successful', 
          authenticated: true 
        };
      } else {
        return { 
          success: false, 
          message: 'ECU authentication failed - invalid key', 
          authenticated: false 
        };
      }

    } catch (error) {
      return { 
        success: false, 
        message: `Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`, 
        authenticated: false 
      };
    }
  }

  /** Mix immobilizer PIN with ECU seed for UDS 0x27 key (OEM-specific; experimental). */
  static deriveKeyFromPin(seed: string, pin: string, manufacturer: string): string {
    const seedBytes = seed.replace(/\s+/g, '').match(/.{1,2}/g) ?? [];
    const pinDigits = pin.replace(/\D/g, '');
    const pinBytes: string[] = [];
    for (let i = 0; i < pinDigits.length; i += 2) {
      const pair = pinDigits.slice(i, i + 2);
      pinBytes.push(pair.length === 2 ? pair : `${pair}0`);
    }
    if (pinBytes.length === 0) {
      return seed.padStart(8, '0').slice(-8).toUpperCase();
    }
    const mfg = manufacturer.toUpperCase();
    const out: string[] = [];
    const max = Math.max(seedBytes.length, pinBytes.length, 4);
    for (let i = 0; i < max; i++) {
      const s = parseInt(seedBytes[i % seedBytes.length] || '00', 16);
      const p = parseInt(pinBytes[i % pinBytes.length] || '00', 16);
      let b = (s ^ p) & 0xff;
      if (mfg.includes('FORD') || mfg === 'GM') {
        b = ((s + p + i) & 0xff) ^ 0xaa;
      } else if (mfg.includes('VW') || mfg.includes('AUDI')) {
        b = ((s * 3 + p) & 0xff);
      }
      out.push(b.toString(16).padStart(2, '0').toUpperCase());
    }
    return out.join(' ');
  }

  static async unlockWithPin(
    pin: string,
    manufacturer: string,
    sendCommand: (command: string) => Promise<string>,
    ecuAddress: string = '7E0'
  ): Promise<{ success: boolean; unlocked: boolean; message: string }> {
    const digits = pin.replace(/\D/g, '');
    if (digits.length < 4) {
      return { success: false, unlocked: false, message: 'PIN must be at least 4 digits' };
    }
    try {
      const seedCmd = `${ecuAddress} 27 01`;
      const seedResponse = await sendCommand(seedCmd);
      if (seedResponse.toUpperCase().includes('7F 27')) {
        const desc = this.getSecurityErrorDescription(
          seedResponse.toUpperCase().match(/7F 27 \d{2}/)?.[0] ?? ''
        );
        return { success: false, unlocked: false, message: desc || `Seed request failed: ${seedResponse}` };
      }
      const seed = this.extractSeed(seedResponse);
      if (!seed) {
        return {
          success: false,
          unlocked: false,
          message: 'No seed in ECU response — PIN unlock may not apply on this ECU',
        };
      }
      const key = this.deriveKeyFromPin(seed, digits, manufacturer);
      logPinAttempt(digits.length);
      const result = await this.sendManualSecurityKey(sendCommand, ecuAddress, key);
      return {
        ...result,
        message: result.unlocked
          ? `Security unlocked with PIN (${digits.length} digits)`
          : result.message,
      };
    } catch (error) {
      return {
        success: false,
        unlocked: false,
        message: error instanceof Error ? error.message : 'PIN unlock failed',
      };
    }
  }

  static async sendManualSecurityKey(
    sendCommand: (command: string) => Promise<string>,
    ecuAddress: string,
    keyHex: string
  ): Promise<{ success: boolean; unlocked: boolean; message: string }> {
    const key = keyHex.replace(/\s+/g, ' ').trim();
    if (!key) {
      return { success: false, unlocked: false, message: 'Key is empty' };
    }
    try {
      const cmd = `${ecuAddress} 27 02 ${key}`;
      const resp = await sendCommand(cmd);
      const ok =
        resp.toUpperCase().includes('67 02') ||
        resp.includes('OK') ||
        (!resp.toUpperCase().includes('7F') && resp.length > 0);
      return {
        success: ok,
        unlocked: ok,
        message: ok ? 'Manual security key accepted' : `Key rejected: ${resp}`,
      };
    } catch (error) {
      return {
        success: false,
        unlocked: false,
        message: error instanceof Error ? error.message : 'Manual unlock failed',
      };
    }
  }

  static async unlockECU(
    manufacturer: string,
    sendCommand: (command: string) => Promise<string>,
    ecuAddress: string = '7E0'
  ): Promise<{ success: boolean; unlocked: boolean; message: string }> {
    const authResult = await this.authenticateECU(manufacturer, sendCommand, ecuAddress);
    
    if (!authResult.success) {
      return { 
        success: false, 
        unlocked: false, 
        message: authResult.message 
      };
    }

    // Additional unlocking steps if needed
    try {
      // Some ECUs require additional commands after authentication
      const unlockCommand = `${ecuAddress} 28 01`; // Test device present
      const unlockResponse = await sendCommand(unlockCommand);
      
      if (unlockResponse.includes('OK') || unlockResponse.includes('00')) {
        return { 
          success: true, 
          unlocked: true, 
          message: 'ECU successfully unlocked' 
        };
      } else {
        return { 
          success: true, 
          unlocked: false, 
          message: 'ECU authenticated but unlock failed' 
        };
      }
    } catch (error) {
      return { 
        success: true, 
        unlocked: false, 
        message: `Unlock error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  static checkSecurityLevel(response: string): {
    requiresAuth: boolean;
    securityLevel: 'none' | 'basic' | 'advanced' | 'maximum';
    manufacturer?: string;
  } {
    if (response.includes('7F 27 12')) {
      return { requiresAuth: true, securityLevel: 'advanced' };
    }
    if (response.includes('7F 27 11')) {
      return { requiresAuth: true, securityLevel: 'basic' };
    }
    if (response.includes('7F 27 13')) {
      return { requiresAuth: true, securityLevel: 'maximum' };
    }
    if (response.includes('BF')) {
      return { requiresAuth: true, securityLevel: 'basic' };
    }
    
    return { requiresAuth: false, securityLevel: 'none' };
  }

  private static extractSeed(response: string): string | null {
    // Extract seed from response like "7E0 BF 12 34 56 78"
    const parts = response.trim().split(' ');
    if (parts.length >= 3 && parts[1] === 'BF') {
      return parts.slice(2).join('');
    }
    return null;
  }

  // Manufacturer-specific algorithms
  private static bmwAlgorithm(seed: string): string {
    // BMW specific XOR-based algorithm
    const seedNum = parseInt(seed, 16);
    const key = seedNum ^ 0x87654321;
    return key.toString(16).padStart(8, '0').toUpperCase();
  }

  private static mercedesAlgorithm(seed: string): string {
    // Mercedes specific algorithm
    const seedNum = parseInt(seed, 16);
    const key = ((seedNum * 0x1234) + 0x5678) & 0xFFFFFFFF;
    return key.toString(16).padStart(8, '0').toUpperCase();
  }

  private static vwAlgorithm(seed: string): string {
    // VW/Audi specific algorithm
    const seedNum = parseInt(seed, 16);
    const key = (seedNum + 0x12345678) & 0xFFFFFFFF;
    return key.toString(16).padStart(8, '0').toUpperCase();
  }

  private static audiAlgorithm(seed: string): string {
    // Audi specific algorithm (similar to VW)
    return this.vwAlgorithm(seed);
  }

  private static toyotaAlgorithm(seed: string): string {
    // Toyota specific algorithm
    const seedNum = parseInt(seed, 16);
    const key = ((seedNum >> 2) + 0x5555) & 0xFFFFFFFF;
    return key.toString(16).padStart(8, '0').toUpperCase();
  }

  private static hondaAlgorithm(seed: string): string {
    // Honda specific algorithm
    const seedNum = parseInt(seed, 16);
    const key = (seedNum * 0x3333) & 0xFFFFFFFF;
    return key.toString(16).padStart(8, '0').toUpperCase();
  }

  private static fordAlgorithm(seed: string): string {
    // Ford specific algorithm
    const seedNum = parseInt(seed, 16);
    const key = ((seedNum ^ 0xFFFF) + 0xAAAA) & 0xFFFFFFFF;
    return key.toString(16).padStart(8, '0').toUpperCase();
  }

  private static gmAlgorithm(seed: string): string {
    // GM specific algorithm
    const seedNum = parseInt(seed, 16);
    const key = (seedNum + seedNum) & 0xFFFFFFFF;
    return key.toString(16).padStart(8, '0').toUpperCase();
  }

  private static nissanAlgorithm(seed: string): string {
    // Nissan specific algorithm
    const seedNum = parseInt(seed, 16);
    const key = ((seedNum * 2) + 0x7777) & 0xFFFFFFFF;
    return key.toString(16).padStart(8, '0').toUpperCase();
  }

  private static hyundaiAlgorithm(seed: string): string {
    // Hyundai specific algorithm
    const seedNum = parseInt(seed, 16);
    const key = (seedNum ^ 0x9999) & 0xFFFFFFFF;
    return key.toString(16).padStart(8, '0').toUpperCase();
  }

  static getSecurityProcedure(manufacturer: string): SecurityProcedure | null {
    return this.SECURITY_PROCEDURES[manufacturer] || null;
  }

  static getSupportedManufacturers(): string[] {
    return Object.keys(this.SECURITY_PROCEDURES);
  }

  static async testSecurityAccess(
    sendCommand: (command: string) => Promise<string>,
    ecuAddress: string = '7E0'
  ): Promise<{
    requiresAuth: boolean;
    securityLevel: 'none' | 'basic' | 'advanced' | 'maximum';
    testResults: Array<{ command: string; response: string; success: boolean }>;
  }> {
    const testResults: Array<{ command: string; response: string; success: boolean }> = [];
    
    try {
      // Test basic security access
      const testCommand = `${ecuAddress} 27 01`;
      const response = await sendCommand(testCommand);
      
      testResults.push({
        command: testCommand,
        response,
        success: response.length > 0
      });

      const securityCheck = this.checkSecurityLevel(response);
      
      return {
        ...securityCheck,
        testResults
      };
    } catch (error) {
      testResults.push({
        command: `${ecuAddress} 27 01`,
        response: 'ERROR',
        success: false
      });

      return {
        requiresAuth: false,
        securityLevel: 'none',
        testResults
      };
    }
  }

  static createCustomSecurityProcedure(
    name: string,
    steps: SecurityStep[],
    algorithm?: (seed: string) => string
  ): SecurityProcedure {
    return {
      name,
      steps,
      algorithm
    };
  }

  static addCustomSecurityProcedure(
    manufacturer: string,
    procedure: SecurityProcedure
  ): void {
    this.SECURITY_PROCEDURES[manufacturer] = procedure;
  }

  static getSecurityErrorDescription(errorCode: string): string {
    const errorMap: Record<string, string> = {
      '7F 27 11': 'Security access required - authentication needed',
      '7F 27 12': 'Security access denied - invalid key',
      '7F 27 13': 'Security access denied - too many attempts',
      '7F 27 21': 'Conditions not correct for security access',
      '7F 27 22': 'Security access timed out',
      '7F 27 31': 'Security access - invalid request format',
      '7F 27 33': 'Security access - device not ready',
      '7F 27 35': 'Security access - function not supported'
    };

    return errorMap[errorCode] || 'Unknown security error';
  }

  static async retryAuthentication(
    manufacturer: string,
    sendCommand: (command: string) => Promise<string>,
    ecuAddress: string = '7E0',
    maxRetries: number = 3
  ): Promise<{ success: boolean; attempts: number; message: string }> {
    let lastError = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.authenticateECU(manufacturer, sendCommand, ecuAddress);
      
      if (result.success) {
        return { 
          success: true, 
          attempts: attempt, 
          message: `Authentication successful on attempt ${attempt}` 
        };
      }
      
      lastError = result.message;
      
      // Wait before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { 
      success: false, 
      attempts: maxRetries, 
      message: `Authentication failed after ${maxRetries} attempts. Last error: ${lastError}` 
    };
  }
}

/** Never log PIN digits — only length for diagnostics. */
function logPinAttempt(pinLength: number): void {
  if (typeof console !== 'undefined' && console.debug) {
    console.debug(`[ECUSecurity] PIN unlock attempt (${pinLength} digits)`);
  }
}
