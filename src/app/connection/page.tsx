'use client';

import { useState } from 'react';
import {
  Bluetooth,
  Wifi,
  Usb,
  Search,
  Plug,
  Unplug,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Signal,
  Zap,
  Shield,
  Clock,
  ChevronDown,
  ChevronRight,
  Radio,
  Cpu,
  Car,
  Terminal,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PROTOCOL_NAMES, PROTOCOL_VEHICLE_COMPAT } from '@/lib/obd/elm327';
import { useOBD } from '@/lib/obd/OBDContext';
import type { ConnectionType, OBDProtocol } from '@/types';

const CONNECTION_ICONS: Record<ConnectionType, typeof Bluetooth> = {
  bluetooth: Bluetooth,
  wifi: Wifi,
  usb: Usb,
};

export default function ConnectionPage() {
  const {
    connectionState,
    initSteps,
    adapters,
    scanning,
    scan,
    connect,
    disconnect,
    sendCommand,
  } = useOBD();

  const [scanType, setScanType] = useState<ConnectionType | 'all'>('all');
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [showProtocols, setShowProtocols] = useState(false);
  const [rawCmd, setRawCmd] = useState('');
  const [rawLog, setRawLog] = useState<{ cmd: string; resp: string; time: number }[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);

  const handleScan = async (type: ConnectionType | 'all') => {
    setScanType(type);
    await scan(type);
  };

  const handleConnect = async (adapterId: string) => {
    const adapter = adapters.find(a => a.id === adapterId);
    if (!adapter) return;
    setConnectingId(adapterId);
    await connect(adapter);
    setConnectingId(null);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleSendRaw = async () => {
    if (!rawCmd.trim()) return;
    try {
      const resp = await sendCommand(rawCmd.trim());
      setRawLog(prev => [...prev, { cmd: rawCmd.trim(), resp, time: Date.now() }]);
    } catch (err: any) {
      setRawLog(prev => [...prev, { cmd: rawCmd.trim(), resp: `ERROR: ${err.message}`, time: Date.now() }]);
    }
    setRawCmd('');
  };

  const isConnected = connectionState.status === 'connected';
  const isConnecting = connectionState.status === 'connecting';
  const hasError = connectionState.status === 'error';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">OBD-II Connection</h1>
          <p className="text-surface-400 text-sm mt-1">Detect, pair, and manage your OBD-II adapter</p>
        </div>
        {isConnected && (
          <button onClick={handleDisconnect} className="btn-danger flex items-center gap-2 text-sm">
            <Unplug className="w-4 h-4" /> Disconnect
          </button>
        )}
      </div>

      {/* Connection Status Banner */}
      <div className={cn(
        'glass-card p-5 border-l-4 transition-all',
        isConnected ? 'border-l-success' : isConnecting ? 'border-l-warning' : 'border-l-surface-600'
      )}>
        <div className="flex items-center gap-5">
          <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center',
            isConnected ? 'bg-success/10' : isConnecting ? 'bg-warning/10' : 'bg-surface-800'
          )}>
            {isConnecting ? (
              <Loader2 className="w-7 h-7 text-warning animate-spin" />
            ) : isConnected ? (
              <CheckCircle2 className="w-7 h-7 text-success" />
            ) : (
              <Plug className="w-7 h-7 text-surface-500" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-white">
              {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'No Adapter Connected'}
            </h2>
            {isConnected && connectionState.adapter && (
              <div className="flex items-center gap-4 mt-1 text-sm text-surface-400">
                <span className="flex items-center gap-1.5">
                  {(() => { const Icon = CONNECTION_ICONS[connectionState.adapter.type]; return <Icon className="w-3.5 h-3.5" />; })()}
                  {connectionState.adapter.name}
                </span>
                <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> {connectionState.adapter.chipset}</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {connectionState.voltage}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {connectionState.latency}ms</span>
              </div>
            )}
            {!isConnected && !isConnecting && (
              <p className="text-sm text-surface-500 mt-0.5">Scan for OBD-II adapters via Bluetooth, WiFi, or USB</p>
            )}
          </div>
          {isConnected && (
            <div className="text-right">
              <p className="text-xs text-surface-500">Protocol</p>
              <p className="text-sm font-medium text-brand-400">{connectionState.protocol ? PROTOCOL_NAMES[connectionState.protocol] : 'Unknown'}</p>
              {connectionState.vin && (
                <>
                  <p className="text-xs text-surface-500 mt-1">VIN</p>
                  <p className="text-sm font-mono text-surface-300">{connectionState.vin}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Connected Details */}
        {isConnected && (
          <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-surface-700/30">
            <div>
              <p className="text-xs text-surface-500 mb-1">ECU Addresses</p>
              <div className="flex gap-1.5">
                {connectionState.ecuAddresses.map(addr => (
                  <span key={addr} className="px-2 py-0.5 bg-surface-800 rounded text-xs font-mono text-surface-300">{addr}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Supported PIDs</p>
              <p className="text-sm font-bold text-white">{connectionState.supportedPIDs.length} <span className="text-surface-400 font-normal">parameters</span></p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Adapter Firmware</p>
              <p className="text-sm text-surface-300">{connectionState.adapter?.firmwareVersion || 'Unknown'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {hasError && connectionState.error && (
        <div className="glass-card p-4 border-l-4 border-l-danger">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-danger">Connection Error</p>
              <p className="text-xs text-surface-400 mt-0.5">{connectionState.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Init Log (real ECU initialization steps) */}
      {initSteps.length > 0 && (isConnecting || isConnected) && (
        <div className="glass-card p-5">
          <h3 className="section-title mb-3">ECU Initialization Log</h3>
          <div className="space-y-2 font-mono text-xs">
            {initSteps.map((log, i) => (
              <div key={i} className="flex items-center gap-3">
                {log.status === 'pending' && <div className="w-4 h-4 rounded-full border border-surface-600" />}
                {log.status === 'running' && <Loader2 className="w-4 h-4 text-warning animate-spin" />}
                {log.status === 'done' && <CheckCircle2 className="w-4 h-4 text-success" />}
                {log.status === 'error' && <AlertTriangle className="w-4 h-4 text-danger" />}
                <span className={cn(
                  log.status === 'done' ? 'text-surface-300' : log.status === 'running' ? 'text-white' : log.status === 'error' ? 'text-danger' : 'text-surface-500'
                )}>{log.step}</span>
                {log.message && <span className={cn('ml-auto', log.status === 'error' ? 'text-danger' : 'text-surface-500')}>{log.message}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan Controls */}
      {!isConnected && !isConnecting && (
        <>
          <div className="glass-card p-5">
            <h3 className="section-title mb-1">Scan for Adapters</h3>
            <p className="section-subtitle mb-4">Search for OBD-II adapters on all connection types</p>

            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => handleScan('all')}
                disabled={scanning}
                className="btn-primary flex flex-col items-center gap-2 py-4 text-sm disabled:opacity-50"
              >
                {scanning && scanType === 'all' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                Scan All
              </button>
              <button
                onClick={() => handleScan('bluetooth')}
                disabled={scanning}
                className="btn-secondary flex flex-col items-center gap-2 py-4 text-sm disabled:opacity-50"
              >
                {scanning && scanType === 'bluetooth' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Bluetooth className="w-6 h-6" />}
                Bluetooth
              </button>
              <button
                onClick={() => handleScan('wifi')}
                disabled={scanning}
                className="btn-secondary flex flex-col items-center gap-2 py-4 text-sm disabled:opacity-50"
              >
                {scanning && scanType === 'wifi' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wifi className="w-6 h-6" />}
                WiFi
              </button>
              <button
                onClick={() => handleScan('usb')}
                disabled={scanning}
                className="btn-secondary flex flex-col items-center gap-2 py-4 text-sm disabled:opacity-50"
              >
                {scanning && scanType === 'usb' ? <Loader2 className="w-6 h-6 animate-spin" /> : <Usb className="w-6 h-6" />}
                USB
              </button>
            </div>
          </div>

          {/* Discovered Adapters */}
          {(adapters.length > 0 || scanning) && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-700/50 flex items-center justify-between">
                <h3 className="section-title">
                  {scanning ? 'Scanning...' : `Found ${adapters.length} Adapter${adapters.length !== 1 ? 's' : ''}`}
                </h3>
                {scanning && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
              </div>
              <div className="divide-y divide-surface-700/30">
                {adapters.map(adapter => {
                  const Icon = CONNECTION_ICONS[adapter.type];
                  const isAdapterConnecting = connectingId === adapter.id;

                  return (
                    <div key={adapter.id} className="px-5 py-4 flex items-center gap-4 hover:bg-surface-800/30 transition-colors">
                      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center',
                        adapter.type === 'bluetooth' ? 'bg-blue-500/10' : adapter.type === 'wifi' ? 'bg-purple-500/10' : 'bg-green-500/10'
                      )}>
                        <Icon className={cn('w-6 h-6',
                          adapter.type === 'bluetooth' ? 'text-blue-400' : adapter.type === 'wifi' ? 'text-purple-400' : 'text-green-400'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{adapter.name}</h4>
                          {adapter.paired && <span className="text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success">Paired</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-surface-400 mt-0.5">
                          <span>{adapter.type.toUpperCase()}</span>
                          <span className="font-mono">{adapter.address}</span>
                          {adapter.chipset && <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {adapter.chipset}</span>}
                          {adapter.rssi && (
                            <span className="flex items-center gap-1">
                              <Signal className="w-3 h-3" />
                              {adapter.rssi > -50 ? 'Excellent' : adapter.rssi > -70 ? 'Good' : 'Weak'} ({adapter.rssi} dBm)
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleConnect(adapter.id)}
                        disabled={isAdapterConnecting || isConnecting}
                        className={cn('btn-primary text-sm flex items-center gap-2 disabled:opacity-50',
                          isAdapterConnecting && 'animate-pulse'
                        )}
                      >
                        {isAdapterConnecting ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
                        ) : (
                          <><Plug className="w-4 h-4" /> Connect</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Supported Protocols */}
      <div className="glass-card">
        <button
          onClick={() => setShowProtocols(!showProtocols)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-800/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-brand-400" />
            <div className="text-left">
              <h3 className="section-title">Supported Protocols & Vehicle Compatibility</h3>
              <p className="section-subtitle">11 OBD-II protocols covering all vehicles 1996+</p>
            </div>
          </div>
          {showProtocols ? <ChevronDown className="w-5 h-5 text-surface-400" /> : <ChevronRight className="w-5 h-5 text-surface-400" />}
        </button>

        {showProtocols && (
          <div className="px-5 pb-5 space-y-3">
            {(Object.entries(PROTOCOL_NAMES) as [OBDProtocol, string][]).filter(([key]) => key !== 'AUTO').map(([key, name]) => (
              <div key={key} className="p-4 bg-surface-800/30 rounded-xl border border-surface-700/20">
                <div className="flex items-center gap-2 mb-2">
                  <Radio className="w-4 h-4 text-brand-400" />
                  <span className="text-sm font-medium text-white">{name}</span>
                  {connectionState.protocol === key && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">Active</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PROTOCOL_VEHICLE_COMPAT[key]?.map(vehicle => (
                    <span key={vehicle} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-800/80 text-[10px] text-surface-400">
                      <Car className="w-3 h-3" /> {vehicle}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw OBD Terminal — send AT/OBD commands directly to ECU */}
      {isConnected && (
        <div className="glass-card">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-surface-800/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-brand-400" />
              <div className="text-left">
                <h3 className="section-title">Raw ECU Terminal</h3>
                <p className="section-subtitle">Send AT commands and OBD PIDs directly to the vehicle ECU</p>
              </div>
            </div>
            {showTerminal ? <ChevronDown className="w-5 h-5 text-surface-400" /> : <ChevronRight className="w-5 h-5 text-surface-400" />}
          </button>
          {showTerminal && (
            <div className="px-5 pb-5">
              <div className="bg-surface-950 rounded-xl border border-surface-700/30 p-4 font-mono text-xs max-h-[300px] overflow-y-auto mb-3">
                {rawLog.length === 0 && <p className="text-surface-600">Type a command below (e.g. ATI, ATRV, 010C, 0100, 03)</p>}
                {rawLog.map((entry, i) => (
                  <div key={i} className="mb-2">
                    <span className="text-brand-400">&gt; {entry.cmd}</span>
                    <pre className={cn('ml-4 whitespace-pre-wrap', entry.resp.startsWith('ERROR') ? 'text-danger' : 'text-surface-300')}>{entry.resp}</pre>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={rawCmd}
                  onChange={e => setRawCmd(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSendRaw()}
                  placeholder="Enter OBD/AT command..."
                  className="input-field flex-1 font-mono text-sm"
                />
                <button onClick={handleSendRaw} className="btn-primary text-sm px-4">Send</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connection Help */}
      <div className="glass-card p-5">
        <h3 className="section-title mb-3">Quick Setup Guide</h3>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Bluetooth className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="text-sm font-medium text-white">Bluetooth</h4>
            </div>
            <ol className="text-xs text-surface-400 space-y-1 list-decimal list-inside">
              <li>Plug OBD-II adapter into vehicle&apos;s OBD port</li>
              <li>Turn ignition ON (engine optional)</li>
              <li>Enable Bluetooth on your device</li>
              <li>Click &quot;Scan Bluetooth&quot; above</li>
              <li>Select your adapter and connect</li>
            </ol>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Wifi className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-sm font-medium text-white">WiFi</h4>
            </div>
            <ol className="text-xs text-surface-400 space-y-1 list-decimal list-inside">
              <li>Plug WiFi OBD-II adapter into vehicle</li>
              <li>Turn ignition ON</li>
              <li>Connect to adapter&apos;s WiFi network</li>
              <li>Click &quot;Scan WiFi&quot; above</li>
              <li>Auto-detection will find the adapter</li>
            </ol>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Usb className="w-4 h-4 text-green-400" />
              </div>
              <h4 className="text-sm font-medium text-white">USB</h4>
            </div>
            <ol className="text-xs text-surface-400 space-y-1 list-decimal list-inside">
              <li>Connect OBD-II cable to vehicle OBD port</li>
              <li>Connect USB end to your computer</li>
              <li>Turn ignition ON</li>
              <li>Click &quot;Scan USB&quot; above</li>
              <li>Grant serial port access when prompted</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
