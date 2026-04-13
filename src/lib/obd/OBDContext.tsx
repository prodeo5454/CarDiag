'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { OBDAdapter, OBDConnectionState, OBDPIDDefinition, ConnectionType } from '@/types';
import { OBDConnectionManager, getConnectionManager, type InitStep, type ECULiveReading } from './connection';
import { STANDARD_PIDS } from './pids';

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

  // Live data state
  const [liveReadings, setLiveReadings] = useState<Map<string, ECULiveReading>>(new Map());
  const [liveHistory, setLiveHistory] = useState<Map<string, { time: number; value: number }[]>>(new Map());
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef(false);
  const pollingPIDsRef = useRef<OBDPIDDefinition[]>([]);

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
    } catch (err) {
      console.error('[OBD] Scan failed:', err);
    } finally {
      setScanning(false);
      setConnectionState(manager.getState());
    }
  }, [manager]);

  // Connect
  const connect = useCallback(async (adapter: OBDAdapter) => {
    const success = await manager.connect(adapter);
    setConnectionState(manager.getState());
    return success;
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
    return manager.sendCommand(cmd);
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
        await new Promise(r => setTimeout(r, 50));
      }
      setIsPolling(false);
    };

    poll();
  }, [manager]);

  const stopPolling = useCallback(() => {
    pollingRef.current = false;
    setIsPolling(false);
  }, []);

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
