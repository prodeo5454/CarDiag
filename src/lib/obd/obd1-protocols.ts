import type { OBDIProtocol } from '@/types';

// OBD-I Legacy Protocol Support for Pre-1996 Vehicles
export class OBD1Protocols {
  private static readonly OBD1_PROTOCOLS: Record<string, OBDIProtocol> = {
    // GM ALDL Protocol
    'GM_ALDL': {
      name: 'GM ALDL (Assembly Line Diagnostic Link)',
      make: 'GM',
      protocol: 'ALDL',
      connector: '12-pin',
      baudRate: 8192,
      commands: {
        'STATUS': 'F4 56',
        'CODES': 'F4 57',
        'DATA': 'F4 58',
        'CLEAR': 'F4 4E',
        'VIN': 'F4 49'
      }
    },
    
    // Chrysler CCD Protocol
    'CHRYSLER_CCD': {
      name: 'Chrysler CCD (Chrysler Collision Detection)',
      make: 'Chrysler',
      protocol: 'CCD',
      connector: '3-pin',
      baudRate: 7812.5,
      commands: {
        'STATUS': '8C',
        'CODES': '8D',
        'DATA': '8E',
        'CLEAR': '8F',
        'VIN': '90'
      }
    },
    
    // Ford EEC-IV Protocol
    'FORD_EECIV': {
      name: 'Ford EEC-IV (Electronic Engine Control IV)',
      make: 'Ford',
      protocol: 'SDS',
      connector: '12-pin',
      baudRate: 9600,
      commands: {
        'STATUS': 'FF',
        'CODES': 'FE',
        'DATA': 'FD',
        'CLEAR': 'FC',
        'VIN': 'FB'
      }
    },
    
    // Toyota OBD-I Protocol
    'TOYOTA_OBD1': {
      name: 'Toyota OBD-I',
      make: 'Toyota',
      protocol: 'OBDI',
      connector: '12-pin',
      baudRate: 9600,
      commands: {
        'STATUS': '01',
        'CODES': '02',
        'DATA': '03',
        'CLEAR': '04',
        'VIN': '05'
      }
    },
    
    // Honda OBD-I Protocol
    'HONDA_OBD1': {
      name: 'Honda OBD-I',
      make: 'Honda',
      protocol: 'OBDI',
      connector: '3-pin',
      baudRate: 10400,
      commands: {
        'STATUS': 'A1',
        'CODES': 'A2',
        'DATA': 'A3',
        'CLEAR': 'A4',
        'VIN': 'A5'
      }
    },
    
    // Nissan OBD-I Protocol
    'NISSAN_OBD1': {
      name: 'Nissan OBD-I',
      make: 'Nissan',
      protocol: 'OBDI',
      connector: '12-pin',
      baudRate: 9600,
      commands: {
        'STATUS': 'B1',
        'CODES': 'B2',
        'DATA': 'B3',
        'CLEAR': 'B4',
        'VIN': 'B5'
      }
    },
    
    // BMW OBD-I Protocol
    'BMW_OBD1': {
      name: 'BMW OBD-I',
      make: 'BMW',
      protocol: 'OBDI',
      connector: '20-pin',
      baudRate: 9600,
      commands: {
        'STATUS': 'C1',
        'CODES': 'C2',
        'DATA': 'C3',
        'CLEAR': 'C4',
        'VIN': 'C5'
      }
    },
    
    // Mercedes OBD-I Protocol
    'MERCEDES_OBD1': {
      name: 'Mercedes OBD-I',
      make: 'Mercedes',
      protocol: 'OBDI',
      connector: '38-pin',
      baudRate: 9600,
      commands: {
        'STATUS': 'D1',
        'CODES': 'D2',
        'DATA': 'D3',
        'CLEAR': 'D4',
        'VIN': 'D5'
      }
    },
    
    // VW/Audi OBD-I Protocol
    'VW_OBD1': {
      name: 'VW/Audi OBD-I',
      make: 'VW',
      protocol: 'OBDI',
      connector: '2x2',
      baudRate: 9600,
      commands: {
        'STATUS': 'E1',
        'CODES': 'E2',
        'DATA': 'E3',
        'CLEAR': 'E4',
        'VIN': 'E5'
      }
    }
  };

  static getProtocol(make: string): OBDIProtocol | null {
    for (const [key, protocol] of Object.entries(this.OBD1_PROTOCOLS)) {
      if (protocol.make.toLowerCase() === make.toLowerCase()) {
        return protocol;
      }
    }
    return null;
  }

  static getAllProtocols(): OBDIProtocol[] {
    return Object.values(this.OBD1_PROTOCOLS);
  }

  static getProtocolsByMake(make: string): OBDIProtocol[] {
    return Object.values(this.OBD1_PROTOCOLS).filter(p => 
      p.make.toLowerCase() === make.toLowerCase()
    );
  }

  static getConnectorTypes(): string[] {
    const connectors = new Set<string>();
    Object.values(this.OBD1_PROTOCOLS).forEach(p => connectors.add(p.connector));
    return Array.from(connectors);
  }

  static getMakes(): string[] {
    const makes = new Set<string>();
    Object.values(this.OBD1_PROTOCOLS).forEach(p => makes.add(p.make));
    return Array.from(makes);
  }

  static parseOBD1Response(response: string, protocol: OBDIProtocol): {
    status?: string;
    codes?: string[];
    data?: Record<string, number>;
    vin?: string;
    error?: string;
  } {
    const result: any = {};

    try {
      // Parse based on protocol type
      switch (protocol.protocol) {
        case 'ALDL':
          return this.parseALDLResponse(response);
        case 'CCD':
          return this.parseCCDResponse(response);
        case 'SDS':
          return this.parseSDSResponse(response);
        case 'OBDI':
          return this.parseGenericOBD1Response(response);
        default:
          return { error: 'Unknown OBD-I protocol' };
      }
    } catch (error) {
      return { error: `Parse error: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  }

  private static parseALDLResponse(response: string): any {
    const result: any = {};
    
    // ALDL response format: F4 XX XX XX XX...
    if (response.startsWith('F4')) {
      const data = response.substring(3).split(' ').filter(Boolean);
      
      if (data.length >= 1) {
        const statusByte = parseInt(data[0], 16);
        result.status = this.getALDLStatus(statusByte);
      }
      
      if (data.length >= 2) {
        const codeCount = parseInt(data[1], 16);
        result.codes = [];
        
        for (let i = 0; i < codeCount && i + 2 < data.length; i++) {
          const code = parseInt(data[i + 2], 16);
          result.codes.push(this.formatALDLCode(code));
        }
      }
    }
    
    return result;
  }

  private static parseCCDResponse(response: string): any {
    const result: any = {};
    
    // CCD response format: 8C XX XX XX...
    if (response.startsWith('8C')) {
      const data = response.substring(3).split(' ').filter(Boolean);
      
      if (data.length >= 1) {
        const statusByte = parseInt(data[0], 16);
        result.status = this.getCCDStatus(statusByte);
      }
      
      if (data.length >= 2) {
        const codeByte = parseInt(data[1], 16);
        result.codes = this.formatCCDCodes(codeByte);
      }
    }
    
    return result;
  }

  private static parseSDSResponse(response: string): any {
    const result: any = {};
    
    // SDS response format: FF XX XX XX...
    if (response.startsWith('FF')) {
      const data = response.substring(3).split(' ').filter(Boolean);
      
      if (data.length >= 1) {
        const statusByte = parseInt(data[0], 16);
        result.status = this.getSDSStatus(statusByte);
      }
      
      if (data.length >= 2) {
        const codeByte1 = parseInt(data[1], 16);
        const codeByte2 = data.length >= 3 ? parseInt(data[2], 16) : 0;
        result.codes = this.formatSDSCodes(codeByte1, codeByte2);
      }
    }
    
    return result;
  }

  private static parseGenericOBD1Response(response: string): any {
    const result: any = {};
    
    // Generic OBD-I response format varies by manufacturer
    const data = response.split(' ').filter(Boolean);
    
    if (data.length >= 1) {
      const statusByte = parseInt(data[0], 16);
      result.status = this.getGenericStatus(statusByte);
    }
    
    if (data.length >= 2) {
      result.codes = [];
      for (let i = 1; i < data.length; i++) {
        const code = parseInt(data[i], 16);
        if (code > 0) {
          result.codes.push(this.formatGenericCode(code));
        }
      }
    }
    
    return result;
  }

  private static getALDLStatus(statusByte: number): string {
    const statusMap: Record<number, string> = {
      0x00: 'Normal',
      0x01: 'Check Engine On',
      0x02: 'Service Required',
      0x03: 'System Fault',
      0x04: 'Engine Off',
      0x05: 'Engine Running',
      0x06: 'Warm-up Cycle',
      0x07: 'Closed Loop'
    };
    return statusMap[statusByte] || 'Unknown';
  }

  private static getCCDStatus(statusByte: number): string {
    const statusMap: Record<number, string> = {
      0x00: 'Normal',
      0x01: 'MIL On',
      0x02: 'Service Required',
      0x03: 'System Fault',
      0x04: 'Engine Off',
      0x05: 'Engine Running'
    };
    return statusMap[statusByte] || 'Unknown';
  }

  private static getSDSStatus(statusByte: number): string {
    const statusMap: Record<number, string> = {
      0x00: 'Normal',
      0x01: 'Check Engine On',
      0x02: 'Service Required',
      0x03: 'System Fault',
      0x04: 'Engine Off',
      0x05: 'Engine Running',
      0x06: 'Self-test Mode'
    };
    return statusMap[statusByte] || 'Unknown';
  }

  private static getGenericStatus(statusByte: number): string {
    const statusMap: Record<number, string> = {
      0x00: 'Normal',
      0x01: 'MIL On',
      0x02: 'Service Required',
      0x03: 'System Fault',
      0x04: 'Engine Off',
      0x05: 'Engine Running'
    };
    return statusMap[statusByte] || 'Unknown';
  }

  private static formatALDLCode(code: number): string {
    // GM ALDL code format
    if (code === 0) return '';
    return `${code.toString(16).toUpperCase().padStart(2, '0')}`;
  }

  private static formatCCDCodes(codeByte: number): string[] {
    // Chrysler CCD code format - bit-based
    const codes: string[] = [];
    const codeMap: Record<number, string> = {
      0x01: 'P001',
      0x02: 'P002',
      0x04: 'P003',
      0x08: 'P004',
      0x10: 'P005',
      0x20: 'P006',
      0x40: 'P007',
      0x80: 'P008'
    };
    
    for (let bit = 0; bit < 8; bit++) {
      if (codeByte & (1 << bit)) {
        const code = codeMap[1 << bit];
        if (code) codes.push(code);
      }
    }
    
    return codes;
  }

  private static formatSDSCodes(codeByte1: number, codeByte2: number): string[] {
    // Ford SDS code format
    const codes: string[] = [];
    
    if (codeByte1 > 0) {
      codes.push(codeByte1.toString(16).toUpperCase().padStart(2, '0'));
    }
    
    if (codeByte2 > 0) {
      codes.push(codeByte2.toString(16).toUpperCase().padStart(2, '0'));
    }
    
    return codes;
  }

  private static formatGenericCode(code: number): string {
    // Generic OBD-I code format
    return code.toString(16).toUpperCase().padStart(2, '0');
  }

  static getOBD1ConnectorPinout(connector: string): Record<string, string> {
    const pinouts: Record<string, Record<string, string>> = {
      '12-pin': {
        'A': 'Ground',
        'B': 'Power (+12V)',
        'C': 'Data',
        'D': 'Clock',
        'E': 'Request',
        'F': 'Response',
        'G': 'Ignition',
        'H': 'Sensor Ground',
        'I': 'Signal',
        'J': 'Not Used',
        'K': 'Not Used',
        'L': 'Not Used'
      },
      '3-pin': {
        '1': 'Ground',
        '2': 'Data',
        '3': 'Power (+12V)'
      },
      '20-pin': {
        '1': 'Ground',
        '2': 'Power (+12V)',
        '3': 'Data',
        '4': 'Clock',
        '5': 'Request',
        '6': 'Response',
        '7': 'Ignition',
        '8': 'Sensor Ground',
        '9': 'Signal',
        '10': 'Not Used',
        '11': 'Not Used',
        '12': 'Not Used',
        '13': 'Not Used',
        '14': 'Not Used',
        '15': 'Not Used',
        '16': 'Not Used',
        '17': 'Not Used',
        '18': 'Not Used',
        '19': 'Not Used',
        '20': 'Not Used'
      },
      '38-pin': {
        '1': 'Ground',
        '2': 'Power (+12V)',
        '3': 'Data',
        '4': 'Clock',
        '5': 'Request',
        '6': 'Response',
        '7': 'Ignition',
        '8': 'Sensor Ground',
        '9': 'Signal',
        '10': 'Not Used',
        '11': 'Not Used',
        '12': 'Not Used',
        '13': 'Not Used',
        '14': 'Not Used',
        '15': 'Not Used',
        '16': 'Not Used',
        '17': 'Not Used',
        '18': 'Not Used',
        '19': 'Not Used',
        '20': 'Not Used',
        '21': 'Not Used',
        '22': 'Not Used',
        '23': 'Not Used',
        '24': 'Not Used',
        '25': 'Not Used',
        '26': 'Not Used',
        '27': 'Not Used',
        '28': 'Not Used',
        '29': 'Not Used',
        '30': 'Not Used',
        '31': 'Not Used',
        '32': 'Not Used',
        '33': 'Not Used',
        '34': 'Not Used',
        '35': 'Not Used',
        '36': 'Not Used',
        '37': 'Not Used',
        '38': 'Not Used'
      },
      '2x2': {
        '1': 'Ground',
        '2': 'Data',
        '3': 'Power (+12V)',
        '4': 'Not Used'
      }
    };
    
    return pinouts[connector] || {};
  }

  static getOBD1YearRanges(): Record<string, [number, number]> {
    return {
      'GM': [1982, 1995],
      'Chrysler': [1983, 1995],
      'Ford': [1984, 1995],
      'Toyota': [1985, 1995],
      'Honda': [1986, 1995],
      'Nissan': [1987, 1995],
      'BMW': [1988, 1995],
      'Mercedes': [1989, 1995],
      'VW': [1990, 1995]
    };
  }

  static isOBD1Vehicle(make: string, year: number): boolean {
    const yearRange = this.getOBD1YearRanges()[make];
    if (!yearRange) return false;
    return year >= yearRange[0] && year <= yearRange[1];
  }

  static getOBD1Capabilities(protocol: OBDIProtocol): {
    canReadCodes: boolean;
    canClearCodes: boolean;
    canReadData: boolean;
    canReadVIN: boolean;
    realTimeData: boolean;
  } {
    return {
      canReadCodes: true,
      canClearCodes: true,
      canReadData: protocol.protocol === 'ALDL' || protocol.protocol === 'SDS',
      canReadVIN: protocol.protocol === 'ALDL' || protocol.protocol === 'SDS',
      realTimeData: protocol.protocol === 'ALDL' || protocol.protocol === 'SDS'
    };
  }

  static createOBD1Command(protocol: OBDIProtocol, command: string): string {
    const cmd = protocol.commands[command];
    if (!cmd) {
      throw new Error(`Command '${command}' not supported for ${protocol.name}`);
    }
    return cmd;
  }

  static validateOBD1Response(response: string, protocol: OBDIProtocol): boolean {
    // Basic validation for OBD-I responses
    if (!response || response.length === 0) return false;
    
    // Check if response starts with expected prefix
    const expectedPrefix = Object.values(protocol.commands)[0]?.substring(0, 2);
    if (expectedPrefix && !response.startsWith(expectedPrefix)) {
      return false;
    }
    
    return true;
  }
}
