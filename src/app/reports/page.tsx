'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Printer, Calendar, Car, AlertTriangle, CheckCircle2, TrendingUp, Clock, Filter, Plug, BarChart3, PieChart, Activity, Zap, Thermometer, Fuel, Gauge, Battery, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useOBD } from '@/lib/obd/OBDContext';
import { searchDTCByCode } from '@/lib/dtc-database';
import { APP_VERSION } from '@/lib/app-info';
import { VehicleManager } from '@/lib/vehicle-manager';
import { MaintenanceTracker } from '@/lib/obd/maintenance-tracker';

interface ScanReport {
  id: string;
  timestamp: number;
  vehicle: string;
  vin: string;
  protocol: string;
  healthScore: number;
  codesStored: string[];
  codesPending: string[];
  codesPermanent: string[];
  readinessComplete: number;
  readinessTotal: number;
  sensorData: {
    coolantTemp?: number;
    rpm?: number;
    speed?: number;
    fuelLevel?: number;
    batteryVoltage?: number;
    intakeAirTemp?: number;
    maf?: number;
    map?: number;
    o2?: number;
  };
  readinessMonitors: Array<{ name: string; available: boolean; complete: boolean }>;
  freezeFrame?: {
    dtc: string;
    timestamp: number;
    conditions: Record<string, number>;
  };
}

export default function ReportsPage() {
  const { connectionState, readDTCs, readPendingDTCs, readPermanentDTCs, readIMReadiness, readPIDValue, getSupportedPIDs } = useOBD();
  const isConnected = connectionState.status === 'connected';

  const [reports, setReports] = useState<ScanReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<ScanReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'issues' | 'healthy'>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  // Load reports from localStorage
  useEffect(() => {
    const savedReports = localStorage.getItem('cardiag-scan-reports');
    if (savedReports) {
      try {
        setReports(JSON.parse(savedReports));
      } catch (error) {
        console.error('Failed to load reports:', error);
      }
    }
  }, []);

  // Save reports to localStorage
  const saveReports = (newReports: ScanReport[]) => {
    localStorage.setItem('cardiag-scan-reports', JSON.stringify(newReports));
    setReports(newReports);
  };

  // Generate new report
  const generateReport = async () => {
    if (!isConnected) return;
    
    setIsGenerating(true);
    try {
      const [stored, pending, permanent] = await Promise.all([
        readDTCs(),
        readPendingDTCs(),
        readPermanentDTCs(),
      ]);
      const readiness = await readIMReadiness();
      const supported = getSupportedPIDs();
      
      // Read sensor data
      const sensorData: ScanReport['sensorData'] = {};
      
      const coolantPid = supported.find(p => p.pid === '05');
      if (coolantPid) {
        const r = await readPIDValue(coolantPid);
        if (r) sensorData.coolantTemp = r.value;
      }
      
      const rpmPid = supported.find(p => p.pid === '0C');
      if (rpmPid) {
        const r = await readPIDValue(rpmPid);
        if (r) sensorData.rpm = r.value;
      }
      
      const speedPid = supported.find(p => p.pid === '0D');
      if (speedPid) {
        const r = await readPIDValue(speedPid);
        if (r) sensorData.speed = r.value;
      }
      
      const fuelPid = supported.find(p => p.pid === '2F');
      if (fuelPid) {
        const r = await readPIDValue(fuelPid);
        if (r) sensorData.fuelLevel = r.value;
      }
      
      const batteryPid = supported.find(p => p.pid === '42');
      if (batteryPid) {
        const r = await readPIDValue(batteryPid);
        if (r) sensorData.batteryVoltage = r.value;
      }

      // Calculate health score
      let healthScore = 100;
      healthScore -= stored.length * 10;
      healthScore -= pending.length * 3;
      healthScore -= permanent.length * 15;
      
      const incompleteMonitors = readiness.filter(m => m.available && !m.complete).length;
      healthScore -= incompleteMonitors * 2;
      
      if (sensorData.coolantTemp && (sensorData.coolantTemp > 110 || sensorData.coolantTemp < 60)) {
        healthScore -= 10;
      }
      
      healthScore = Math.max(0, Math.min(100, healthScore));

      const newReport: ScanReport = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        vehicle: 'Current Vehicle',
        vin: connectionState.vin || 'Unknown',
        protocol: connectionState.protocol || 'Unknown',
        healthScore,
        codesStored: stored,
        codesPending: pending,
        codesPermanent: permanent,
        readinessComplete: readiness.filter(m => m.available && m.complete).length,
        readinessTotal: readiness.filter(m => m.available).length,
        sensorData,
        readinessMonitors: readiness,
      };

      saveReports([newReport, ...reports]);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export reports
  const exportReports = () => {
    const data = {
      reports,
      maintenanceHistory: MaintenanceTracker.getMaintenanceHistory(),
      exportDate: new Date().toISOString(),
      version: APP_VERSION
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cardiag-reports-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export single report as PDF (simplified)
  const vehicleMake = VehicleManager.getActiveVehicleMake();

  const exportReportPDF = (report: ScanReport) => {
    const reportContent = `CAR DIAGNOSTIC REPORT
=====================

Date: ${new Date(report.timestamp).toLocaleString()}
Vehicle: ${report.vehicle}
VIN: ${report.vin}
Protocol: ${report.protocol}

HEALTH SCORE: ${report.healthScore}/100

TROUBLE CODES:
${report.codesStored.length > 0 ? report.codesStored.map(code => {
  const dtc = searchDTCByCode(code, vehicleMake);
  return `  ${code} - ${dtc?.description || 'Unknown DTC'}`;
}).join('\n') : '  None found'}

Pending Codes:
${report.codesPending.length > 0 ? report.codesPending.map(code => {
  const dtc = searchDTCByCode(code, vehicleMake);
  return `  ${code} - ${dtc?.description || 'Unknown DTC'}`;
}).join('\n') : '  None found'}

READINESS MONITORS:
${report.readinessMonitors.map(m => 
  `  ${m.name}: ${m.available ? (m.complete ? 'READY' : 'INCOMPLETE') : 'N/A'}`
).join('\n')}

SENSOR DATA:
${Object.entries(report.sensorData).map(([key, value]) => 
  `  ${key}: ${value}${key.includes('Temp') ? '°C' : key === 'rpm' ? ' RPM' : key === 'speed' ? ' km/h' : key === 'fuelLevel' ? '%' : key === 'batteryVoltage' ? 'V' : ''}`
).join('\n')}

Generated by CarDiag v${APP_VERSION}`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagnostic-report-${new Date(report.timestamp).toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filter reports
  const filteredReports = reports.filter(report => {
    const totalCodes = report.codesStored.length + report.codesPending.length + report.codesPermanent.length;
    
    if (filterStatus === 'issues') return totalCodes > 0;
    if (filterStatus === 'healthy') return totalCodes === 0;
    return true;
  }).filter(report => {
    const reportDate = new Date(report.timestamp);
    const now = new Date();
    
    if (dateRange === 'week') return (now.getTime() - reportDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    if (dateRange === 'month') return (now.getTime() - reportDate.getTime()) <= 30 * 24 * 60 * 60 * 1000;
    if (dateRange === 'quarter') return (now.getTime() - reportDate.getTime()) <= 90 * 24 * 60 * 60 * 1000;
    if (dateRange === 'year') return (now.getTime() - reportDate.getTime()) <= 365 * 24 * 60 * 60 * 1000;
    return true;
  });

  // Calculate statistics
  const stats = {
    totalScans: filteredReports.length,
    avgHealthScore: filteredReports.length > 0 ? Math.round(filteredReports.reduce((a, r) => a + r.healthScore, 0) / filteredReports.length) : 0,
    totalCodes: filteredReports.reduce((a, r) => a + r.codesStored.length + r.codesPending.length + r.codesPermanent.length, 0),
    cleanScans: filteredReports.filter(r => r.codesStored.length === 0 && r.codesPending.length === 0 && r.codesPermanent.length === 0).length,
    criticalIssues: filteredReports.filter(r => r.codesPermanent.length > 0).length,
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Diagnostic Reports</h1>
          <p className="text-surface-400 text-xs sm:text-sm mt-1">
            View and export diagnostic scan history —{' '}
            <Link href="/advanced" className="text-brand-400 hover:underline">run AI analysis</Link>
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {isConnected && (
            <button 
              onClick={generateReport}
              disabled={isGenerating}
              className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5 disabled:opacity-50"
            >
              {isGenerating ? <Activity className="w-3.5 h-3.5 sm:w-4 h-4 animate-pulse" /> : <FileText className="w-3.5 h-3.5 sm:w-4 h-4" />}
              {isGenerating ? 'Wait...' : 'New Scan'}
            </button>
          )}
          <button onClick={exportReports} className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2">
            <Download className="w-3.5 h-3.5 sm:w-4 h-4" /> <span className="hidden xs:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <Filter className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
            <div className="flex gap-1.5">
              {[
                { value: 'all', label: 'All' },
                { value: 'issues', label: 'Issues' },
                { value: 'healthy', label: 'Healthy' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilterStatus(value as typeof filterStatus)}
                  className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs transition-all whitespace-nowrap ${
                    filterStatus === value
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500'
                      : 'bg-surface-800/50 text-surface-300 border border-surface-700/30 hover:bg-surface-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Calendar className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
            <div className="flex gap-1.5">
              {[
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'quarter', label: 'Quarter' },
                { value: 'year', label: 'Year' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setDateRange(value as typeof dateRange)}
                  className={`px-3 py-1 rounded-lg text-[10px] sm:text-xs transition-all whitespace-nowrap ${
                    dateRange === value
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500'
                      : 'bg-surface-800/50 text-surface-300 border border-surface-700/30 hover:bg-surface-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Connection Banner */}
      {!isConnected && (
        <div className="glass-card p-6 sm:p-8 text-center border-l-4 border-l-brand-500">
          <Plug className="w-10 h-10 sm:w-12 h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-medium text-white mb-2">Connect to View Reports</h3>
          <p className="text-surface-400 text-xs sm:text-sm max-w-md mx-auto mb-4">
            Connect your OBD-II adapter to scan your vehicle and generate diagnostic reports.
          </p>
          <Link href="/connection" className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm">
            <Plug className="w-3.5 h-3.5 sm:w-4 h-4" /> Go to Connection
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card p-3 sm:p-4">
          <span className="text-surface-400 text-[10px] sm:text-sm">Total Scans</span>
          <span className="text-xl sm:text-3xl font-bold text-white">{stats.totalScans}</span>
        </div>
        <div className="stat-card p-3 sm:p-4">
          <span className="text-surface-400 text-[10px] sm:text-sm">Avg Health</span>
          <span className="text-xl sm:text-3xl font-bold text-success">{stats.avgHealthScore}</span>
        </div>
        <div className="stat-card p-3 sm:p-4">
          <span className="text-surface-400 text-[10px] sm:text-sm">Codes Found</span>
          <span className="text-xl sm:text-3xl font-bold text-warning">{stats.totalCodes}</span>
        </div>
        <div className="stat-card p-3 sm:p-4">
          <span className="text-surface-400 text-[10px] sm:text-sm">Critical</span>
          <span className="text-xl sm:text-3xl font-bold text-danger">{stats.criticalIssues}</span>
        </div>
      </div>

      {/* Reports List */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-700/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Scan History</h2>
          <span className="text-[10px] text-surface-500">{filteredReports.length} reports</span>
        </div>
        <div className="divide-y divide-surface-700/30">
          {filteredReports.map(report => {
            const totalCodes = report.codesStored.length + report.codesPending.length + report.codesPermanent.length;
            const criticalCount = report.codesPermanent.length;
            const warningCount = report.codesStored.length + report.codesPending.length;
            const status = totalCodes === 0 ? 'ok' : criticalCount > 0 ? 'critical' : 'warning';
            
            return (
              <div
                key={report.id}
                className={cn('px-4 py-3 sm:px-5 sm:py-4 flex items-center gap-3 sm:gap-5 hover:bg-surface-800/30 transition-colors cursor-pointer', selectedReport?.id === report.id && 'bg-surface-800/50')}
                onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
              >
                {/* Status */}
                <div className={cn('w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0',
                  status === 'ok' ? 'bg-success/10' : status === 'warning' ? 'bg-warning/10' : 'bg-danger/10'
                )}>
                  {status === 'ok' ? <CheckCircle2 className="w-4 h-4 sm:w-5 h-5 text-success" /> : <AlertTriangle className={cn('w-4 h-4 sm:w-5 h-5', status === 'warning' ? 'text-warning' : 'text-danger')} />}
                </div>

                {/* Date */}
                <div className="min-w-[80px] sm:min-w-[100px]">
                  <p className="text-xs sm:text-sm font-medium text-white">{new Date(report.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  <p className="text-[10px] text-surface-500 flex items-center gap-1 uppercase tracking-tighter">{new Date(report.timestamp).getFullYear()}</p>
                </div>

                {/* Vehicle */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-surface-300 truncate">{report.vehicle}</p>
                  <p className="text-[9px] sm:text-xs text-surface-500 font-mono truncate">{report.vin}</p>
                </div>

                {/* Health Score */}
                <div className="text-center min-w-[50px] sm:min-w-[80px]">
                  <p className={cn('text-lg sm:text-2xl font-bold', report.healthScore >= 85 ? 'text-success' : report.healthScore >= 60 ? 'text-warning' : 'text-danger')}>{report.healthScore}</p>
                  <p className="text-[9px] text-surface-500 uppercase font-bold tracking-tighter">Score</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      exportReportPDF(report);
                    }}
                    className="p-1.5 sm:p-2 rounded-lg hover:bg-surface-700/50 text-surface-400"
                  >
                    <Download className="w-3.5 h-3.5 sm:w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Report View */}
      {selectedReport && (
        <div className="glass-card p-4 sm:p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-sm sm:text-lg font-bold text-white">Report Details</h2>
            <button 
              onClick={() => setSelectedReport(null)}
              className="p-1 text-surface-400 hover:text-white"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div className="bg-surface-800/40 p-3 rounded-xl border border-surface-700/30">
                <p className="text-[10px] text-surface-500 uppercase font-bold mb-1">Vehicle Info</p>
                <p className="text-sm text-white font-medium">{selectedReport.vehicle}</p>
                <p className="text-xs text-surface-400 font-mono mt-0.5">{selectedReport.vin}</p>
                <div className="mt-2 pt-2 border-t border-surface-700/30 flex justify-between">
                  <span className="text-[10px] text-surface-500">PROTOCOL</span>
                  <span className="text-[10px] text-surface-300 font-mono uppercase">{selectedReport.protocol}</span>
                </div>
              </div>
            </div>

            {/* Sensor Data */}
            <div className="space-y-3">
              <h3 className="text-[10px] text-surface-500 uppercase font-bold px-1">Snapshots</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(selectedReport.sensorData).map(([key, value]) => {
                  const icons: Record<string, any> = {
                    coolantTemp: Thermometer,
                    rpm: Gauge,
                    speed: Activity,
                    fuelLevel: Fuel,
                    batteryVoltage: Battery,
                  };
                  const Icon = icons[key] || Zap;
                  const units = key.includes('Temp') ? '°C' : key === 'rpm' ? ' RPM' : key === 'speed' ? ' km/h' : key === 'fuelLevel' ? '%' : key === 'batteryVoltage' ? 'V' : '';
                  
                  return (
                    <div key={key} className="flex items-center justify-between bg-surface-800/30 px-3 py-2 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-surface-400" />
                        <span className="text-xs text-surface-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <span className="text-xs text-white font-mono">{value}{units}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trouble Codes */}
            <div className="space-y-3">
              <h3 className="text-[10px] text-surface-500 uppercase font-bold px-1">Trouble Codes</h3>
              <div className="space-y-2">
                {selectedReport.codesStored.length > 0 || selectedReport.codesPending.length > 0 ? (
                  <>
                    {selectedReport.codesStored.map(code => {
                      const dtc = searchDTCByCode(code, vehicleMake);
                      return (
                        <div key={code} className="p-2.5 bg-warning/5 border border-warning/10 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-mono font-bold text-warning">{code}</span>
                            <span className="text-[9px] px-1.5 py-0.5 bg-warning/10 text-warning rounded uppercase">Stored</span>
                          </div>
                          <p className="text-[11px] text-surface-300 leading-tight">{dtc?.description || 'Unknown DTC definition'}</p>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-6 bg-success/5 border border-success/10 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
                    <p className="text-xs text-surface-300">No codes detected in this scan</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
