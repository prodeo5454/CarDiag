'use client';

import { useState } from 'react';
import { Activity, Pause, Play, RefreshCw, Download, Maximize2, Plug } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useOBD } from '@/lib/obd/OBDContext';
import { getAllCategories } from '@/lib/obd/pids';
import type { OBDPIDDefinition } from '@/types';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

export default function LiveDataPage() {
  const {
    connectionState,
    liveReadings,
    liveHistory,
    isPolling,
    startPolling,
    stopPolling,
    getSupportedPIDs,
  } = useOBD();

  const isConnected = connectionState.status === 'connected';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSensor, setExpandedSensor] = useState<string | null>(null);

  const supportedPIDs = getSupportedPIDs();
  const categories = ['All', ...getAllCategories()];

  const filtered = selectedCategory === 'All' || selectedCategory === 'all'
    ? supportedPIDs
    : supportedPIDs.filter(p => p.category === selectedCategory);

  // Convert live readings to chart data
  const getChartData = (pid: string) => {
    const history = liveHistory.get(pid) || [];
    return history.map(h => ({
      time: new Date(h.time).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
      value: Math.round(h.value * 100) / 100,
    }));
  };

  const isInRange = (pid: OBDPIDDefinition, value: number) =>
    value >= pid.min && value <= pid.max;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Live Data</h1>
          <p className="text-surface-400 text-sm mt-1">Real-time OBD-II sensor monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <button className="btn-secondary flex items-center gap-2 text-sm" disabled={!isPolling}>
              <RefreshCw className={cn('w-4 h-4', isPolling && 'animate-spin')} /> Refresh
            </button>
          )}
          <button className="btn-secondary flex items-center gap-2 text-sm" disabled={!isPolling}>
            <Download className="w-4 h-4" /> Record
          </button>
          {isConnected ? (
            <button
              onClick={() => isPolling ? stopPolling() : startPolling()}
              className={cn('flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-xl transition-all', isPolling ? 'btn-danger' : 'btn-primary')}
            >
              {isPolling ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Resume</>}
            </button>
          ) : (
            <Link href="/connection" className="btn-primary flex items-center gap-2 text-sm">
              <Plug className="w-4 h-4" /> Connect Adapter
            </Link>
          )}
        </div>
      </div>

      {/* Connection Banner */}
      {!isConnected && (
        <div className="glass-card p-8 text-center border-l-4 border-l-brand-500">
          <Plug className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Connect to Your Vehicle</h3>
          <p className="text-surface-400 text-sm max-w-md mx-auto mb-4">
            Connect your OBD-II adapter to view real-time sensor data from the vehicle ECU.
          </p>
          <Link href="/connection" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plug className="w-4 h-4" /> Go to Connection
          </Link>
        </div>
      )}

      {isConnected && (
        <>
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn('px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap',
                  selectedCategory === cat ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20' : 'text-surface-400 hover:text-white hover:bg-surface-800/50 border border-transparent'
                )}
              >
                {cat === 'All' ? 'All Sensors' : cat} ({cat === 'All' ? supportedPIDs.length : supportedPIDs.filter(p => p.category === cat).length})
              </button>
            ))}
          </div>

          {/* Status Bar */}
          <div className="glass-card px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-surface-400">
              <span className="flex items-center gap-1.5">
                <span className={cn('w-2 h-2 rounded-full', isPolling ? 'bg-success animate-pulse' : 'bg-surface-500')} />
                {isPolling ? 'Streaming' : 'Paused'}
              </span>
              <span>Refresh: 1s</span>
              <span>Protocol: {connectionState.protocol ? connectionState.protocol.replace(/_/g, ' ') : 'Unknown'}</span>
            </div>
            <span className="text-xs text-surface-500">{filtered.length} sensors displayed</span>
          </div>
        </>
      )}

      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(pid => {
            const reading = liveReadings.get(pid.pid);
            const value = reading?.value ?? null;
            const chartData = getChartData(pid.pid);
            const inRange = value !== null && isInRange(pid, value);
            const isExpanded = expandedSensor === pid.pid;

            return (
              <div
                key={pid.pid}
                className={cn(
                  'glass-card-hover p-4 cursor-pointer transition-all',
                  isExpanded && 'col-span-1 md:col-span-2 xl:col-span-3 glow-brand',
                  !inRange && 'border-warning/30'
                )}
                onClick={() => setExpandedSensor(isExpanded ? null : pid.pid)}
              >
                {/* Sensor Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Activity className={cn('w-4 h-4 flex-shrink-0', inRange ? 'text-brand-400' : 'text-warning')} />
                    <span className="text-sm font-medium text-white truncate">{pid.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full', pid.category === 'Engine' ? 'bg-brand-500/10 text-brand-400' : pid.category === 'Fuel' ? 'bg-warning/10 text-warning' : 'bg-surface-700/50 text-surface-400')}>
                      {pid.category}
                    </span>
                    <Maximize2 className="w-3.5 h-3.5 text-surface-500" />
                  </div>
                </div>

                {/* Value */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={cn('text-3xl font-bold font-mono', inRange ? 'text-white' : 'text-warning')}>
                    {value !== null ? value.toFixed(pid.unit === 'RPM' || pid.unit === 'kPa' ? 0 : 1) : '--'}
                  </span>
                  <span className="text-surface-400 text-sm">{pid.unit}</span>
                </div>

                {/* Range bar */}
                <div className="mb-3">
                  <div className="relative h-1.5 bg-surface-800 rounded-full overflow-hidden">
                    {value !== null && (
                      <div
                        className={cn('absolute h-full rounded-full transition-all duration-500', inRange ? 'bg-brand-500' : 'bg-warning')}
                        style={{ width: `${Math.min(100, Math.max(0, ((value - pid.min) / (pid.max - pid.min)) * 100))}%` }}
                      />
                    )}
                  </div>
                  <div className="flex justify-between text-[10px] text-surface-500 mt-0.5">
                    <span>{pid.min}{pid.unit}</span>
                    <span className={cn(inRange ? 'text-success' : 'text-warning')}>
                      Normal: {pid.min}-{pid.max}
                    </span>
                    <span>{pid.max}{pid.unit}</span>
                  </div>
                </div>

                {/* Mini Chart */}
                <div className={cn('transition-all', isExpanded ? 'h-64' : 'h-16')}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      {isExpanded && (
                        <>
                          <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} interval="preserveStartEnd" />
                          <YAxis domain={[pid.min * 0.8, pid.max * 1.2]} tick={{ fontSize: 10, fill: '#64748b' }} width={40} />
                          <Tooltip
                            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                            labelStyle={{ color: '#94a3b8' }}
                          />
                          <ReferenceLine y={pid.min} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} />
                          <ReferenceLine y={pid.max} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.5} />
                        </>
                      )}
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={inRange ? '#338dff' : '#f59e0b'}
                        strokeWidth={isExpanded ? 2 : 1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
