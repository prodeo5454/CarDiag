'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Download,
  Upload,
  Trash2,
  Smartphone,
  Monitor,
  Bell,
  Shield,
  Database,
  Globe,
  Palette,
  Volume2,
  Wifi,
  Battery,
  Car,
  User,
  Moon,
  Sun,
  Languages,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { MaintenanceTracker } from '@/lib/obd/maintenance-tracker';
import { usePWA } from '@/components/PWAProvider';
import AISettingsCard from '@/components/settings/AISettingsCard';
import OEMDatabaseCard from '@/components/settings/OEMDatabaseCard';
import { usePreferences } from '@/components/providers/PreferencesProvider';
import {
  type CarDiagPreferences,
  DEFAULT_PREFERENCES,
  getPreferences,
  savePreferences as persistPreferences,
} from '@/lib/preferences';
import { getKnownAdapters } from '@/lib/adapter-history';
import SettingsToggle from '@/components/ui/SettingsToggle';
import { APP_BUILD_DATE, APP_VERSION, getPlatformLabel, isNativeApp } from '@/lib/app-info';

export default function SettingsPage() {
  const { isInstalled, canInstall, install } = usePWA();
  const { setPreferences: applyPreferences } = usePreferences();
  const [preferences, setPreferences] = useState<CarDiagPreferences>(DEFAULT_PREFERENCES);

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [knownAdapters, setKnownAdapters] = useState<{ id: string; name: string; type: string }[]>([]);

  useEffect(() => {
    setPreferences(getPreferences());
    setKnownAdapters(getKnownAdapters());
  }, []);

  const applyThemePreview = (theme: CarDiagPreferences['theme']) => {
    const next = { ...preferences, theme };
    setPreferences(next);
    setHasChanges(true);
    applyPreferences(next);
  };

  const updatePreference = (category: keyof CarDiagPreferences, key: string, value: unknown) => {
    setPreferences(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' 
        ? { ...prev[category], [key]: value }
        : value
    }));
    setHasChanges(true);
  };

  const updateNestedPreference = (
    category: keyof CarDiagPreferences,
    subcategory: string,
    key: string,
    value: unknown
  ) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...(typeof prev[category] === 'object' ? prev[category] : {}),
        [subcategory]: {
          ...((prev[category] as any)?.[subcategory] || {}),
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      persistPreferences(preferences);
      applyPreferences(preferences);
      setKnownAdapters(getKnownAdapters());
      setHasChanges(false);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = () => {
    const data = MaintenanceTracker.exportMaintenanceData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardiag-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          MaintenanceTracker.importMaintenanceData(data);
          alert('Data imported successfully!');
        } catch (error) {
          alert('Failed to import data. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      localStorage.clear();
      alert('All data cleared. The app will reload.');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-surface-400 text-sm mt-1">Configure your CarDiag Pro experience</p>
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <button
              onClick={savePreferences}
              disabled={isSaving}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Error</span>
            </div>
          )}
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Appearance */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-brand-400" />
            <h2 className="section-title">Appearance</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'light', icon: Sun, label: 'Light' },
                  { value: 'dark', icon: Moon, label: 'Dark' },
                  { value: 'auto', icon: Monitor, label: 'Auto' },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    onClick={() => applyThemePreview(value as CarDiagPreferences['theme'])}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                      preferences.theme === value
                        ? 'bg-brand-500/20 border-brand-500'
                        : 'bg-surface-800/50 border-surface-700/30 hover:bg-surface-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs">{label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-surface-500 mt-2">Light theme is beta — some screens may stay dark.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => updatePreference('language', '', e.target.value)}
                className="select-field w-full text-sm"
              >
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
                <option value="pt">Português</option>
                <option value="ru">Pycckki</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
                <option value="ko">Korean</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Units</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'metric', label: 'Metric (km, °C)' },
                  { value: 'imperial', label: 'Imperial (mi, °F)' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updatePreference('units', '', value)}
                    className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                      preferences.units === value
                        ? 'bg-brand-500/20 border-brand-500'
                        : 'bg-surface-800/50 border-surface-700/30 hover:bg-surface-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-brand-400" />
            <h2 className="section-title">Notifications</h2>
          </div>
          
          <div className="space-y-3">
            {[
              { key: 'enabled', label: 'Enable Notifications', description: 'Show system notifications' },
              { key: 'maintenance', label: 'Maintenance Reminders', description: 'Alert for upcoming service' },
              { key: 'diagnostics', label: 'Diagnostic Alerts', description: 'New DTCs detected' },
              { key: 'connection', label: 'Connection Status', description: 'Adapter connect/disconnect' },
              { key: 'updates', label: 'App Updates', description: 'New versions available' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-surface-500">{description}</p>
                </div>
                <button
                  onClick={() => updateNestedPreference('notifications', '', key, !preferences.notifications[key as keyof typeof preferences.notifications])}
                  className={`w-12 h-6 rounded-full transition-all ${
                    preferences.notifications[key as keyof typeof preferences.notifications]
                      ? 'bg-brand-500'
                      : 'bg-surface-700'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    preferences.notifications[key as keyof typeof preferences.notifications] ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Data Management */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-brand-400" />
            <h2 className="section-title">Data Management</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Auto Backup</p>
                <p className="text-xs text-surface-500">Automatically backup data</p>
              </div>
              <button
                onClick={() => updateNestedPreference('data', '', 'autoBackup', !preferences.data.autoBackup)}
                className={`w-12 h-6 rounded-full transition-all ${
                  preferences.data.autoBackup ? 'bg-brand-500' : 'bg-surface-700'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  preferences.data.autoBackup ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Backup Interval</label>
              <select
                value={preferences.data.backupInterval}
                onChange={(e) => updateNestedPreference('data', '', 'backupInterval', e.target.value)}
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Data Retention</label>
              <select
                value={preferences.data.retentionDays}
                onChange={(e) => updateNestedPreference('data', '', 'retentionDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
                <option value="365">1 year</option>
                <option value="730">2 years</option>
                <option value="3650">Forever</option>
              </select>
            </div>

            <div className="pt-3 border-t border-surface-700/50 space-y-2">
              <button
                onClick={exportData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface-800/50 border border-surface-700/30 rounded-lg text-white hover:bg-surface-800 transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Export Data</span>
              </button>
              
              <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-surface-800/50 border border-surface-700/30 rounded-lg text-white hover:bg-surface-800 transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span className="text-sm">Import Data</span>
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              
              <button
                onClick={clearAllData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-danger/10 border border-danger/30 rounded-lg text-danger hover:bg-danger/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Clear All Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-5 h-5 text-brand-400" />
            <h2 className="section-title">Display</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Dashboard Layout</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'compact', label: 'Compact' },
                  { value: 'standard', label: 'Standard' },
                  { value: 'detailed', label: 'Detailed' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateNestedPreference('display', '', 'dashboardLayout', value)}
                    className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                      preferences.display.dashboardLayout === value
                        ? 'bg-brand-500/20 border-brand-500'
                        : 'bg-surface-800/50 border-surface-700/30 hover:bg-surface-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Refresh Rate</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'fast', label: 'Fast' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'slow', label: 'Slow' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => updateNestedPreference('display', '', 'refreshRate', value)}
                    className={`px-3 py-2 rounded-lg border transition-all text-sm ${
                      preferences.display.refreshRate === value
                        ? 'bg-brand-500/20 border-brand-500'
                        : 'bg-surface-800/50 border-surface-700/30 hover:bg-surface-800'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {[
              { key: 'showTooltips', label: 'Show Tooltips' },
              { key: 'animations', label: 'Enable Animations' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <p className="text-sm text-white">{label}</p>
                <button
                  onClick={() => updateNestedPreference('display', '', key, !preferences.display[key as keyof typeof preferences.display])}
                  className={`w-12 h-6 rounded-full transition-all ${
                    preferences.display[key as keyof typeof preferences.display]
                      ? 'bg-brand-500'
                      : 'bg-surface-700'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    preferences.display[key as keyof typeof preferences.display] ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* OBD Settings */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Car className="w-5 h-5 text-brand-400" />
            <h2 className="section-title">OBD Settings</h2>
          </div>
          
          <div className="space-y-4">
            <SettingsToggle
              label="Auto Connect"
              description="Reconnect to preferred or last adapter on launch"
              checked={preferences.obd.autoConnect}
              onChange={(v) => updateNestedPreference('obd', '', 'autoConnect', v)}
            />

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Preferred adapter</label>
              <select
                value={preferences.obd.preferredAdapter}
                onChange={(e) => updateNestedPreference('obd', '', 'preferredAdapter', e.target.value)}
                className="select-field w-full text-sm"
              >
                <option value="">Any — use last connected</option>
                {knownAdapters.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.type})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-surface-500 mt-1">
                Scan on Connection to populate. Star marks preferred in the list.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Scan Interval (ms)</label>
              <input
                type="number"
                value={preferences.obd.scanInterval}
                onChange={(e) => updateNestedPreference('obd', '', 'scanInterval', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                min="100"
                max="10000"
                step="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Command timeout (ms)</label>
              <input
                type="number"
                value={preferences.obd.timeout}
                onChange={(e) =>
                  updateNestedPreference('obd', '', 'timeout', parseInt(e.target.value, 10) || 5000)
                }
                className="input-field w-full text-sm"
                min={1000}
                max={30000}
                step={1000}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Retry Attempts</label>
              <input
                type="number"
                value={preferences.obd.retryAttempts}
                onChange={(e) => updateNestedPreference('obd', '', 'retryAttempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                min="0"
                max="10"
                step="1"
              />
            </div>
          </div>
        </div>

        <AISettingsCard />
        <OEMDatabaseCard />

        {/* PWA Info */}
        <div className="col-span-12 lg:col-span-4 glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-brand-400" />
            <h2 className="section-title">App Info</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-heading">Installed as PWA</p>
                <p className="text-xs text-surface-500">Native app experience</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                isInstalled || isNativeApp() ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
                {isNativeApp() ? 'Native' : isInstalled ? 'Installed' : 'Browser'}
              </div>
            </div>

            {!isNativeApp() && !isInstalled && canInstall && (
              <button
                onClick={install}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-brand-500/20 border border-brand-500 rounded-lg text-brand-400 hover:bg-brand-500/30 transition-all"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Install App</span>
              </button>
            )}

            <div className="pt-3 border-t border-surface-700/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">Version</span>
                <span className="text-xs text-surface-300">{APP_VERSION}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">Build</span>
                <span className="text-xs text-surface-300">{APP_BUILD_DATE}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">Platform</span>
                <span className="text-xs text-surface-300">{getPlatformLabel()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
