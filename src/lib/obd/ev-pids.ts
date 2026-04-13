import type { OBDPIDDefinition, EVData } from '@/types';

// Electric Vehicle specific PIDs and data handling
export class EVPIDSupport {
  private static readonly EV_PIDS: Record<string, OBDPIDDefinition> = {
    // Battery System PIDs
    '0A': {
      pid: '0A',
      mode: '01',
      bytes: 1,
      name: 'Battery Pack Voltage',
      description: 'High voltage battery pack voltage',
      unit: 'V',
      formula: (b) => b[0] / 10,
      min: 200,
      max: 800,
      category: 'Battery',
      manufacturer: 'EV'
    },
    '0B': {
      pid: '0B',
      mode: '01',
      bytes: 2,
      name: 'Battery Pack Current',
      description: 'High voltage battery pack current (positive = charging, negative = discharging)',
      unit: 'A',
      formula: (b) => {
        const v = b[0] * 256 + b[1];
        return v > 32767 ? (v - 65536) / 10 : v / 10;
      },
      min: -500,
      max: 500,
      category: 'Battery',
      manufacturer: 'EV'
    },
    '0C': {
      pid: '0C',
      mode: '01',
      bytes: 1,
      name: 'State of Charge',
      description: 'Battery state of charge percentage',
      unit: '%',
      formula: (b) => (b[0] * 100) / 255,
      min: 0,
      max: 100,
      category: 'Battery',
      manufacturer: 'EV'
    },
    '0D': {
      pid: '0D',
      mode: '01',
      bytes: 1,
      name: 'Battery Temperature',
      description: 'Average battery pack temperature',
      unit: '°C',
      formula: (b) => b[0] - 40,
      min: -40,
      max: 215,
      category: 'Battery',
      manufacturer: 'EV'
    },
    '0E': {
      pid: '0E',
      mode: '01',
      bytes: 2,
      name: 'Motor RPM',
      description: 'Electric motor speed',
      unit: 'RPM',
      formula: (b) => ((b[0] * 256 + b[1]) / 4),
      min: 0,
      max: 16000,
      category: 'Drivetrain',
      manufacturer: 'EV'
    },
    '0F': {
      pid: '0F',
      mode: '01',
      bytes: 1,
      name: 'Motor Torque',
      description: 'Electric motor torque output',
      unit: 'Nm',
      formula: (b) => b[0] - 125,
      min: -125,
      max: 125,
      category: 'Drivetrain',
      manufacturer: 'EV'
    },
    '10': {
      pid: '10',
      mode: '01',
      bytes: 1,
      name: 'Inverter Temperature',
      description: 'Power inverter temperature',
      unit: '°C',
      formula: (b) => b[0] - 40,
      min: -40,
      max: 215,
      category: 'Drivetrain',
      manufacturer: 'EV'
    },
    '11': {
      pid: '11',
      mode: '01',
      bytes: 1,
      name: 'Charging Power',
      description: 'Current charging power in kW',
      unit: 'kW',
      formula: (b) => b[0] / 10,
      min: 0,
      max: 100,
      category: 'Charging',
      manufacturer: 'EV'
    },
    '12': {
      pid: '12',
      mode: '01',
      bytes: 1,
      name: 'Charging Status',
      description: 'Current charging status',
      unit: '',
      formula: (b) => b[0],
      min: 0,
      max: 7,
      category: 'Charging',
      manufacturer: 'EV'
    },
    '13': {
      pid: '13',
      mode: '01',
      bytes: 1,
      name: 'Battery Capacity',
      description: 'Battery capacity degradation percentage',
      unit: '%',
      formula: (b) => b[0],
      min: 0,
      max: 100,
      category: 'Battery',
      manufacturer: 'EV'
    },
    '14': {
      pid: '14',
      mode: '01',
      bytes: 1,
      name: 'DC-DC Converter Status',
      description: 'DC-DC converter operating status',
      unit: '',
      formula: (b) => b[0],
      min: 0,
      max: 255,
      category: 'Electrical',
      manufacturer: 'EV'
    },
    '15': {
      pid: '15',
      mode: '01',
      bytes: 1,
      name: 'Regenerative Braking',
      description: 'Regenerative braking activation status',
      unit: '',
      formula: (b) => b[0],
      min: 0,
      max: 1,
      category: 'Drivetrain',
      manufacturer: 'EV'
    },
    '16': {
      pid: '16',
      mode: '01',
      bytes: 2,
      name: 'Battery Module Voltages',
      description: 'Individual battery module voltages',
      unit: 'V',
      formula: (b) => (b[0] * 256 + b[1]) / 1000,
      min: 2.5,
      max: 4.5,
      category: 'Battery',
      manufacturer: 'EV'
    },
    '17': {
      pid: '17',
      mode: '01',
      bytes: 1,
      name: 'Battery Module Temperatures',
      description: 'Individual battery module temperatures',
      unit: '°C',
      formula: (b) => b[0] - 40,
      min: -40,
      max: 215,
      category: 'Battery',
      manufacturer: 'EV'
    },
    '18': {
      pid: '18',
      mode: '01',
      bytes: 1,
      name: 'Cooling System Status',
      description: 'Battery cooling system status',
      unit: '',
      formula: (b) => b[0],
      min: 0,
      max: 7,
      category: 'Thermal',
      manufacturer: 'EV'
    },
    '19': {
      pid: '19',
      mode: '01',
      bytes: 2,
      name: 'Estimated Range',
      description: 'Estimated driving range based on current SOC',
      unit: 'km',
      formula: (b) => b[0] * 256 + b[1],
      min: 0,
      max: 1000,
      category: 'Navigation',
      manufacturer: 'EV'
    },
    '1A': {
      pid: '1A',
      mode: '01',
      bytes: 1,
      name: 'Battery Health',
      description: 'Overall battery health indicator',
      unit: '%',
      formula: (b) => b[0],
      min: 0,
      max: 100,
      category: 'Battery',
      manufacturer: 'EV'
    },
    '1B': {
      pid: '1B',
      mode: '01',
      bytes: 1,
      name: 'Power Limit',
      description: 'Current power limit in kW',
      unit: 'kW',
      formula: (b) => b[0] / 10,
      min: 0,
      max: 500,
      category: 'Performance',
      manufacturer: 'EV'
    },
    '1C': {
      pid: '1C',
      mode: '01',
      bytes: 1,
      name: 'Thermal Management',
      description: 'Thermal management system status',
      unit: '',
      formula: (b) => b[0],
      min: 0,
      max: 255,
      category: 'Thermal',
      manufacturer: 'EV'
    },
    '1D': {
      pid: '1D',
      mode: '01',
      bytes: 1,
      name: 'Charging Connector Status',
      description: 'Charging connector type and status',
      unit: '',
      formula: (b) => b[0],
      min: 0,
      max: 15,
      category: 'Charging',
      manufacturer: 'EV'
    },
    '1E': {
      pid: '1E',
      mode: '01',
      bytes: 2,
      name: 'Battery Isolation',
      description: 'High voltage battery isolation resistance',
      unit: 'kOhm',
      formula: (b) => b[0] * 256 + b[1],
      min: 0,
      max: 65535,
      category: 'Safety',
      manufacturer: 'EV'
    }
  };

  // Manufacturer-specific EV PIDs
  private static readonly MANUFACTURER_EV_PIDS: Record<string, Record<string, OBDPIDDefinition>> = {
    'Tesla': {
      'A0': {
        pid: 'A0',
        mode: '01',
        bytes: 2,
        name: 'Tesla Battery Pack Voltage',
        description: 'Tesla-specific battery voltage reading',
        unit: 'V',
        formula: (b) => (b[0] * 256 + b[1]) / 100,
        min: 350,
        max: 450,
        category: 'Battery',
        manufacturer: 'Tesla'
      },
      'A1': {
        pid: 'A1',
        mode: '01',
        bytes: 2,
        name: 'Tesla Battery Current',
        description: 'Tesla-specific battery current',
        unit: 'A',
        formula: (b) => {
          const v = b[0] * 256 + b[1];
          return v > 32767 ? (v - 65536) / 10 : v / 10;
        },
        min: -400,
        max: 400,
        category: 'Battery',
        manufacturer: 'Tesla'
      },
      'A2': {
        pid: 'A2',
        mode: '01',
        bytes: 1,
        name: 'Tesla SOC',
        description: 'Tesla state of charge',
        unit: '%',
        formula: (b) => b[0] / 2,
        min: 0,
        max: 100,
        category: 'Battery',
        manufacturer: 'Tesla'
      }
    },
    'Nissan': {
      'B0': {
        pid: 'B0',
        mode: '01',
        bytes: 1,
        name: 'Nissan LEAF Battery Voltage',
        description: 'Nissan LEAF battery voltage',
        unit: 'V',
        formula: (b) => b[0] / 10,
        min: 300,
        max: 400,
        category: 'Battery',
        manufacturer: 'Nissan'
      },
      'B1': {
        pid: 'B1',
        mode: '01',
        bytes: 2,
        name: 'Nissan LEAF GIDS',
        description: 'Nissan LEAF GIDS (battery capacity units)',
        unit: 'GIDS',
        formula: (b) => b[0] * 256 + b[1],
        min: 0,
        max: 1000,
        category: 'Battery',
        manufacturer: 'Nissan'
      }
    },
    'Chevrolet': {
      'C0': {
        pid: 'C0',
        mode: '01',
        bytes: 1,
        name: 'Chevrolet Volt Battery Voltage',
        description: 'Chevrolet Volt battery voltage',
        unit: 'V',
        formula: (b) => b[0] / 10,
        min: 300,
        max: 400,
        category: 'Battery',
        manufacturer: 'Chevrolet'
      },
      'C1': {
        pid: 'C1',
        mode: '01',
        bytes: 1,
        name: 'Chevrolet Volt SOC',
        description: 'Chevrolet Volt state of charge',
        unit: '%',
        formula: (b) => (b[0] * 100) / 255,
        min: 0,
        max: 100,
        category: 'Battery',
        manufacturer: 'Chevrolet'
      }
    }
  };

  static getStandardEVPIDs(): Record<string, OBDPIDDefinition> {
    return { ...this.EV_PIDS };
  }

  static getManufacturerEVPIDs(manufacturer: string): Record<string, OBDPIDDefinition> {
    return this.MANUFACTURER_EV_PIDS[manufacturer] || {};
  }

  static getAllEVPIDs(manufacturer?: string): Record<string, OBDPIDDefinition> {
    const standard = { ...this.EV_PIDS };
    if (manufacturer && this.MANUFACTURER_EV_PIDS[manufacturer]) {
      return { ...standard, ...this.MANUFACTURER_EV_PIDS[manufacturer] };
    }
    return standard;
  }

  static parseEVData(readings: Map<string, number>, manufacturer?: string): EVData {
    const evPIDs = this.getAllEVPIDs(manufacturer);
    
    return {
      batteryVoltage: readings.get('0A') ?? 0,
      batteryCurrent: readings.get('0B') ?? 0,
      stateOfCharge: readings.get('0C') ?? 0,
      batteryTemperature: readings.get('0D') ?? 0,
      motorRPM: readings.get('0E') ?? 0,
      chargingPower: readings.get('11') ?? 0,
      chargingStatus: this.getChargingStatus(readings.get('12') ?? 0)
    };
  }

  static getChargingStatus(statusValue: number): string {
    const statusMap: Record<number, string> = {
      0: 'Not Charging',
      1: 'Charging (AC)',
      2: 'Charging (DC)',
      3: 'Charging Complete',
      4: 'Charge Fault',
      5: 'Battery Conditioning',
      6: 'Preconditioning',
      7: 'Unknown'
    };
    return statusMap[statusValue] || 'Unknown';
  }

  static getBatteryHealth(soc: number, voltage: number, temperature: number): {
    health: number;
    status: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
    recommendations: string[];
  } {
    let health = 100;
    const recommendations: string[] = [];

    // SOC-based health assessment
    if (soc < 20) {
      health -= 20;
      recommendations.push('Low state of charge - charge battery soon');
    } else if (soc > 80) {
      health -= 5;
      recommendations.push('High state of charge - consider partial charging');
    }

    // Voltage-based health assessment
    if (voltage < 320) {
      health -= 15;
      recommendations.push('Low battery voltage - check battery health');
    } else if (voltage > 400) {
      health -= 10;
      recommendations.push('High battery voltage - check thermal management');
    }

    // Temperature-based health assessment
    if (temperature < 0) {
      health -= 10;
      recommendations.push('Cold battery temperature - reduced performance');
    } else if (temperature > 45) {
      health -= 15;
      recommendations.push('High battery temperature - check cooling system');
    }

    let status: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical';
    if (health >= 90) status = 'Excellent';
    else if (health >= 75) status = 'Good';
    else if (health >= 60) status = 'Fair';
    else if (health >= 40) status = 'Poor';
    else status = 'Critical';

    return { health, status, recommendations };
  }

  static getChargingRecommendations(chargingStatus: string, soc: number, temperature: number): string[] {
    const recommendations: string[] = [];

    if (chargingStatus === 'Not Charging' && soc < 20) {
      recommendations.push('Critical: Charge battery immediately');
    } else if (chargingStatus === 'Not Charging' && soc < 50) {
      recommendations.push('Charge battery soon');
    }

    if (soc > 80 && chargingStatus === 'Charging (AC)') {
      recommendations.push('Consider stopping charge to preserve battery health');
    }

    if (temperature > 35 && chargingStatus !== 'Not Charging') {
      recommendations.push('Monitor battery temperature during charging');
    }

    if (temperature < 5 && chargingStatus !== 'Not Charging') {
      recommendations.push('Cold temperature charging - slower charging rate expected');
    }

    return recommendations;
  }

  static getEfficiencyMetrics(motorRPM: number, batteryCurrent: number, batteryVoltage: number): {
    powerOutput: number;
    efficiency: number;
    status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  } {
    const powerOutput = Math.abs(batteryCurrent * batteryVoltage) / 1000; // kW
    const theoreticalPower = (motorRPM / 1000) * 50; // Simplified theoretical power
    const efficiency = theoreticalPower > 0 ? (powerOutput / theoreticalPower) * 100 : 0;

    let status: 'Excellent' | 'Good' | 'Fair' | 'Poor';
    if (efficiency >= 85) status = 'Excellent';
    else if (efficiency >= 70) status = 'Good';
    else if (efficiency >= 55) status = 'Fair';
    else status = 'Poor';

    return { powerOutput, efficiency: Math.min(efficiency, 100), status };
  }

  static getThermalStatus(batteryTemp: number, inverterTemp: number, coolingStatus: number): {
    status: 'Normal' | 'Warning' | 'Critical';
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let status: 'Normal' | 'Warning' | 'Critical' = 'Normal';

    if (batteryTemp > 50 || inverterTemp > 70) {
      status = 'Critical';
      recommendations.push('Critical temperature detected - stop charging/operation');
    } else if (batteryTemp > 40 || inverterTemp > 60) {
      status = 'Warning';
      recommendations.push('High temperature - reduce power usage');
    }

    if (coolingStatus === 0) {
      recommendations.push('Cooling system not active - monitor temperatures');
    }

    return { status, recommendations };
  }
}
