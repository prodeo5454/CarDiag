import type { DTCCode } from '@/types';

// Repair Cost Estimation System
export interface RepairCost {
  parts: {
    name: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    oem: boolean;
    aftermarket: boolean;
    availability: 'in_stock' | 'ordered' | 'special_order';
  }[];
  labor: {
    task: string;
    hours: number;
    hourlyRate: number;
    totalPrice: number;
    difficulty: 'easy' | 'medium' | 'hard' | 'professional';
    certification: 'none' | 'basic' | 'advanced' | 'specialized';
  }[];
  additional: {
    name: string;
    price: number;
    description: string;
    optional: boolean;
  }[];
  totalCost: {
    parts: number;
    labor: number;
    additional: number;
    tax: number;
    total: number;
    currency: string;
  };
  timeEstimate: {
    minimum: number;
    maximum: number;
    average: number;
    unit: 'hours';
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'professional';
  warranty: {
    parts: number; // in months
    labor: number; // in months
    provider: string;
  };
  diy: {
    possible: boolean;
    difficulty: 'easy' | 'medium' | 'hard' | 'professional';
    tools: string[];
    savings: number;
    risks: string[];
  };
}

export interface CostEstimateParams {
  dtcCodes: string[];
  symptoms: string[];
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  mileage: number;
  location: string;
  laborRate?: number;
  oemParts?: boolean;
  diyOption?: boolean;
}

export class CostEstimator {
  private static readonly LABOR_RATES: Record<string, number> = {
    'independent': 85,
    'dealership': 125,
    'specialty': 150,
    'chain': 95
  };

  private static readonly PARTS_DATABASE: Record<string, any> = {
    // Engine Components
    'spark_plugs': {
      name: 'Spark Plugs',
      averagePrice: 8,
      quantity: 4,
      oemPrice: 12,
      aftermarketPrice: 6,
      difficulty: 'easy',
      laborHours: 0.5
    },
    'oxygen_sensor': {
      name: 'Oxygen Sensor',
      averagePrice: 65,
      quantity: 1,
      oemPrice: 95,
      aftermarketPrice: 45,
      difficulty: 'medium',
      laborHours: 1
    },
    'mass_airflow_sensor': {
      name: 'Mass Airflow Sensor',
      averagePrice: 120,
      quantity: 1,
      oemPrice: 180,
      aftermarketPrice: 85,
      difficulty: 'easy',
      laborHours: 0.5
    },
    'fuel_filter': {
      name: 'Fuel Filter',
      averagePrice: 15,
      quantity: 1,
      oemPrice: 25,
      aftermarketPrice: 12,
      difficulty: 'medium',
      laborHours: 1
    },
    'fuel_pump': {
      name: 'Fuel Pump',
      averagePrice: 250,
      quantity: 1,
      oemPrice: 350,
      aftermarketPrice: 180,
      difficulty: 'hard',
      laborHours: 3
    },
    'alternator': {
      name: 'Alternator',
      averagePrice: 350,
      quantity: 1,
      oemPrice: 450,
      aftermarketPrice: 280,
      difficulty: 'medium',
      laborHours: 2
    },
    'starter': {
      name: 'Starter Motor',
      averagePrice: 200,
      quantity: 1,
      oemPrice: 280,
      aftermarketPrice: 150,
      difficulty: 'medium',
      laborHours: 2
    },
    'battery': {
      name: 'Battery',
      averagePrice: 120,
      quantity: 1,
      oemPrice: 150,
      aftermarketPrice: 100,
      difficulty: 'easy',
      laborHours: 0.25
    },
    
    // Transmission Components
    'transmission_filter': {
      name: 'Transmission Filter',
      averagePrice: 25,
      quantity: 1,
      oemPrice: 35,
      aftermarketPrice: 20,
      difficulty: 'medium',
      laborHours: 1.5
    },
    'transmission_fluid': {
      name: 'Transmission Fluid',
      averagePrice: 8,
      quantity: 6,
      oemPrice: 12,
      aftermarketPrice: 6,
      difficulty: 'easy',
      laborHours: 1
    },
    
    // Brake Components
    'brake_pads': {
      name: 'Brake Pads',
      averagePrice: 45,
      quantity: 2,
      oemPrice: 65,
      aftermarketPrice: 35,
      difficulty: 'easy',
      laborHours: 1
    },
    'brake_rotors': {
      name: 'Brake Rotors',
      averagePrice: 60,
      quantity: 2,
      oemPrice: 85,
      aftermarketPrice: 45,
      difficulty: 'medium',
      laborHours: 1.5
    },
    'brake_calipers': {
      name: 'Brake Calipers',
      averagePrice: 85,
      quantity: 1,
      oemPrice: 120,
      aftermarketPrice: 65,
      difficulty: 'hard',
      laborHours: 2
    },
    
    // Suspension Components
    'shock_absorbers': {
      name: 'Shock Absorbers',
      averagePrice: 75,
      quantity: 4,
      oemPrice: 95,
      aftermarketPrice: 60,
      difficulty: 'medium',
      laborHours: 3
    },
    'struts': {
      name: 'Struts',
      averagePrice: 150,
      quantity: 2,
      oemPrice: 200,
      aftermarketPrice: 120,
      difficulty: 'hard',
      laborHours: 4
    },
    
    // Cooling System
    'radiator': {
      name: 'Radiator',
      averagePrice: 200,
      quantity: 1,
      oemPrice: 280,
      aftermarketPrice: 150,
      difficulty: 'medium',
      laborHours: 2.5
    },
    'water_pump': {
      name: 'Water Pump',
      averagePrice: 85,
      quantity: 1,
      oemPrice: 120,
      aftermarketPrice: 65,
      difficulty: 'medium',
      laborHours: 2
    },
    'thermostat': {
      name: 'Thermostat',
      averagePrice: 15,
      quantity: 1,
      oemPrice: 25,
      aftermarketPrice: 12,
      difficulty: 'easy',
      laborHours: 1
    },
    
    // Emissions
    'catalytic_converter': {
      name: 'Catalytic Converter',
      averagePrice: 800,
      quantity: 1,
      oemPrice: 1200,
      aftermarketPrice: 600,
      difficulty: 'hard',
      laborHours: 2
    },
    'evap_canister': {
      name: 'EVAP Canister',
      averagePrice: 85,
      quantity: 1,
      oemPrice: 120,
      aftermarketPrice: 65,
      difficulty: 'medium',
      laborHours: 1.5
    }
  };

  private static readonly DTC_TO_PARTS: Record<string, string[]> = {
    'P0300': ['spark_plugs', 'ignition_coils', 'fuel_filter'],
    'P0301': ['spark_plugs', 'ignition_coils'],
    'P0302': ['spark_plugs', 'ignition_coils'],
    'P0303': ['spark_plugs', 'ignition_coils'],
    'P0304': ['spark_plugs', 'ignition_coils'],
    'P0130': ['oxygen_sensor'],
    'P0131': ['oxygen_sensor'],
    'P0132': ['oxygen_sensor'],
    'P0133': ['oxygen_sensor'],
    'P0134': ['oxygen_sensor'],
    'P0135': ['oxygen_sensor'],
    'P0136': ['oxygen_sensor'],
    'P0137': ['oxygen_sensor'],
    'P0138': ['oxygen_sensor'],
    'P0139': ['oxygen_sensor'],
    'P0140': ['oxygen_sensor'],
    'P0101': ['mass_airflow_sensor', 'air_filter'],
    'P0102': ['mass_airflow_sensor'],
    'P0103': ['mass_airflow_sensor'],
    'P0171': ['oxygen_sensor', 'mass_airflow_sensor', 'fuel_filter'],
    'P0172': ['oxygen_sensor', 'mass_airflow_sensor'],
    'P0420': ['catalytic_converter', 'oxygen_sensor'],
    'P0440': ['evap_canister', 'gas_cap'],
    'P0441': ['evap_canister'],
    'P0442': ['evap_canister', 'gas_cap'],
    'P0446': ['evap_canister'],
    'P0455': ['evap_canister', 'gas_cap'],
    'P0401': ['egr_valve'],
    'P0403': ['egr_valve'],
    'P0404': ['egr_valve'],
    'P0405': ['egr_valve'],
    'P0406': ['egr_valve'],
    'P0480': ['cooling_fan'],
    'P0481': ['cooling_fan'],
    'P0113': ['intake_air_temperature_sensor'],
    'P0112': ['intake_air_temperature_sensor'],
    'P0118': ['coolant_temperature_sensor'],
    'P0117': ['coolant_temperature_sensor'],
    'P0121': ['throttle_position_sensor'],
    'P0122': ['throttle_position_sensor'],
    'P0123': ['throttle_position_sensor'],
    'P0505': ['idle_air_control_valve'],
    'P0506': ['idle_air_control_valve'],
    'P0507': ['idle_air_control_valve'],
    'P0562': ['alternator', 'battery'],
    'P0563': ['alternator', 'battery'],
    'P0601': ['ecm'],
    'P0602': ['ecm'],
    'P0603': ['ecm'],
    'P0604': ['ecm'],
    'P0605': ['ecm'],
    'P0606': ['ecm'],
    'P0607': ['ecm'],
    'P0650': ['ecm'],
    'P0700': ['transmission_control_module'],
    'P0705': ['transmission_range_sensor'],
    'P0706': ['transmission_range_sensor'],
    'P0707': ['transmission_range_sensor'],
    'P0708': ['transmission_range_sensor'],
    'P0715': ['transmission_speed_sensor'],
    'P0720': ['transmission_speed_sensor'],
    'P0730': ['transmission_fluid', 'transmission_filter'],
    'P0741': ['torque_converter'],
    'P0742': ['torque_converter'],
    'P0743': ['torque_converter'],
    'P0744': ['torque_converter'],
    'C0001': ['abs_module'],
    'C0002': ['abs_wheel_sensor'],
    'C0003': ['abs_wheel_sensor'],
    'C0004': ['abs_wheel_sensor'],
    'C0005': ['abs_wheel_sensor'],
    'B0001': ['airbag_control_module'],
    'B0002': ['airbag_sensor'],
    'U0001': ['can_bus_module'],
    'U0002': ['can_bus_module']
  };

  static estimateRepairCost(params: CostEstimateParams): RepairCost {
    const parts: any[] = [];
    const labor: any[] = [];
    const additional: any[] = [];
    
    let totalPartsCost = 0;
    let totalLaborCost = 0;
    let totalAdditionalCost = 0;
    
    const laborRate = params.laborRate || this.LABOR_RATES.independent;
    const useOEM = params.oemParts || false;
    
    // Analyze DTC codes and determine required parts
    const requiredParts = new Set<string>();
    
    params.dtcCodes.forEach(code => {
      const partsForCode = this.DTC_TO_PARTS[code] || [];
      partsForCode.forEach(part => requiredParts.add(part));
    });
    
    // Add parts based on symptoms
    if (params.symptoms.includes('engine won\'t start')) {
      requiredParts.add('battery');
      requiredParts.add('starter');
      requiredParts.add('fuel_pump');
    }
    
    if (params.symptoms.includes('overheating')) {
      requiredParts.add('thermostat');
      requiredParts.add('water_pump');
      requiredParts.add('radiator');
    }
    
    if (params.symptoms.includes('poor braking')) {
      requiredParts.add('brake_pads');
      requiredParts.add('brake_rotors');
    }
    
    if (params.symptoms.includes('rough shifting')) {
      requiredParts.add('transmission_fluid');
      requiredParts.add('transmission_filter');
    }
    
    // Generate parts list
    Array.from(requiredParts).forEach(partKey => {
      const partInfo = this.PARTS_DATABASE[partKey];
      if (partInfo) {
        const unitPrice = useOEM ? partInfo.oemPrice : partInfo.aftermarketPrice;
        const totalPrice = unitPrice * partInfo.quantity;
        
        parts.push({
          name: partInfo.name,
          partNumber: this.generatePartNumber(partKey, params.vehicleMake),
          quantity: partInfo.quantity,
          unitPrice,
          totalPrice,
          oem: useOEM,
          aftermarket: !useOEM,
          availability: this.checkAvailability(partKey, params.location)
        });
        
        totalPartsCost += totalPrice;
        
        // Add labor for this part
        const laborCost = partInfo.laborHours * laborRate;
        labor.push({
          task: `Replace ${partInfo.name}`,
          hours: partInfo.laborHours,
          hourlyRate: laborRate,
          totalPrice: laborCost,
          difficulty: partInfo.difficulty,
          certification: this.getRequiredCertification(partInfo.difficulty)
        });
        
        totalLaborCost += laborCost;
      }
    });
    
    // Add additional costs
    additional.push({
      name: 'Shop Supplies',
      price: 25,
      description: 'Fluids, cleaners, and miscellaneous supplies',
      optional: false
    });
    totalAdditionalCost += 25;
    
    if (params.symptoms.includes('check engine light')) {
      additional.push({
        name: 'Diagnostic Fee',
        price: 100,
        description: 'Computer diagnostic and code analysis',
        optional: false
      });
      totalAdditionalCost += 100;
    }
    
    // Calculate totals
    const subtotal = totalPartsCost + totalLaborCost + totalAdditionalCost;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + tax;
    
    // Calculate time estimate
    const totalLaborHours = labor.reduce((sum, item) => sum + item.hours, 0);
    const timeEstimate = {
      minimum: Math.max(totalLaborHours, 0.5),
      maximum: totalLaborHours * 1.5,
      average: totalLaborHours * 1.2,
      unit: 'hours' as const
    };
    
    // Determine overall difficulty
    const difficulties = labor.map(item => item.difficulty);
    const overallDifficulty = this.calculateOverallDifficulty(difficulties);
    
    // Calculate DIY savings
    const diyPossible = this.checkDIYPossibility(requiredParts);
    const diySavings = diyPossible ? totalLaborCost : 0;
    
    return {
      parts,
      labor,
      additional,
      totalCost: {
        parts: totalPartsCost,
        labor: totalLaborCost,
        additional: totalAdditionalCost,
        tax,
        total,
        currency: 'USD'
      },
      timeEstimate,
      difficulty: overallDifficulty,
      warranty: {
        parts: useOEM ? 24 : 12,
        labor: 12,
        provider: useOEM ? 'Dealership' : 'Independent Shop'
      },
      diy: {
        possible: diyPossible,
        difficulty: overallDifficulty,
        tools: this.getRequiredTools(requiredParts),
        savings: diySavings,
        risks: this.getDIYRisks(requiredParts)
      }
    };
  }

  private static generatePartNumber(partKey: string, make: string): string {
    const makePrefix = make.substring(0, 3).toUpperCase();
    const partSuffix = partKey.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 10000);
    return `${makePrefix}-${partSuffix}-${random.toString().padStart(4, '0')}`;
  }

  private static checkAvailability(partKey: string, location: string): 'in_stock' | 'ordered' | 'special_order' {
    // Simulate availability check
    const random = Math.random();
    if (random < 0.6) return 'in_stock';
    if (random < 0.9) return 'ordered';
    return 'special_order';
  }

  private static getRequiredCertification(difficulty: string): 'none' | 'basic' | 'advanced' | 'specialized' {
    switch (difficulty) {
      case 'easy': return 'basic';
      case 'medium': return 'basic';
      case 'hard': return 'advanced';
      case 'professional': return 'specialized';
      default: return 'none';
    }
  }

  private static calculateOverallDifficulty(difficulties: string[]): 'easy' | 'medium' | 'hard' | 'professional' {
    if (difficulties.includes('professional')) return 'professional';
    if (difficulties.includes('hard')) return 'hard';
    if (difficulties.includes('medium')) return 'medium';
    return 'easy';
  }

  private static checkDIYPossibility(requiredParts: Set<string>): boolean {
    const professionalOnlyParts = ['catalytic_converter', 'transmission_control_module', 'ecm', 'airbag_control_module'];
    return !Array.from(requiredParts).some(part => professionalOnlyParts.includes(part));
  }

  private static getRequiredTools(requiredParts: Set<string>): string[] {
    const tools = new Set<string>();
    
    Array.from(requiredParts).forEach(part => {
      switch (part) {
        case 'spark_plugs':
          tools.add('Spark plug socket');
          tools.add('Torque wrench');
          tools.add('Gap tool');
          break;
        case 'oil_filter':
          tools.add('Oil filter wrench');
          tools.add('Oil drain pan');
          break;
        case 'brake_pads':
          tools.add('Brake caliper tool');
          tools.add('C-clamp');
          tools.add('Torque wrench');
          break;
        case 'alternator':
          tools.add('Wrench set');
          tools.add('Socket set');
          tools.add('Battery terminal tool');
          break;
        case 'battery':
          tools.add('Battery terminal cleaner');
          tools.add('Wrench set');
          break;
        default:
          tools.add('Basic tool set');
          tools.add('Socket set');
          tools.add('Wrench set');
      }
    });
    
    return Array.from(tools);
  }

  private static getDIYRisks(requiredParts: Set<string>): string[] {
    const risks: string[] = [];
    
    Array.from(requiredParts).forEach(part => {
      switch (part) {
        case 'fuel_pump':
          risks.push('Fuel system pressure - fire hazard');
          risks.push('Fuel exposure - health risk');
          break;
        case 'alternator':
          risks.push('Electrical system - shock hazard');
          risks.push('Battery connection - short circuit risk');
          break;
        case 'brake_pads':
          risks.push('Brake system failure - safety risk');
          risks.push('Brake fluid contamination');
          break;
        case 'catalytic_converter':
          risks.push('Exposure to carcinogenic materials');
          risks.push('High temperature components');
          break;
        case 'transmission_fluid':
          risks.push('Fluid spillage - environmental hazard');
          risks.push('Incorrect fluid type - transmission damage');
          break;
      }
    });
    
    return Array.from(new Set(risks));
  }

  static getCostBreakdownByCategory(estimate: RepairCost): {
    engine: number;
    transmission: number;
    brakes: number;
    suspension: number;
    electrical: number;
    cooling: number;
    emissions: number;
    other: number;
  } {
    const breakdown = {
      engine: 0,
      transmission: 0,
      brakes: 0,
      suspension: 0,
      electrical: 0,
      cooling: 0,
      emissions: 0,
      other: 0
    };

    estimate.parts.forEach(part => {
      const category = this.getPartCategory(part.name);
      breakdown[category] += part.totalPrice;
    });

    estimate.labor.forEach(laborItem => {
      const category = this.getTaskCategory(laborItem.task);
      breakdown[category] += laborItem.totalPrice;
    });

    return breakdown;
  }

  private static getPartCategory(partName: string): keyof ReturnType<typeof CostEstimator.getCostBreakdownByCategory> {
    const name = partName.toLowerCase();
    
    if (name.includes('spark') || name.includes('oxygen') || name.includes('airflow') || name.includes('fuel')) return 'engine';
    if (name.includes('transmission')) return 'transmission';
    if (name.includes('brake')) return 'brakes';
    if (name.includes('shock') || name.includes('strut')) return 'suspension';
    if (name.includes('alternator') || name.includes('battery') || name.includes('starter')) return 'electrical';
    if (name.includes('radiator') || name.includes('water pump') || name.includes('thermostat')) return 'cooling';
    if (name.includes('catalytic') || name.includes('evap')) return 'emissions';
    
    return 'other';
  }

  private static getTaskCategory(taskName: string): keyof ReturnType<typeof CostEstimator.getCostBreakdownByCategory> {
    const name = taskName.toLowerCase();
    
    if (name.includes('spark') || name.includes('oxygen') || name.includes('airflow') || name.includes('fuel')) return 'engine';
    if (name.includes('transmission')) return 'transmission';
    if (name.includes('brake')) return 'brakes';
    if (name.includes('shock') || name.includes('strut')) return 'suspension';
    if (name.includes('alternator') || name.includes('battery') || name.includes('starter')) return 'electrical';
    if (name.includes('radiator') || name.includes('water pump') || name.includes('thermostat')) return 'cooling';
    if (name.includes('catalytic') || name.includes('evap')) return 'emissions';
    
    return 'other';
  }

  static compareCosts(estimates: RepairCost[]): {
    lowest: RepairCost;
    highest: RepairCost;
    average: RepairCost;
    savings: {
      lowestVsHighest: number;
      averageVsHighest: number;
      percentage: number;
    };
  } {
    if (estimates.length === 0) {
      throw new Error('No estimates provided');
    }

    const sorted = [...estimates].sort((a, b) => a.totalCost.total - b.totalCost.total);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];
    
    const average: RepairCost = {
      parts: lowest.parts, // Use lowest parts as reference
      labor: lowest.labor, // Use lowest labor as reference
      additional: lowest.additional, // Use lowest additional as reference
      totalCost: {
        parts: estimates.reduce((sum, e) => sum + e.totalCost.parts, 0) / estimates.length,
        labor: estimates.reduce((sum, e) => sum + e.totalCost.labor, 0) / estimates.length,
        additional: estimates.reduce((sum, e) => sum + e.totalCost.additional, 0) / estimates.length,
        tax: estimates.reduce((sum, e) => sum + e.totalCost.tax, 0) / estimates.length,
        total: estimates.reduce((sum, e) => sum + e.totalCost.total, 0) / estimates.length,
        currency: 'USD'
      },
      timeEstimate: lowest.timeEstimate, // Use lowest time as reference
      difficulty: lowest.difficulty, // Use lowest difficulty as reference
      warranty: lowest.warranty, // Use lowest warranty as reference
      diy: lowest.diy // Use lowest DIY as reference
    };

    const lowestVsHighest = highest.totalCost.total - lowest.totalCost.total;
    const averageVsHighest = highest.totalCost.total - average.totalCost.total;
    const percentage = (lowestVsHighest / highest.totalCost.total) * 100;

    return {
      lowest,
      highest,
      average,
      savings: {
        lowestVsHighest,
        averageVsHighest,
        percentage
      }
    };
  }

  static getMaintenanceCostEstimate(vehicleMake: string, vehicleYear: number): {
    annual: number;
    byCategory: Record<string, number>;
    commonServices: Array<{
      name: string;
      interval: string;
      cost: number;
      frequency: number;
    }>;
  } {
    const baseAnnualCost = this.getBaseMaintenanceCost(vehicleMake);
    
    const byCategory = {
      oil_changes: baseAnnualCost * 0.3,
      tire_services: baseAnnualCost * 0.2,
      brake_services: baseAnnualCost * 0.15,
      fluid_services: baseAnnualCost * 0.15,
      filter_replacements: baseAnnualCost * 0.1,
      inspections: baseAnnualCost * 0.1
    };

    const commonServices = [
      {
        name: 'Oil Change',
        interval: '5,000 miles / 6 months',
        cost: 65,
        frequency: 2
      },
      {
        name: 'Tire Rotation',
        interval: '5,000 miles / 6 months',
        cost: 35,
        frequency: 2
      },
      {
        name: 'Brake Inspection',
        interval: '10,000 miles / 12 months',
        cost: 75,
        frequency: 1
      },
      {
        name: 'Transmission Service',
        interval: '30,000 miles / 24 months',
        cost: 175,
        frequency: 0.33
      },
      {
        name: 'Coolant Flush',
        interval: '30,000 miles / 24 months',
        cost: 110,
        frequency: 0.33
      }
    ];

    return {
      annual: baseAnnualCost,
      byCategory,
      commonServices
    };
  }

  private static getBaseMaintenanceCost(make: string): number {
    const costs: Record<string, number> = {
      'Toyota': 600,
      'Honda': 650,
      'Ford': 750,
      'Chevrolet': 700,
      'BMW': 1200,
      'Mercedes': 1300,
      'Audi': 1150,
      'Volkswagen': 800,
      'Nissan': 680,
      'Hyundai': 550,
      'Kia': 520
    };

    return costs[make] || 700;
  }
}
