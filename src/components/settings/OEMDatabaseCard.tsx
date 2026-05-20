'use client';

import { useEffect, useRef, useState } from 'react';
import { Database, Download, RefreshCw, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  getOEMDatabaseStats,
  getOEMLoadError,
  isOEMDatabaseLoaded,
  loadOEMDatabase,
  importCustomOEMBundle,
  getOEMSyncMeta,
  saveOEMSyncMeta,
  runOEMAutoSyncIfDue,
  clearCustomOverlay,
} from '@/lib/oem-database';

export default function OEMDatabaseCard() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [stats, setStats] = useState<ReturnType<typeof getOEMDatabaseStats>>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncMeta, setSyncMeta] = useState(getOEMSyncMeta);
  const [syncMessage, setSyncMessage] = useState('');

  const refresh = async () => {
    setLoading(true);
    await loadOEMDatabase(true);
    setLoaded(isOEMDatabaseLoaded());
    setStats(getOEMDatabaseStats());
    setError(getOEMLoadError());
    setSyncMeta(getOEMSyncMeta());
    setLoading(false);
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const json = JSON.parse(text) as unknown;
      const result = importCustomOEMBundle(json);
      if (result.success) {
        toast.success(result.message);
        await refresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Invalid JSON file');
    }
  };

  const handleAutoSyncToggle = () => {
    const next = !syncMeta.autoSyncEnabled;
    saveOEMSyncMeta({ autoSyncEnabled: next });
    setSyncMeta(getOEMSyncMeta());
    toast.info(next ? 'OEM auto-sync enabled' : 'OEM auto-sync disabled');
  };

  const handleForceSync = async () => {
    setLoading(true);
    const result = await runOEMAutoSyncIfDue(true);
    setSyncMessage(result.message);
    await refresh();
    setLoading(false);
    toast[result.ran ? 'success' : 'info'](result.message);
  };

  return (
    <div className="col-span-12 lg:col-span-4 glass-card p-5 border border-surface-700/50">
      <div className="flex items-center gap-3 mb-4">
        <Database className="w-5 h-5 text-brand-400" />
        <h2 className="section-title">Offline OEM Database</h2>
      </div>
      <p className="text-xs text-surface-500 mb-4">
        Manufacturer DTC definitions and generic SAE codes bundled for fully offline lookup.
        Import custom JSON overlays or check for bundle updates when online.
      </p>

      {loaded && stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-surface-800/40 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-brand-400">{stats.uniqueCodes.toLocaleString()}</p>
            <p className="text-[10px] text-surface-500">Unique codes</p>
          </div>
          <div className="bg-surface-800/40 rounded-lg p-3 text-center">
            <p className="text-lg font-bold text-white">{stats.totalDefinitions.toLocaleString()}</p>
            <p className="text-[10px] text-surface-500">Definitions</p>
          </div>
          <div className="bg-surface-800/40 rounded-lg p-3 text-center col-span-2 sm:col-span-1">
            <p className="text-lg font-bold text-white">{stats.sourceFiles}</p>
            <p className="text-[10px] text-surface-500">OEM sources</p>
          </div>
        </div>
      ) : error ? (
        <p className="text-xs text-warning flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4" />
          {error}. Run <code className="text-brand-400">npm run build:oem-db</code> then rebuild.
        </p>
      ) : null}

      <label className="flex items-center gap-2 text-xs text-surface-400 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={syncMeta.autoSyncEnabled}
          onChange={handleAutoSyncToggle}
        />
        Auto-check for OEM bundle updates (weekly when online)
      </label>

      {syncMessage && (
        <p className="text-[10px] text-surface-500 mb-3">{syncMessage}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleImport(file);
          e.target.value = '';
        }}
      />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={refresh}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Reload database
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <Upload className="w-3.5 h-3.5" /> Import custom JSON
        </button>
        <button
          onClick={handleForceSync}
          disabled={loading}
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Check for updates
        </button>
        <a
          href="/data/oem/dtc-bundle.json"
          download
          className="btn-secondary text-xs flex items-center gap-2"
        >
          <Download className="w-3.5 h-3.5" /> Export bundle
        </a>
        <button
          onClick={() => {
            clearCustomOverlay();
            toast.info('Custom overlay cleared');
            void refresh();
          }}
          className="btn-secondary text-xs"
        >
          Clear overlay
        </button>
        {loaded && (
          <span className="text-xs text-success flex items-center gap-1 self-center">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready offline
          </span>
        )}
      </div>

      <p className="text-[10px] text-surface-600 mt-4">
        Sources: Wal33D/dtc-database (MIT), NHTSA vPIC. Custom import merges into local overlay.
        {syncMeta.bundleVersion > 0 && ` Bundle v${syncMeta.bundleVersion}.`}
        See DATA_SOURCES.md.
      </p>
    </div>
  );
}
