export interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin?: string;
  engine?: string;
  transmission?: string;
  mileage?: number;
  fuelType?: string;
  nickname?: string;
}

export type DTCSeverity = 'critical' | 'warning' | 'info' | 'pending';
export type DTCCategory = 'powertrain' | 'body' | 'chassis' | 'network';

export interface DTCCode {
  code: string;
  description: string;
  category: DTCCategory;
  severity: DTCSeverity;
  possibleCauses: string[];
  symptoms: string[];
  solutions: string[];
  estimatedCost?: { min: number; max: number };
  system: string;
}

/** Parsed trouble code from raw OBD-II mode 03 / 07 / 0A responses */
export interface DTC {
  code: string;
  description: string;
  status: 'stored' | 'pending' | 'permanent';
  timestamp: string;
}

export interface DiagnosticSession {
  id: string;
  vehicleId: string;
  timestamp: Date;
  codes: DTCCode[];
  healthScore: number;
  systemStatuses: SystemStatus[];
}

export interface SystemStatus {
  name: string;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
  value?: string;
  details?: string;
}

export interface SensorData {
  id: string;
  name: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  normalRange: { min: number; max: number };
  history: { time: number; value: number }[];
  category: string;
}

export interface MaintenanceItem {
  id: string;
  vehicleId: string;
  service: string;
  intervalMiles?: number;
  intervalMonths?: number;
  lastPerformed?: Date;
  lastMileage?: number;
  nextDue?: Date;
  nextMileage?: number;
  status: 'ok' | 'due-soon' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  estimatedCost?: { min: number; max: number };
}

export interface DiagnosticReport {
  id: string;
  vehicleId: string;
  vehicle: Vehicle;
  date: Date;
  healthScore: number;
  systems: SystemStatus[];
  codes: DTCCode[];
  maintenance: MaintenanceItem[];
  recommendations: string[];
}

export interface VehicleMake {
  name: string;
  logo?: string;
  country: string;
  models: VehicleModel[];
}

export interface VehicleModel {
  name: string;
  years: number[];
  engines: string[];
  transmissions: string[];
}

// ─── OBD-II Connection Types ─────────────────────────────────────────────────

export type ConnectionType = 'bluetooth' | 'wifi' | 'usb';
export type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error';

export type OBDProtocol =
  | 'AUTO'
  | 'SAE_J1850_PWM'
  | 'SAE_J1850_VPW'
  | 'ISO_9141_2'
  | 'ISO_14230_4_KWP_5BAUD'
  | 'ISO_14230_4_KWP_FAST'
  | 'ISO_15765_4_CAN_11BIT_500K'
  | 'ISO_15765_4_CAN_29BIT_500K'
  | 'ISO_15765_4_CAN_11BIT_250K'
  | 'ISO_15765_4_CAN_29BIT_250K'
  | 'SAE_J1939_CAN';

export interface OBDAdapter {
  id: string;
  name: string;
  type: ConnectionType;
  address: string;
  rssi?: number;
  paired?: boolean;
  lastConnected?: string;
  firmwareVersion?: string;
  chipset?: 'ELM327' | 'STN1110' | 'STN2120' | 'OBDLink';
}

export interface OBDConnectionState {
  status: ConnectionStatus;
  adapter: OBDAdapter | null;
  protocol: OBDProtocol | null;
  voltage: string | null;
  vin: string | null;
  ecuAddresses: string[];
  supportedPIDs: string[];
  error: string | null;
  latency: number;
  lastActivity: number;
}

export interface OBDCommand {
  command: string;
  description: string;
  expectedBytes?: number;
  parser?: (data: string) => unknown;
}

export interface OBDPIDDefinition {
  pid: string;
  /** OBD-II service mode as hex, e.g. "01" */
  mode: string;
  name: string;
  description: string;
  unit: string;
  /** Decode ECU payload bytes to a scalar value */
  formula: (bytes: number[]) => number;
  min: number;
  max: number;
  /** Expected ECU data byte count for this PID */
  bytes: number;
  category: string;
  manufacturer?: string;
  protocol?: string;
}

export interface ManufacturerProtocol {
  name: string;
  manufacturer: string;
  protocol: string;
  baudRate: number;
  initSequence: string[];
  customPIDs: Record<string, OBDPIDDefinition>;
  securityProcedures?: SecurityProcedure[];
  connector?: string;
}

export interface SecurityProcedure {
  name: string;
  steps: SecurityStep[];
  algorithm?: (seed: string) => string;
}

export interface SecurityStep {
  command: string;
  expectedResponse?: string;
  timeout?: number;
}

export interface EVData {
  batteryVoltage: number;
  batteryCurrent: number;
  stateOfCharge: number;
  batteryTemperature: number;
  motorRPM: number;
  chargingPower: number;
  chargingStatus: string;
}

export interface J1939Parameter {
  pgn: number;
  spn: number;
  name: string;
  unit: string;
  formula: (value: number) => number;
  min: number;
  max: number;
}

export interface OBDIProtocol {
  name: string;
  make: string;
  protocol: 'ALDL' | 'CCD' | 'SDS' | 'OBDI';
  connector: '12-pin' | '16-pin' | '3-pin' | '20-pin' | '38-pin' | '2x2';
  baudRate: number;
  commands: Record<string, string>;
}

export interface AdapterCapabilities {
  protocols: OBDProtocol[];
  maxBaudRate: number;
  canFiltering: boolean;
  batteryVoltage: boolean;
  adaptiveTiming: boolean;
  j1939Support: boolean;
  canMonitor: boolean;
}

export interface ConnectionEvent {
  type: 'connected' | 'disconnected' | 'error' | 'data' | 'protocol_detected' | 'vin_read';
  timestamp: number;
  data?: unknown;
  message?: string;
}
