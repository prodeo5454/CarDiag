'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu,
  Key,
  Lock,
  Plug,
  AlertTriangle,
  Loader2,
  Play,
  Shield,
  Copy,
  Fingerprint,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOBD } from '@/lib/obd/OBDContext';
import {
  ECUCodingService,
  COMMON_CODING_DIDS,
  KeyProgrammingService,
  KEY_PROGRAMMING_PROCEDURES,
} from '@/lib/obd';
import { ECUSecurity } from '@/lib/obd/ecu-security';
import { VehicleManager } from '@/lib/vehicle-manager';
import { HubPageHeader, HubTabBar } from '@/components/layout/HubPageHeader';

type Tab = 'coding' | 'keys' | 'security';

const ECU_TARGETS = [
  { id: '7E0', label: '7E0 — Engine (default)' },
  { id: '7E1', label: '7E1 — Engine alternate' },
  { id: '7E2', label: '7E2 — Transmission' },
  { id: '7B0', label: '7B0 — Body / gateway' },
  { id: '7C0', label: '7C0 — Chassis' },
];

export default function ProgrammingHub() {
  const { connectionState, sendCommand } = useOBD();
  const isConnected = connectionState.status === 'connected';
  const activeVehicle = VehicleManager.getActiveVehicle();
  const make = activeVehicle?.make || 'GENERIC';
  const chipset = connectionState.adapter?.chipset;

  const defaultEcu =
    connectionState.ecuAddresses?.[0]?.replace(/^0x/i, '').toUpperCase() || '7E0';

  const [tab, setTab] = useState<Tab>('coding');
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [ecuAddress, setEcuAddress] = useState(defaultEcu);

  const [did, setDid] = useState('F190');
  const [readValue, setReadValue] = useState('');
  const [writeValue, setWriteValue] = useState('');
  const [writeConfirm, setWriteConfirm] = useState(false);
  const [routineId, setRoutineId] = useState('FF01');
  const [ecuIdParts, setEcuIdParts] = useState<Record<string, string>>({});

  const [pin, setPin] = useState('');
  const [keyRiskConfirm, setKeyRiskConfirm] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState('add_spare_key');
  const [manualMfg, setManualMfg] = useState('Ford');
  const [manualKeyHex, setManualKeyHex] = useState('');

  useEffect(() => {
    if (defaultEcu && defaultEcu !== ecuAddress) {
      setEcuAddress(defaultEcu);
    }
  }, [defaultEcu, ecuAddress]);

  const codingService = useMemo(
    () => new ECUCodingService(sendCommand, { manufacturer: make, ecuAddress }),
    [sendCommand, make, ecuAddress]
  );
  const keyService = useMemo(
    () => new KeyProgrammingService(sendCommand, make, ecuAddress),
    [sendCommand, make, ecuAddress]
  );

  useEffect(() => {
    codingService.setTarget(ecuAddress, make);
  }, [codingService, ecuAddress, make]);

  const adapterAssessment = useMemo(
    () => keyService.assessAdapterCapability(chipset),
    [keyService, chipset]
  );

  const procedures = useMemo(() => keyService.getProceduresForVehicle(make), [keyService, make]);
  const selectedProcMeta = KEY_PROGRAMMING_PROCEDURES.find((x) => x.id === selectedProcedure);
  const isDealerOnly = selectedProcMeta?.requiredHardware === 'dealer_immo';

  const appendLog = (line: string) => setLog((prev) => [...prev, line]);

  const copyLog = () => {
    if (!log.length) return;
    void navigator.clipboard.writeText(log.join('\n'));
    toast.success('Log copied');
  };

  const runRead = useCallback(async () => {
    setBusy(true);
    appendLog(`[${ecuAddress}] Read DID ${did}...`);
    const r = await codingService.readDataByIdentifier(did);
    appendLog(r.message);
    if (r.value) setReadValue(r.value.rawHex);
    setBusy(false);
    toast[r.success ? 'success' : 'error'](r.message);
  }, [codingService, did, ecuAddress]);

  const runWrite = useCallback(async () => {
    if (!writeConfirm) {
      toast.error('Confirm write risk first');
      return;
    }
    setBusy(true);
    const r = await codingService.writeDataByIdentifier({
      did,
      hexValue: writeValue,
      confirmRisk: true,
    });
    appendLog(r.message);
    setBusy(false);
    toast[r.success ? 'success' : 'error'](r.message);
  }, [codingService, did, writeValue, writeConfirm]);

  const runRoutine = useCallback(async () => {
    setBusy(true);
    appendLog(`Routine ${routineId} on ${ecuAddress}...`);
    const r = await codingService.runRoutineControl(routineId);
    appendLog(r.message);
    if (r.response) appendLog(r.response);
    setBusy(false);
    toast[r.success ? 'success' : 'error'](r.message);
  }, [codingService, routineId, ecuAddress]);

  const runEcuId = useCallback(async () => {
    setBusy(true);
    appendLog('Reading ECU identification DIDs...');
    const r = await codingService.readEcuIdentification();
    appendLog(r.message);
    setEcuIdParts(r.parts);
    setBusy(false);
    toast[r.success ? 'success' : 'info'](r.message);
  }, [codingService]);

  const runKeyProcedure = useCallback(async () => {
    if (!keyRiskConfirm) {
      toast.error('Confirm immobilizer risk first');
      return;
    }
    setBusy(true);
    setLog([]);
    const r = await keyService.runProcedure(selectedProcedure, {
      pin,
      confirmRisk: true,
    });
    setLog(r.log);
    setBusy(false);
    toast[r.success ? 'success' : isDealerOnly ? 'info' : 'error'](r.message);
  }, [keyService, selectedProcedure, pin, keyRiskConfirm, isDealerOnly]);

  const runSecurityTest = useCallback(async () => {
    setBusy(true);
    const immo = await keyService.testImmobilizerResponse();
    appendLog(immo.message);
    const r = await ECUSecurity.testSecurityAccess(sendCommand, ecuAddress);
    appendLog(`Security level: ${r.securityLevel}, auth=${r.requiresAuth}`);
    r.testResults.forEach((t) => appendLog(`${t.command} → ${t.response}`));
    setBusy(false);
  }, [sendCommand, ecuAddress, keyService]);

  const runManualUnlock = useCallback(async () => {
    if (!manualKeyHex.trim()) {
      toast.error('Enter calculated key (hex bytes, space-separated)');
      return;
    }
    setBusy(true);
    const r = await ECUSecurity.sendManualSecurityKey(sendCommand, ecuAddress, manualKeyHex);
    appendLog(r.message);
    setBusy(false);
    toast[r.unlocked ? 'success' : 'error'](r.message);
  }, [manualKeyHex, sendCommand, ecuAddress]);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'coding', label: 'ECU Coding', icon: Cpu },
    { id: 'keys', label: 'Key Programming', icon: Key },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-4">
      <HubPageHeader
        title="ECU Coding & Key Programming"
        subtitle="UDS read/write, immobilizer routines, and security access. Use STN/OBDLink-class adapters for key learn—not ELM327 clones."
        icon={Cpu}
        variant="warning"
        footer={
          <p className="text-xs text-surface-500">
            Adapter: <span className="text-surface-300">{chipset || 'unknown'}</span> —{' '}
            {adapterAssessment.message}
          </p>
        }
      >
        {!isConnected && (
          <Link href="/connection" className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
            <Plug className="w-4 h-4" /> Connect adapter
          </Link>
        )}
      </HubPageHeader>

      <div className="glass-card p-4 space-y-3">
        <label className="text-xs text-surface-500 block">Target ECU address</label>
        <select
          value={ecuAddress}
          onChange={(e) => setEcuAddress(e.target.value)}
          className="select-field w-full text-sm"
        >
          {ECU_TARGETS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
          {connectionState.ecuAddresses
            ?.filter((a) => !ECU_TARGETS.some((t) => t.id === a.toUpperCase()))
            .map((a) => (
              <option key={a} value={a.toUpperCase()}>
                {a} — detected
              </option>
            ))}
        </select>
      </div>

      <HubTabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'coding' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4">
            <h2 className="section-title">Read / Write DID</h2>
            <div>
              <label className="text-xs text-surface-500">Data identifier (hex)</label>
              <select
                value={did}
                onChange={(e) => setDid(e.target.value)}
                className="select-field w-full mt-1 text-sm"
              >
                {COMMON_CODING_DIDS.map((d) => (
                  <option key={d.did} value={d.did}>
                    {d.did} — {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={runRead}
                disabled={!isConnected || busy}
                className="btn-primary text-sm flex-1"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Read DID'}
              </button>
              <button
                type="button"
                onClick={runEcuId}
                disabled={!isConnected || busy}
                className="btn-secondary text-sm flex items-center gap-1"
              >
                <Fingerprint className="w-4 h-4" />
                ECU ID
              </button>
            </div>
            {readValue && (
              <div className="bg-surface-800/40 p-3 rounded-lg font-mono text-xs text-brand-400 break-all">
                {readValue}
              </div>
            )}
            {Object.keys(ecuIdParts).length > 0 && (
              <div className="text-xs space-y-1 font-mono text-surface-400">
                {Object.entries(ecuIdParts).map(([k, v]) => (
                  <p key={k}>
                    <span className="text-brand-400">{k}</span>: {v}
                  </p>
                ))}
              </div>
            )}
            <div>
              <label className="text-xs text-surface-500">Write value (hex)</label>
              <input
                value={writeValue}
                onChange={(e) => setWriteValue(e.target.value.toUpperCase())}
                className="input-field w-full mt-1 font-mono text-sm"
                placeholder="e.g. 4A303030..."
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-warning cursor-pointer">
              <input
                type="checkbox"
                checked={writeConfirm}
                onChange={(e) => setWriteConfirm(e.target.checked)}
              />
              I understand incorrect coding can brick the ECU
            </label>
            <button
              type="button"
              onClick={runWrite}
              disabled={!isConnected || busy || !writeValue}
              className="btn-danger w-full text-sm"
            >
              Write DID (reprogram)
            </button>

            <div className="pt-4 border-t border-surface-700/40 space-y-2">
              <h3 className="text-sm font-medium text-white">Routine control (UDS 0x31)</h3>
              <input
                value={routineId}
                onChange={(e) => setRoutineId(e.target.value.toUpperCase())}
                className="input-field w-full font-mono text-sm"
                placeholder="Routine ID e.g. FF01"
              />
              <button
                type="button"
                onClick={runRoutine}
                disabled={!isConnected || busy}
                className="btn-secondary w-full text-sm"
              >
                Start routine
              </button>
            </div>
          </div>
          <div className="glass-card p-5">
            <h2 className="section-title mb-3">Common coding IDs</h2>
            <div className="max-h-96 overflow-y-auto space-y-2 custom-scrollbar">
              {COMMON_CODING_DIDS.map((d) => (
                <button
                  key={d.did}
                  type="button"
                  onClick={() => setDid(d.did)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-surface-800/30 hover:bg-surface-800 text-xs"
                >
                  <span className="font-mono text-brand-400">{d.did}</span>
                  <span className="text-surface-400 ml-2">{d.name}</span>
                  <span className="text-surface-600 ml-1">({d.category})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'keys' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4 lg:sticky lg:top-4 lg:self-start">
            <h2 className="section-title">Key procedure</h2>
            {isDealerOnly && (
              <p className="text-xs text-warning flex gap-2 items-start">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                Dealer/specialist hardware required — CarDiag runs guided steps only.
              </p>
            )}
            <select
              value={selectedProcedure}
              onChange={(e) => setSelectedProcedure(e.target.value)}
              className="select-field w-full text-sm"
            >
              {procedures.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div>
              <label className="text-xs text-surface-500">Immobilizer PIN (if required)</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="input-field w-full mt-1 text-sm"
                placeholder="From dealer or owner records"
                autoComplete="off"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-warning cursor-pointer">
              <input
                type="checkbox"
                checked={keyRiskConfirm}
                onChange={(e) => setKeyRiskConfirm(e.target.checked)}
              />
              I accept immobilizer programming risk
            </label>
            <button
              type="button"
              onClick={runKeyProcedure}
              disabled={!isConnected || busy}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {isDealerOnly ? 'Show guided steps' : 'Run procedure'}
            </button>
          </div>
          <div className="glass-card p-5">
            <h2 className="section-title mb-2">Procedure detail</h2>
            {selectedProcMeta && (
              <>
                <p className="text-sm text-surface-300">{selectedProcMeta.description}</p>
                <p className="text-xs text-surface-500 mt-2">
                  Hardware: {selectedProcMeta.requiredHardware.replace(/_/g, ' ')}
                </p>
                <ul className="mt-3 text-xs text-surface-400 list-decimal list-inside space-y-1">
                  {selectedProcMeta.steps.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
                {selectedProcMeta.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-warning mt-2 flex gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    {w}
                  </p>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card p-5 space-y-4">
            <h2 className="section-title flex items-center gap-2">
              <Shield className="w-4 h-4" /> Security access (UDS 0x27)
            </h2>
            <p className="text-sm text-surface-400">
              Profiles: {ECUSecurity.getSupportedManufacturers().join(', ')}. Algorithms are
              simplified — not production OEM seed-key.
            </p>
            <button
              type="button"
              onClick={runSecurityTest}
              disabled={!isConnected || busy}
              className="btn-primary text-sm flex items-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Test immobilizer / security
            </button>
          </div>
          <div className="glass-card p-5 space-y-4">
            <h2 className="section-title text-base">Manual key entry</h2>
            <p className="text-xs text-surface-500">
              After seed response, enter your calculated unlock key from OEM documentation.
            </p>
            <select
              value={manualMfg}
              onChange={(e) => setManualMfg(e.target.value)}
              className="select-field w-full text-sm"
            >
              {ECUSecurity.getSupportedManufacturers().map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              value={manualKeyHex}
              onChange={(e) => setManualKeyHex(e.target.value.toUpperCase())}
              className="input-field w-full font-mono text-sm"
              placeholder="Key bytes e.g. A1 B2 C3 D4"
            />
            <button
              type="button"
              onClick={runManualUnlock}
              disabled={!isConnected || busy}
              className="btn-secondary w-full text-sm"
            >
              Send manual unlock
            </button>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-surface-400">Session log</span>
            <button type="button" onClick={copyLog} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
              <Copy className="w-3 h-3" /> Copy
            </button>
          </div>
          <div className="font-mono text-xs text-surface-400 max-h-48 overflow-y-auto custom-scrollbar space-y-1">
            {log.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
