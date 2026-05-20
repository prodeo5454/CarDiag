'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { OBDAdapter, OBDConnectionState, OBDPIDDefinition, ConnectionType } from '@/types';
import { OBDConnectionManager, getConnectionManager, type InitStep, type ECULiveReading } from './connection';
import { STANDARD_PIDS } from './pids';
import { recordConnectionEvent } from '@/lib/connection-events';
import {
  getOBDCommandTimeout,
  getPollingIntervalMs,
  getPreferences,
  LAST_ADAPTER_KEY,
} from '@/lib/preferences';
import { getAdapterById, rememberAdapter, rememberAdapters } from '@/lib/adapter-history';
import { toast } from 'sonner';

// ─── Context Types ──────────────────────────────────────────────────────────

export interface OBDContextValue {
  // Connection state
  connectionState: OBDConnectionState;
  initSteps: InitStep[];
  adapters: OBDAdapter[];
  scanning: boolean;

  // Actions
  scan: (type: ConnectionType | 'all') => Promise<void>;
  connect: (adapter: OBDAdapter) => Promise<boolean>;
  disconnect: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<string>;

  // Real ECU data reading
  readPIDValue: (pid: OBDPIDDefinition) => Promise<ECULiveReading | null>;
  readMultiplePIDs: (pids: OBDPIDDefinition[]) => Promise<ECULiveReading[]>;
  getSupportedPIDs: () => OBDPIDDefinition[];

  // DTC operations
  readDTCs: () => Promise<string[]>;
  readPendingDTCs: () => Promise<string[]>;
  readPermanentDTCs: () => Promise<string[]>;
  clearDTCs: () => Promise<boolean>;

  // I/M Readiness
  readIMReadiness: () => Promise<{ name: string; available: boolean; complete: boolean }[]>;

  // Live data polling
  liveReadings: Map<string, ECULiveReading>;
  liveHistory: Map<string, { time: number; value: number }[]>;
  isPolling: boolean;
  startPolling: (pids?: OBDPIDDefinition[]) => void;
  stopPolling: () => void;
  refreshLiveData: (pids?: OBDPIDDefinition[]) => Promise<void>;

  // Errors from last operation
  lastError: string | null;
  clearError: () => void;

  // Manager reference
  manager: OBDConnectionManager;
}

const OBDContext = createContext<OBDContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────────────────────

export function OBDProvider({ children }: { children: React.ReactNode }) {
  const managerRef = useRef<OBDConnectionManager>(getConnectionManager());
  const manager = managerRef.current;

  const [connectionState, setConnectionState] = useState<OBDConnectionState>(manager.getState());
  const [initSteps, setInitSteps] = useState<InitStep[]>([]);
  const [adapters, setAdapters] = useState<OBDAdapter[]>([]);
  const [scanning, setScanning] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const lastAdapterRef = useRef<OBDAdapter | null>(null);

  // Live data state
  const [liveReadings, setLiveReadings] = useState<Map<string, ECULiveReading>>(new Map());
  const [liveHistory, setLiveHistory] = useState<Map<string, { time: number; value: number }[]>>(new Map());
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(false);
  const pollingPIDsRef = useRef<OBDPIDDefinition[]>([]);

  // Optional auto-reconnect to last adapter
  useEffect(() => {
    const prefs = getPreferences();
    if (!prefs.obd.autoConnect) return;

    let cancelled = false;
    (async () => {
      if (manager.getState().status === 'connected') return;
      try {
        let adapter: OBDAdapter | null = null;
        if (prefs.obd.preferredAdapter) {
          adapter = getAdapterById(prefs.obd.preferredAdapter);
        }
        if (!adapter) {
          const raw = localStorage.getItem(LAST_ADAPTER_KEY);
          if (raw) adapter = JSON.parse(raw) as OBDAdapter;
        }
        if (!adapter || cancelled) return;
        const ok = await manager.connect(adapter);
        if (!cancelled) {
          setConnectionState(manager.getState());
          if (ok) {
            setLastError(null);
            toast.success(`Connected to ${adapter.name}`);
          } else {
            toast.error(`Could not connect to ${adapter.name}`);
          }
        }
      } catch {
        if (!cancelled) {
          toast.error('Auto-connect failed — open Connection to scan again');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [manager]);

  // Subscribe to connection events
  useEffect(() => {
    const unsubEvent = manager.on((event) => {
      setConnectionState(manager.getState());
    });
    const unsubInit = manager.onInitSteps((steps) => {
      setInitSteps([...steps]);
    });
    return () => { unsubEvent(); unsubInit(); };
  }, [manager]);

  // Scan
  const scan = useCallback(async (type: ConnectionType | 'all') => {
    setScanning(true);
    setAdapters([]);
    try {
      let results: OBDAdapter[] = [];
      if (type === 'all') {
        results = await manager.scanAll();
      } else if (type === 'bluetooth') {
        results = await manager.scanBluetooth();
      } else if (type === 'usb') {
        results = await manager.scanUSB();
      } else if (type === 'wifi') {
        results = await manager.scanWiFi();
      }
      setAdapters(results);
      if (results.length) rememberAdapters(results);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      setLastError(message);
      console.error('[OBD] Scan failed:', err);
    } finally {
      setScanning(false);
      setConnectionState(manager.getState());
    }
  }, [manager]);

  // Connect
  const connect = useCallback(async (adapter: OBDAdapter) => {
    lastAdapterRef.current = adapter;
    try {
      const success = await manager.connect(adapter);
      setConnectionState(manager.getState());
      recordConnectionEvent({
        adapterId: adapter.id,
        adapterName: adapter.name,
        connectionType: adapter.type,
        success,
      });
      if (!success) {
        setLastError('Failed to connect to adapter');
      } else {
        setLastError(null);
        try {
          localStorage.setItem(LAST_ADAPTER_KEY, JSON.stringify(adapter));
          rememberAdapter(adapter);
        } catch {
          /* quota */
        }
      }
      return success;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      setLastError(message);
      recordConnectionEvent({
        adapterId: adapter.id,
        adapterName: adapter.name,
        connectionType: adapter.type,
        success: false,
      });
      setConnectionState(manager.getState());
      return false;
    }
  }, [manager]);

  // Disconnect
  const disconnect = useCallback(async () => {
    pollingRef.current = false;
    setIsPolling(false);
    await manager.disconnect();
    setConnectionState(manager.getState());
    setLiveReadings(new Map());
    setLiveHistory(new Map());
  }, [manager]);

  // Send raw command
  const sendCommand = useCallback(async (cmd: string) => {
    return manager.sendCommand(cmd, getOBDCommandTimeout());
  }, [manager]);

  // Read single PID
  const readPIDValue = useCallback(async (pid: OBDPIDDefinition) => {
    return manager.readPIDValue(pid);
  }, [manager]);

  // Read multiple PIDs
  const readMultiplePIDs = useCallback(async (pids: OBDPIDDefinition[]) => {
    return manager.readMultiplePIDs(pids);
  }, [manager]);

  // Get supported PIDs
  const getSupportedPIDs = useCallback(() => {
    return manager.getSupportedPIDDefinitions();
  }, [manager]);

  // DTCs
  const readDTCs = useCallback(() => manager.readDTCs(), [manager]);
  const readPendingDTCs = useCallback(() => manager.readPendingDTCs(), [manager]);
  const readPermanentDTCs = useCallback(() => manager.readPermanentDTCs(), [manager]);
  const clearDTCs = useCallback(() => manager.clearDTCs(), [manager]);

  // I/M Readiness
  const readIMReadiness = useCallback(() => manager.readIMReadiness(), [manager]);

  // ─── Live Polling Loop ────────────────────────────────────────────────

  const startPolling = useCallback((pids?: OBDPIDDefinition[]) => {
    if (!manager.isConnected()) return;

    const pollPids = pids || manager.getSupportedPIDDefinitions();
    pollingPIDsRef.current = pollPids;
    pollingRef.current = true;
    setIsPolling(true);

    const MAX_HISTORY = 120;

    const poll = async () => {
      while (pollingRef.current && manager.isConnected()) {
        const readings = await manager.readMultiplePIDs(pollingPIDsRef.current);

        setLiveReadings(prev => {
          const next = new Map(prev);
          for (const r of readings) {
            next.set(r.pid.pid, r);
          }
          return next;
        });

        setLiveHistory(prev => {
          const next = new Map(prev);
          for (const r of readings) {
            const existing = next.get(r.pid.pid) || [];
            const updated = [...existing, { time: r.timestamp, value: r.value }];
            if (updated.length > MAX_HISTORY) updated.splice(0, updated.length - MAX_HISTORY);
            next.set(r.pid.pid, updated);
          }
          return next;
        });

        // Small delay between poll cycles to not overwhelm the adapter
        await new Promise((r) => setTimeout(r, getPollingIntervalMs()));
      }
      setIsPolling(false);
    };

    poll();
  }, [manager]);

  const stopPolling = useCallback(() => {
    pollingRef.current = false;
    setIsPolling(false);
  }, []);

  const refreshLiveData = useCallback(async (pids?: OBDPIDDefinition[]) => {
    if (!manager.isConnected()) return;

    const pollPids = pids || manager.getSupportedPIDDefinitions();
    const readings = await manager.readMultiplePIDs(pollPids);
    const MAX_HISTORY = 120;

    setLiveReadings(prev => {
      const next = new Map(prev);
      for (const r of readings) {
        next.set(r.pid.pid, r);
      }
      return next;
    });

    setLiveHistory(prev => {
      const next = new Map(prev);
      for (const r of readings) {
        const existing = next.get(r.pid.pid) || [];
        const updated = [...existing, { time: r.timestamp, value: r.value }];
        if (updated.length > MAX_HISTORY) updated.splice(0, updated.length - MAX_HISTORY);
        next.set(r.pid.pid, updated);
      }
      return next;
    });
  }, [manager]);

  const value: OBDContextValue = {
    connectionState,
    initSteps,
    adapters,
    scanning,
    scan,
    connect,
    disconnect,
    sendCommand,
    readPIDValue,
    readMultiplePIDs,
    getSupportedPIDs,
    readDTCs,
    readPendingDTCs,
    readPermanentDTCs,
    clearDTCs,
    readIMReadiness,
    liveReadings,
    liveHistory,
    isPolling,
    startPolling,
    stopPolling,
    refreshLiveData,
    lastError,
    clearError: () => setLastError(null),
    manager,
  };

  return <OBDContext.Provider value={value}>{children}</OBDContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useOBD(): OBDContextValue {
  const ctx = useContext(OBDContext);
  if (!ctx) throw new Error('useOBD must be used within <OBDProvider>');
  return ctx;
}
