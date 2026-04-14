'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Car,
  AlertTriangle,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  Download,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Analytics, type AnalyticsData, type TrendData } from '@/lib/analytics';
import { VehicleManager } from '@/lib/vehicle-manager';
import { MaintenanceTracker } from '@/lib/obd/maintenance-tracker';
import { cn } from '@/lib/utils';

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('fleet');
  const [timeRange, setTimeRange] = useState<number>(12);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'maintenance' | 'health' | 'costs' | 'predictions'>('overview');
  const [vehicles, setVehicles] = useState<any[]>([]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const data = selectedVehicle === 'fleet'
        ? Analytics.generateFleetAnalytics()
        : Analytics.generateAnalytics(selectedVehicle, timeRange);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle, timeRange]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const loadedVehicles = VehicleManager.getVehicles();
    setVehicles(loadedVehicles);
    void loadAnalytics();
  }, [loadAnalytics]);

  const exportAnalytics = () => {
    if (!analyticsData) return;
    
    const filename = selectedVehicle === 'fleet' 
      ? `fleet-analytics-${new Date().toISOString().split('T')[0]}.json`
      : `vehicle-analytics-${selectedVehicle}-${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderTrendChart = (data: TrendData[], title: string, color: string) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1;

    return (
      <div className="glass-card p-5">
        <h3 className="section-title mb-4">{title}</h3>
        <div className="space-y-3">
          {data.slice(-6).map((point, index) => (
            <div key={point.period} className="flex items-center gap-3">
              <span className="text-xs text-surface-400 w-16">{formatPeriod(point.period)}</span>
              <div className="flex-1 relative h-6 bg-surface-800/30 rounded-full overflow-hidden">
                <div 
                  className={cn('absolute left-0 top-0 h-full rounded-full transition-all duration-500', color)}
                  style={{ 
                    width: `${((point.value - minValue) / range) * 100}%`,
                    opacity: 0.8
                  }}
                />
              </div>
              <span className="text-xs text-white font-mono w-20 text-right">{point.label || point.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = (data: TrendData[] | Record<string, number>, title: string) => {
    if (!data) return null;

    // Convert object to TrendData array if needed
    const trendData = Array.isArray(data) ? data : Object.entries(data).map(([period, value]) => ({
      period,
      value: value as number,
      label: `${value}`
    }));

    if (trendData.length === 0) return null;

    const total = trendData.reduce((sum, item) => sum + item.value, 0);
    const colors = ['bg-brand-500', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info', 'bg-surface-600'];

    return (
      <div className="glass-card p-5">
        <h3 className="section-title mb-4">{title}</h3>
        <div className="space-y-2">
          {trendData.slice(0, 6).map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.period} className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full', colors[index % colors.length])} />
                <span className="text-xs text-surface-300 flex-1">{item.period}</span>
                <span className="text-xs text-white font-mono">{percentage.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const formatPeriod = (period: string) => {
    try {
      const date = new Date(period + '-01');
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    } catch {
      return period;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading || !analyticsData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
            <p className="text-surface-400 text-sm mt-1">Historical data trends and insights</p>
          </div>
        </div>
        <div className="glass-card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-surface-600 mx-auto mb-3 animate-spin" />
          <p className="text-surface-400">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-surface-400 text-sm mt-1">Historical data trends and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportAnalytics} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <button onClick={loadAnalytics} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-surface-400" />
            <select
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
              className="px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="fleet">All Vehicles (Fleet)</option>
              {vehicles.map(vehicle => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-surface-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(parseInt(e.target.value))}
              className="px-3 py-2 bg-surface-800 border border-surface-700/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={3}>Last 3 Months</option>
              <option value={6}>Last 6 Months</option>
              <option value={12}>Last Year</option>
              <option value={24}>Last 2 Years</option>
            </select>
          </div>

          <div className="flex gap-2 ml-auto">
            {[
              { value: 'overview', label: 'Overview' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'health', label: 'Health' },
              { value: 'costs', label: 'Costs' },
              { value: 'predictions', label: 'Predictions' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setViewMode(value as any)}
                className={cn('px-3 py-1 rounded-lg text-xs transition-all',
                  viewMode === value
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500'
                    : 'bg-surface-800/50 text-surface-300 border border-surface-700/30 hover:bg-surface-800'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Key Metrics */}
          <div className="col-span-12 grid grid-cols-4 gap-4">
            <div className="stat-card">
              <span className="text-surface-400 text-sm">Total Cost</span>
              <span className="text-3xl font-bold text-brand-400">
                {formatCurrency(analyticsData.costAnalysis.totalCost)}
              </span>
              <span className="text-xs text-surface-400">Last {timeRange} months</span>
            </div>
            <div className="stat-card">
              <span className="text-surface-400 text-sm">Services</span>
              <span className="text-3xl font-bold text-success">
                {analyticsData.maintenanceTrends.frequency.reduce((sum, f) => sum + f.value, 0)}
              </span>
              <span className="text-xs text-surface-400">Total services</span>
            </div>
            <div className="stat-card">
              <span className="text-surface-400 text-sm">Avg Health</span>
              <span className="text-3xl font-bold text-warning">
                {analyticsData.healthTrends.scores.length > 0
                  ? Math.round(analyticsData.healthTrends.scores.reduce((sum, s) => sum + s.value, 0) / analyticsData.healthTrends.scores.length)
                  : '--'}
              </span>
              <span className="text-xs text-surface-400">Vehicle health score</span>
            </div>
            <div className="stat-card">
              <span className="text-surface-400 text-sm">Monthly Avg</span>
              <span className="text-3xl font-bold text-info">
                {formatCurrency(analyticsData.costAnalysis.averageCostPerMonth)}
              </span>
              <span className="text-xs text-surface-400">Cost per month</span>
            </div>
          </div>

          {/* Charts */}
          <div className="col-span-8">
            {renderTrendChart(analyticsData.costAnalysis.costTrend, 'Monthly Costs', 'bg-brand-500')}
          </div>
          <div className="col-span-4">
            {renderPieChart(analyticsData.costAnalysis.costByCategory, 'Cost by Category')}
          </div>
        </div>
      )}

      {/* Maintenance View */}
      {viewMode === 'maintenance' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-6">
            {renderTrendChart(analyticsData.maintenanceTrends.costs, 'Maintenance Costs', 'bg-brand-500')}
          </div>
          <div className="col-span-6">
            {renderTrendChart(analyticsData.maintenanceTrends.frequency, 'Service Frequency', 'bg-success')}
          </div>
          <div className="col-span-12">
            {renderPieChart(analyticsData.maintenanceTrends.categories, 'Service Categories')}
          </div>
        </div>
      )}

      {/* Health View */}
      {viewMode === 'health' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-6">
            {renderTrendChart(analyticsData.healthTrends.scores, 'Health Scores', 'bg-success')}
          </div>
          <div className="col-span-6">
            {renderTrendChart(analyticsData.healthTrends.issues, 'Trouble Codes', 'bg-warning')}
          </div>
          <div className="col-span-12">
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">Most Common Issues</h3>
              <div className="space-y-2">
                {analyticsData.healthTrends.dtcFrequency.slice(0, 10).map((dtc, index) => (
                  <div key={dtc.period} className="flex items-center justify-between p-3 bg-surface-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-surface-400 w-6">#{index + 1}</span>
                      <span className="text-sm text-white font-mono">{dtc.period}</span>
                    </div>
                    <span className="text-sm text-surface-300">{dtc.value} occurrences</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Costs View */}
      {viewMode === 'costs' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            {renderTrendChart(analyticsData.costAnalysis.costTrend, 'Cost Trends', 'bg-brand-500')}
          </div>
          <div className="col-span-4">
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">Cost Summary</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-surface-500">Total Cost</p>
                  <p className="text-2xl font-bold text-brand-400">
                    {formatCurrency(analyticsData.costAnalysis.totalCost)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Monthly Average</p>
                  <p className="text-xl font-bold text-white">
                    {formatCurrency(analyticsData.costAnalysis.averageCostPerMonth)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Projected Annual</p>
                  <p className="text-xl font-bold text-warning">
                    {formatCurrency(analyticsData.costAnalysis.projectedAnnualCost)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-12">
            {renderPieChart(analyticsData.costAnalysis.costByCategory, 'Cost Breakdown')}
          </div>
        </div>
      )}

      {/* Predictions View */}
      {viewMode === 'predictions' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-6">
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">Next Service Prediction</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-surface-500">Estimated Date</p>
                  <p className="text-lg font-bold text-white">
                    {analyticsData.predictions.nextServiceDate.toLocaleDateString()}
                  </p>
                  <p className="text-xs text-surface-400">
                    {Math.ceil((analyticsData.predictions.nextServiceDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} days from now
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Estimated Cost</p>
                  <p className="text-lg font-bold text-brand-400">
                    {formatCurrency(analyticsData.predictions.nextServiceCost)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-surface-500">Projected Mileage</p>
                  <p className="text-lg font-bold text-success">
                    {analyticsData.predictions.projectedMileage.toLocaleString()} mi
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-6">
            <div className="glass-card p-5">
              <h3 className="section-title mb-4">Risk Factors</h3>
              <div className="space-y-3">
                {analyticsData.predictions.riskFactors.map((risk, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-surface-800/30 rounded-lg">
                    <AlertTriangle className={cn('w-4 h-4 mt-0.5 flex-shrink-0',
                      risk.risk === 'high' ? 'text-danger' :
                      risk.risk === 'medium' ? 'text-warning' : 'text-info'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm text-white font-medium">{risk.factor}</p>
                      <p className="text-xs text-surface-400">{risk.description}</p>
                    </div>
                    <span className={cn('text-xs px-2 py-1 rounded-full',
                      risk.risk === 'high' ? 'bg-danger/10 text-danger' :
                      risk.risk === 'medium' ? 'bg-warning/10 text-warning' : 'bg-info/10 text-info'
                    )}>
                      {risk.risk.toUpperCase()}
                    </span>
                  </div>
                ))}
                {analyticsData.predictions.riskFactors.length === 0 && (
                  <div className="text-center py-4">
                    <Info className="w-8 h-8 text-success mx-auto mb-2" />
                    <p className="text-sm text-surface-300">No significant risk factors detected</p>
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
