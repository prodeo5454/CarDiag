import { describe, it, expect } from 'vitest';
import { DiagnosticAI } from './diagnostic-ai';

describe('DiagnosticAI.runExpertAnalysis', () => {
  it('returns analysis for stored DTCs', () => {
    const result = DiagnosticAI.runExpertAnalysis({
      storedDtcs: ['P0300'],
      pendingDtcs: [],
      permanentDtcs: [],
      vehicle: { make: 'Toyota', model: 'Camry', year: 2018, fuelType: 'gasoline' },
    });

    expect(result.rootCauses.length).toBeGreaterThan(0);
    expect(result.repairPlan.length).toBeGreaterThan(0);
    expect(result.proFeatures.length).toBeGreaterThan(3);
    expect(result.aiMode).toBe('expert');
  });

  it('detects EV powertrain', () => {
    const result = DiagnosticAI.runExpertAnalysis({
      storedDtcs: [],
      pendingDtcs: [],
      permanentDtcs: [],
      vehicle: { make: 'Tesla', model: 'Model 3', year: 2022, fuelType: 'electric' },
      evReadings: { '0C': 45, '0D': 28, '0A': 380 },
    });

    expect(result.powertrain).toBe('electric');
    expect(result.evInsights).toBeDefined();
  });
});
