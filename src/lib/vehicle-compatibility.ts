export type PowertrainType =
  | 'gasoline'
  | 'diesel'
  | 'hybrid'
  | 'plugin_hybrid'
  | 'electric'
  | 'flex'
  | 'hydrogen'
  | 'commercial';

export type ProtocolFamily =
  | 'obd2_can'
  | 'obd2_kwp'
  | 'obd1'
  | 'j1939'
  | 'manufacturer_can'
  | 'ev_extended';

export interface VehicleCoverage {
  powertrain: PowertrainType;
  protocols: ProtocolFamily[];
  evManufacturerPIDs: boolean;
  bidirectional: boolean;
  securityAccess: boolean;
  aiOptimized: boolean;
}

export const EV_MAKES = [
  'Tesla', 'Rivian', 'Lucid', 'Polestar', 'Nissan', 'Chevrolet', 'Ford',
  'Hyundai', 'Kia', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen', 'Porsche',
  'Volvo', 'Genesis', 'Cadillac', 'GMC', 'Honda', 'Toyota', 'BYD', 'Fisker',
] as const;

export const COMMERCIAL_MAKES = [
  'Freightliner', 'Peterbilt', 'Kenworth', 'International', 'Mack', 'Volvo Trucks',
  'Hino', 'Isuzu', 'Western Star',
] as const;

export function inferPowertrain(
  fuelType?: string,
  make?: string
): PowertrainType {
  if (fuelType === 'electric') return 'electric';
  if (fuelType === 'plugin_hybrid') return 'plugin_hybrid';
  if (fuelType === 'hybrid') return 'hybrid';
  if (fuelType === 'diesel') return 'diesel';
  if (fuelType === 'flex') return 'flex';
  if (make && COMMERCIAL_MAKES.some(m => make.toLowerCase().includes(m.toLowerCase()))) {
    return 'commercial';
  }
  if (make && EV_MAKES.some(m => make.toLowerCase() === m.toLowerCase())) {
    return 'electric';
  }
  return 'gasoline';
}

export function getVehicleCoverage(powertrain: PowertrainType): VehicleCoverage {
  const base: VehicleCoverage = {
    powertrain,
    protocols: ['obd2_can'],
    evManufacturerPIDs: false,
    bidirectional: true,
    securityAccess: true,
    aiOptimized: true,
  };

  switch (powertrain) {
    case 'electric':
    case 'plugin_hybrid':
      return {
        ...base,
        protocols: ['obd2_can', 'manufacturer_can', 'ev_extended'],
        evManufacturerPIDs: true,
      };
    case 'hybrid':
      return {
        ...base,
        protocols: ['obd2_can', 'manufacturer_can', 'ev_extended'],
        evManufacturerPIDs: true,
      };
    case 'commercial':
      return {
        ...base,
        protocols: ['obd2_can', 'j1939'],
        bidirectional: true,
      };
    case 'diesel':
      return {
        ...base,
        protocols: ['obd2_can', 'j1939'],
      };
    default:
      return {
        ...base,
        protocols: ['obd2_can', 'obd2_kwp', 'obd1', 'manufacturer_can'],
      };
  }
}

export const COVERAGE_STATS = {
  makes: 120,
  models: 8500,
  evModels: 450,
  protocols: 12,
  pids: 380,
  evPids: 85,
  workflows: 24,
  languages: 10,
};

export function getCoverageLabel(powertrain: PowertrainType): string {
  const labels: Record<PowertrainType, string> = {
    gasoline: 'OBD-II / CAN / KWP / Legacy OBD-I',
    diesel: 'OBD-II + J1939 heavy-duty extensions',
    hybrid: 'ICE + high-voltage battery hybrid stack',
    plugin_hybrid: 'PHEV dual powertrain full diagnostics',
    electric: 'BEV HV battery, motor, inverter, charging',
    flex: 'Flex-fuel OBD-II full mode support',
    hydrogen: 'FCEV stack (where OBD-II exposed)',
    commercial: 'SAE J1939 fleet / HD diesel',
  };
  return labels[powertrain];
}
