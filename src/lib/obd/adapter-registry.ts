import type { 
  OBDAdapter, 
  AdapterCapabilities, 
  OBDProtocol,
  ManufacturerProtocol,
  OBDIProtocol 
} from '@/types';
import { OBDConnectionManager } from './connection';
import { ProtocolDetection } from './protocol-detection';

// Adapter registry for multiple hardware types
export class AdapterRegistry {
  private adapters: Map<string, AdapterManager> = new Map();
  private activeAdapter: AdapterManager | null = null;

  constructor() {
    this.registerDefaultAdapters();
  }

  private registerDefaultAdapters() {
    // ELM327 Adapter
    this.registerAdapter('elm327', new ELM327Manager({
      protocols: ['SAE_J1850_PWM', 'SAE_J1850_VPW', 'ISO_9141_2', 'ISO_14230_4_KWP_FAST', 'ISO_15765_4_CAN_11BIT_500K'],
      maxBaudRate: 500000,
      canFiltering: true,
      batteryVoltage: true,
      adaptiveTiming: true,
      j1939Support: false,
      canMonitor: true
    }));

    // STN Adapter (advanced diagnostics)
    this.registerAdapter('stn', new STNManager({
      protocols: ['SAE_J1850_PWM', 'SAE_J1850_VPW', 'ISO_9141_2', 'ISO_14230_4_KWP_FAST', 'ISO_15765_4_CAN_11BIT_500K'],
      maxBaudRate: 1000000,
      canFiltering: true,
      batteryVoltage: true,
      adaptiveTiming: true,
      j1939Support: true,
      canMonitor: true
    }));

    // J2534 Pass-through
    this.registerAdapter('j2534', new J2534Manager({
      protocols: ['SAE_J1850_PWM', 'SAE_J1850_VPW', 'ISO_9141_2', 'ISO_14230_4_KWP_FAST', 'ISO_15765_4_CAN_11BIT_500K'],
      maxBaudRate: 4000000,
      canFiltering: true,
      batteryVoltage: true,
      adaptiveTiming: true,
      j1939Support: true,
      canMonitor: true
    }));

    // Custom Adapter (for future expansion)
    this.registerAdapter('custom', new CustomAdapterManager({
      protocols: ['ISO_15765_4_CAN_11BIT_500K'],
      maxBaudRate: 500000,
      canFiltering: false,
      batteryVoltage: false,
      adaptiveTiming: false,
      j1939Support: false,
      canMonitor: false
    }));
  }

  registerAdapter(type: string, manager: AdapterManager) {
    this.adapters.set(type, manager);
  }

  async connect(adapterType: string, adapter: OBDAdapter): Promise<boolean> {
    const manager = this.adapters.get(adapterType);
    if (!manager) {
      throw new Error(`Unknown adapter type: ${adapterType}`);
    }

    try {
      const connected = await manager.connect(adapter);
      if (connected) {
        this.activeAdapter = manager;
        return true;
      }
    } catch (error) {
      console.error(`Failed to connect ${adapterType} adapter:`, error);
    }

    return false;
  }

  async disconnect(): Promise<void> {
    if (this.activeAdapter) {
      await this.activeAdapter.disconnect();
      this.activeAdapter = null;
    }
  }

  getActiveAdapter(): AdapterManager | null {
    return this.activeAdapter;
  }

  getAvailableAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }

  getAdapterCapabilities(type: string): AdapterCapabilities | undefined {
    const manager = this.adapters.get(type);
    return manager?.getCapabilities();
  }
}

// Base adapter manager interface
export abstract class AdapterManager {
  protected capabilities: AdapterCapabilities;
  protected connection: any = null;
  protected protocolDetection: ProtocolDetection;

  constructor(capabilities: AdapterCapabilities) {
    this.capabilities = capabilities;
    this.protocolDetection = new ProtocolDetection(capabilities);
  }

  abstract connect(adapter: OBDAdapter): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract sendCommand(command: string): Promise<string>;
  abstract readData(): Promise<string>;

  getCapabilities(): AdapterCapabilities {
    return this.capabilities;
  }

  async detectProtocol(): Promise<{
    protocol: OBDProtocol | ManufacturerProtocol | OBDIProtocol;
    type: 'standard' | 'manufacturer' | 'legacy' | 'heavy-duty';
    confidence: number;
  }> {
    return this.protocolDetection.detectProtocol(this);
  }

  async initializeProtocol(protocol: OBDProtocol | ManufacturerProtocol | OBDIProtocol): Promise<boolean> {
    try {
      if (this.isStandardProtocol(protocol)) {
        return await this.initializeStandardProtocol(protocol);
      } else if (this.isManufacturerProtocol(protocol)) {
        return await this.initializeManufacturerProtocol(protocol);
      } else if (this.isLegacyProtocol(protocol)) {
        return await this.initializeLegacyProtocol(protocol);
      }
    } catch (error) {
      console.error('Protocol initialization failed:', error);
    }
    return false;
  }

  private isStandardProtocol(protocol: any): protocol is OBDProtocol {
    return typeof protocol === 'string' || ['ISO_15765_4_CAN_11BIT_500K', 'ISO_14230_4_KWP_FAST', 'ISO_9141_2', 'SAE_J1850_PWM', 'SAE_J1850_VPW'].includes(protocol as string);
  }

  private isManufacturerProtocol(protocol: any): protocol is ManufacturerProtocol {
    return protocol && typeof protocol === 'object' && 'manufacturer' in protocol;
  }

  private isLegacyProtocol(protocol: any): protocol is OBDIProtocol {
    return protocol && typeof protocol === 'object' && 'protocol' in protocol && ['ALDL', 'CCD', 'SDS', 'OBDI'].includes(protocol.protocol);
  }

  private async initializeStandardProtocol(protocol: OBDProtocol): Promise<boolean> {
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
      'SAE_J1939_CAN': '9'
    };

    const protocolCode = protocolMap[protocol];
    if (!protocolCode) {
      console.warn(`Unknown protocol code for ${protocol}`);
      return false;
    }

    await this.sendCommand('ATZ'); // Reset
    await this.sendCommand(`ATSP${protocolCode}`); // Set protocol
    
    if (this.capabilities.adaptiveTiming) {
      await this.sendCommand('ATAT0'); // Adaptive timing on
    }
    
    return true;
  }

  private async initializeManufacturerProtocol(protocol: ManufacturerProtocol): Promise<boolean> {
    // Set baud rate
    await this.sendCommand(`ATBR${protocol.baudRate}`);
    
    // Run manufacturer-specific initialization sequence
    for (const cmd of protocol.initSequence) {
      await this.sendCommand(cmd);
    }
    
    return true;
  }

  private async initializeLegacyProtocol(protocol: OBDIProtocol): Promise<boolean> {
    // Set baud rate for legacy protocol
    await this.sendCommand(`ATBR${protocol.baudRate}`);
    
    // Legacy protocols may not use standard AT commands
    // Implementation would be adapter-specific
    return true;
  }
}

// ELM327 Manager
export class ELM327Manager extends AdapterManager {
  private connectionManager: OBDConnectionManager;

  constructor(capabilities: AdapterCapabilities) {
    super(capabilities);
    this.connectionManager = new OBDConnectionManager();
  }

  async connect(adapter: OBDAdapter): Promise<boolean> {
    try {
      this.connection = await this.connectionManager.connect(adapter);
      return this.connection !== null;
    } catch (error) {
      console.error('ELM327 connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connectionManager.disconnect();
      this.connection = null;
    }
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.connection) {
      throw new Error('Not connected');
    }
    return this.connectionManager.sendCommand(command);
  }

  async readData(): Promise<string> {
    if (!this.connection) {
      throw new Error('Not connected');
    }
    return this.connectionManager.readData();
  }
}

// STN Manager (advanced diagnostics)
export class STNManager extends AdapterManager {
  private stnConnection: any = null;

  async connect(adapter: OBDAdapter): Promise<boolean> {
    // STN-specific connection logic
    try {
      // Initialize STN adapter
      this.stnConnection = await this.initializeSTN(adapter);
      return this.stnConnection !== null;
    } catch (error) {
      console.error('STN connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.stnConnection) {
      await this.stnConnection.close();
      this.stnConnection = null;
    }
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.stnConnection) {
      throw new Error('Not connected');
    }
    return this.stnConnection.send(command);
  }

  async readData(): Promise<string> {
    if (!this.stnConnection) {
      throw new Error('Not connected');
    }
    return this.stnConnection.read();
  }

  private async initializeSTN(adapter: OBDAdapter): Promise<any> {
    // STN-specific initialization
    // This would interface with STN SDK or API
    return { send: () => '', read: () => '', close: () => {} };
  }
}

// J2534 Manager (pass-through devices)
export class J2534Manager extends AdapterManager {
  private j2534Device: any = null;

  async connect(adapter: OBDAdapter): Promise<boolean> {
    try {
      this.j2534Device = await this.initializeJ2534(adapter);
      return this.j2534Device !== null;
    } catch (error) {
      console.error('J2534 connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.j2534Device) {
      await this.j2534Device.close();
      this.j2534Device = null;
    }
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.j2534Device) {
      throw new Error('Not connected');
    }
    return this.j2534Device.passThrough(command);
  }

  async readData(): Promise<string> {
    if (!this.j2534Device) {
      throw new Error('Not connected');
    }
    return this.j2534Device.read();
  }

  private async initializeJ2534(adapter: OBDAdapter): Promise<any> {
    // J2534-specific initialization
    // This would interface with J2534 API
    return { passThrough: () => '', read: () => '', close: () => {} };
  }
}

// Custom Adapter Manager (for future expansion)
export class CustomAdapterManager extends AdapterManager {
  private customConnection: any = null;

  async connect(adapter: OBDAdapter): Promise<boolean> {
    try {
      this.customConnection = await this.initializeCustom(adapter);
      return this.customConnection !== null;
    } catch (error) {
      console.error('Custom adapter connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.customConnection) {
      await this.customConnection.close();
      this.customConnection = null;
    }
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.customConnection) {
      throw new Error('Not connected');
    }
    return this.customConnection.send(command);
  }

  async readData(): Promise<string> {
    if (!this.customConnection) {
      throw new Error('Not connected');
    }
    return this.customConnection.read();
  }

  private async initializeCustom(adapter: OBDAdapter): Promise<any> {
    // Custom adapter initialization
    // This would be implemented based on specific hardware requirements
    return { send: () => '', read: () => '', close: () => {} };
  }
}
