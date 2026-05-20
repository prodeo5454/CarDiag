'use client';

import { useState, useEffect } from 'react';
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
  Star,
} from 'lucide-react';
import { getPreferences } from '@/lib/preferences';
import { cn } from '@/lib/utils';
import { PROTOCOL_NAMES, PROTOCOL_VEHICLE_COMPAT } from '@/lib/obd/elm327';
import { useOBD } from '@/lib/obd/OBDContext';
import { isCapacitorNativeHost } from '@/lib/obd/native-ble-platform';
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
  const [isNativeApp, setIsNativeApp] = useState(false);

  useEffect(() => {
    void isCapacitorNativeHost().then(setIsNativeApp);
  }, []);

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
  const preferredAdapterId =
    typeof window !== 'undefined' ? getPreferences().obd.preferredAdapter : '';

  return (
    <div className="space-y-6 animate-fade-in">
      {isNativeApp && (
        <div className="glass-card p-4 border border-brand-500/25 flex gap-3 items-start">
          <Bluetooth className="w-5 h-5 text-brand-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white">Android / iOS app</p>
            <p className="text-xs text-surface-400 mt-1">
              Use Bluetooth LE to pair your OBD adapter. USB serial is not available on phones — Wi‑Fi
              adapters may work when the adapter IP is reachable.
            </p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Connection</h1>
          <p className="text-surface-400 text-sm mt-1">Manage your OBD-II adapter</p>
        </div>
        {isConnected && (
          <button onClick={handleDisconnect} className="btn-danger flex items-center justify-center gap-2 text-sm py-2 px-4 w-full sm:w-auto">
            <Unplug className="w-4 h-4" /> Disconnect
          </button>
        )}
      </div>

      {/* Connection Status Banner */}
      <div className={cn(
        'glass-card p-4 sm:p-5 border-l-4 transition-all',
        isConnected ? 'border-l-success' : isConnecting ? 'border-l-warning' : 'border-l-surface-600'
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
          <div className="flex items-center gap-4 flex-1">
            <div className={cn('w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0',
              isConnected ? 'bg-success/10' : isConnecting ? 'bg-warning/10' : 'bg-surface-800'
            )}>
              {isConnecting ? (
                <Loader2 className="w-6 h-6 sm:w-7 sm:h-7 text-warning animate-spin" />
              ) : isConnected ? (
                <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7 text-success" />
              ) : (
                <Plug className="w-6 h-6 sm:w-7 sm:h-7 text-surface-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-bold text-white truncate">
                {isConnected ? 'Connected' : isConnecting ? 'Connecting...' : 'No Adapter'}
              </h2>
              {isConnected && connectionState.adapter && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5 text-[10px] sm:text-sm text-surface-400">
                  <span className="flex items-center gap-1">
                    {(() => { const Icon = CONNECTION_ICONS[connectionState.adapter.type]; return <Icon className="w-3 h-3" />; })()}
                    {connectionState.adapter.name}
                  </span>
                  <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {connectionState.adapter.chipset}</span>
                </div>
              )}
              {!isConnected && !isConnecting && (
                <p className="text-xs text-surface-500 mt-0.5">Scan for adapters via BT, WiFi, or USB</p>
              )}
            </div>
          </div>

          {isConnected && (
            <div className="flex sm:flex-col justify-between items-center sm:items-end border-t sm:border-t-0 border-surface-700/30 pt-3 sm:pt-0">
              <div className="text-left sm:text-right">
                <p className="text-[10px] text-surface-500">Protocol</p>
                <p className="text-xs sm:text-sm font-medium text-brand-400 truncate max-w-[120px] sm:max-w-none">{connectionState.protocol ? PROTOCOL_NAMES[connectionState.protocol] : 'Unknown'}</p>
              </div>
              {connectionState.vin && (
                <div className="text-right ml-4 sm:ml-0 sm:mt-1">
                  <p className="text-[10px] text-surface-500">VIN</p>
                  <p className="text-[10px] sm:text-sm font-mono text-surface-300">{connectionState.vin}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Connected Details */}
        {isConnected && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4 sm:mt-5 pt-4 border-t border-surface-700/30">
            <div className="col-span-2 sm:col-span-1">
              <p className="text-[10px] text-surface-500 mb-1 uppercase tracking-wider font-semibold">ECU Addresses</p>
              <div className="flex flex-wrap gap-1.5">
                {connectionState.ecuAddresses.map(addr => (
                  <span key={addr} className="px-1.5 py-0.5 bg-surface-800 rounded text-[10px] font-mono text-surface-300 border border-surface-700/50">{addr}</span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-surface-500 mb-1 uppercase tracking-wider font-semibold">Parameters</p>
              <p className="text-xs sm:text-sm font-bold text-white">{connectionState.supportedPIDs.length} <span className="text-surface-400 font-normal">supported</span></p>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-[10px] text-surface-500 mb-1 uppercase tracking-wider font-semibold">Latency</p>
              <p className="text-xs sm:text-sm text-surface-300">{connectionState.latency}ms</p>
            </div>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {hasError && connectionState.error && (
        <div className="glass-card p-3 sm:p-4 border-l-4 border-l-danger">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-danger">Connection Error</p>
              <p className="text-[10px] sm:text-xs text-surface-400 mt-0.5 truncate">{connectionState.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Init Log */}
      {initSteps.length > 0 && (isConnecting || isConnected) && (
        <div className="glass-card p-4 sm:p-5">
          <h3 className="section-title text-sm sm:text-base mb-3">ECU Initialization Log</h3>
          <div className="space-y-2 font-mono text-[10px] sm:text-xs max-h-[150px] overflow-y-auto pr-2">
            {initSteps.map((log, i) => (
              <div key={i} className="flex items-center gap-2 sm:gap-3">
                {log.status === 'pending' && <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-surface-600" />}
                {log.status === 'running' && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-warning animate-spin" />}
                {log.status === 'done' && <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-success" />}
                {log.status === 'error' && <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-danger" />}
                <span className={cn(
                  'truncate',
                  log.status === 'done' ? 'text-surface-300' : log.status === 'running' ? 'text-white' : log.status === 'error' ? 'text-danger' : 'text-surface-500'
                )}>{log.step}</span>
                {log.message && <span className={cn('ml-auto text-[9px] sm:text-[10px]', log.status === 'error' ? 'text-danger' : 'text-surface-500')}>{log.message}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scan Controls */}
      {!isConnected && !isConnecting && (
        <>
          <div className="glass-card p-4 sm:p-5">
            <h3 className="section-title text-sm sm:text-base mb-1">Scan for Adapters</h3>
            <p className="section-subtitle text-xs mb-4">Search on all connection types</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <button
                onClick={() => handleScan('all')}
                disabled={scanning}
                className="btn-primary flex flex-col items-center gap-2 py-3 sm:py-4 text-xs sm:text-sm disabled:opacity-50"
              >
                {scanning && scanType === 'all' ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Search className="w-5 h-5 sm:w-6 sm:h-6" />}
                Scan All
              </button>
              <button
                onClick={() => handleScan('bluetooth')}
                disabled={scanning}
                className="btn-secondary flex flex-col items-center gap-2 py-3 sm:py-4 text-xs sm:text-sm disabled:opacity-50"
              >
                {scanning && scanType === 'bluetooth' ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Bluetooth className="w-5 h-5 sm:w-6 sm:h-6" />}
                Bluetooth
              </button>
              <button
                onClick={() => handleScan('wifi')}
                disabled={scanning}
                className="btn-secondary flex flex-col items-center gap-2 py-3 sm:py-4 text-xs sm:text-sm disabled:opacity-50"
              >
                {scanning && scanType === 'wifi' ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Wifi className="w-5 h-5 sm:w-6 sm:h-6" />}
                WiFi
              </button>
              <button
                onClick={() => handleScan('usb')}
                disabled={scanning}
                className="btn-secondary flex flex-col items-center gap-2 py-3 sm:py-4 text-xs sm:text-sm disabled:opacity-50"
              >
                {scanning && scanType === 'usb' ? <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" /> : <Usb className="w-5 h-5 sm:w-6 sm:h-6" />}
                USB
              </button>
            </div>
          </div>

          {/* Discovered Adapters */}
          {(adapters.length > 0 || scanning) && (
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-surface-700/50 flex items-center justify-between">
                <h3 className="section-title text-sm sm:text-base">
                  {scanning ? 'Scanning...' : `Found ${adapters.length} Adapter${adapters.length !== 1 ? 's' : ''}`}
                </h3>
                {scanning && <Loader2 className="w-4 h-4 text-brand-400 animate-spin" />}
              </div>
              <div className="divide-y divide-surface-700/30">
                {adapters.map(adapter => {
                  const Icon = CONNECTION_ICONS[adapter.type];
                  const isAdapterConnecting = connectingId === adapter.id;

                  return (
                    <div key={adapter.id} className="px-4 py-3 sm:py-4 flex items-center gap-3 sm:gap-4 hover:bg-surface-800/30 transition-colors">
                      <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                        adapter.type === 'bluetooth' ? 'bg-blue-500/10' : adapter.type === 'wifi' ? 'bg-purple-500/10' : 'bg-green-500/10'
                      )}>
                        <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6',
                          adapter.type === 'bluetooth' ? 'text-blue-400' : adapter.type === 'wifi' ? 'text-purple-400' : 'text-green-400'
                        )} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate">{adapter.name}</h4>
                          {adapter.id === preferredAdapterId && (
                            <span title="Preferred adapter">
                              <Star className="w-3.5 h-3.5 text-warning fill-warning flex-shrink-0" />
                            </span>
                          )}
                          {adapter.paired && <span className="text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">Paired</span>}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] sm:text-xs text-surface-400 mt-0.5">
                          <span className="font-mono">{adapter.address}</span>
                          {adapter.rssi && (
                            <span className="flex items-center gap-1">
                              <Signal className="w-2.5 h-2.5" />
                              {adapter.rssi > -70 ? 'Good' : 'Weak'}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleConnect(adapter.id)}
                        disabled={isAdapterConnecting || isConnecting}
                        className={cn('btn-primary text-[10px] sm:text-sm py-1.5 px-3 sm:py-2 sm:px-4 flex items-center gap-1.5 disabled:opacity-50',
                          isAdapterConnecting && 'animate-pulse'
                        )}
                      >
                        {isAdapterConnecting ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> ...</>
                        ) : (
                          <><Plug className="w-3.5 h-3.5" /> Connect</>
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
          className="w-full px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between hover:bg-surface-800/20 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400" />
            <div className="text-left">
              <h3 className="section-title text-sm sm:text-base">Protocols & Compatibility</h3>
              <p className="section-subtitle text-[10px] sm:text-xs">Covering vehicles 1996+</p>
            </div>
          </div>
          {showProtocols ? <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-surface-400" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-surface-400" />}
        </button>

        {showProtocols && (
          <div className="px-4 pb-4 sm:px-5 sm:pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(Object.entries(PROTOCOL_NAMES) as [OBDProtocol, string][]).filter(([key]) => key !== 'AUTO').map(([key, name]) => (
              <div key={key} className="p-3 bg-surface-800/30 rounded-xl border border-surface-700/20">
                <div className="flex items-center gap-2 mb-1.5">
                  <Radio className="w-3.5 h-3.5 text-brand-400" />
                  <span className="text-[10px] sm:text-xs font-medium text-white truncate">{name}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {PROTOCOL_VEHICLE_COMPAT[key]?.slice(0, 3).map(vehicle => (
                    <span key={vehicle} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-800/80 text-[8px] sm:text-[9px] text-surface-400 border border-surface-700/30">
                      {vehicle}
                    </span>
                  ))}
                  {(PROTOCOL_VEHICLE_COMPAT[key]?.length || 0) > 3 && (
                    <span className="text-[8px] sm:text-[9px] text-surface-500 ml-1">+{PROTOCOL_VEHICLE_COMPAT[key]!.length - 3} more</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raw OBD Terminal */}
      {isConnected && (
        <div className="glass-card">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className="w-full px-4 py-3 sm:px-5 sm:py-4 flex items-center justify-between hover:bg-surface-800/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 sm:w-5 sm:h-5 text-brand-400" />
              <div className="text-left">
                <h3 className="section-title text-sm sm:text-base">Raw ECU Terminal</h3>
                <p className="section-subtitle text-[10px] sm:text-xs">Send commands directly to the ECU</p>
              </div>
            </div>
            {showTerminal ? <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-surface-400" /> : <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-surface-400" />}
          </button>
          {showTerminal && (
            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <div className="bg-surface-950 rounded-xl border border-surface-700/30 p-3 font-mono text-[9px] sm:text-xs h-[200px] overflow-y-auto mb-3">
                {rawLog.length === 0 && <p className="text-surface-600">Type a command (ATI, 010C, etc.)</p>}
                {rawLog.map((entry, i) => (
                  <div key={i} className="mb-2 border-b border-surface-900 pb-1 last:border-0">
                    <span className="text-brand-400">&gt; {entry.cmd}</span>
                    <pre className={cn('ml-2 mt-0.5 whitespace-pre-wrap', entry.resp.startsWith('ERROR') ? 'text-danger' : 'text-surface-300')}>{entry.resp}</pre>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={rawCmd}
                  onChange={e => setRawCmd(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleSendRaw()}
                  placeholder="Enter command..."
                  className="input-field flex-1 font-mono text-xs py-2"
                />
                <button onClick={handleSendRaw} className="btn-primary text-xs px-4 py-2">Send</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Setup Guide */}
      <div className="glass-card p-4 sm:p-5">
        <h3 className="section-title text-sm sm:text-base mb-3">Setup Guide</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-surface-800/20 p-3 rounded-xl border border-surface-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Bluetooth className="w-4 h-4 text-blue-400" />
              <h4 className="text-xs font-bold text-white">Bluetooth</h4>
            </div>
            <ol className="text-[10px] text-surface-400 space-y-1 list-decimal list-inside">
              <li>Plug adapter into OBD port</li>
              <li>Turn ignition ON</li>
              <li>Click &quot;Scan Bluetooth&quot;</li>
              <li>Select adapter and connect</li>
            </ol>
          </div>
          <div className="bg-surface-800/20 p-3 rounded-xl border border-surface-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-white">WiFi</h4>
            </div>
            <ol className="text-[10px] text-surface-400 space-y-1 list-decimal list-inside">
              <li>Plug WiFi adapter into port</li>
              <li>Turn ignition ON</li>
              <li>Connect to adapter&apos;s WiFi</li>
              <li>Click &quot;Scan WiFi&quot;</li>
            </ol>
          </div>
          <div className="bg-surface-800/20 p-3 rounded-xl border border-surface-700/30">
            <div className="flex items-center gap-2 mb-2">
              <Usb className="w-4 h-4 text-green-400" />
              <h4 className="text-xs font-bold text-white">USB</h4>
            </div>
            <ol className="text-[10px] text-surface-400 space-y-1 list-decimal list-inside">
              <li>Connect adapter cable</li>
              <li>Turn ignition ON</li>
              <li>Click &quot;Scan USB&quot;</li>
              <li>Grant serial port access</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
