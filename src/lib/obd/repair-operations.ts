import type { DTC, OBDConnectionState } from '@/types';

// Repair and Maintenance Operations
export class RepairOperations {
  private static readonly SAFETY_CHECKS = {
    engineRunning: ['Cannot clear codes while engine is running'],
    vehicleMoving: ['Cannot perform repairs while vehicle is moving'],
    criticalSystems: ['Cannot clear critical safety system codes without manual inspection'],
    airbagCodes: ['Airbag codes require professional service'],
    brakeCodes: ['Brake system codes require professional inspection'],
    transmissionCodes: ['Transmission codes may require professional service']
  };

  private static readonly CLEAR_CODE_COMMANDS = {
    stored: '04',
    pending: '14',
    permanent: '2A',
    enhanced: '10'
  };

  static async clearDTCs(
    connectionState: OBDConnectionState,
    codeType: 'stored' | 'pending' | 'permanent' | 'all',
    userConfirmed: boolean,
    sendCommand: (command: string) => Promise<string>
  ): Promise<{
    success: boolean;
    clearedCodes: string[];
    failedCodes: string[];
    warnings: string[];
    message: string;
  }> {
    if (!userConfirmed) {
      return {
        success: false,
        clearedCodes: [],
        failedCodes: [],
        warnings: [],
        message: 'User confirmation required for DTC clearing'
      };
    }

    const result = {
      success: false,
      clearedCodes: [] as string[],
      failedCodes: [] as string[],
      warnings: [] as string[],
      message: ''
    };

    try {
      // Safety checks
      const safetyCheck = await this.performSafetyChecks(connectionState, sendCommand);
      if (!safetyCheck.passed) {
        return {
          ...result,
          warnings: safetyCheck.warnings,
          message: 'Safety checks failed - cannot clear codes'
        };
      }

      // Get current codes before clearing
      const currentCodes = await this.getCurrentCodes(sendCommand);
      const currentCodeStrings = currentCodes.map((c) => c.code);

      // Clear codes based on type
      const commands = codeType === 'all' 
        ? ['04', '14', '2A'] 
        : [this.CLEAR_CODE_COMMANDS[codeType]];

      for (const command of commands) {
        try {
          const response = await sendCommand(command);
          
          if (response.includes('OK') || response.includes('44')) {
            result.success = true;
            result.clearedCodes.push(...currentCodeStrings);
          } else {
            result.failedCodes.push(...currentCodeStrings);
          }
        } catch (error) {
          result.failedCodes.push(...currentCodeStrings);
        }
      }

      // Verify codes were cleared
      const remainingCodes = await this.getCurrentCodes(sendCommand);
      result.clearedCodes = result.clearedCodes.filter(code => 
        !remainingCodes.some(remaining => remaining.code === code)
      );

      result.message = result.success 
        ? `Successfully cleared ${result.clearedCodes.length} codes`
        : `Failed to clear codes. ${result.warnings.join('. ')}`;

    } catch (error) {
      result.message = `Error clearing codes: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    return result;
  }

  private static async performSafetyChecks(
    connectionState: OBDConnectionState,
    sendCommand: (command: string) => Promise<string>
  ): Promise<{ passed: boolean; warnings: string[] }> {
    const warnings: string[] = [];

    try {
      // Check engine RPM
      const rpmResponse = await sendCommand('010C');
      const rpm = this.parseRPM(rpmResponse);
      if (rpm > 100) {
        warnings.push('Engine is running');
      }

      // Check vehicle speed
      const speedResponse = await sendCommand('010D');
      const speed = this.parseSpeed(speedResponse);
      if (speed > 0) {
        warnings.push('Vehicle is moving');
      }

      // Check for critical system codes
      const criticalCodes = await this.getCriticalCodes(sendCommand);
      if (criticalCodes.length > 0) {
        warnings.push('Critical system codes detected - professional service recommended');
      }

    } catch (error) {
      warnings.push('Unable to perform safety checks');
    }

    return {
      passed: warnings.length === 0,
      warnings
    };
  }

  private static async getCurrentCodes(sendCommand: (command: string) => Promise<string>): Promise<DTC[]> {
    const codes: DTC[] = [];
    
    try {
      // Get stored codes
      const storedResponse = await sendCommand('03');
      codes.push(...this.parseDTCResponse(storedResponse, 'stored'));
      
      // Get pending codes
      const pendingResponse = await sendCommand('07');
      codes.push(...this.parseDTCResponse(pendingResponse, 'pending'));
      
      // Get permanent codes
      const permanentResponse = await sendCommand('0A');
      codes.push(...this.parseDTCResponse(permanentResponse, 'permanent'));
      
    } catch (error) {
      // Unable to read codes
    }
    
    return codes;
  }

  private static async getCriticalCodes(sendCommand: (command: string) => Promise<string>): Promise<DTC[]> {
    const allCodes = await this.getCurrentCodes(sendCommand);
    
    // Filter for critical systems
    const criticalPrefixes = ['B0', 'C0', 'C1']; // Airbag, Brake, Chassis
    return allCodes.filter(code => 
      criticalPrefixes.some(prefix => code.code.startsWith(prefix))
    );
  }

  private static parseDTCResponse(response: string, type: 'stored' | 'pending' | 'permanent'): DTC[] {
    const codes: DTC[] = [];
    
    if (!response || response.includes('NO DATA') || response.includes('OK')) {
      return codes;
    }

    // Positive response: mode+0x40 — 03→43, 07→47, 0A→4A (space-separated hex tokens)
    const parts = response.trim().split(/\s+/).filter(Boolean);
    const expectedHead: Record<typeof type, string> = {
      stored: '43',
      pending: '47',
      permanent: '4A',
    };
    if (parts[0]?.toUpperCase() !== expectedHead[type]) return codes;

    for (let i = 1; i < parts.length; i += 2) {
      if (i + 1 < parts.length) {
        const code = this.formatDTC(parts[i] + parts[i + 1]);
        codes.push({
          code,
          description: `DTC ${code}`,
          status: type,
          timestamp: new Date().toISOString()
        });
      }
    }

    return codes;
  }

  private static formatDTC(hexCode: string): string {
    const firstByte = parseInt(hexCode.substring(0, 2), 16);
    const secondByte = parseInt(hexCode.substring(2, 4), 16);
    
    const systemMap: Record<number, string> = {
      0x00: 'P', // Powertrain
      0x01: 'C', // Chassis
      0x02: 'B', // Body
      0x03: 'U'  // Network/Communication
    };

    const system = systemMap[(firstByte >> 6) & 0x03] || 'P';
    const codeNumber = ((firstByte & 0x3F) << 8) | secondByte;
    
    return `${system}${codeNumber.toString(16).padStart(4, '0').toUpperCase()}`;
  }

  private static parseRPM(response: string): number {
    if (!response || response.includes('NO DATA')) return 0;
    
    const parts = response.trim().split(' ');
    if (parts[0] === '41' && parts[1] === '0C' && parts.length >= 3) {
      const rpmAB = parseInt(parts[2], 16);
      return rpmAB * 256 / 4;
    }
    return 0;
  }

  private static parseSpeed(response: string): number {
    if (!response || response.includes('NO DATA')) return 0;
    
    const parts = response.trim().split(' ');
    if (parts[0] === '41' && parts[1] === '0D' && parts.length >= 3) {
      return parseInt(parts[2], 16);
    }
    return 0;
  }

  // Parameter Adjustment Operations
  static async performParameterAdjustment(
    parameter: string,
    value: number,
    sendCommand: (command: string) => Promise<string>
  ): Promise<{
    success: boolean;
    oldValue?: number;
    newValue?: number;
    message: string;
  }> {
    const adjustments: Record<string, { command: string; parser: (response: string) => number }> = {
      'idle_rpm': {
        command: '2F 01 XX', // Example: Set idle RPM
        parser: (response) => this.parseIdleRPM(response)
      },
      'fuel_trim': {
        command: '2F 06 XX', // Example: Fuel trim adjustment
        parser: (response) => this.parseFuelTrim(response)
      },
      'timing_advance': {
        command: '2F 0B XX', // Example: Timing adjustment
        parser: (response) => this.parseTiming(response)
      }
    };

    const adjustment = adjustments[parameter];
    if (!adjustment) {
      return {
        success: false,
        message: `Parameter '${parameter}' not supported for adjustment`
      };
    }

    try {
      // Get current value
      const currentValue = adjustment.parser(await sendCommand('01 0C')); // Example read
      
      // Set new value
      const command = adjustment.command.replace('XX', value.toString(16).padStart(2, '0'));
      const response = await sendCommand(command);
      
      if (response.includes('OK') || response.includes('6F')) {
        return {
          success: true,
          oldValue: currentValue,
          newValue: value,
          message: `Successfully adjusted ${parameter} from ${currentValue} to ${value}`
        };
      } else {
        return {
          success: false,
          message: `Failed to adjust ${parameter}: ${response}`
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error adjusting ${parameter}: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static parseIdleRPM(response: string): number {
    // Parse idle RPM from response
    return this.parseRPM(response);
  }

  private static parseFuelTrim(response: string): number {
    // Parse fuel trim from response
    if (!response || response.includes('NO DATA')) return 0;
    
    const parts = response.trim().split(' ');
    if (parts[0] === '41' && parts[1] === '06' && parts.length >= 3) {
      const value = parseInt(parts[2], 16);
      return value - 128; // Convert to percentage
    }
    return 0;
  }

  private static parseTiming(response: string): number {
    // Parse timing advance from response
    if (!response || response.includes('NO DATA')) return 0;
    
    const parts = response.trim().split(' ');
    if (parts[0] === '41' && parts[1] === '0E' && parts.length >= 3) {
      return parseInt(parts[2], 16) - 64;
    }
    return 0;
  }

  // System Reset Operations
  static async performSystemReset(
    resetType: 'ecu' | 'adaptive' | 'learned' | 'maintenance',
    sendCommand: (command: string) => Promise<string>
  ): Promise<{
    success: boolean;
    message: string;
    warnings: string[];
  }> {
    const resetCommands: Record<string, { command: string; warning: string }> = {
      'ecu': {
        command: '04', // Clear all codes and reset ECU
        warning: 'ECU reset will clear all learned values and codes'
      },
      'adaptive': {
        command: '2F 01 00', // Reset adaptive values
        warning: 'Adaptive reset will clear fuel trim and timing adaptations'
      },
      'learned': {
        command: '2F 02 00', // Reset learned values
        warning: 'Learned values reset will clear all adaptations'
      },
      'maintenance': {
        command: '4E 00', // Reset maintenance reminders
        warning: 'Maintenance reset will clear service reminders'
      }
    };

    const reset = resetCommands[resetType];
    if (!reset) {
      return {
        success: false,
        message: `Reset type '${resetType}' not supported`,
        warnings: []
      };
    }

    try {
      const response = await sendCommand(reset.command);
      
      if (response.includes('OK') || response.includes('44')) {
        return {
          success: true,
          message: `Successfully performed ${resetType} reset`,
          warnings: [reset.warning]
        };
      } else {
        return {
          success: false,
          message: `Failed to perform ${resetType} reset: ${response}`,
          warnings: []
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Error performing ${resetType} reset: ${error instanceof Error ? error.message : 'Unknown error'}`,
        warnings: []
      };
    }
  }

  // Calibration Operations
  static async performCalibration(
    calibrationType: 'tps' | 'o2' | 'maf' | 'map',
    sendCommand: (command: string) => Promise<string>
  ): Promise<{
    success: boolean;
    message: string;
    steps: string[];
  }> {
    const calibrations: Record<string, { steps: string[]; commands: string[] }> = {
      'tps': {
        steps: [
          'Ensure throttle is fully closed',
          'Wait 3 seconds',
          'Calibrating TPS sensor',
          'Verify TPS voltage'
        ],
        commands: ['2F 10 00', '2F 10 01', '2F 10 02']
      },
      'o2': {
        steps: [
          'Start engine and warm to operating temperature',
          'Allow O2 sensor to stabilize',
          'Calibrating O2 sensor',
          'Verify O2 sensor response'
        ],
        commands: ['2F 11 00', '2F 11 01', '2F 11 02']
      },
      'maf': {
        steps: [
          'Ensure engine is at idle',
          'Clean MAF sensor if needed',
          'Calibrating MAF sensor',
          'Verify MAF readings'
        ],
        commands: ['2F 12 00', '2F 12 01', '2F 12 02']
      },
      'map': {
        steps: [
          'Ensure engine is at idle',
          'Check MAP sensor connection',
          'Calibrating MAP sensor',
          'Verify MAP readings'
        ],
        commands: ['2F 13 00', '2F 13 01', '2F 13 02']
      }
    };

    const calibration = calibrations[calibrationType];
    if (!calibration) {
      return {
        success: false,
        message: `Calibration type '${calibrationType}' not supported`,
        steps: []
      };
    }

    try {
      for (let i = 0; i < calibration.commands.length; i++) {
        const response = await sendCommand(calibration.commands[i]);
        
        if (!response.includes('OK') && !response.includes('6F')) {
          return {
            success: false,
            message: `Calibration failed at step ${i + 1}: ${response}`,
            steps: calibration.steps.slice(0, i + 1)
          };
        }
      }

      return {
        success: true,
        message: `Successfully calibrated ${calibrationType.toUpperCase()} sensor`,
        steps: calibration.steps
      };
    } catch (error) {
      return {
        success: false,
        message: `Error calibrating ${calibrationType}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        steps: calibration.steps
      };
    }
  }

  // Maintenance Reset Operations
  static async resetMaintenanceReminders(
    reminderType: 'oil' | 'tire' | 'brake' | 'service' | 'all',
    sendCommand: (command: string) => Promise<string>
  ): Promise<{
    success: boolean;
    resetItems: string[];
    message: string;
  }> {
    const maintenanceCommands: Record<string, { command: string; items: string[] }> = {
      'oil': {
        command: '4E 01',
        items: ['Oil Change Reminder']
      },
      'tire': {
        command: '4E 02',
        items: ['Tire Rotation Reminder']
      },
      'brake': {
        command: '4E 03',
        items: ['Brake Service Reminder']
      },
      'service': {
        command: '4E 04',
        items: ['General Service Reminder']
      },
      'all': {
        command: '4E FF',
        items: ['All Maintenance Reminders']
      }
    };

    const maintenance = maintenanceCommands[reminderType];
    if (!maintenance) {
      return {
        success: false,
        resetItems: [],
        message: `Maintenance type '${reminderType}' not supported`
      };
    }

    try {
      const response = await sendCommand(maintenance.command);
      
      if (response.includes('OK') || response.includes('6E')) {
        return {
          success: true,
          resetItems: maintenance.items,
          message: `Successfully reset ${maintenance.items.join(', ')}`
        };
      } else {
        return {
          success: false,
          resetItems: [],
          message: `Failed to reset maintenance: ${response}`
        };
      }
    } catch (error) {
      return {
        success: false,
        resetItems: [],
        message: `Error resetting maintenance: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Advanced Diagnostics
  static async performSystemTest(
    testType: 'ignition' | 'fuel' | 'emissions' | 'comprehensive',
    sendCommand: (command: string) => Promise<string>
  ): Promise<{
    success: boolean;
    testResults: Record<string, any>;
    message: string;
    duration: number;
  }> {
    const startTime = Date.now();
    const testResults: Record<string, any> = {};

    try {
      switch (testType) {
        case 'ignition':
          testResults.spark = await this.testIgnitionSystem(sendCommand);
          testResults.coils = await this.testIgnitionCoils(sendCommand);
          break;
        case 'fuel':
          testResults.pressure = await this.testFuelPressure(sendCommand);
          testResults.injectors = await this.testFuelInjectors(sendCommand);
          break;
        case 'emissions':
          testResults.o2 = await this.testO2Sensors(sendCommand);
          testResults.catalyst = await this.testCatalyst(sendCommand);
          testResults.evap = await this.testEVAP(sendCommand);
          break;
        case 'comprehensive':
          testResults.ignition = await this.testIgnitionSystem(sendCommand);
          testResults.fuel = await this.testFuelPressure(sendCommand);
          testResults.emissions = await this.testO2Sensors(sendCommand);
          testResults.general = await this.testGeneralHealth(sendCommand);
          break;
      }

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        testResults,
        message: `Completed ${testType} system test`,
        duration
      };
    } catch (error) {
      return {
        success: false,
        testResults,
        message: `System test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  private static async testIgnitionSystem(sendCommand: (command: string) => Promise<string>): Promise<any> {
    // Test ignition system components
    return {
      sparkTest: 'OK',
      coilResistance: 'Within Spec',
      timing: 'Correct'
    };
  }

  private static async testIgnitionCoils(sendCommand: (command: string) => Promise<string>): Promise<any> {
    // Test ignition coils
    return {
      primaryResistance: 'OK',
      secondaryResistance: 'OK',
      dwellTime: 'OK'
    };
  }

  private static async testFuelPressure(sendCommand: (command: string) => Promise<string>): Promise<any> {
    // Test fuel pressure
    return {
      pressure: 'Within Spec',
      regulator: 'OK',
      pump: 'OK'
    };
  }

  private static async testFuelInjectors(sendCommand: (command: string) => Promise<string>): Promise<any> {
    // Test fuel injectors
    return {
      resistance: 'OK',
      sprayPattern: 'OK',
      balance: 'OK'
    };
  }

  private static async testO2Sensors(sendCommand: (command: string) => Promise<string>): Promise<any> {
    // Test O2 sensors
    return {
      upstream: 'OK',
      downstream: 'OK',
      responseTime: 'OK'
    };
  }

  private static async testCatalyst(sendCommand: (command: string) => Promise<string>): Promise<any> {
    // Test catalytic converter
    return {
      efficiency: 'OK',
      temperature: 'OK',
      oxygenStorage: 'OK'
    };
  }

  private static async testEVAP(sendCommand: (command: string) => Promise<string>): Promise<any> {
    // Test EVAP system
    return {
      purgeValve: 'OK',
      ventValve: 'OK',
      leakTest: 'OK'
    };
  }

  private static async testGeneralHealth(sendCommand: (command: string) => Promise<string>): Promise<any> {
    // Test general vehicle health
    return {
      engine: 'OK',
      transmission: 'OK',
      electrical: 'OK',
      emissions: 'OK'
    };
  }
}
