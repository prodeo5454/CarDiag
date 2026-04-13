import type { 
  OBDProtocol, 
  ManufacturerProtocol, 
  OBDIProtocol, 
  J1939Parameter,
  SecurityProcedure,
  AdapterCapabilities 
} from '@/types';
// Enhanced protocol detection system
export class ProtocolDetection {
  private adapterCapabilities: AdapterCapabilities;

  constructor(capabilities: AdapterCapabilities) {
    this.adapterCapabilities = capabilities;
  }

  async detectProtocol(adapter: any): Promise<{
    protocol: OBDProtocol | ManufacturerProtocol | OBDIProtocol;
    type: 'standard' | 'manufacturer' | 'legacy' | 'heavy-duty';
    confidence: number;
  }> {
    // Try standard OBD-II protocols first
    const standardResult = await this.tryStandardProtocols(adapter);
    if (standardResult.confidence > 0.8) {
      return { ...standardResult, type: 'standard' as const };
    }

    // Try manufacturer-specific protocols
    const manufacturerResult = await this.tryManufacturerProtocols(adapter);
    if (manufacturerResult.confidence > 0.7) {
      return { ...manufacturerResult, type: 'manufacturer' as const };
    }

    // Try heavy-duty J1939
    if (this.adapterCapabilities.j1939Support) {
      const heavyDutyResult = await this.tryJ1939Protocol(adapter);
      if (heavyDutyResult.confidence > 0.6) {
        return { ...heavyDutyResult, type: 'heavy-duty' as const };
      }
    }

    // Try legacy OBD-I protocols
    const legacyResult = await this.tryLegacyProtocols(adapter);
    if (legacyResult.confidence > 0.5) {
      return { ...legacyResult, type: 'legacy' as const };
    }

    // Fallback to most common protocol
    return {
      protocol: 'ISO_15765_4_CAN_11BIT_500K',
      type: 'standard' as const,
      confidence: 0.3
    };
  }

  private async tryStandardProtocols(adapter: any): Promise<{
    protocol: OBDProtocol;
    confidence: number;
  }> {
    const protocols: OBDProtocol[] = [
      'ISO_15765_4_CAN_11BIT_500K',
      'ISO_14230_4_KWP_FAST',
      'ISO_9141_2',
      'SAE_J1850_PWM',
      'SAE_J1850_VPW'
    ];

    for (const protocol of protocols) {
      try {
        const response = await this.testProtocol(adapter, protocol);
        if (response.success) {
          return { protocol, confidence: response.confidence };
        }
      } catch (error) {
        console.warn(`Protocol test failed for ${protocol}:`, error);
      }
    }

    return { protocol: 'ISO_15765_4_CAN_11BIT_500K', confidence: 0.1 };
  }

  private async tryManufacturerProtocols(adapter: any): Promise<{
    protocol: ManufacturerProtocol;
    confidence: number;
  }> {
    const manufacturerProtocols = this.getManufacturerProtocols();

    for (const protocol of manufacturerProtocols) {
      try {
        const response = await this.testManufacturerProtocol(adapter, protocol);
        if (response.success) {
          return { protocol, confidence: response.confidence };
        }
      } catch (error) {
        console.warn(`Manufacturer protocol test failed for ${protocol.name}:`, error);
      }
    }

    // Return a generic manufacturer protocol as fallback
    return {
      protocol: {
        name: 'Generic Manufacturer',
        manufacturer: 'Unknown',
        protocol: 'CAN',
        baudRate: 500000,
        initSequence: ['ATZ', 'ATSP0'],
        customPIDs: {}
      },
      confidence: 0.2
    };
  }

  private async tryJ1939Protocol(adapter: any): Promise<{
    protocol: 'SAE_J1939_CAN';
    confidence: number;
  }> {
    try {
      // Test J1939 specific initialization
      await adapter.sendCommand('ATJ1939');
      const response = await adapter.sendCommand('ATDP');
      
      if (response.includes('J1939') || response.includes('250K')) {
        return { protocol: 'SAE_J1939_CAN', confidence: 0.9 };
      }
    } catch (error) {
      console.warn('J1939 protocol test failed:', error);
    }

    return { protocol: 'SAE_J1939_CAN', confidence: 0.1 };
  }

  private async tryLegacyProtocols(adapter: any): Promise<{
    protocol: OBDIProtocol;
    confidence: number;
  }> {
    const legacyProtocols = this.getLegacyProtocols();

    for (const protocol of legacyProtocols) {
      try {
        const response = await this.testLegacyProtocol(adapter, protocol);
        if (response.success) {
          return { protocol, confidence: response.confidence };
        }
      } catch (error) {
        console.warn(`Legacy protocol test failed for ${protocol.name}:`, error);
      }
    }

    return {
      protocol: {
        name: 'Generic OBD-I',
        make: 'Unknown',
        protocol: 'OBDI',
        connector: '12-pin',
        baudRate: 9600,
        commands: {}
      },
      confidence: 0.1
    };
  }

  private async testProtocol(adapter: any, protocol: OBDProtocol): Promise<{
    success: boolean;
    confidence: number;
  }> {
    try {
      // Set protocol
      const protocolMap: Partial<Record<OBDProtocol, string>> = {
        'ISO_15765_4_CAN_11BIT_500K': '6',
        'ISO_15765_4_CAN_29BIT_500K': '6',
        'ISO_15765_4_CAN_11BIT_250K': '6',
        'ISO_15765_4_CAN_29BIT_250K': '6',
        'ISO_14230_4_KWP_FAST': '5',
        'ISO_14230_4_KWP_5BAUD': '5',
        'ISO_9141_2': '3',
        'SAE_J1850_PWM': '1',
        'SAE_J1850_VPW': '2',
        'SAE_J1939_CAN': '9',
      };

      const atsp = protocolMap[protocol];
      if (!atsp) return { success: false, confidence: 0 };

      await adapter.sendCommand(`ATSP${atsp}`);
      
      // Test with basic OBD command
      const response = await adapter.sendCommand('0100');
      
      if (response && response.length > 0 && !response.includes('NO DATA')) {
        return { success: true, confidence: 0.9 };
      }
    } catch (error) {
      // Protocol not supported
    }

    return { success: false, confidence: 0 };
  }

  private async testManufacturerProtocol(adapter: any, protocol: ManufacturerProtocol): Promise<{
    success: boolean;
    confidence: number;
  }> {
    try {
      // Try manufacturer-specific initialization
      for (const cmd of protocol.initSequence) {
        await adapter.sendCommand(cmd);
      }

      // Test with manufacturer-specific PID if available
      const testPID = Object.keys(protocol.customPIDs)[0];
      if (testPID) {
        const response = await adapter.sendCommand(`01${testPID}`);
        if (response && response.length > 0 && !response.includes('NO DATA')) {
          return { success: true, confidence: 0.8 };
        }
      }

      // Fallback to standard test
      const response = await adapter.sendCommand('0100');
      if (response && response.length > 0 && !response.includes('NO DATA')) {
        return { success: true, confidence: 0.6 };
      }
    } catch (error) {
      // Protocol not supported
    }

    return { success: false, confidence: 0 };
  }

  private async testLegacyProtocol(adapter: any, protocol: OBDIProtocol): Promise<{
    success: boolean;
    confidence: number;
  }> {
    try {
      // Set baud rate for legacy protocol
      await adapter.sendCommand(`ATBR${protocol.baudRate}`);
      
      // Test with legacy command
      const testCommand = Object.keys(protocol.commands)[0];
      if (testCommand) {
        const response = await adapter.sendCommand(protocol.commands[testCommand]);
        if (response && response.length > 0 && !response.includes('ERROR')) {
          return { success: true, confidence: 0.7 };
        }
      }
    } catch (error) {
      // Protocol not supported
    }

    return { success: false, confidence: 0 };
  }

  private getManufacturerProtocols(): ManufacturerProtocol[] {
    return [
      // BMW/Mini EDIC Protocol
      {
        name: 'BMW EDIC',
        manufacturer: 'BMW',
        protocol: 'EDIC',
        baudRate: 9600,
        initSequence: ['ATZ', 'ATIB96', 'ATIIA13', 'ATSH81', 'ATFI0'],
        customPIDs: {
          '10': { pid: '10', mode: '01', name: 'BMW VIN', description: 'BMW Vehicle Identification', unit: '', formula: (b) => b[0] ?? 0, min: 0, max: 0, bytes: 1, category: 'Vehicle', manufacturer: 'BMW' },
          '21': { pid: '21', mode: '01', name: 'BMW Software Version', description: 'ECU Software Version', unit: '', formula: (b) => b[0] ?? 0, min: 0, max: 0, bytes: 1, category: 'System', manufacturer: 'BMW' }
        }
      },
      // VW/Audi KWP1281
      {
        name: 'VW KWP1281',
        manufacturer: 'Volkswagen',
        protocol: 'KWP1281',
        baudRate: 10400,
        initSequence: ['ATZ', 'ATIB96', 'ATIIA13', 'ATSH81', 'ATFI0'],
        customPIDs: {
          '92': { pid: '92', mode: '01', name: 'VW VIN', description: 'VW Vehicle Identification', unit: '', formula: (b) => b[0] ?? 0, min: 0, max: 0, bytes: 1, category: 'Vehicle', manufacturer: 'VW' }
        }
      },
      // GM J1850 VPW Extensions
      {
        name: 'GM VPW Enhanced',
        manufacturer: 'GM',
        protocol: 'J1850_VPW',
        baudRate: 10400,
        initSequence: ['ATZ', 'ATSP2', 'ATFI0'],
        customPIDs: {
          '1C': { pid: '1C', mode: '01', name: 'GM VIN', description: 'GM Vehicle Identification', unit: '', formula: (b) => b[0] ?? 0, min: 0, max: 0, bytes: 1, category: 'Vehicle', manufacturer: 'GM' }
        }
      },
      // Toyota Custom CAN
      {
        name: 'Toyota CAN',
        manufacturer: 'Toyota',
        protocol: 'CAN',
        baudRate: 500000,
        initSequence: ['ATZ', 'ATSP6', 'ATSH7E0', 'ATFCSH7E8', 'ATFCSD300'],
        customPIDs: {
          '90': { pid: '90', mode: '01', name: 'Toyota VIN', description: 'Toyota Vehicle Identification', unit: '', formula: (b) => b[0] ?? 0, min: 0, max: 0, bytes: 1, category: 'Vehicle', manufacturer: 'Toyota' }
        }
      }
    ];
  }

  private getLegacyProtocols(): OBDIProtocol[] {
    return [
      // GM ALDL
      {
        name: 'GM ALDL',
        make: 'GM',
        protocol: 'ALDL',
        connector: '12-pin',
        baudRate: 8192,
        commands: {
          'ALDL_STATUS': 'F4 56',
          'ALDL_CODES': 'F4 57'
        }
      },
      // Chrysler CCD
      {
        name: 'Chrysler CCD',
        make: 'Chrysler',
        protocol: 'CCD',
        connector: '3-pin',
        baudRate: 7812.5,
        commands: {
          'CCD_STATUS': '8C',
          'CCD_CODES': '8D'
        }
      },
      // Ford EEC-IV
      {
        name: 'Ford EEC-IV',
        make: 'Ford',
        protocol: 'SDS',
        connector: '12-pin',
        baudRate: 9600,
        commands: {
          'FORD_STATUS': 'FF',
          'FORD_CODES': 'FE'
        }
      }
    ];
  }
}
