'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Gauge,
  Thermometer,
  Fuel,
  Zap,
  Battery,
  Cpu,
  Radio,
  ShieldCheck,
  Car,
  ArrowUpRight,
  Clock,
  Plug,
  Loader2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useOBD } from '@/lib/obd/OBDContext';
import { PROTOCOL_NAMES } from '@/lib/obd/elm327';
import { searchDTCByCode } from '@/lib/dtc-database';

export default function DashboardPage() {
  const {
    connectionState,
    readDTCs,
    readPendingDTCs,
    readIMReadiness,
    readPIDValue,
    getSupportedPIDs,
  } = useOBD();

  const isConnected = connectionState.status === 'connected';

  // Real ECU data states
  const [activeDTCs, setActiveDTCs] = useState<string[]>([]);
  const [pendingDTCs, setPendingDTCs] = useState<string[]>([]);
  const [readiness, setReadiness] = useState<{ name: string; available: boolean; complete: boolean }[]>([]);
  const [coolantTemp, setCoolantTemp] = useState<number | null>(null);
  const [rpm, setRpm] = useState<number | null>(null);
  const [milOn, setMilOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);

  // Compute health score from real data
  const computeHealth = useCallback(() => {
    if (!isConnected) return 0;
    let score = 100;
    score -= activeDTCs.length * 10;
    score -= pendingDTCs.length * 3;
    if (milOn) score -= 15;
    const incompleteMonitors = readiness.filter(m => m.available && !m.complete).length;
    score -= incompleteMonitors * 2;
    if (coolantTemp !== null && (coolantTemp > 110 || coolantTemp < 60)) score -= 10;
    return Math.max(0, Math.min(100, score));
  }, [isConnected, activeDTCs, pendingDTCs, milOn, readiness, coolantTemp]);

  const [healthScore, setHealthScore] = useState(0);
  const targetHealth = computeHealth();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (healthScore < targetHealth) setHealthScore(prev => Math.min(prev + 2, targetHealth));
      else if (healthScore > targetHealth) setHealthScore(prev => Math.max(prev - 2, targetHealth));
    }, 20);
    return () => clearTimeout(timer);
  }, [healthScore, targetHealth]);

  // Fetch real data from ECU
  const fetchECUData = useCallback(async () => {
    if (!isConnected) return;
    setScanning(true);
    try {
      // Read DTCs from ECU
      const [stored, pending] = await Promise.all([readDTCs(), readPendingDTCs()]);
      setActiveDTCs(stored);
      setPendingDTCs(pending);

      // Read I/M readiness
      const im = await readIMReadiness();
      setReadiness(im);

      // Read MIL status (PID 01 01, byte 0 bit 7)
      const supported = getSupportedPIDs();
      const milPid = supported.find(p => p.pid === '01');
      if (milPid) {
        const r = await readPIDValue(milPid);
        if (r && r.rawBytes.length > 0) setMilOn(!!(r.rawBytes[0] & 0x80));
      }

      // Read coolant temp
      const coolPid = supported.find(p => p.pid === '05');
      if (coolPid) {
        const r = await readPIDValue(coolPid);
        if (r) setCoolantTemp(r.value);
      }

      // Read RPM
      const rpmPid = supported.find(p => p.pid === '0C');
      if (rpmPid) {
        const r = await readPIDValue(rpmPid);
        if (r) setRpm(r.value);
      }

      setLastScanTime(Date.now());
    } catch (err) {
      console.error('[Dashboard] ECU read error:', err);
    } finally {
      setScanning(false);
    }
  }, [isConnected, readDTCs, readPendingDTCs, readIMReadiness, readPIDValue, getSupportedPIDs]);

  // Auto-fetch on connect
  useEffect(() => {
    if (isConnected && !lastScanTime) {
      fetchECUData();
    }
  }, [isConnected, lastScanTime, fetchECUData]);

  const healthColor = healthScore >= 85 ? 'text-success' : healthScore >= 60 ? 'text-warning' : 'text-danger';
  const healthGlow = healthScore >= 85 ? 'glow-success' : healthScore >= 60 ? 'glow-warning' : 'glow-danger';
  const healthStroke = healthScore >= 85 ? '#22c55e' : healthScore >= 60 ? '#f59e0b' : '#ef4444';

  const circumference = 2 * Math.PI * 88;
  const dashOffset = circumference - (healthScore / 100) * circumference;

  const readyCount = readiness.filter(m => m.available && m.complete).length;
  const totalMonitors = readiness.filter(m => m.available).length;
  const incompleteCount = readiness.filter(m => m.available && !m.complete).length;

  // Look up DTC descriptions from the reference database
  const dtcDetails = activeDTCs.map(code => {
    const lookup = searchDTCByCode(code);
    return { code, desc: lookup?.description || 'Unknown DTC', severity: lookup?.severity || 'warning' };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <Link
        href="/advanced"
        className="glass-card block p-4 sm:p-5 border border-brand-500/30 bg-gradient-to-r from-brand-600/15 to-transparent hover:border-brand-500/50 transition-all group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center glow-brand">
              <Sparkles className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Advanced AI Diagnostics</p>
              <p className="text-xs text-surface-500 mt-0.5">
                EV/hybrid HV analysis • guided workflows • J1939 • AI repair plans
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-brand-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </Link>

      <Link
        href="/programming"
        className="glass-card block p-4 sm:p-5 border border-warning/25 bg-gradient-to-r from-warning/10 to-transparent hover:border-warning/40 transition-all group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning/15 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">ECU Coding &amp; Key Programming</p>
              <p className="text-xs text-surface-500 mt-0.5">
                UDS read/write • immobilizer routines • security access (pro adapter recommended)
              </p>
            </div>
          </div>
          <ArrowUpRight className="w-5 h-5 text-warning group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </div>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-surface-400 text-sm mt-1">Vehicle health overview and quick diagnostics</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {isConnected && connectionState.vin && (
            <div className="glass-card px-3 py-1.5 flex items-center gap-2">
              <Car className="w-4 h-4 text-brand-400" />
              <span className="text-xs sm:text-sm text-white font-medium font-mono">{connectionState.vin}</span>
            </div>
          )}
          {isConnected ? (
            <button onClick={fetchECUData} disabled={scanning} className="btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 px-3 sm:px-5 disabled:opacity-50">
              {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
              {scanning ? 'Reading...' : 'Refresh'}
            </button>
          ) : (
            <Link href="/connection" className="btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 px-3 sm:px-5">
              <Plug className="w-4 h-4" /> Connect
            </Link>
          )}
        </div>
      </div>

      {/* Not connected banner */}
      {!isConnected && (
        <div className="glass-card p-6 sm:p-8 text-center border-l-4 border-l-brand-500">
          <Plug className="w-10 h-10 sm:w-12 sm:h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-white mb-2">Connect to Your Vehicle</h3>
          <p className="text-surface-400 text-xs sm:text-sm max-w-md mx-auto mb-4">
            Plug your OBD-II adapter into the vehicle, then pair it on the Connection page to see real ECU data here.
          </p>
          <Link href="/connection" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plug className="w-4 h-4" /> Go to Connection
          </Link>
        </div>
      )}

      {isConnected && (
        <>
          {/* Top Row: Health + Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Health Score */}
            <div className={cn('lg:col-span-4 glass-card p-4 sm:p-6 flex flex-col items-center justify-center', healthGlow)}>
              <p className="text-xs sm:text-sm text-surface-400 mb-4 font-medium uppercase tracking-wider">Health Score</p>
              <div className="relative w-40 h-40 sm:w-52 sm:h-52">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="88" stroke="#1e293b" strokeWidth="10" fill="none" />
                  <circle
                    cx="100" cy="100" r="88"
                    stroke={healthStroke}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={cn('text-4xl sm:text-5xl font-bold', healthColor)}>{healthScore}</span>
                  <span className="text-surface-400 text-[10px] sm:text-sm mt-1">out of 100</span>
                </div>
              </div>
              {connectionState.protocol && (
                <p className="mt-3 text-[10px] sm:text-xs text-surface-500">{PROTOCOL_NAMES[connectionState.protocol]}</p>
              )}
            </div>

            {/* Quick Stats Grid */}
            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Active Codes */}
              <div className="stat-card p-3 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-surface-400 text-xs sm:text-sm">Active DTCs</span>
                  <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center', activeDTCs.length > 0 ? 'bg-warning/10' : 'bg-success/10')}>
                    {activeDTCs.length > 0 ? <AlertTriangle className="w-4 h-4 text-warning" /> : <CheckCircle2 className="w-4 h-4 text-success" />}
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-white">{activeDTCs.length}</span>
                <span className="text-[10px] sm:text-xs text-surface-400">{activeDTCs.length === 0 ? 'Clear' : 'Read from ECU'}</span>
              </div>

              {/* Pending Codes */}
              <div className="stat-card p-3 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-surface-400 text-xs sm:text-sm">Pending DTCs</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-info/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-info" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-white">{pendingDTCs.length}</span>
                <span className="text-[10px] sm:text-xs text-surface-400">Drive cycle</span>
              </div>

              {/* MIL Status */}
              <div className="stat-card p-3 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-surface-400 text-xs sm:text-sm">MIL Status</span>
                  <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center', milOn ? 'bg-warning/10' : 'bg-success/10')}>
                    {milOn ? <AlertTriangle className="w-4 h-4 text-warning" /> : <CheckCircle2 className="w-4 h-4 text-success" />}
                  </div>
                </div>
                <span className={cn('text-lg sm:text-xl font-bold', milOn ? 'text-warning' : 'text-success')}>{milOn ? 'ON' : 'OFF'}</span>
                <span className="text-[10px] sm:text-xs text-surface-400">Check Engine</span>
              </div>

              {/* Readiness */}
              <div className="stat-card p-3 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-surface-400 text-xs sm:text-sm">Readiness</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-white">{readyCount}/{totalMonitors}</span>
                <span className="text-[10px] sm:text-xs text-surface-400">Complete</span>
              </div>

              {/* Coolant Temp */}
              <div className="stat-card p-3 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-surface-400 text-xs sm:text-sm">Coolant</span>
                  <div className={cn('w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center', coolantTemp !== null && coolantTemp <= 110 ? 'bg-success/10' : 'bg-warning/10')}>
                    <Thermometer className={cn('w-4 h-4', coolantTemp !== null && coolantTemp <= 110 ? 'text-success' : 'text-warning')} />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-white">{coolantTemp !== null ? `${Math.round(coolantTemp)}°C` : '--'}</span>
                <span className={cn('text-[10px] sm:text-xs', coolantTemp !== null && coolantTemp >= 80 && coolantTemp <= 105 ? 'text-success' : 'text-surface-400')}>
                  {coolantTemp !== null ? (coolantTemp >= 80 && coolantTemp <= 105 ? 'Normal' : 'High') : 'No data'}
                </span>
              </div>

              {/* Engine RPM */}
              <div className="stat-card p-3 sm:p-5">
                <div className="flex items-center justify-between">
                  <span className="text-surface-400 text-xs sm:text-sm">RPM</span>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
                    <Gauge className="w-4 h-4 text-brand-400" />
                  </div>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-white">{rpm !== null ? Math.round(rpm) : '--'}</span>
                <span className="text-[10px] sm:text-xs text-surface-400">
                  {rpm !== null ? (rpm < 900 ? 'Idle' : 'Live') : 'No data'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Connection Info + DTCs + Readiness */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
            {/* Trouble Codes from ECU */}
            <div className="lg:col-span-5 order-1 lg:order-2 glass-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="section-title">Trouble Codes</h2>
                <Link href="/diagnostics" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1">
                  Details <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {dtcDetails.length === 0 && pendingDTCs.length === 0 ? (
                <div className="text-center py-6 sm:py-8">
                  <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-success mx-auto mb-2" />
                  <p className="text-sm text-surface-300">No trouble codes found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dtcDetails.map((dtc) => (
                    <div key={dtc.code} className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/30">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn('badge', dtc.severity === 'critical' ? 'badge-critical' : 'badge-warning')}>{dtc.code}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-surface-300 line-clamp-2">{dtc.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* I/M Readiness from ECU */}
            <div className="lg:col-span-3 order-2 lg:order-3 glass-card p-4 sm:p-5">
              <h2 className="section-title mb-4">I/M Readiness</h2>
              {readiness.length === 0 ? (
                <p className="text-xs sm:text-sm text-surface-500 text-center py-6">Refresh to read monitors</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-4 gap-y-1">
                    {readiness.map((mon) => (
                      <div key={mon.name} className="flex items-center justify-between py-1.5 border-b border-surface-800/50 last:border-0">
                        <span className="text-xs text-surface-300 truncate mr-2">{mon.name}</span>
                        {!mon.available ? (
                          <span className="badge-pending text-[9px] px-1.5">N/A</span>
                        ) : mon.complete ? (
                          <span className="badge-success text-[9px] px-1.5">READY</span>
                        ) : (
                          <span className="badge-warning text-[9px] px-1.5">INC</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Connection Info */}
            <div className="lg:col-span-4 order-3 lg:order-1 glass-card p-4 sm:p-5">
              <h2 className="section-title mb-4">Connection Info</h2>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between"><span className="text-surface-500">Adapter</span><span className="text-surface-300">{connectionState.adapter?.name || '--'}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Protocol</span><span className="text-brand-400 text-[10px] sm:text-xs text-right max-w-[150px] truncate">{connectionState.protocol ? PROTOCOL_NAMES[connectionState.protocol] : '--'}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Voltage</span><span className="text-surface-300">{connectionState.voltage || '--'}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">VIN</span><span className="text-surface-300 font-mono text-[10px]">{connectionState.vin || '--'}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Latency</span><span className="text-surface-300">{connectionState.latency}ms</span></div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
