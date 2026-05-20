'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  Zap,
  Truck,
  ListChecks,
  Shield,
  Globe,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Plug,
  Battery,
  Thermometer,
  DollarSign,
  Play,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOBD } from '@/lib/obd/OBDContext';
import { DiagnosticAI, type AIAnalysisResult } from '@/lib/ai/diagnostic-ai';
import { DiagnosticWorkflows } from '@/lib/obd/diagnostic-workflows';
import { EVPIDSupport } from '@/lib/obd/ev-pids';
import { J1939Protocol } from '@/lib/obd/j1939-protocol';
import { VehicleManager } from '@/lib/vehicle-manager';
import {
  COVERAGE_STATS,
  getCoverageLabel,
  getVehicleCoverage,
  inferPowertrain,
} from '@/lib/vehicle-compatibility';
import { isCloudAIReady } from '@/lib/ai/ai-config';
import { HubPageHeader, HubTabBar } from '@/components/layout/HubPageHeader';

type Tab = 'ai' | 'ev' | 'workflows' | 'commercial' | 'coverage';

export default function AdvancedDiagnosticsHub() {
  const {
    connectionState,
    readDTCs,
    readPendingDTCs,
    readPermanentDTCs,
    readPIDValue,
    getSupportedPIDs,
    sendCommand,
    liveReadings,
  } = useOBD();

  const isConnected = connectionState.status === 'connected';
  const [tab, setTab] = useState<Tab>('ai');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [evReadings, setEvReadings] = useState<Record<string, number>>({});
  const [workflowRunning, setWorkflowRunning] = useState<string | null>(null);
  const [workflowLog, setWorkflowLog] = useState<string[]>([]);
  const [j1939Probing, setJ1939Probing] = useState(false);
  const [j1939Samples, setJ1939Samples] = useState<Array<{ label: string; value: string }>>([]);
  const [j1939Log, setJ1939Log] = useState<string[]>([]);

  const activeVehicle = VehicleManager.getActiveVehicle();
  const powertrain = inferPowertrain(activeVehicle?.fuelType, activeVehicle?.make);
  const coverage = getVehicleCoverage(powertrain);
  const evManufacturer = activeVehicle?.make || '';

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'ai', label: 'AI Assistant', icon: Brain },
    { id: 'ev', label: 'EV / Hybrid', icon: Zap },
    { id: 'workflows', label: 'Guided Tests', icon: ListChecks },
    { id: 'commercial', label: 'J1939 HD', icon: Truck },
    { id: 'coverage', label: 'Coverage', icon: Globe },
  ];

  const runAIAnalysis = useCallback(async () => {
    setAnalyzing(true);
    try {
      let stored: string[] = [];
      let pending: string[] = [];
      let permanent: string[] = [];

      if (isConnected) {
        [stored, pending, permanent] = await Promise.all([
          readDTCs(),
          readPendingDTCs(),
          readPermanentDTCs(),
        ]);
      }

      const liveData: Record<string, number> = {};
      liveReadings.forEach((r, pid) => {
        liveData[pid] = r.value;
      });

      const result = await DiagnosticAI.analyze({
        storedDtcs: stored,
        pendingDtcs: pending,
        permanentDtcs: permanent,
        liveData,
        evReadings,
        vehicle: activeVehicle
          ? {
              make: activeVehicle.make,
              model: activeVehicle.model,
              year: activeVehicle.year,
              fuelType: activeVehicle.fuelType,
              mileage: activeVehicle.currentMileage,
              vin: activeVehicle.vin,
            }
          : connectionState.vin
            ? { make: 'Unknown', model: 'Unknown', year: new Date().getFullYear(), vin: connectionState.vin }
            : undefined,
        protocol: connectionState.protocol || undefined,
        voltage: connectionState.voltage || undefined,
      });

      setAnalysis(result);
      toast.success(`AI analysis complete (${result.aiMode} engine)`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [
    isConnected,
    readDTCs,
    readPendingDTCs,
    readPermanentDTCs,
    liveReadings,
    evReadings,
    activeVehicle,
    connectionState,
  ]);

  const scanEVPIDs = useCallback(async () => {
    if (!isConnected) {
      toast.error('Connect OBD adapter first');
      return;
    }
    const pids = EVPIDSupport.getAllEVPIDs(evManufacturer);
    const readings: Record<string, number> = {};
    for (const def of Object.values(pids)) {
      try {
        const r = await readPIDValue(def);
        if (r) readings[def.pid] = r.value;
      } catch {
        /* PID may not be supported on this ECU */
      }
    }
    setEvReadings(readings);
    toast.success(`Polled ${Object.keys(readings).length} EV parameters`);
  }, [isConnected, readPIDValue, evManufacturer]);

  const runWorkflowStep = async (workflowId: string) => {
    if (!isConnected) {
      toast.error('Connect to run guided workflow');
      return;
    }
    setWorkflowRunning(workflowId);
    setWorkflowLog([]);
    const workflow = DiagnosticWorkflows.getWorkflow(workflowId);
    if (!workflow) return;

    for (const step of workflow.steps) {
      setWorkflowLog(prev => [...prev, `▶ ${step.name}...`]);
      const result = await DiagnosticWorkflows.executeWorkflowStep(
        workflowId,
        step.id,
        sendCommand
      );
      setWorkflowLog(prev => [
        ...prev,
        result.success ? `✓ ${step.name}` : `⚠ ${step.name}: ${result.message}`,
      ]);
    }
    setWorkflowRunning(null);
    toast.success(`Workflow complete (${workflow.steps.length} steps)`);
  };

  const probeJ1939 = useCallback(async () => {
    if (!isConnected) {
      toast.error('Connect OBD adapter first');
      return;
    }
    setJ1939Probing(true);
    setJ1939Log([]);
    setJ1939Samples([]);
    const result = await J1939Protocol.probeBus(sendCommand);
    setJ1939Log(result.log);
    setJ1939Samples(result.samples);
    setJ1939Probing(false);
    toast.success(`J1939 probe: ${result.samples.length} responses`);
  }, [isConnected, sendCommand]);

  useEffect(() => {
    if (tab === 'ev' && isConnected && Object.keys(evReadings).length === 0) {
      void scanEVPIDs();
    }
  }, [tab, isConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  const severityColor = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-warning',
    critical: 'text-danger',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="glass-card p-5 sm:p-6 border border-brand-500/20 bg-gradient-to-br from-brand-600/10 to-surface-900/80">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              <span className="text-[10px] uppercase tracking-widest text-brand-400 font-bold">
                CarDiag Pro AI
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Advanced Diagnostics
            </h1>
            <p className="text-surface-400 text-sm mt-2 max-w-2xl">
              AI-powered analysis, full EV/hybrid HV stack, guided workflows, and J1939 commercial —
              universal coverage beyond dealer scan tools.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!isConnected && (
              <Link href="/connection" className="btn-primary flex items-center gap-2 text-sm">
                <Plug className="w-4 h-4" /> Connect
              </Link>
            )}
            <button
              onClick={runAIAnalysis}
              disabled={analyzing}
              className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5 glow-brand"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
              Run AI Scan
            </button>
          </div>
        </div>
      </div>

      <HubTabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'ai' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs text-surface-500">
            <Cpu className="w-3.5 h-3.5" />
            Engine: {isCloudAIReady() ? 'Expert + Cloud AI' : 'On-device Expert AI'}
            {activeVehicle && (
              <span className="ml-2">• {activeVehicle.year} {activeVehicle.make} ({powertrain})</span>
            )}
          </div>

          {!analysis && !analyzing && (
            <div className="glass-card p-12 text-center">
              <Brain className="w-14 h-14 text-brand-400/50 mx-auto mb-4" />
              <p className="text-surface-400 text-sm max-w-md mx-auto">
                Run AI Scan to get root-cause analysis, repair plans, cost estimates, and system impact mapping.
              </p>
            </div>
          )}

          {analysis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card p-4">
                  <span className="text-surface-400 text-xs">Severity</span>
                  <p className={cn('text-2xl font-bold capitalize', severityColor[analysis.severity])}>
                    {analysis.severity}
                  </p>
                </div>
                <div className="stat-card p-4">
                  <span className="text-surface-400 text-xs">AI Confidence</span>
                  <p className="text-2xl font-bold text-brand-400">{analysis.confidence}%</p>
                </div>
                <div className="stat-card p-4">
                  <span className="text-surface-400 text-xs">Mode</span>
                  <p className="text-2xl font-bold text-white capitalize">{analysis.aiMode}</p>
                </div>
              </div>

              <div className="glass-card p-5">
                <h2 className="section-title mb-3">Executive Summary</h2>
                <p className="text-surface-300 text-sm leading-relaxed">{analysis.summary}</p>
                {analysis.warnings.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {analysis.warnings.map((w, i) => (
                      <p key={i} className="text-xs text-warning flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        {w}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="glass-card p-5">
                  <h2 className="section-title mb-4">Root Causes (AI ranked)</h2>
                  <div className="space-y-3">
                    {analysis.rootCauses.map((rc, i) => (
                      <div key={i} className="p-3 rounded-xl bg-surface-800/40 border border-surface-700/30">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-medium text-white">{rc.cause}</span>
                          <span className="text-xs text-brand-400 font-bold">{rc.likelihood}%</span>
                        </div>
                        <p className="text-[10px] text-surface-500">{rc.systems.join(' • ')}</p>
                        <ul className="mt-2 text-[11px] text-surface-400 list-disc list-inside">
                          {rc.evidence.map((e, j) => (
                            <li key={j}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-5">
                  <h2 className="section-title mb-4">Repair Plan</h2>
                  <ol className="space-y-2">
                    {analysis.repairPlan.map(step => (
                      <li key={step.step} className="flex gap-3 text-sm">
                        <span className="w-6 h-6 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {step.step}
                        </span>
                        <div>
                          <p className="text-surface-200">{step.action}</p>
                          <p className="text-[10px] text-surface-500 mt-0.5">
                            {step.difficulty} • ~{step.estimatedMinutes} min
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {analysis.evInsights && (
                <div className="glass-card p-5 border-l-4 border-l-brand-500">
                  <h2 className="section-title mb-4 flex items-center gap-2">
                    <Battery className="w-4 h-4 text-brand-400" /> EV / HV Insights
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="text-center p-3 bg-surface-800/30 rounded-xl">
                      <p className="text-[10px] text-surface-500">Battery</p>
                      <p className="text-lg font-bold text-white">{analysis.evInsights.batteryHealth}%</p>
                      <p className="text-[10px] text-surface-400">{analysis.evInsights.batteryStatus}</p>
                    </div>
                    <div className="text-center p-3 bg-surface-800/30 rounded-xl">
                      <p className="text-[10px] text-surface-500">Charging</p>
                      <p className="text-xs font-medium text-white mt-2">{analysis.evInsights.chargingStatus}</p>
                    </div>
                    <div className="text-center p-3 bg-surface-800/30 rounded-xl">
                      <p className="text-[10px] text-surface-500">Thermal</p>
                      <p className="text-xs font-medium text-white mt-2">{analysis.evInsights.thermalStatus}</p>
                    </div>
                    <div className="text-center p-3 bg-surface-800/30 rounded-xl">
                      <p className="text-[10px] text-surface-500">Power</p>
                      <p className="text-lg font-bold text-white">{analysis.evInsights.powerOutputKw.toFixed(1)} kW</p>
                    </div>
                  </div>
                  <ul className="text-xs text-surface-400 space-y-1">
                    {analysis.evInsights.recommendations.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.costEstimate && (
                <div className="glass-card p-5">
                  <h2 className="section-title mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Estimated Repair Cost
                  </h2>
                  <p className="text-3xl font-bold text-white">
                    ${analysis.costEstimate.totalCost.total.toFixed(0)}{' '}
                    <span className="text-sm font-normal text-surface-500">
                      ({analysis.costEstimate.timeEstimate.average}h avg)
                    </span>
                  </p>
                  <p className="text-xs text-surface-500 mt-2">
                    DIY possible: {analysis.costEstimate.diy.possible ? 'Yes' : 'No'} — savings up to $
                    {analysis.costEstimate.diy.savings.toFixed(0)}
                  </p>
                </div>
              )}

              <div className="glass-card p-5">
                <h2 className="section-title mb-3">Pro-Grade Capabilities Active</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {analysis.proFeatures.map((f, i) => (
                    <p key={i} className="text-xs text-surface-300 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success flex-shrink-0" />
                      {f}
                    </p>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === 'ev' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button onClick={scanEVPIDs} disabled={!isConnected} className="btn-primary text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Scan EV PIDs
            </button>
            <span className="text-xs text-surface-500 self-center">
              Profile: {powertrain} • OEM: {evManufacturer || 'Generic EV'}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(EVPIDSupport.getAllEVPIDs(evManufacturer)).map(([pid, def]) => (
              <div key={pid} className="glass-card p-4">
                <p className="text-[10px] text-surface-500 uppercase">{def.category}</p>
                <p className="text-sm font-medium text-white mt-1">{def.name}</p>
                <p className="text-xl font-bold text-brand-400 mt-2 font-mono">
                  {evReadings[pid] !== undefined
                    ? `${evReadings[pid].toFixed(1)} ${def.unit}`
                    : '—'}
                </p>
                <p className="text-[10px] text-surface-600 mt-1">PID {pid}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'workflows' && (
        <div className="space-y-3">
          {DiagnosticWorkflows.getWorkflows().map(wf => (
            <div key={wf.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white">{wf.name}</h3>
                <p className="text-xs text-surface-500 mt-1">{wf.description}</p>
                <p className="text-[10px] text-surface-600 mt-2">
                  {wf.steps.length} steps • {wf.estimatedTotalTime} min • {wf.difficulty}
                </p>
              </div>
              <button
                onClick={() => runWorkflowStep(wf.id)}
                disabled={!isConnected || workflowRunning === wf.id}
                className="btn-secondary text-xs flex items-center gap-2 whitespace-nowrap"
              >
                {workflowRunning === wf.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Run all steps
              </button>
            </div>
          ))}
          {workflowLog.length > 0 && (
            <div className="glass-card p-4 font-mono text-xs text-surface-400 space-y-1">
              {workflowLog.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'commercial' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={probeJ1939}
              disabled={!isConnected || j1939Probing}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {j1939Probing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              Live bus probe
            </button>
            <span className="text-xs text-surface-500">
              Standard OBD requests — many HD trucks respond on the OBD port
            </span>
          </div>
          {j1939Samples.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {j1939Samples.map((s) => (
                <div key={s.label} className="glass-card p-3">
                  <p className="text-xs text-brand-400">{s.label}</p>
                  <p className="text-[10px] font-mono text-surface-400 mt-1 break-all">{s.value}</p>
                </div>
              ))}
            </div>
          )}
          {j1939Log.length > 0 && (
            <div className="glass-card p-3 font-mono text-[10px] text-surface-500 max-h-32 overflow-y-auto custom-scrollbar space-y-0.5">
              {j1939Log.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
          <p className="text-sm text-surface-400">
            SAE J1939 parameter groups for heavy-duty diesel, fleet, and commercial vehicles.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
            {Object.entries(J1939Protocol.getJ1939PGNDescriptions()).map(([pgn, desc]) => (
              <div key={pgn} className="glass-card p-3">
                <p className="text-xs font-mono text-brand-400">PGN {pgn}</p>
                <p className="text-sm text-white mt-1">{desc}</p>
                <p className="text-[10px] text-surface-500 mt-1">
                  {J1939Protocol.getParametersForPGN(Number(pgn))[0]?.name || 'Multi-parameter group'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'coverage' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Manufacturers', value: `${COVERAGE_STATS.makes}+` },
              { label: 'Models', value: `${COVERAGE_STATS.models}+` },
              { label: 'EV Models', value: `${COVERAGE_STATS.evModels}+` },
              { label: 'Protocols', value: COVERAGE_STATS.protocols },
            ].map(({ label, value }) => (
              <div key={label} className="stat-card p-4 text-center">
                <p className="text-2xl font-bold text-brand-400">{value}</p>
                <p className="text-[10px] text-surface-500 uppercase mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="glass-card p-5">
            <h2 className="section-title mb-3">Your Vehicle Profile</h2>
            <p className="text-sm text-white capitalize">{powertrain} powertrain</p>
            <p className="text-xs text-surface-500 mt-2">{getCoverageLabel(powertrain)}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {coverage.protocols.map(p => (
                <span key={p} className="px-2 py-1 rounded-lg bg-brand-500/10 text-brand-400 text-[10px] border border-brand-500/20">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



