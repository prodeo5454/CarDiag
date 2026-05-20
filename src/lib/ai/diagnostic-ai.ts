import { searchDTCByCode } from '@/lib/dtc-database';
import { CostEstimator, type RepairCost } from '@/lib/obd/cost-estimator';
import { EVPIDSupport } from '@/lib/obd/ev-pids';
import {
  inferPowertrain,
  getVehicleCoverage,
  type PowertrainType,
} from '@/lib/vehicle-compatibility';
import { getAIConfig, isCloudAIReady } from './ai-config';
import type { EVData } from '@/types';

export interface AIAnalysisRequest {
  storedDtcs: string[];
  pendingDtcs: string[];
  permanentDtcs: string[];
  liveData?: Record<string, number>;
  evReadings?: Record<string, number>;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    fuelType?: string;
    mileage?: number;
    vin?: string;
  };
  healthScore?: number;
  protocol?: string;
  voltage?: string;
}

export interface RootCause {
  cause: string;
  likelihood: number;
  evidence: string[];
  systems: string[];
}

export interface RepairStep {
  step: number;
  action: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'professional';
  estimatedMinutes: number;
  tools?: string[];
}

export interface EVInsights {
  batteryHealth: number;
  batteryStatus: string;
  chargingStatus: string;
  thermalStatus: string;
  efficiencyStatus: string;
  recommendations: string[];
  powerOutputKw: number;
}

export interface AIAnalysisResult {
  summary: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  powertrain: PowertrainType;
  rootCauses: RootCause[];
  repairPlan: RepairStep[];
  systemImpacts: Array<{ system: string; status: 'ok' | 'warning' | 'critical'; detail: string }>;
  evInsights?: EVInsights;
  costEstimate?: RepairCost;
  proFeatures: string[];
  warnings: string[];
  aiMode: 'expert' | 'cloud' | 'hybrid';
  generatedAt: string;
}

export class DiagnosticAI {
  static async analyze(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const expert = this.runExpertAnalysis(request);
    const config = getAIConfig();

    if (isCloudAIReady() && !config.preferExpertFirst) {
      try {
        const cloud = await this.runCloudAnalysis(request, expert);
        return cloud;
      } catch {
        return { ...expert, warnings: [...expert.warnings, 'Cloud AI unavailable — using expert engine'] };
      }
    }

    if (isCloudAIReady() && config.preferExpertFirst) {
      try {
        const cloud = await this.runCloudAnalysis(request, expert);
        return this.mergeAnalyses(expert, cloud);
      } catch {
        return expert;
      }
    }

    return expert;
  }

  static runExpertAnalysis(request: AIAnalysisRequest): AIAnalysisResult {
    const powertrain = inferPowertrain(
      request.vehicle?.fuelType,
      request.vehicle?.make
    );
    const coverage = getVehicleCoverage(powertrain);
    const allCodes = [
      ...request.storedDtcs,
      ...request.pendingDtcs,
      ...request.permanentDtcs,
    ];

    const rootCauses = this.inferRootCauses(allCodes, request, powertrain);
    const severity = this.computeSeverity(request, rootCauses);
    const systemImpacts = this.analyzeSystems(request, allCodes, powertrain);
    const repairPlan = this.buildRepairPlan(rootCauses, allCodes, powertrain);
    const evInsights = this.analyzeEV(request, powertrain);
    const warnings = this.buildWarnings(request, allCodes, powertrain);

    let costEstimate: RepairCost | undefined;
    if (allCodes.length > 0 && request.vehicle?.make) {
      costEstimate = CostEstimator.estimateRepairCost({
        dtcCodes: allCodes,
        symptoms: rootCauses.map(r => r.cause),
        vehicleMake: request.vehicle.make,
        vehicleModel: request.vehicle.model || 'Unknown',
        vehicleYear: request.vehicle.year || new Date().getFullYear(),
        mileage: request.vehicle.mileage || 0,
        location: 'independent',
      });
    }

    const confidence = this.computeConfidence(request, allCodes, rootCauses);
    const summary = this.buildSummary(severity, allCodes, rootCauses, powertrain, evInsights);

    return {
      summary,
      confidence,
      severity,
      powertrain,
      rootCauses,
      repairPlan,
      systemImpacts,
      evInsights,
      costEstimate,
      proFeatures: this.getProFeatures(coverage),
      warnings,
      aiMode: 'expert',
      generatedAt: new Date().toISOString(),
    };
  }

  private static inferRootCauses(
    codes: string[],
    request: AIAnalysisRequest,
    powertrain: PowertrainType
  ): RootCause[] {
    const causes: RootCause[] = [];
    const seen = new Set<string>();

    for (const code of codes) {
      const dtc = searchDTCByCode(code);
      const primary = dtc?.possibleCauses[0] || `Fault indicated by ${code}`;
      const key = `${code}:${primary}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const evidence: string[] = [];
      if (request.storedDtcs.includes(code)) evidence.push('Stored DTC confirmed');
      if (request.pendingDtcs.includes(code)) evidence.push('Pending / intermittent');
      if (request.permanentDtcs.includes(code)) evidence.push('Permanent — emissions critical');
      if (dtc?.symptoms[0]) evidence.push(`Symptom: ${dtc.symptoms[0]}`);

      const likelihood =
        request.permanentDtcs.includes(code) ? 95 :
        request.storedDtcs.includes(code) ? 85 :
        65;

      causes.push({
        cause: primary,
        likelihood,
        evidence,
        systems: [dtc?.system || this.systemFromCode(code)],
      });
    }

    if (powertrain === 'electric' || powertrain === 'plugin_hybrid' || powertrain === 'hybrid') {
      const ev = request.evReadings;
      if (ev) {
        const soc = ev['0C'] ?? ev['A2'] ?? ev['C1'];
        const temp = ev['0D'];
        if (soc !== undefined && soc < 15) {
          causes.push({
            cause: 'High-voltage battery critically low SOC',
            likelihood: 90,
            evidence: [`SOC ${soc.toFixed(1)}%`],
            systems: ['HV Battery'],
          });
        }
        if (temp !== undefined && temp > 45) {
          causes.push({
            cause: 'Battery thermal management stress',
            likelihood: 80,
            evidence: [`Pack temp ${temp}°C`],
            systems: ['Thermal Management'],
          });
        }
      }
    }

    if (request.liveData) {
      const coolant = request.liveData['05'];
      if (coolant !== undefined && coolant > 105) {
        causes.push({
          cause: 'Engine overheating — cooling system fault',
          likelihood: 88,
          evidence: [`Coolant ${coolant}°C`],
          systems: ['Cooling'],
        });
      }
    }

    if (codes.length === 0) {
      causes.push({
        cause: 'No active faults — preventive inspection recommended',
        likelihood: 70,
        evidence: ['Clean DTC scan', request.healthScore ? `Health score ${request.healthScore}` : ''].filter(Boolean),
        systems: ['General'],
      });
    }

    return causes.sort((a, b) => b.likelihood - a.likelihood).slice(0, 8);
  }

  private static systemFromCode(code: string): string {
    if (code.startsWith('P')) return 'Powertrain';
    if (code.startsWith('C')) return 'Chassis';
    if (code.startsWith('B')) return 'Body';
    if (code.startsWith('U')) return 'Network/CAN';
    return 'Unknown';
  }

  private static computeSeverity(
    request: AIAnalysisRequest,
    causes: RootCause[]
  ): AIAnalysisResult['severity'] {
    if (request.permanentDtcs.length > 0) return 'critical';
    if (request.storedDtcs.length >= 3) return 'high';
    if (request.storedDtcs.length > 0) return 'medium';
    if (causes.some(c => c.likelihood >= 85 && c.systems.includes('HV Battery'))) return 'high';
    return 'low';
  }

  private static analyzeSystems(
    request: AIAnalysisRequest,
    codes: string[],
    powertrain: PowertrainType
  ): AIAnalysisResult['systemImpacts'] {
    const systems = new Map<string, AIAnalysisResult['systemImpacts'][0]>();

    const add = (name: string, status: 'ok' | 'warning' | 'critical', detail: string) => {
      const existing = systems.get(name);
      if (!existing || status === 'critical' || (status === 'warning' && existing.status === 'ok')) {
        systems.set(name, { system: name, status, detail });
      }
    };

    for (const code of codes) {
      const sys = this.systemFromCode(code);
      const sev = request.permanentDtcs.includes(code) ? 'critical' as const
        : request.storedDtcs.includes(code) ? 'warning' as const : 'warning' as const;
      add(sys, sev, `DTC ${code} active`);
    }

    if (powertrain === 'electric' || powertrain === 'hybrid' || powertrain === 'plugin_hybrid') {
      add('HV Battery', codes.length ? 'warning' : 'ok', 'EV stack monitored');
      add('Motor/Inverter', 'ok', 'Traction system');
      add('Charging', 'ok', 'AC/DC charge path');
    }

    if (codes.length === 0) {
      add('Powertrain', 'ok', 'No codes reported');
      add('Emissions', 'ok', 'I/M monitors nominal');
    }

    return Array.from(systems.values());
  }

  private static buildRepairPlan(
    causes: RootCause[],
    codes: string[],
    powertrain: PowertrainType
  ): RepairStep[] {
    const steps: RepairStep[] = [];
    let n = 1;

    steps.push({
      step: n++,
      action: 'Verify DTCs with key-on engine-off and KOER tests',
      difficulty: 'easy',
      estimatedMinutes: 10,
      tools: ['OBD-II scanner'],
    });

    if (codes.some(c => c.startsWith('U'))) {
      steps.push({
        step: n++,
        action: 'Inspect CAN bus wiring and module connectors for corrosion',
        difficulty: 'medium',
        estimatedMinutes: 45,
        tools: ['Multimeter', 'Wiring diagram'],
      });
    }

    for (const cause of causes.slice(0, 3)) {
      const dtc = codes.find(c => searchDTCByCode(c)?.possibleCauses[0] === cause.cause);
      const lookup = dtc ? searchDTCByCode(dtc) : null;
      const solution = lookup?.solutions[0] || `Diagnose: ${cause.cause}`;
      steps.push({
        step: n++,
        action: solution,
        difficulty: codes.length > 2 ? 'professional' : 'medium',
        estimatedMinutes: 60,
      });
    }

    if (powertrain === 'electric' || powertrain === 'plugin_hybrid') {
      steps.push({
        step: n++,
        action: 'Perform HV isolation and battery health snapshot (service manual procedure)',
        difficulty: 'professional',
        estimatedMinutes: 90,
        tools: ['Insulation tester', 'HV PPE'],
      });
    }

    steps.push({
      step: n++,
      action: 'Clear codes after repair and complete drive cycle for readiness',
      difficulty: 'easy',
      estimatedMinutes: 20,
    });

    return steps;
  }

  private static analyzeEV(
    request: AIAnalysisRequest,
    powertrain: PowertrainType
  ): EVInsights | undefined {
    if (!['electric', 'hybrid', 'plugin_hybrid'].includes(powertrain)) return undefined;
    const readings = request.evReadings;
    if (!readings || Object.keys(readings).length === 0) {
      return {
        batteryHealth: 0,
        batteryStatus: 'No EV data — connect and poll EV PIDs',
        chargingStatus: 'Unknown',
        thermalStatus: 'Unknown',
        efficiencyStatus: 'Unknown',
        recommendations: ['Select EV profile and run EV scan from Advanced Diagnostics'],
        powerOutputKw: 0,
      };
    }

    const manufacturer = request.vehicle?.make;
    const evData = EVPIDSupport.parseEVData(new Map(Object.entries(readings)), manufacturer);
    const health = EVPIDSupport.getBatteryHealth(
      evData.stateOfCharge,
      evData.batteryVoltage,
      evData.batteryTemperature
    );
    const thermal = EVPIDSupport.getThermalStatus(
      evData.batteryTemperature,
      readings['10'] ?? 25,
      readings['13'] ?? 1
    );
    const efficiency = EVPIDSupport.getEfficiencyMetrics(
      evData.motorRPM,
      evData.batteryCurrent,
      evData.batteryVoltage
    );
    const chargingRecs = EVPIDSupport.getChargingRecommendations(
      evData.chargingStatus,
      evData.stateOfCharge,
      evData.batteryTemperature
    );

    return {
      batteryHealth: health.health,
      batteryStatus: health.status,
      chargingStatus: evData.chargingStatus,
      thermalStatus: thermal.status,
      efficiencyStatus: efficiency.status,
      recommendations: [...health.recommendations, ...thermal.recommendations, ...chargingRecs],
      powerOutputKw: efficiency.powerOutput,
    };
  }

  private static buildWarnings(
    request: AIAnalysisRequest,
    codes: string[],
    powertrain: PowertrainType
  ): string[] {
    const w: string[] = [];
    if (request.permanentDtcs.length) {
      w.push('Permanent DTCs present — may require drive cycle or dealer reprogram');
    }
    if (codes.some(c => c.startsWith('B') && c.includes('0'))) {
      w.push('SRS/airbag codes detected — professional service required');
    }
    if (powertrain === 'electric') {
      w.push('HV safety: use insulated tools and follow OEM lockout procedure');
    }
    return w;
  }

  private static computeConfidence(
    request: AIAnalysisRequest,
    codes: string[],
    causes: RootCause[]
  ): number {
    let c = 60;
    if (request.vehicle?.vin) c += 10;
    if (request.liveData && Object.keys(request.liveData).length > 3) c += 10;
    if (codes.length > 0) c += 10;
    if (causes.length > 0 && causes[0].likelihood > 80) c += 10;
    return Math.min(98, c);
  }

  private static buildSummary(
    severity: AIAnalysisResult['severity'],
    codes: string[],
    causes: RootCause[],
    powertrain: PowertrainType,
    ev?: EVInsights
  ): string {
    if (codes.length === 0) {
      return `Vehicle scan complete (${powertrain}). No active DTCs. ${ev ? `Battery: ${ev.batteryStatus}.` : ''} Continue monitoring with AI live analysis.`;
    }
    const top = causes[0]?.cause || 'Multiple faults';
    return `${severity.toUpperCase()} diagnostic result: ${codes.length} code(s). Primary focus: ${top}. Powertrain profile: ${powertrain}.`;
  }

  private static getProFeatures(coverage: ReturnType<typeof getVehicleCoverage>): string[] {
    return [
      'AI root-cause ranking with evidence chain',
      'Bi-directional actuator tests (mode 08)',
      'Guided step-by-step workflows',
      `${coverage.protocols.length} protocol families`,
      coverage.evManufacturerPIDs ? 'OEM EV HV battery & motor PIDs' : 'Standard OBD-II PID suite',
      coverage.protocols.includes('j1939') ? 'SAE J1939 commercial PGN/SPN' : 'Multi-ECU CAN discovery',
      'Repair cost estimation (parts + labor)',
      'Permanent / pending / stored DTC triage',
      'Cloud AI enhancement (optional API)',
    ];
  }

  private static async runCloudAnalysis(
    request: AIAnalysisRequest,
    expert: AIAnalysisResult
  ): Promise<AIAnalysisResult> {
    const config = getAIConfig();
    const prompt = `You are an master automotive diagnostic AI (exceeding pro scan tools). Analyze this OBD data and respond ONLY with valid JSON matching: { "summary": string, "severity": "low"|"medium"|"high"|"critical", "rootCauses": [{"cause":string,"likelihood":number,"evidence":string[],"systems":string[]}], "repairPlan": [{"step":number,"action":string,"difficulty":string,"estimatedMinutes":number}], "warnings": string[] }
Vehicle: ${JSON.stringify(request.vehicle)}
DTCs stored: ${request.storedDtcs.join(', ')}
pending: ${request.pendingDtcs.join(', ')}
permanent: ${request.permanentDtcs.join(', ')}
Expert baseline: ${expert.summary}`;

    const res = await fetch(`${config.apiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: 'Expert automotive diagnostician. JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) throw new Error(`Cloud AI error ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');
    const parsed = JSON.parse(content);

    return {
      ...expert,
      summary: parsed.summary || expert.summary,
      severity: parsed.severity || expert.severity,
      rootCauses: parsed.rootCauses?.length ? parsed.rootCauses : expert.rootCauses,
      repairPlan: parsed.repairPlan?.length ? parsed.repairPlan : expert.repairPlan,
      warnings: [...expert.warnings, ...(parsed.warnings || [])],
      aiMode: 'cloud',
    };
  }

  private static mergeAnalyses(
    expert: AIAnalysisResult,
    cloud: AIAnalysisResult
  ): AIAnalysisResult {
    return {
      ...expert,
      summary: cloud.summary || expert.summary,
      rootCauses: cloud.rootCauses.length ? cloud.rootCauses : expert.rootCauses,
      repairPlan: cloud.repairPlan.length ? cloud.repairPlan : expert.repairPlan,
      warnings: Array.from(new Set([...expert.warnings, ...cloud.warnings])),
      aiMode: 'hybrid',
      confidence: Math.min(98, expert.confidence + 5),
    };
  }
}
