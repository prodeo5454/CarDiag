import type {
  OBDAdapter,
  OBDConnectionState,
  ConnectionType,
  ConnectionEvent,
  OBDProtocol,
  OBDPIDDefinition,
} from '@/types';
import {
  getInitSequence,
  parseELMResponse,
  isELMError,
  parseVoltage,
  parseProtocolNumber,
  parseVIN,
  PROTOCOL_MAP,
} from './elm327';
import { parseSupportedPIDs, parseDTCCodes, STANDARD_PIDS, PID_SUPPORT_COMMANDS } from './pids';
import { BLE_SERVICES, BLE_WRITE_CHARS, BLE_NOTIFY_CHARS } from './ble-constants';
import { ensureNativeBleInitialized, isCapacitorNativeHost } from './native-ble-platform';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ConnectionListener = (event: ConnectionEvent) => void;

export interface InitStep {
  step: string;
  status: 'pending' | 'running' | 'done' | 'error';
  message?: string;
}

export interface ECULiveReading {
  pid: OBDPIDDefinition;
  rawBytes: number[];
  value: number;
  timestamp: number;
}

/** Loose shape for @capacitor-community/bluetooth-le getServices() (avoids tight coupling to plugin types). */
type NativeBleServiceShape = {
  uuid: string;
  characteristics?: { uuid: string; properties?: Record<string, boolean> }[];
};

// ─── Baud rates to attempt for ELM327 adapters ─────────────────────────────

const BAUD_RATES = [38400, 115200, 9600, 57600, 19200, 230400, 500000];

// ─── Real OBD-II Connection Manager ─────────────────────────────────────────

export class OBDConnectionManager {
  private state: OBDConnectionState = {
    status: 'disconnected',
    adapter: null,
    protocol: null,
    voltage: null,
    vin: null,
    ecuAddresses: [],
    supportedPIDs: [],
    error: null,
    latency: 0,
    lastActivity: 0,
  };

  private listeners: ConnectionListener[] = [];
  private initStepListeners: ((steps: InitStep[]) => void)[] = [];
  private initSteps: InitStep[] = [];

  // Transport layer references
  private port: SerialPort | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private btWriteChar: any = null;
  private wifiSocket: WebSocket | null = null;

  /** Capacitor @capacitor-community/bluetooth-le transport (Android / iOS shell). */
  private nativeBle: {
    deviceId: string;
    service: string;
    write: string;
    notify: string;
  } | null = null;

  private readBuffer = '';
  private readResolve: ((value: string) => void) | null = null;
  private connected = false;
  private readLoopRunning = false;
  private commandLock = false;

  // ─── Event System ───────────────────────────────────────────────────────

  on(listener: ConnectionListener): () => void {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); };
  }

  onInitSteps(listener: (steps: InitStep[]) => void): () => void {
    this.initStepListeners.push(listener);
    return () => { this.initStepListeners = this.initStepListeners.filter(l => l !== listener); };
  }

  private emit(event: ConnectionEvent) {
    this.listeners.forEach(l => { try { l(event); } catch {} });
  }

  private emitInitSteps() {
    const snapshot = this.initSteps.map(s => ({ ...s }));
    this.initStepListeners.forEach(l => { try { l(snapshot); } catch {} });
  }

  getState(): OBDConnectionState {
    return { ...this.state };
  }

  isConnected(): boolean {
    return this.connected && this.state.status === 'connected';
  }

  // ─── Bluetooth Scanning (Real Web Bluetooth API) ───────────────────────

  async scanBluetooth(): Promise<OBDAdapter[]> {
    this.state.status = 'scanning';
    this.emit({ type: 'data', timestamp: Date.now(), message: 'Scanning for Bluetooth OBD adapters...' });
    const adapters: OBDAdapter[] = [];

    const optionalServices = [...BLE_SERVICES];

    if (await isCapacitorNativeHost()) {
      try {
        await ensureNativeBleInitialized();
        const { BleClient } = await import('@capacitor-community/bluetooth-le');
        const namePrefixes = [
          'OBD', 'ELM', 'OBDII', 'V-LINK', 'Vgate', 'iCar', 'Veepeak', 'LELink',
          'BAFX', 'Konnwei', 'Carista', 'BlueDriver',
        ];
        for (const namePrefix of namePrefixes) {
          try {
            const device = await BleClient.requestDevice({ namePrefix, optionalServices });
            adapters.push({
              id: device.deviceId,
              name: device.name || 'Bluetooth OBD Adapter',
              type: 'bluetooth',
              address: device.deviceId,
              paired: true,
              chipset: 'ELM327',
            });
            break;
          } catch {
            /* try next prefix */
          }
        }
        if (adapters.length === 0) {
          try {
            const device = await BleClient.requestDevice({ optionalServices });
            adapters.push({
              id: device.deviceId,
              name: device.name || 'Bluetooth OBD Adapter',
              type: 'bluetooth',
              address: device.deviceId,
              paired: true,
              chipset: 'ELM327',
            });
          } catch (err: any) {
            if (err?.message) {
              this.emit({ type: 'error', timestamp: Date.now(), message: `Bluetooth: ${err.message}` });
            }
          }
        }
      } catch (err: any) {
        console.error('[OBD] Native BLE scan error:', err);
        this.emit({ type: 'error', timestamp: Date.now(), message: `Bluetooth: ${err?.message || err}` });
      }
      this.state.status = 'disconnected';
      return adapters;
    }

    if (!('bluetooth' in navigator)) {
      this.state.status = 'disconnected';
      throw new Error('Web Bluetooth not available. Use Chrome/Edge on desktop, or install the Android app for native BLE.');
    }

    try {
      const nav = navigator as any;
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OBD' },
          { namePrefix: 'ELM' },
          { namePrefix: 'OBDII' },
          { namePrefix: 'V-LINK' },
          { namePrefix: 'Vgate' },
          { namePrefix: 'iCar' },
          { namePrefix: 'Veepeak' },
          { namePrefix: 'LELink' },
          { namePrefix: 'BAFX' },
          { namePrefix: 'Konnwei' },
          { namePrefix: 'Carista' },
          { namePrefix: 'BlueDriver' },
        ],
        optionalServices,
      });

      if (device) {
        adapters.push({
          id: device.id,
          name: device.name || 'Bluetooth OBD Adapter',
          type: 'bluetooth',
          address: device.id,
          paired: !!device.gatt,
          chipset: 'ELM327',
        });
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        console.error('[OBD] Bluetooth scan error:', err);
        this.emit({ type: 'error', timestamp: Date.now(), message: `Bluetooth: ${err.message}` });
      }
    }

    this.state.status = 'disconnected';
    return adapters;
  }

  // ─── USB / Serial Scanning (Real Web Serial API) ──────────────────────

  async scanUSB(): Promise<OBDAdapter[]> {
    this.state.status = 'scanning';
    this.emit({ type: 'data', timestamp: Date.now(), message: 'Scanning for USB OBD adapters...' });
    const adapters: OBDAdapter[] = [];

    if (!('serial' in navigator)) {
      this.state.status = 'disconnected';
      throw new Error('Web Serial not available. Use Chrome/Edge on desktop.');
    }

    try {
      const nav = navigator as any;

      // Also check previously granted ports
      const existingPorts: SerialPort[] = await nav.serial.getPorts();
      for (const ep of existingPorts) {
        const info = ep.getInfo();
        adapters.push({
          id: `usb-${info.usbVendorId}-${info.usbProductId}`,
          name: this.getUSBAdapterName(info.usbVendorId),
          type: 'usb',
          address: `USB:${info.usbVendorId?.toString(16)}:${info.usbProductId?.toString(16)}`,
          chipset: 'ELM327',
          paired: true,
        });
      }

      // Prompt user to select a new port
      const port = await nav.serial.requestPort({
        filters: [
          { usbVendorId: 0x0403 },  // FTDI (most ELM327 clones)
          { usbVendorId: 0x067B },  // Prolific PL2303
          { usbVendorId: 0x10C4 },  // Silicon Labs CP210x
          { usbVendorId: 0x1A86 },  // QinHeng CH340/CH341
          { usbVendorId: 0x04D8 },  // Microchip (OBDLink)
          { usbVendorId: 0x2341 },  // Arduino (some DIY adapters)
          { usbVendorId: 0x1EAF },  // Leaflabs
        ],
      });

      if (port) {
        const info = port.getInfo();
        const existingIndex = adapters.findIndex(a =>
          a.address === `USB:${info.usbVendorId?.toString(16)}:${info.usbProductId?.toString(16)}`
        );
        if (existingIndex === -1) {
          adapters.push({
            id: `usb-${info.usbVendorId}-${info.usbProductId}-new`,
            name: this.getUSBAdapterName(info.usbVendorId),
            type: 'usb',
            address: `USB:${info.usbVendorId?.toString(16)}:${info.usbProductId?.toString(16)}`,
            chipset: 'ELM327',
          });
        }
        this.port = port;
      }
    } catch (err: any) {
      if (err.name !== 'NotFoundError') {
        console.error('[OBD] USB scan error:', err);
        this.emit({ type: 'error', timestamp: Date.now(), message: `USB: ${err.message}` });
      }
    }

    this.state.status = 'disconnected';
    return adapters;
  }

  private getUSBAdapterName(vendorId?: number): string {
    const names: Record<number, string> = {
      0x0403: 'FTDI USB OBD Adapter',
      0x067B: 'Prolific USB OBD Adapter',
      0x10C4: 'Silicon Labs USB OBD Adapter',
      0x1A86: 'CH340 USB OBD Adapter',
      0x04D8: 'OBDLink USB Adapter',
      0x2341: 'Arduino OBD Adapter',
    };
    return vendorId ? (names[vendorId] || `USB OBD (VID:${vendorId.toString(16)})`) : 'USB OBD Adapter';
  }

  // ─── WiFi Scanning (TCP/WebSocket probe) ──────────────────────────────

  async scanWiFi(): Promise<OBDAdapter[]> {
    this.state.status = 'scanning';
    this.emit({ type: 'data', timestamp: Date.now(), message: 'Scanning for WiFi OBD adapters...' });

    // Common WiFi OBD adapter addresses
    const targets = [
      { ip: '192.168.0.10', port: 35000, name: 'WiFi OBD (ELM327)' },
      { ip: '192.168.0.10', port: 23, name: 'WiFi OBD (Telnet)' },
      { ip: '192.168.1.10', port: 35000, name: 'WiFi OBD (Subnet 1)' },
      { ip: '192.168.4.1', port: 35000, name: 'WiFi OBD (AP Mode)' },
      { ip: '10.0.0.1', port: 35000, name: 'WiFi OBD (10.x)' },
      { ip: '192.168.2.10', port: 35000, name: 'WiFi OBD (Subnet 2)' },
    ];

    const adapters: OBDAdapter[] = [];

    const probes = targets.map(async (target) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);

        // Try HTTP probe first (some adapters have a web interface)
        try {
          await fetch(`http://${target.ip}:${target.port}`, {
            signal: controller.signal,
            mode: 'no-cors',
          });
          clearTimeout(timeout);
          return target;
        } catch {
          clearTimeout(timeout);
        }

        // Try WebSocket
        return await new Promise<typeof target | null>((resolve) => {
          const ws = new WebSocket(`ws://${target.ip}:${target.port}`);
          const timer = setTimeout(() => { try { ws.close(); } catch {} resolve(null); }, 2000);
          ws.onopen = () => { clearTimeout(timer); ws.close(); resolve(target); };
          ws.onerror = () => { clearTimeout(timer); resolve(null); };
        });
      } catch {
        return null;
      }
    });

    const results = await Promise.allSettled(probes);
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        const t = r.value;
        adapters.push({
          id: `wifi-${t.ip}-${t.port}`,
          name: t.name,
          type: 'wifi',
          address: `${t.ip}:${t.port}`,
          chipset: 'ELM327',
        });
      }
    }

    this.state.status = 'disconnected';
    return adapters;
  }

  // ─── Scan All ─────────────────────────────────────────────────────────

  async scanAll(): Promise<OBDAdapter[]> {
    this.state.status = 'scanning';
    const results: OBDAdapter[] = [];

    const [bt, usb, wifi] = await Promise.allSettled([
      this.scanBluetooth().catch(() => [] as OBDAdapter[]),
      this.scanUSB().catch(() => [] as OBDAdapter[]),
      this.scanWiFi().catch(() => [] as OBDAdapter[]),
    ]);

    if (bt.status === 'fulfilled') results.push(...bt.value);
    if (usb.status === 'fulfilled') results.push(...usb.value);
    if (wifi.status === 'fulfilled') results.push(...wifi.value);

    this.state.status = 'disconnected';
    return results;
  }

  // ─── Connect ──────────────────────────────────────────────────────────

  async connect(adapter: OBDAdapter): Promise<boolean> {
    this.state.status = 'connecting';
    this.state.adapter = adapter;
    this.state.error = null;

    this.initSteps = [];
    this.emitInitSteps();

    try {
      let transportOk = false;

      if (adapter.type === 'usb') {
        transportOk = await this.openSerialTransport();
      } else if (adapter.type === 'bluetooth') {
        transportOk = await this.openBluetoothTransport(adapter);
      } else if (adapter.type === 'wifi') {
        transportOk = await this.openWiFiTransport(adapter);
      }

      if (!transportOk) {
        throw new Error('Failed to open transport layer');
      }

      this.connected = true;
      await this.initializeAdapter();

      this.state.status = 'connected';
      this.emit({ type: 'connected', timestamp: Date.now(), message: `Connected to ${adapter.name} via ${adapter.type}` });
      return true;
    } catch (err: any) {
      this.connected = false;
      this.state.status = 'error';
      this.state.error = err.message || 'Connection failed';
      this.emit({ type: 'error', timestamp: Date.now(), message: err.message });
      return false;
    }
  }

  // ─── Serial Transport (USB) ──────────────────────────────────────────

  private async openSerialTransport(): Promise<boolean> {
    if (!this.port) throw new Error('No serial port. Run USB scan first.');

    this.addInitStep('Opening serial port...');

    // Try baud rates until one works
    for (const baud of BAUD_RATES) {
      try {
        await this.port.open({ baudRate: baud, dataBits: 8, stopBits: 1, parity: 'none', bufferSize: 4096 });
        this.reader = this.port.readable!.getReader();
        this.writer = this.port.writable!.getWriter();

        // Start continuous read loop
        this.startSerialReadLoop();

        // Test with ATI command
        const testResponse = await this.sendRaw('ATI\r', 3000);
        if (testResponse.includes('ELM') || testResponse.includes('STN') || testResponse.includes('OBD')) {
          this.updateInitStep(`Serial port opened at ${baud} baud`);
          return true;
        }

        // Wrong baud rate, close and try next
        await this.closeTransport();
      } catch {
        try { await this.closeTransport(); } catch {}
      }
    }

    throw new Error('Could not communicate with adapter at any baud rate');
  }

  private startSerialReadLoop() {
    if (this.readLoopRunning || !this.reader) return;
    this.readLoopRunning = true;

    const loop = async () => {
      try {
        while (this.readLoopRunning && this.reader) {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) {
            const text = new TextDecoder().decode(value);
            this.readBuffer += text;

            // Resolve any waiting command
            if (this.readBuffer.includes('>') && this.readResolve) {
              this.readResolve(this.readBuffer);
              this.readResolve = null;
            }
          }
        }
      } catch (err) {
        if (this.readLoopRunning) {
          console.error('[OBD] Serial read loop error:', err);
          this.readLoopRunning = false;
        }
      }
    };

    loop();
  }

  // ─── Bluetooth Transport (BLE GATT) ──────────────────────────────────

  private async openBluetoothTransport(adapter: OBDAdapter): Promise<boolean> {
    this.addInitStep('Connecting via Bluetooth...');

    if (await isCapacitorNativeHost()) {
      return this.openNativeBluetoothTransport(adapter);
    }

    if (!('bluetooth' in navigator)) throw new Error('Web Bluetooth not supported');

    const nav = navigator as any;
    let device: any = null;

    // Try getDevices() first (previously paired)
    try {
      const devices = await nav.bluetooth.getDevices();
      device = devices.find((d: any) => d.id === adapter.id);
    } catch {}

    // If not found, request again
    if (!device) {
      device = await nav.bluetooth.requestDevice({
        filters: [{ name: adapter.name }],
        optionalServices: BLE_SERVICES,
      });
    }

    if (!device?.gatt) throw new Error('Bluetooth device has no GATT server');

    const server = await device.gatt.connect();

    // Try each known service UUID
    let writeChar: any = null;
    let notifyChar: any = null;

    for (const svcUUID of BLE_SERVICES) {
      try {
        const service = await server.getPrimaryService(svcUUID);

        for (const wUUID of BLE_WRITE_CHARS) {
          try { writeChar = await service.getCharacteristic(wUUID); break; } catch {}
        }
        for (const nUUID of BLE_NOTIFY_CHARS) {
          try { notifyChar = await service.getCharacteristic(nUUID); break; } catch {}
        }

        if (writeChar && notifyChar) break;
      } catch {}
    }

    if (!writeChar || !notifyChar) {
      throw new Error('Could not find OBD GATT characteristics. Adapter may not be BLE-compatible.');
    }

    await notifyChar.startNotifications();
    notifyChar.addEventListener('characteristicvaluechanged', (event: any) => {
      const text = new TextDecoder().decode(event.target.value);
      this.readBuffer += text;

      if (this.readBuffer.includes('>') && this.readResolve) {
        this.readResolve(this.readBuffer);
        this.readResolve = null;
      }
    });

    this.btWriteChar = writeChar;
    this.updateInitStep('Bluetooth connected');
    return true;
  }

  private async openNativeBluetoothTransport(adapter: OBDAdapter): Promise<boolean> {
    await ensureNativeBleInitialized();
    const { BleClient } = await import('@capacitor-community/bluetooth-le');
    const deviceId = adapter.id;

    await BleClient.connect(deviceId, () => {
      this.connected = false;
      this.emit({ type: 'disconnected', timestamp: Date.now(), message: 'Bluetooth device disconnected' });
    });

    const services = await BleClient.getServices(deviceId);
    const picked = this.pickObdBleCharacteristics(services as unknown as NativeBleServiceShape[]);
    if (!picked) {
      try {
        await BleClient.disconnect(deviceId);
      } catch {}
      throw new Error('Could not find OBD GATT characteristics. Adapter may not be BLE-compatible.');
    }

    await BleClient.startNotifications(deviceId, picked.service, picked.notify, (value: DataView) => {
      const text = new TextDecoder().decode(value);
      this.readBuffer += text;
      if (this.readBuffer.includes('>') && this.readResolve) {
        this.readResolve(this.readBuffer);
        this.readResolve = null;
      }
    });

    this.nativeBle = {
      deviceId,
      service: picked.service,
      write: picked.write,
      notify: picked.notify,
    };
    this.btWriteChar = null;
    this.updateInitStep('Bluetooth connected (native)');
    return true;
  }

  private pickObdBleCharacteristics(services: NativeBleServiceShape[]): {
    service: string;
    write: string;
    notify: string;
  } | null {
    const nu = (u: string) => u.toLowerCase();

    const writeSet = new Set(BLE_WRITE_CHARS.map((u) => nu(u)));
    const notifySet = new Set(BLE_NOTIFY_CHARS.map((u) => nu(u)));

    for (const svc of services) {
      const chars = svc.characteristics;
      if (!chars?.length) continue;
      let write: string | null = null;
      let notify: string | null = null;
      for (const c of chars) {
        const cu = nu(c.uuid);
        const p = c.properties || {};
        if (writeSet.has(cu)) write = c.uuid;
        if (notifySet.has(cu) && (p.notify || p.indicate)) notify = c.uuid;
      }
      if (write && notify) return { service: svc.uuid, write, notify };
    }

    for (const svc of services) {
      const chars = svc.characteristics;
      if (!chars?.length) continue;
      let write: string | null = null;
      let notify: string | null = null;
      for (const c of chars) {
        const p = c.properties || {};
        if ((p.write || p.writeWithoutResponse) && !write) write = c.uuid;
        if (p.notify && !notify) notify = c.uuid;
      }
      if (write && notify) return { service: svc.uuid, write, notify };
    }

    return null;
  }

  // ─── WiFi Transport (WebSocket / TCP) ─────────────────────────────────

  private async openWiFiTransport(adapter: OBDAdapter): Promise<boolean> {
    this.addInitStep('Connecting via WiFi...');

    const ws = new WebSocket(`ws://${adapter.address}`);

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { ws.close(); reject(new Error('WiFi connection timeout')); }, 5000);
      ws.onopen = () => { clearTimeout(timeout); resolve(); };
      ws.onerror = () => { clearTimeout(timeout); reject(new Error('WiFi connection failed')); };
    });

    ws.onmessage = (event) => {
      const data = typeof event.data === 'string' ? event.data : new TextDecoder().decode(event.data);
      this.readBuffer += data;

      if (this.readBuffer.includes('>') && this.readResolve) {
        this.readResolve(this.readBuffer);
        this.readResolve = null;
      }
    };

    ws.onclose = () => {
      if (this.connected) {
        this.connected = false;
        this.state.status = 'error';
        this.state.error = 'WiFi connection lost';
        this.emit({ type: 'disconnected', timestamp: Date.now(), message: 'WiFi connection lost' });
      }
    };

    this.wifiSocket = ws;
    this.updateInitStep('WiFi connected');
    return true;
  }

  // ─── Init Step Tracking ───────────────────────────────────────────────

  private addInitStep(step: string) {
    this.initSteps.push({ step, status: 'running' });
    this.emitInitSteps();
  }

  private updateInitStep(message: string) {
    const last = this.initSteps[this.initSteps.length - 1];
    if (last) { last.status = 'done'; last.message = message; }
    this.emitInitSteps();
  }

  private failInitStep(message: string) {
    const last = this.initSteps[this.initSteps.length - 1];
    if (last) { last.status = 'error'; last.message = message; }
    this.emitInitSteps();
  }

  // ─── Send Raw Bytes ───────────────────────────────────────────────────

  private async sendRaw(data: string, timeout: number = 5000): Promise<string> {
    this.readBuffer = '';
    const encoded = new TextEncoder().encode(data);

    if (this.writer) {
      await this.writer.write(encoded);
    } else if (this.nativeBle) {
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      const m = this.nativeBle;
      for (let i = 0; i < encoded.length; i += 20) {
        const chunk = encoded.slice(i, i + 20);
        const view = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength);
        try {
          await BleClient.writeWithoutResponse(m.deviceId, m.service, m.write, view);
        } catch {
          await BleClient.write(m.deviceId, m.service, m.write, view);
        }
      }
    } else if (this.btWriteChar) {
      // BLE has MTU limits, chunk at 20 bytes
      for (let i = 0; i < encoded.length; i += 20) {
        const chunk = encoded.slice(i, i + 20);
        await this.btWriteChar.writeValue(chunk);
      }
    } else if (this.wifiSocket && this.wifiSocket.readyState === WebSocket.OPEN) {
      this.wifiSocket.send(data);
    } else {
      throw new Error('No transport available');
    }

    // Wait for '>' prompt
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.readResolve = null;
        // Return what we have even on timeout
        if (this.readBuffer.length > 0) {
          resolve(this.readBuffer);
        } else {
          reject(new Error(`Timeout waiting for response`));
        }
      }, timeout);

      this.readResolve = (buf: string) => {
        clearTimeout(timer);
        resolve(buf);
      };

      // Check if we already have a complete response
      if (this.readBuffer.includes('>')) {
        clearTimeout(timer);
        this.readResolve = null;
        resolve(this.readBuffer);
      }
    });
  }

  // ─── Send OBD Command (public, with locking) ─────────────────────────

  async sendCommand(command: string, timeout: number = 5000): Promise<string> {
    if (!this.connected) throw new Error('Not connected to adapter');

    // Simple lock to prevent interleaved commands
    while (this.commandLock) {
      await new Promise(r => setTimeout(r, 10));
    }
    this.commandLock = true;

    try {
      const start = Date.now();
      const raw = await this.sendRaw(command + '\r', timeout);
      this.state.latency = Date.now() - start;
      this.state.lastActivity = Date.now();

      const parsed = parseELMResponse(raw);

      if (isELMError(parsed) && !command.startsWith('AT')) {
        throw new Error(`ECU Error: ${parsed}`);
      }

      this.emit({ type: 'data', timestamp: Date.now(), data: { command, response: parsed, latency: this.state.latency } });
      return parsed;
    } finally {
      this.commandLock = false;
    }
  }

  /** Drain unsolicited RX bytes (use between commands; waits if a send is in progress). */
  async readData(): Promise<string> {
    if (!this.connected) throw new Error('Not connected to adapter');
    while (this.commandLock) {
      await new Promise(r => setTimeout(r, 10));
    }
    const out = this.readBuffer;
    this.readBuffer = '';
    return out;
  }

  // ─── Real ECU Initialization ──────────────────────────────────────────

  private async initializeAdapter(): Promise<void> {
    // Step 1: Reset
    this.addInitStep('Resetting adapter (ATZ)');
    try {
      const resetResp = await this.sendCommand('ATZ', 10000);
      const chipMatch = resetResp.match(/(ELM\d+|STN\d+|OBDLink\s*\w+)/i);
      this.updateInitStep(chipMatch ? chipMatch[1] : 'Reset OK');
      if (chipMatch && this.state.adapter) {
        const chip = chipMatch[1].toUpperCase();
        if (chip.includes('STN')) this.state.adapter.chipset = chip.includes('2120') ? 'STN2120' : 'STN1110';
        else if (chip.includes('OBDLINK')) this.state.adapter.chipset = 'OBDLink';
        else this.state.adapter.chipset = 'ELM327';
        this.state.adapter.firmwareVersion = chipMatch[1];
      }
    } catch (e: any) {
      this.failInitStep(e.message);
    }

    // Step 2: Configure adapter for clean communication
    this.addInitStep('Configuring adapter');
    const configCmds = ['ATE0', 'ATL0', 'ATS0', 'ATH1', 'ATAT1', 'ATST32'];
    for (const cmd of configCmds) {
      try { await this.sendCommand(cmd, 2000); } catch {}
    }
    this.updateInitStep('Echo off, headers on, adaptive timing');

    // Step 3: Auto-detect protocol
    this.addInitStep('Auto-detecting vehicle protocol (ATSP0)');
    try {
      await this.sendCommand('ATSP0', 3000);
      // Force protocol detection by sending a PID request
      await this.sendCommand('0100', 15000);
      const protResp = await this.sendCommand('ATDPN', 2000);
      const protocol = parseProtocolNumber(protResp);
      if (protocol) {
        this.state.protocol = protocol;
        this.emit({ type: 'protocol_detected', timestamp: Date.now(), data: protocol });
        this.updateInitStep(`${protocol}`);
      } else {
        this.updateInitStep('Protocol detected');
      }
    } catch (e: any) {
      this.failInitStep(`Protocol detection failed: ${e.message}`);
    }

    // Step 4: Read battery voltage
    this.addInitStep('Reading battery voltage (ATRV)');
    try {
      const voltResp = await this.sendCommand('ATRV', 2000);
      const voltage = parseVoltage(voltResp);
      if (voltage) {
        this.state.voltage = voltage.toFixed(1) + 'V';
        this.updateInitStep(this.state.voltage);
      } else {
        this.updateInitStep(voltResp);
      }
    } catch (e: any) {
      this.failInitStep(e.message);
    }

    // Step 5: Enumerate all supported PIDs from ECU
    this.addInitStep('Enumerating ECU supported PIDs');
    try {
      const allPids: string[] = [];
      for (const pidCmd of PID_SUPPORT_COMMANDS) {
        try {
          const resp = await this.sendCommand(pidCmd.command, 5000);
          const supported = parseSupportedPIDs(resp, pidCmd.range[0]);
          allPids.push(...supported);
          // If the last bit is set, there are more PIDs
          if (!supported.includes(pidCmd.range[1].toString(16).padStart(2, '0').toUpperCase())) {
            break;
          }
        } catch { break; }
      }
      this.state.supportedPIDs = allPids;
      this.updateInitStep(`${allPids.length} PIDs supported`);
    } catch (e: any) {
      this.failInitStep(e.message);
    }

    // Step 6: Read VIN from ECU (Mode 09, PID 02)
    this.addInitStep('Reading VIN from ECU (0902)');
    try {
      const vinResp = await this.sendCommand('0902', 10000);
      const vin = parseVIN(vinResp);
      if (vin) {
        this.state.vin = vin;
        this.emit({ type: 'vin_read', timestamp: Date.now(), data: vin });
        this.updateInitStep(vin);
      } else {
        this.updateInitStep('VIN not available');
      }
    } catch {
      this.failInitStep('VIN not supported by this ECU');
    }

    // Step 7: Detect ECU addresses (turn headers on temporarily)
    this.addInitStep('Detecting ECU addresses');
    try {
      await this.sendCommand('ATH1', 1000);
      const ecuResp = await this.sendCommand('0100', 5000);
      const lines = ecuResp.split('\n').filter(l => l.trim().length > 0);
      const addrs: string[] = [];
      for (const line of lines) {
        const match = line.match(/^([0-9A-F]{3})/i);
        if (match && !addrs.includes(match[1])) addrs.push(match[1]);
      }
      this.state.ecuAddresses = addrs.length > 0 ? addrs : ['7E8'];
      this.updateInitStep(addrs.length > 0 ? addrs.join(', ') : 'Default ECU');
    } catch {
      this.state.ecuAddresses = ['7E8'];
      this.updateInitStep('Default ECU (7E8)');
    }
  }

  // ─── Read Real PID Value from ECU ─────────────────────────────────────

  async readPID(mode: string, pid: string): Promise<number[]> {
    const response = await this.sendCommand(`${mode}${pid}`);
    const cleaned = response.replace(/[\s\r\n]/g, '');

    // Multi-ECU: may have multiple responses, take first valid
    const lines = response.split('\n').filter(l => l.trim().length > 0);
    for (const line of lines) {
      const hex = line.replace(/[\s]/g, '');
      // Find the mode+40 response marker (e.g. "41" for mode "01")
      const modeResp = (parseInt(mode, 16) + 0x40).toString(16).toUpperCase().padStart(2, '0');
      const markerIdx = hex.toUpperCase().indexOf(modeResp + pid.toUpperCase());
      if (markerIdx !== -1) {
        const dataHex = hex.substring(markerIdx + modeResp.length + pid.length);
        const bytes: number[] = [];
        for (let i = 0; i < dataHex.length; i += 2) {
          const val = parseInt(dataHex.substring(i, i + 2), 16);
          if (!isNaN(val)) bytes.push(val);
        }
        return bytes;
      }
    }

    // Fallback: skip first 4 chars
    const dataHex = cleaned.substring(4);
    const bytes: number[] = [];
    for (let i = 0; i < dataHex.length; i += 2) {
      const val = parseInt(dataHex.substring(i, i + 2), 16);
      if (!isNaN(val)) bytes.push(val);
    }
    return bytes;
  }

  // ─── Read Real PID with Definition ────────────────────────────────────

  async readPIDValue(pidDef: OBDPIDDefinition): Promise<ECULiveReading | null> {
    try {
      const rawBytes = await this.readPID(pidDef.mode, pidDef.pid);
      if (rawBytes.length < pidDef.bytes) return null;
      const value = pidDef.formula(rawBytes);
      return { pid: pidDef, rawBytes, value, timestamp: Date.now() };
    } catch {
      return null;
    }
  }

  // ─── Batch Read Multiple PIDs ─────────────────────────────────────────

  async readMultiplePIDs(pids: OBDPIDDefinition[]): Promise<ECULiveReading[]> {
    const readings: ECULiveReading[] = [];
    for (const pid of pids) {
      const reading = await this.readPIDValue(pid);
      if (reading) readings.push(reading);
    }
    return readings;
  }

  // ─── Get PIDs the ECU Actually Supports ──────────────────────────────

  getSupportedPIDDefinitions(): OBDPIDDefinition[] {
    return STANDARD_PIDS.filter(p =>
      this.state.supportedPIDs.includes(p.pid.toUpperCase())
    );
  }

  // ─── Read Real DTCs from ECU ──────────────────────────────────────────

  async readDTCs(): Promise<string[]> {
    const response = await this.sendCommand('03', 10000);
    return parseDTCCodes(response);
  }

  async readPendingDTCs(): Promise<string[]> {
    const response = await this.sendCommand('07', 10000);
    return parseDTCCodes(response);
  }

  async readPermanentDTCs(): Promise<string[]> {
    try {
      const response = await this.sendCommand('0A', 10000);
      return parseDTCCodes(response);
    } catch {
      return [];
    }
  }

  async clearDTCs(): Promise<boolean> {
    try {
      await this.sendCommand('04', 10000);
      return true;
    } catch {
      return false;
    }
  }

  // ─── Read Freeze Frame Data ──────────────────────────────────────────

  async readFreezeFrame(pid: string): Promise<number[]> {
    return this.readPID('02', pid);
  }

  // ─── Read I/M Readiness Monitors ─────────────────────────────────────

  async readIMReadiness(): Promise<{ name: string; available: boolean; complete: boolean }[]> {
    try {
      const bytes = await this.readPID('01', '01');
      if (bytes.length < 4) return [];

      const milOn = !!(bytes[0] & 0x80);
      const dtcCount = bytes[0] & 0x7F;

      // bytes[1] = supported/complete for spark ignition
      const monitors = [
        { name: 'Misfire', bit: 0 },
        { name: 'Fuel System', bit: 1 },
        { name: 'Components', bit: 2 },
        { name: 'Catalyst', bit: 0 },
        { name: 'Heated Catalyst', bit: 1 },
        { name: 'Evaporative System', bit: 2 },
        { name: 'Secondary Air', bit: 3 },
        { name: 'A/C Refrigerant', bit: 4 },
        { name: 'Oxygen Sensor', bit: 5 },
        { name: 'Oxygen Sensor Heater', bit: 6 },
        { name: 'EGR System', bit: 7 },
      ];

      return monitors.map((m, i) => {
        const byteIdx = i < 3 ? 1 : 2;
        const compByteIdx = i < 3 ? 1 : 3;
        const bitOffset = i < 3 ? m.bit : m.bit;
        return {
          name: m.name,
          available: !!(bytes[byteIdx] & (1 << bitOffset)),
          complete: !(bytes[compByteIdx] & (1 << (bitOffset + (i < 3 ? 4 : 0)))),
        };
      });
    } catch {
      return [];
    }
  }

  // ─── Disconnect & Cleanup ─────────────────────────────────────────────

  async disconnect(): Promise<void> {
    this.connected = false;
    this.readLoopRunning = false;
    this.readResolve = null;

    await this.closeTransport();

    this.state = {
      status: 'disconnected',
      adapter: null,
      protocol: null,
      voltage: null,
      vin: null,
      ecuAddresses: [],
      supportedPIDs: [],
      error: null,
      latency: 0,
      lastActivity: 0,
    };

    this.initSteps = [];
    this.emitInitSteps();
    this.emit({ type: 'disconnected', timestamp: Date.now(), message: 'Adapter disconnected' });
  }

  private async closeTransport(): Promise<void> {
    if (this.nativeBle) {
      try {
        const { BleClient } = await import('@capacitor-community/bluetooth-le');
        const m = this.nativeBle;
        await BleClient.stopNotifications(m.deviceId, m.service, m.notify);
        await BleClient.disconnect(m.deviceId);
      } catch {}
      this.nativeBle = null;
    }
    try { if (this.reader) { await this.reader.cancel(); this.reader.releaseLock(); } } catch {}
    try { if (this.writer) { await this.writer.close(); } } catch {}
    try { if (this.port?.readable || this.port?.writable) { await this.port.close(); } } catch {}
    try { if (this.wifiSocket) { this.wifiSocket.close(); } } catch {}
    this.reader = null;
    this.writer = null;
    this.port = null;
    this.btWriteChar = null;
    this.wifiSocket = null;
  }
}

// ─── Singleton Instance ─────────────────────────────────────────────────────

let instance: OBDConnectionManager | null = null;

export function getConnectionManager(): OBDConnectionManager {
  if (!instance) {
    instance = new OBDConnectionManager();
  }
  return instance;
}
