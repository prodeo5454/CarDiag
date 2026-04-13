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

interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh' | 'ko';
  units: 'metric' | 'imperial';
  notifications: {
    enabled: boolean;
    maintenance: boolean;
    diagnostics: boolean;
    connection: boolean;
    updates: boolean;
  };
  data: {
    autoBackup: boolean;
    backupInterval: 'daily' | 'weekly' | 'monthly';
    retentionDays: number;
    compression: boolean;
  };
  display: {
    dashboardLayout: 'compact' | 'standard' | 'detailed';
    refreshRate: 'fast' | 'normal' | 'slow';
    showTooltips: boolean;
    animations: boolean;
  };
  obd: {
    autoConnect: boolean;
    preferredAdapter: string;
    scanInterval: number;
    timeout: number;
    retryAttempts: number;
  };
}

export default function SettingsPage() {
  const { isInstalled, canInstall, install } = usePWA();
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    language: 'en',
    units: 'metric',
    notifications: {
      enabled: true,
      maintenance: true,
      diagnostics: true,
      connection: true,
      updates: true,
    },
    data: {
      autoBackup: true,
      backupInterval: 'weekly',
      retentionDays: 365,
      compression: true,
    },
    display: {
      dashboardLayout: 'standard',
      refreshRate: 'normal',
      showTooltips: true,
      animations: true,
    },
    obd: {
      autoConnect: false,
      preferredAdapter: '',
      scanInterval: 1000,
      timeout: 5000,
      retryAttempts: 3,
    },
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cardiag-preferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load preferences:', error);
      }
    }
  }, []);

  const updatePreference = (category: keyof UserPreferences, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [category]: typeof prev[category] === 'object' 
        ? { ...prev[category], [key]: value }
        : value
    }));
    setHasChanges(true);
  };

  const updateNestedPreference = (category: keyof UserPreferences, subcategory: string, key: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: {
          ...(prev[category] as any)[subcategory],
          [key]: value
        }
      }
    }));
    setHasChanges(true);
  };

  const savePreferences = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('cardiag-preferences', JSON.stringify(preferences));
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
      MaintenanceTracker.saveMaintenanceHistory([]);
      MaintenanceTracker.saveMaintenanceSchedules([]);
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
        <div className="col-span-4 glass-card p-5">
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
                    onClick={() => updatePreference('theme', '', value)}
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
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-300 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => updatePreference('language', '', e.target.value)}
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
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
        <div className="col-span-4 glass-card p-5">
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
        <div className="col-span-4 glass-card p-5">
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
        <div className="col-span-4 glass-card p-5">
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
        <div className="col-span-4 glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Car className="w-5 h-5 text-brand-400" />
            <h2 className="section-title">OBD Settings</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { key: 'autoConnect', label: 'Auto Connect', description: 'Connect to last used adapter' },
            ].map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{label}</p>
                  <p className="text-xs text-surface-500">{description}</p>
                </div>
                <button
                  onClick={() => updateNestedPreference('obd', '', key, !preferences.obd[key as keyof typeof preferences.obd])}
                  className={`w-12 h-6 rounded-full transition-all ${
                    preferences.obd[key as keyof typeof preferences.obd]
                      ? 'bg-brand-500'
                      : 'bg-surface-700'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    preferences.obd[key as keyof typeof preferences.obd] ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            ))}

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
              <label className="block text-sm font-medium text-surface-300 mb-2">Timeout (ms)</label>
              <input
                type="number"
                value={preferences.obd.timeout}
                onChange={(e) => updateNestedPreference('obd', '', 'timeout', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                min="1000"
                max="30000"
                step="1000"
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

        {/* PWA Info */}
        <div className="col-span-4 glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <Smartphone className="w-5 h-5 text-brand-400" />
            <h2 className="section-title">App Info</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">Installed as PWA</p>
                <p className="text-xs text-surface-500">Native app experience</p>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs ${
                isInstalled ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
              }`}>
                {isInstalled ? 'Installed' : 'Browser'}
              </div>
            </div>

            {!isInstalled && canInstall && (
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
                <span className="text-xs text-surface-300">2.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">Build</span>
                <span className="text-xs text-surface-300">2026.04.13</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500">Platform</span>
                <span className="text-xs text-surface-300">PWA</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
