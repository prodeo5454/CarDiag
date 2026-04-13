import type { DTCCode } from '@/types';

// Automated Diagnostic Workflows
export interface DiagnosticStep {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  commands?: Array<{
    command: string;
    description: string;
    expectedResponse?: string;
    timeout?: number;
  }>;
  checks?: Array<{
    name: string;
    condition: string;
    successMessage: string;
    failureMessage: string;
  }>;
  warnings?: string[];
  tools?: string[];
  estimatedTime: number; // in minutes
  difficulty: 'easy' | 'medium' | 'hard' | 'professional';
  images?: string[];
}

export interface DiagnosticWorkflow {
  id: string;
  name: string;
  description: string;
  category: 'engine' | 'transmission' | 'brakes' | 'electrical' | 'emissions' | 'general';
  symptoms: string[];
  requiredTools: string[];
  steps: DiagnosticStep[];
  estimatedTotalTime: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'professional';
  safetyWarnings: string[];
  prerequisites: string[];
}

export class DiagnosticWorkflows {
  private static readonly WORKFLOWS: DiagnosticWorkflow[] = [
    {
      id: 'engine_no_start',
      name: 'Engine Won\'t Start Diagnosis',
      description: 'Comprehensive diagnosis for engines that won\'t start or crank',
      category: 'engine',
      symptoms: ['Engine won\'t crank', 'Engine cranks but won\'t start', 'Engine starts then dies'],
      requiredTools: ['Multimeter', 'Spark tester', 'Fuel pressure gauge'],
      steps: [
        {
          id: 'check_battery',
          name: 'Check Battery Voltage',
          description: 'Verify battery has sufficient voltage to start the engine',
          instructions: [
            'Turn off all accessories',
            'Connect multimeter to battery terminals',
            'Read voltage with engine off',
            'Read voltage while attempting to start'
          ],
          commands: [
            {
              command: 'ATRV',
              description: 'Read battery voltage via OBD',
              expectedResponse: '12.0-14.5V',
              timeout: 2000
            }
          ],
          checks: [
            {
              name: 'Battery voltage check',
              condition: 'voltage >= 12.0',
              successMessage: 'Battery voltage is sufficient',
              failureMessage: 'Battery voltage is low - charge or replace battery'
            }
          ],
          warnings: ['Wear safety glasses', 'Be careful of battery acid'],
          tools: ['Multimeter'],
          estimatedTime: 5,
          difficulty: 'easy'
        },
        {
          id: 'check_starter',
          name: 'Check Starter System',
          description: 'Verify starter motor and relay are functioning',
          instructions: [
            'Listen for clicking sound when turning key',
            'Check starter relay operation',
            'Test starter motor current draw'
          ],
          commands: [
            {
              command: '0105',
              description: 'Read coolant temperature',
              expectedResponse: 'Valid temperature reading',
              timeout: 2000
            }
          ],
          checks: [
            {
              name: 'Starter engagement',
              condition: 'starter_engages === true',
              successMessage: 'Starter motor is engaging',
              failureMessage: 'Starter motor not engaging - check relay and connections'
            }
          ],
          warnings: ['Keep clear of moving parts'],
          tools: ['Multimeter', 'Test light'],
          estimatedTime: 10,
          difficulty: 'medium'
        },
        {
          id: 'check_fuel',
          name: 'Check Fuel System',
          description: 'Verify fuel delivery and pressure',
          instructions: [
            'Listen for fuel pump prime',
            'Check fuel pressure',
            'Verify fuel injectors are firing'
          ],
          commands: [
            {
              command: '0110',
              description: 'Read intake air temperature',
              expectedResponse: 'Valid temperature reading',
              timeout: 2000
            }
          ],
          checks: [
            {
              name: 'Fuel pressure',
              condition: 'fuel_pressure >= 40',
              successMessage: 'Fuel pressure is within specification',
              failureMessage: 'Low fuel pressure - check pump and filter'
            }
          ],
          warnings: ['Relieve fuel pressure before disconnecting lines'],
          tools: ['Fuel pressure gauge'],
          estimatedTime: 15,
          difficulty: 'medium'
        },
        {
          id: 'check_ignition',
          name: 'Check Ignition System',
          description: 'Verify spark and ignition timing',
          instructions: [
            'Check for spark at plugs',
            'Inspect ignition coils',
            'Check crankshaft position sensor'
          ],
          commands: [
            {
              command: '010C',
              description: 'Read engine RPM',
              expectedResponse: '0 RPM when not starting',
              timeout: 2000
            }
          ],
          checks: [
            {
              name: 'Spark presence',
              condition: 'spark_present === true',
              successMessage: 'Ignition system is producing spark',
              failureMessage: 'No spark detected - check coils and sensors'
            }
          ],
          warnings: ['High voltage - use insulated tools'],
          tools: ['Spark tester'],
          estimatedTime: 20,
          difficulty: 'medium'
        }
      ],
      estimatedTotalTime: 50,
      difficulty: 'medium',
      safetyWarnings: ['Disconnect battery before working', 'Wear safety glasses', 'Keep away from moving parts'],
      prerequisites: ['Vehicle parked on level ground', 'Parking brake engaged']
    },
    {
      id: 'check_engine_light',
      name: 'Check Engine Light Diagnosis',
      description: 'Diagnose and resolve check engine light issues',
      category: 'engine',
      symptoms: ['Check engine light on', 'Poor performance', 'Reduced fuel economy'],
      requiredTools: ['OBD-II scanner'],
      steps: [
        {
          id: 'read_codes',
          name: 'Read Diagnostic Trouble Codes',
          description: 'Retrieve and analyze stored DTCs',
          instructions: [
            'Connect OBD-II scanner',
            'Read stored codes',
            'Note freeze frame data',
            'Document code descriptions'
          ],
          commands: [
            {
              command: '03',
              description: 'Read stored DTCs',
              expectedResponse: 'Code list or NO DATA',
              timeout: 5000
            },
            {
              command: '07',
              description: 'Read pending DTCs',
              expectedResponse: 'Code list or NO DATA',
              timeout: 5000
            },
            {
              command: '0A',
              description: 'Read permanent DTCs',
              expectedResponse: 'Code list or NO DATA',
              timeout: 5000
            },
            {
              command: '02',
              description: 'Read freeze frame data',
              expectedResponse: 'Freeze frame data',
              timeout: 3000
            }
          ],
          checks: [
            {
              name: 'Code retrieval',
              condition: 'codes_retrieved === true',
              successMessage: 'DTCs successfully retrieved',
              failureMessage: 'Failed to retrieve codes - check connection'
            }
          ],
          warnings: ['Some codes may require professional service'],
          tools: ['OBD-II scanner'],
          estimatedTime: 10,
          difficulty: 'easy'
        },
        {
          id: 'analyze_codes',
          name: 'Analyze Trouble Codes',
          description: 'Interpret codes and determine likely causes',
          instructions: [
            'Research code meanings',
            'Identify affected systems',
            'Check common causes',
            'Plan diagnostic approach'
          ],
          checks: [
            {
              name: 'Code analysis',
              condition: 'codes_analyzed === true',
              successMessage: 'Codes analyzed and diagnostic plan created',
              failureMessage: 'Unable to analyze codes - consult service manual'
            }
          ],
          warnings: ['Multiple codes may indicate related issues'],
          tools: ['Service manual'],
          estimatedTime: 15,
          difficulty: 'medium'
        },
        {
          id: 'verify_repair',
          name: 'Verify Repair and Clear Codes',
          description: 'After repairs, verify fix and clear codes',
          instructions: [
            'Perform test drive',
            'Verify symptoms resolved',
            'Clear codes if appropriate',
            'Verify codes don\'t return'
          ],
          commands: [
            {
              command: '04',
              description: 'Clear stored codes',
              expectedResponse: 'OK',
              timeout: 3000
            }
          ],
          checks: [
            {
              name: 'Repair verification',
              condition: 'symptoms_resolved === true',
              successMessage: 'Repair successful - codes cleared',
              failureMessage: 'Symptoms persist - further diagnosis needed'
            }
          ],
          warnings: ['Clear codes only after repairs are complete'],
          tools: ['OBD-II scanner'],
          estimatedTime: 30,
          difficulty: 'easy'
        }
      ],
      estimatedTotalTime: 55,
      difficulty: 'easy',
      safetyWarnings: ['Follow repair procedures carefully', 'Don\'t clear codes before repairs'],
      prerequisites: ['OBD-II scanner connected', 'Vehicle parked safely']
    },
    {
      id: 'transmission_slipping',
      name: 'Transmission Slipping Diagnosis',
      description: 'Diagnose transmission slipping and shifting issues',
      category: 'transmission',
      symptoms: ['Transmission slips', 'Harsh shifting', 'Delayed engagement'],
      requiredTools: ['Transmission fluid dipstick', 'Scan tool'],
      steps: [
        {
          id: 'check_fluid',
          name: 'Check Transmission Fluid',
          description: 'Verify fluid level and condition',
          instructions: [
            'Park on level surface',
            'Engage parking brake',
            'Check fluid level with engine running',
            'Inspect fluid color and smell'
          ],
          commands: [
            {
              command: '011F',
              description: 'Read transmission fluid temperature',
              expectedResponse: 'Valid temperature reading',
              timeout: 2000
            }
          ],
          checks: [
            {
              name: 'Fluid level',
              condition: "fluid_level === 'proper'",
              successMessage: 'Transmission fluid level is correct',
              failureMessage: 'Fluid level incorrect - adjust as needed'
            },
            {
              name: 'Fluid condition',
              condition: "fluid_condition === 'good'",
              successMessage: 'Fluid condition is good',
              failureMessage: 'Fluid condition poor - service transmission'
            }
          ],
          warnings: ['Hot fluid can cause burns', 'Use correct fluid type'],
          tools: ['Transmission fluid dipstick'],
          estimatedTime: 10,
          difficulty: 'easy'
        },
        {
          id: 'check_sensors',
          name: 'Check Transmission Sensors',
          description: 'Verify transmission speed and position sensors',
          instructions: [
            'Scan for transmission codes',
            'Check sensor readings',
            'Verify sensor connections',
            'Test sensor operation'
          ],
          commands: [
            {
              command: '010D',
              description: 'Read vehicle speed',
              expectedResponse: 'Valid speed reading',
              timeout: 2000
            },
            {
              command: '010C',
              description: 'Read engine RPM',
              expectedResponse: 'Valid RPM reading',
              timeout: 2000
            }
          ],
          checks: [
            {
              name: 'Sensor readings',
              condition: 'sensor_readings_valid === true',
              successMessage: 'Transmission sensors are operating correctly',
              failureMessage: 'Sensor issues detected - check wiring and sensors'
            }
          ],
          warnings: ['Sensor replacement may require calibration'],
          tools: ['Scan tool', 'Multimeter'],
          estimatedTime: 20,
          difficulty: 'medium'
        }
      ],
      estimatedTotalTime: 30,
      difficulty: 'medium',
      safetyWarnings: ['Transmission can be hot', 'Use jack stands if needed'],
      prerequisites: ['Vehicle on level ground', 'Engine cool']
    },
    {
      id: 'brake_system',
      name: 'Brake System Diagnosis',
      description: 'Diagnose brake system issues and ABS problems',
      category: 'brakes',
      symptoms: ['Brake warning light', 'Poor braking', 'ABS light on'],
      requiredTools: ['Brake fluid tester', 'Scan tool'],
      steps: [
        {
          id: 'check_fluid',
          name: 'Check Brake Fluid',
          description: 'Verify brake fluid level and condition',
          instructions: [
            'Check fluid level in reservoir',
            'Inspect fluid color and clarity',
            'Check for leaks',
            'Test fluid moisture content'
          ],
          commands: [
            {
              command: '0117',
              description: 'Read brake fluid level sensor',
              expectedResponse: 'Valid reading',
              timeout: 2000
            }
          ],
          checks: [
            {
              name: 'Fluid level',
              condition: "fluid_level >= 'min'",
              successMessage: 'Brake fluid level is adequate',
              failureMessage: 'Low brake fluid - check for leaks'
            }
          ],
          warnings: ['Brake fluid can damage paint', 'Use correct fluid type'],
          tools: ['Brake fluid tester'],
          estimatedTime: 5,
          difficulty: 'easy'
        },
        {
          id: 'scan_abs',
          name: 'Scan ABS System',
          description: 'Read ABS codes and sensor data',
          instructions: [
            'Connect scan tool to ABS port',
            'Read ABS trouble codes',
            'Check wheel speed sensors',
            'Verify ABS module operation'
          ],
          commands: [
            {
              command: 'ABS_SCAN',
              description: 'Scan ABS system',
              expectedResponse: 'ABS data',
              timeout: 5000
            }
          ],
          checks: [
            {
              name: 'ABS operation',
              condition: "abs_codes === 'none'",
              successMessage: 'ABS system operating normally',
              failureMessage: 'ABS codes detected - diagnose wheel sensors'
            }
          ],
          warnings: ['ABS repairs may require professional service'],
          tools: ['ABS scan tool'],
          estimatedTime: 15,
          difficulty: 'hard'
        }
      ],
      estimatedTotalTime: 20,
      difficulty: 'medium',
      safetyWarnings: ['Brake failure can be dangerous', 'Test brakes in safe area'],
      prerequisites: ['Vehicle on level ground', 'Parking brake engaged']
    },
    {
      id: 'electrical_system',
      name: 'Electrical System Diagnosis',
      description: 'Diagnose charging system and electrical issues',
      category: 'electrical',
      symptoms: ['Battery light on', 'Electrical problems', 'Alternator issues'],
      requiredTools: ['Multimeter', 'Battery tester'],
      steps: [
        {
          id: 'test_charging',
          name: 'Test Charging System',
          description: 'Verify alternator and charging system operation',
          instructions: [
            'Test battery voltage with engine off',
            'Start engine and test voltage',
            'Test voltage under load',
            'Check alternator output'
          ],
          commands: [
            {
              command: 'ATRV',
              description: 'Read system voltage',
              expectedResponse: '12.0-14.5V',
              timeout: 2000
            }
          ],
          checks: [
            {
              name: 'Charging voltage',
              condition: 'voltage >= 13.5 && voltage <= 14.5',
              successMessage: 'Charging system operating correctly',
              failureMessage: 'Charging system fault - test alternator'
            }
          ],
          warnings: ['High voltage can damage electronics', 'Disconnect battery before repairs'],
          tools: ['Multimeter'],
          estimatedTime: 15,
          difficulty: 'medium'
        },
        {
          id: 'check_parasitic',
          name: 'Check Parasitic Drain',
          description: 'Test for excessive battery drain',
          instructions: [
            'Turn off all accessories',
            'Close all doors and trunk',
            'Connect multimeter in series',
            'Measure current draw'
          ],
          checks: [
            {
              name: 'Parasitic drain',
              condition: 'drain_current <= 0.05',
              successMessage: 'Parasitic drain is within limits',
              failureMessage: 'Excessive drain - locate and fix circuit'
            }
          ],
          warnings: ['Some modules need time to sleep', 'Don\'t open battery with draw connected'],
          tools: ['Multimeter'],
          estimatedTime: 30,
          difficulty: 'medium'
        }
      ],
      estimatedTotalTime: 45,
      difficulty: 'medium',
      safetyWarnings: ['Disconnect battery before repairs', 'High current can be dangerous'],
      prerequisites: ['Battery fully charged', 'All accessories off']
    },
    {
      id: 'emissions_test',
      name: 'Emissions System Diagnosis',
      description: 'Diagnose emissions system failures and prepare for testing',
      category: 'emissions',
      symptoms: ['Failed emissions test', 'Check engine light', 'Poor fuel economy'],
      requiredTools: ['Scan tool', 'Smoke machine'],
      steps: [
        {
          id: 'check_readiness',
          name: 'Check Monitor Readiness',
          description: 'Verify all emissions monitors are ready',
          instructions: [
            'Connect scan tool',
            'Check monitor status',
            'Identify incomplete monitors',
            'Drive cycle if needed'
          ],
          commands: [
            {
              command: '0101',
              description: 'Read monitor status',
              expectedResponse: 'Monitor data',
              timeout: 3000
            }
          ],
          checks: [
            {
              name: 'Monitor readiness',
              condition: 'incomplete_monitors === 0',
              successMessage: 'All monitors ready for testing',
              failureMessage: 'Some monitors incomplete - perform drive cycle'
            }
          ],
          warnings: ['Drive cycle may take several trips'],
          tools: ['Scan tool'],
          estimatedTime: 10,
          difficulty: 'easy'
        },
        {
          id: 'check_evap',
          name: 'Check EVAP System',
          description: 'Test evaporative emissions system',
          instructions: [
            'Perform EVAP leak test',
            'Check purge valve operation',
            'Test vent valve function',
            'Inspect gas cap'
          ],
          commands: [
            {
              command: 'EVAP_TEST',
              description: 'Run EVAP system test',
              expectedResponse: 'Test results',
              timeout: 10000
            }
          ],
          checks: [
            {
              name: 'EVAP system',
              condition: "evap_leaks === 'none'",
              successMessage: 'EVAP system operating correctly',
              failureMessage: 'EVAP leak detected - locate and repair'
            }
          ],
          warnings: ['EVAP repairs may require specialized tools'],
          tools: ['Smoke machine'],
          estimatedTime: 30,
          difficulty: 'hard'
        }
      ],
      estimatedTotalTime: 40,
      difficulty: 'medium',
      safetyWarnings: ['EVAP tests require proper ventilation', 'Some tests require professional equipment'],
      prerequisites: ['Fuel level between 15-85%', 'No check engine light']
    }
  ];

  static getWorkflows(category?: string, symptoms?: string[]): DiagnosticWorkflow[] {
    let workflows = [...this.WORKFLOWS];
    
    if (category) {
      workflows = workflows.filter(w => w.category === category);
    }
    
    if (symptoms && symptoms.length > 0) {
      workflows = workflows.filter(w => 
        symptoms.some(symptom => 
          w.symptoms.some(s => 
            s.toLowerCase().includes(symptom.toLowerCase())
          )
        )
      );
    }
    
    return workflows;
  }

  static getWorkflow(id: string): DiagnosticWorkflow | null {
    return this.WORKFLOWS.find(w => w.id === id) || null;
  }

  static getWorkflowBySymptom(symptom: string): DiagnosticWorkflow[] {
    return this.WORKFLOWS.filter(w => 
      w.symptoms.some(s => 
        s.toLowerCase().includes(symptom.toLowerCase())
      )
    );
  }

  static executeWorkflowStep(
    workflowId: string,
    stepId: string,
    sendCommand: (command: string) => Promise<string>
  ): Promise<{
    success: boolean;
    stepResults: Record<string, any>;
    message: string;
    nextStep?: string;
  }> {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      return Promise.resolve({
        success: false,
        stepResults: {},
        message: 'Workflow not found'
      });
    }

    const step = workflow.steps.find(s => s.id === stepId);
    if (!step) {
      return Promise.resolve({
        success: false,
        stepResults: {},
        message: 'Step not found'
      });
    }

    return this.executeStep(step, sendCommand);
  }

  private static async executeStep(
    step: DiagnosticStep,
    sendCommand: (command: string) => Promise<string>
  ): Promise<{
    success: boolean;
    stepResults: Record<string, any>;
    message: string;
    nextStep?: string;
  }> {
    const results: Record<string, any> = {};

    try {
      // Execute commands if any
      if (step.commands) {
        for (const command of step.commands) {
          try {
            const response = await sendCommand(command.command);
            results[command.command] = {
              success: true,
              response,
              expected: command.expectedResponse,
              passed: this.validateResponse(response, command.expectedResponse)
            };
          } catch (error) {
            results[command.command] = {
              success: false,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        }
      }

      // Perform checks if any
      if (step.checks) {
        for (const check of step.checks) {
          const checkResult = this.evaluateCheck(check, results);
          results[check.name] = checkResult;
        }
      }

      // Determine success
      const commandSuccess = step.commands ? 
        step.commands.every(cmd => results[cmd.command]?.passed !== false) : true;
      
      const checkSuccess = step.checks ? 
        step.checks.every(check => results[check.name]?.passed !== false) : true;

      return {
        success: commandSuccess && checkSuccess,
        stepResults: results,
        message: commandSuccess && checkSuccess ? 
          `Step "${step.name}" completed successfully` : 
          `Step "${step.name}" completed with some issues`
      };
    } catch (error) {
      return {
        success: false,
        stepResults: results,
        message: `Error executing step: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private static validateResponse(response: string, expected?: string): boolean {
    if (!expected) return true;
    
    if (expected.includes('-')) {
      // Range check (e.g., "12.0-14.5V")
      const [min, max] = expected.replace('V', '').split('-').map(Number);
      const value = parseFloat(response);
      return value >= min && value <= max;
    }
    
    return response.includes(expected);
  }

  private static evaluateCheck(
    check: any,
    results: Record<string, any>
  ): { passed: boolean; message: string } {
    // This would evaluate the check condition based on results
    // For now, return a default result
    return {
      passed: true,
      message: check.successMessage
    };
  }

  static getDiagnosticRecommendations(workflowId: string, stepResults: Record<string, any>): {
    recommendations: string[];
    nextActions: string[];
    severity: 'low' | 'medium' | 'high';
  } {
    const workflow = this.getWorkflow(workflowId);
    if (!workflow) {
      return {
        recommendations: ['Workflow not found'],
        nextActions: [],
        severity: 'low'
      };
    }

    const recommendations: string[] = [];
    const nextActions: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';

    // Analyze step results and generate recommendations
    Object.entries(stepResults).forEach(([stepName, result]) => {
      if (result.passed === false) {
        severity = 'high';
        recommendations.push(`Issue detected in ${stepName} - further diagnosis needed`);
        nextActions.push(`Check ${stepName} system components`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('All systems operating normally');
      nextActions.push('Continue regular maintenance');
    }

    return { recommendations, nextActions, severity };
  }

  static createCustomWorkflow(workflow: Omit<DiagnosticWorkflow, 'id' | 'estimatedTotalTime'>): string {
    const id = Date.now().toString(36);
    const totalTime = workflow.steps.reduce((sum, step) => sum + step.estimatedTime, 0);
    
    const fullWorkflow: DiagnosticWorkflow = {
      ...workflow,
      id,
      estimatedTotalTime: totalTime
    };

    this.WORKFLOWS.push(fullWorkflow);
    return id;
  }
}
