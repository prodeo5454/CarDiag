'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Search,
  Scan,
  Trash2,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  XCircle,
  Info,
  Clock,
  DollarSign,
  Wrench,
  ListChecks,
  ArrowRight,
  Plug,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { searchDTCByCode, searchDTCByKeyword, getAllDTCs, interpretDTCCode, getAllSystems } from '@/lib/dtc-database';
import { getOEMDatabaseStats, isOEMDatabaseLoaded } from '@/lib/oem-database';
import { useOBD } from '@/lib/obd/OBDContext';
import { VehicleManager } from '@/lib/vehicle-manager';
import type { DTCCode, DTCCategory, DTCSeverity } from '@/types';

export default function DiagnosticsPage() {
  const {
    connectionState,
    readDTCs,
    readPendingDTCs,
    readPermanentDTCs,
    clearDTCs,
  } = useOBD();

  const isConnected = connectionState.status === 'connected';
  const activeVehicle = VehicleManager.getActiveVehicle();
  const vehicleMake = activeVehicle?.make;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DTCCategory | 'all'>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<DTCSeverity | 'all'>('all');
  const [expandedCode, setExpandedCode] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Real DTCs read from ECU
  const [storedRaw, setStoredRaw] = useState<string[]>([]);
  const [pendingRaw, setPendingRaw] = useState<string[]>([]);
  const [permanentRaw, setPermanentRaw] = useState<string[]>([]);
  const [oemCodes, setOemCodes] = useState<number | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (isOEMDatabaseLoaded()) {
        setOemCodes(getOEMDatabaseStats()?.uniqueCodes ?? null);
        window.clearInterval(id);
      }
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  // Resolve raw DTC codes against the reference database
  const resolveCode = useCallback(
    (code: string, tag: 'stored' | 'pending' | 'permanent'): DTCCode & { tag: string } => {
      const lookup = searchDTCByCode(code, vehicleMake);
      if (lookup) return { ...lookup, tag };
      return {
        code,
        description: `Unknown DTC — ${code}`,
        category: (code.startsWith('P')
          ? 'powertrain'
          : code.startsWith('C')
            ? 'chassis'
            : code.startsWith('B')
              ? 'body'
              : 'network') as DTCCategory,
        severity: tag === 'permanent' ? 'critical' : tag === 'stored' ? 'warning' : 'pending',
        system: 'Unknown',
        possibleCauses: ['Refer to vehicle service manual'],
        symptoms: ['Check engine light may be on'],
        solutions: ['Diagnose with full service manual procedure'],
        tag,
      };
    },
    [vehicleMake]
  );

  const activeCodes = useMemo(() => {
    const stored = storedRaw.map((c) => resolveCode(c, 'stored'));
    const pending = pendingRaw.map((c) => resolveCode(c, 'pending'));
    const permanent = permanentRaw.map((c) => resolveCode(c, 'permanent'));
    return [...stored, ...pending, ...permanent];
  }, [storedRaw, pendingRaw, permanentRaw, resolveCode]);

  const filteredCodes = useMemo(() => {
    let codes: (DTCCode & { tag?: string })[] = searchQuery.trim()
      ? searchDTCByKeyword(searchQuery, vehicleMake)
      : scanComplete ? activeCodes : [];

    if (selectedCategory !== 'all') {
      codes = codes.filter(c => c.category === selectedCategory);
    }
    if (selectedSeverity !== 'all') {
      codes = codes.filter(c => c.severity === selectedSeverity);
    }
    return codes;
  }, [searchQuery, selectedCategory, selectedSeverity, activeCodes, scanComplete]);

  // Real ECU scan
  const startScan = useCallback(async () => {
    if (!isConnected) return;
    setScanning(true);
    setScanComplete(false);
    try {
      const [stored, pending, permanent] = await Promise.all([
        readDTCs(),
        readPendingDTCs(),
        readPermanentDTCs(),
      ]);
      setStoredRaw(stored);
      setPendingRaw(pending);
      setPermanentRaw(permanent);
      setScanComplete(true);
      const total = stored.length + pending.length + permanent.length;
      toast.success(total > 0 ? `Found ${total} code(s)` : 'Scan complete — no codes');
    } catch (err) {
      console.error('[Diagnostics] Scan error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to read DTCs from ECU');
    } finally {
      setScanning(false);
    }
  }, [isConnected, readDTCs, readPendingDTCs, readPermanentDTCs]);

  const exportScan = useCallback(() => {
    const data = {
      timestamp: new Date().toISOString(),
      vin: connectionState.vin,
      stored: storedRaw,
      pending: pendingRaw,
      permanent: permanentRaw,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dtc-scan-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [connectionState.vin, storedRaw, pendingRaw, permanentRaw]);

  const handleClear = useCallback(async () => {
    if (!isConnected) return;
    setClearing(true);
    try {
      const ok = await clearDTCs();
      if (ok) {
        setStoredRaw([]);
        setPendingRaw([]);
        setPermanentRaw([]);
        setScanComplete(false);
        toast.success('DTCs cleared');
      } else {
        toast.error('ECU did not confirm clear — try key on, engine off');
      }
    } catch (err) {
      console.error('[Diagnostics] Clear error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to clear DTCs');
    } finally {
      setClearing(false);
    }
  }, [isConnected, clearDTCs]);

  const severityIcon = (severity: DTCSeverity) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-danger" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'info': return <Info className="w-4 h-4 text-info" />;
      case 'pending': return <Clock className="w-4 h-4 text-surface-400" />;
    }
  };

  const severityBadge = (severity: DTCSeverity) => {
    const classes: Record<DTCSeverity, string> = {
      critical: 'badge-critical',
      warning: 'badge-warning',
      info: 'badge-info',
      pending: 'badge-pending',
    };
    return classes[severity];
  };

  const categoryLabel: Record<DTCCategory, string> = {
    powertrain: 'Powertrain (P)',
    body: 'Body (B)',
    chassis: 'Chassis (C)',
    network: 'Network (U)',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Diagnostics</h1>
          <p className="text-surface-400 text-sm mt-1">
            Read and clear DTCs from the ECU — or use{' '}
            <Link href="/advanced" className="text-brand-400 hover:underline">Advanced AI</Link> for full analysis
            {oemCodes != null && (
              <span className="text-success"> · {oemCodes.toLocaleString()} OEM codes offline</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleClear}
            disabled={!isConnected || clearing || activeCodes.length === 0}
            className="btn-danger flex items-center gap-2 text-xs sm:text-sm py-2 px-3 sm:px-5 disabled:opacity-50"
          >
            {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {clearing ? 'Clearing...' : 'Clear'}
          </button>
          <button
            onClick={exportScan}
            className="btn-secondary flex items-center gap-2 text-xs sm:text-sm py-2 px-3 sm:px-5"
            disabled={!scanComplete}
          >
            <Download className="w-4 h-4" /> Export
          </button>
          {isConnected ? (
            <button
              onClick={startScan}
              disabled={scanning}
              className="btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 px-3 sm:px-5 disabled:opacity-50"
            >
              <Scan className={cn('w-4 h-4', scanning && 'animate-spin')} />
              {scanning ? 'Reading...' : 'Scan'}
            </button>
          ) : (
            <Link href="/connection" className="btn-primary flex items-center gap-2 text-xs sm:text-sm py-2 px-3 sm:px-5">
              <Plug className="w-4 h-4" /> Connect
            </Link>
          )}
        </div>
      </div>

      {/* Connection Banner */}
      {!isConnected && (
        <div className="glass-card p-6 sm:p-8 text-center border-l-4 border-l-brand-500">
          <Plug className="w-10 h-10 sm:w-12 sm:h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-white mb-2">Connect to Your Vehicle</h3>
          <p className="text-surface-400 text-xs sm:text-sm max-w-md mx-auto mb-4">
            Plug your OBD-II adapter into the vehicle, then pair it on the Connection page to read and clear DTCs.
          </p>
          <Link href="/connection" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plug className="w-4 h-4" /> Go to Connection
          </Link>
        </div>
      )}

      {/* Scan Info */}
      {isConnected && scanComplete && (
        <div className="glass-card p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm text-surface-300">Last scan completed</span>
            <span className="text-[10px] sm:text-xs text-surface-500">{new Date().toLocaleTimeString()}</span>
          </div>
          <div className="mt-2 flex gap-4 sm:gap-6 text-[10px] sm:text-xs text-surface-500">
            <span>Stored: {storedRaw.length}</span>
            <span>Pending: {pendingRaw.length}</span>
            <span>Permanent: {permanentRaw.length}</span>
          </div>
        </div>
      )}

      {/* Search & Filters */}
      <div className="glass-card p-3 sm:p-4 space-y-3 sm:space-y-0">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code or keyword..."
              className="input-field w-full pl-10 text-sm py-2"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as DTCCategory | 'all')}
              className="select-field text-xs sm:text-sm py-2 px-3 flex-1 lg:flex-initial"
            >
              <option value="all">All Categories</option>
              <option value="powertrain">Powertrain (P)</option>
              <option value="body">Body (B)</option>
              <option value="chassis">Chassis (C)</option>
              <option value="network">Network (U)</option>
            </select>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as DTCSeverity | 'all')}
              className="select-field text-xs sm:text-sm py-2 px-3 flex-1 lg:flex-initial"
            >
              <option value="all">All Severity</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      {(searchQuery || scanComplete) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs sm:text-sm text-surface-400">
            Found <span className="text-white font-medium">{filteredCodes.length}</span> trouble code{filteredCodes.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-3 text-[10px] sm:text-xs">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-danger" /> Critical: {filteredCodes.filter(c => c.severity === 'critical').length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Warning: {filteredCodes.filter(c => c.severity === 'warning').length}</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-info" /> Info: {filteredCodes.filter(c => c.severity === 'info').length}</span>
          </div>
        </div>
      )}

      {/* DTC List */}
      <div className="space-y-3">
        {filteredCodes.map((code) => {
          const isExpanded = expandedCode === code.code;
          const interpretation = interpretDTCCode(code.code);
          const tag = (code as any).tag;
          return (
            <div key={`${code.code}-${tag}`} className={cn('glass-card overflow-hidden transition-all duration-300', isExpanded && 'glow-brand')}>
              {/* Code Header */}
              <button
                onClick={() => setExpandedCode(isExpanded ? null : code.code)}
                className="w-full p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:bg-surface-800/30 transition-colors text-left"
              >
                {severityIcon(code.severity)}
                <span className={cn('badge font-mono text-[10px] sm:text-xs', severityBadge(code.severity))}>{code.code}</span>
                {tag && (
                  <span className={cn('text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full',
                    tag === 'stored' ? 'bg-warning/10 text-warning' :
                    tag === 'pending' ? 'bg-info/10 text-info' :
                    'bg-danger/10 text-danger'
                  )}>{tag}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white truncate">{code.description}</p>
                  <p className="text-[9px] sm:text-xs text-surface-400 mt-0.5">{code.system} | {categoryLabel[code.category]}</p>
                </div>
                {isExpanded ? <ChevronUp className="w-4 h-4 text-surface-400" /> : <ChevronDown className="w-4 h-4 text-surface-400" />}
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-3 sm:px-4 pb-4 border-t border-surface-700/50 animate-slide-up">
                  {/* Code Interpretation */}
                  {interpretation && (
                    <div className="mt-4 p-3 rounded-xl bg-surface-800/50 border border-surface-700/30">
                      <h4 className="text-[9px] sm:text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Code Breakdown</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-surface-500 text-[10px] block">Prefix</span>
                          <span className="text-white font-mono font-bold">{interpretation.prefix}</span>
                          <span className="text-[10px] text-surface-400 ml-1">({interpretation.category})</span>
                        </div>
                        <div>
                          <span className="text-surface-500 text-[10px] block">Type</span>
                          <span className="text-white text-[10px]">{interpretation.type}</span>
                        </div>
                        <div>
                          <span className="text-surface-500 text-[10px] block">Subsystem</span>
                          <span className="text-white font-mono">{interpretation.number.substring(0, 1)}xx</span>
                        </div>
                        <div>
                          <span className="text-surface-500 text-[10px] block">Specific Fault</span>
                          <span className="text-white font-mono">x{interpretation.number.substring(1)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    {/* Possible Causes */}
                    <div>
                      <h4 className="text-[9px] sm:text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Possible Causes
                      </h4>
                      <ul className="space-y-1">
                        {code.possibleCauses.map((cause, i) => (
                          <li key={i} className="text-[11px] sm:text-sm text-surface-300 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-surface-500 mt-1 flex-shrink-0" />
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Symptoms */}
                    <div>
                      <h4 className="text-[9px] sm:text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <ListChecks className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Symptoms
                      </h4>
                      <ul className="space-y-1">
                        {code.symptoms.map((symptom, i) => (
                          <li key={i} className="text-[11px] sm:text-sm text-surface-300 flex items-start gap-2">
                            <ArrowRight className="w-3 h-3 text-surface-500 mt-1 flex-shrink-0" />
                            {symptom}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Solutions */}
                    <div>
                      <h4 className="text-[9px] sm:text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Wrench className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Recommended Solutions
                      </h4>
                      <ul className="space-y-1">
                        {code.solutions.map((solution, i) => (
                          <li key={i} className="text-[11px] sm:text-sm text-surface-300 flex items-start gap-2">
                            <span className="text-brand-400 font-bold text-[10px] mt-0.5">{i + 1}.</span>
                            {solution}
                          </li>
                        ))}
                      </ul>
                      {code.estimatedCost && (
                        <div className="mt-3 p-2 rounded-lg bg-surface-800/50 flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 text-success" />
                          <span className="text-[11px] sm:text-sm text-surface-300">
                            Est: <span className="text-white font-medium">${code.estimatedCost.min} - ${code.estimatedCost.max}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {!scanning && !scanComplete && !searchQuery && (
        <div className="glass-card p-12 text-center">
          {isConnected ? (
            <>
              <Scan className="w-16 h-16 text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Ready to Scan</h3>
              <p className="text-surface-400 text-sm max-w-md mx-auto mb-6">
                Click &quot;Scan Vehicle&quot; to read all diagnostic trouble codes from the ECU, or search the database for any OBD-II code.
              </p>
              <button onClick={startScan} className="btn-primary inline-flex items-center gap-2">
                <Scan className="w-4 h-4" /> Start Full Vehicle Scan
              </button>
            </>
          ) : (
            <>
              <Plug className="w-16 h-16 text-surface-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Connect to Scan</h3>
              <p className="text-surface-400 text-sm max-w-md mx-auto mb-6">
                Connect your OBD-II adapter to read and clear diagnostic trouble codes from the vehicle ECU.
              </p>
              <Link href="/connection" className="btn-primary inline-flex items-center gap-2">
                <Plug className="w-4 h-4" /> Go to Connection
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
