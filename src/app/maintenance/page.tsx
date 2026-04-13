'use client';

import { useState } from 'react';
import {
  Wrench,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Car,
  Droplets,
  Disc,
  Wind,
  Zap,
  Gauge,
  Filter,
  ChevronDown,
  Plug,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useOBD } from '@/lib/obd/OBDContext';

interface MaintenanceTask {
  id: string;
  name: string;
  icon: React.ElementType;
  intervalMiles: number;
  intervalMonths: number;
  lastDone: string;
  lastMileage: number;
  currentMileage: number;
  status: 'ok' | 'due-soon' | 'overdue';
  estimatedCost: { min: number; max: number };
}

export default function MaintenancePage() {
  const { connectionState } = useOBD();
  const isConnected = connectionState.status === 'connected';

  // Default maintenance schedule - in a real app this would be customizable
  const defaultTasks: Omit<MaintenanceTask, 'lastDone' | 'lastMileage' | 'currentMileage' | 'status'>[] = [
    { id: 'oil', name: 'Engine Oil Change', icon: Droplets, intervalMiles: 7500, intervalMonths: 6, estimatedCost: { min: 40, max: 80 } },
    { id: 'tires', name: 'Tire Rotation', icon: Disc, intervalMiles: 5000, intervalMonths: 6, estimatedCost: { min: 20, max: 50 } },
    { id: 'air-filter', name: 'Air Filter Replacement', icon: Wind, intervalMiles: 15000, intervalMonths: 12, estimatedCost: { min: 15, max: 40 } },
    { id: 'brakes', name: 'Brake Inspection', icon: Disc, intervalMiles: 15000, intervalMonths: 12, estimatedCost: { min: 50, max: 150 } },
    { id: 'spark-plugs', name: 'Spark Plugs', icon: Zap, intervalMiles: 30000, intervalMonths: 24, estimatedCost: { min: 60, max: 150 } },
    { id: 'transmission', name: 'Transmission Fluid', icon: Droplets, intervalMiles: 30000, intervalMonths: 24, estimatedCost: { min: 100, max: 250 } },
    { id: 'coolant', name: 'Coolant Flush', icon: Droplets, intervalMiles: 30000, intervalMonths: 24, estimatedCost: { min: 70, max: 150 } },
    { id: 'battery', name: 'Battery Check', icon: Zap, intervalMiles: 25000, intervalMonths: 12, estimatedCost: { min: 0, max: 0 } },
  ];

  // Generate tasks with current mileage from ECU (if available) or mock data
  const [tasks] = useState<MaintenanceTask[]>(() => {
    const currentMileage = 0; // In a real app, this would come from ECU or user input
    return defaultTasks.map(task => ({
      ...task,
      lastDone: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastMileage: Math.max(0, currentMileage - Math.random() * 10000),
      currentMileage,
      status: 'ok' as const,
    }));
  });

  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'due-soon' | 'overdue'>('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const vehicles = ['Current Vehicle'];

  const filtered = tasks.filter(t =>
    (filterStatus === 'all' || t.status === filterStatus) &&
    (filterVehicle === 'all' || true) // Only one vehicle for now
  );

  const overdue = tasks.filter(t => t.status === 'overdue').length;
  const dueSoon = tasks.filter(t => t.status === 'due-soon').length;

  const getMilesUntilDue = (t: MaintenanceTask) => (t.lastMileage + t.intervalMiles) - t.currentMileage;
  const getProgress = (t: MaintenanceTask) => {
    const milesDone = t.currentMileage - t.lastMileage;
    return Math.min(100, (milesDone / t.intervalMiles) * 100);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Maintenance Scheduler</h1>
          <p className="text-surface-400 text-sm mt-1">Track and manage vehicle maintenance schedules</p>
        </div>
        <div className="flex items-center gap-3">
          {!isConnected && (
            <Link href="/connection" className="btn-primary flex items-center gap-2 text-sm">
              <Plug className="w-4 h-4" /> Connect Adapter
            </Link>
          )}
          <button className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* Connection Banner */}
      {!isConnected && (
        <div className="glass-card p-8 text-center border-l-4 border-l-brand-500">
          <Plug className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-white mb-2">Connect for Mileage Data</h3>
          <p className="text-surface-400 text-sm max-w-md mx-auto mb-4">
            Connect your OBD-II adapter to automatically track mileage and calculate maintenance schedules.
          </p>
          <Link href="/connection" className="btn-primary inline-flex items-center gap-2 text-sm">
            <Plug className="w-4 h-4" /> Go to Connection
          </Link>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <span className="text-surface-400 text-sm">Total Tasks</span>
          <span className="text-3xl font-bold text-white">{tasks.length}</span>
          <span className="text-xs text-surface-400">Across all vehicles</span>
        </div>
        <div className="stat-card border-danger/20">
          <span className="text-surface-400 text-sm">Overdue</span>
          <span className="text-3xl font-bold text-danger">{overdue}</span>
          <span className="text-xs text-danger">Needs immediate attention</span>
        </div>
        <div className="stat-card border-warning/20">
          <span className="text-surface-400 text-sm">Due Soon</span>
          <span className="text-3xl font-bold text-warning">{dueSoon}</span>
          <span className="text-xs text-warning">Schedule service</span>
        </div>
        <div className="stat-card">
          <span className="text-surface-400 text-sm">Up to Date</span>
          <span className="text-3xl font-bold text-success">{tasks.length - overdue - dueSoon}</span>
          <span className="text-xs text-success">No action needed</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-surface-400" />
          <span className="text-sm text-surface-400">Filter:</span>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'overdue', 'due-soon', 'ok'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                filterStatus === status
                  ? status === 'overdue' ? 'bg-danger/15 text-danger border border-danger/20'
                  : status === 'due-soon' ? 'bg-warning/15 text-warning border border-warning/20'
                  : status === 'ok' ? 'bg-success/15 text-success border border-success/20'
                  : 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800/50 border border-transparent'
              )}
            >
              {status === 'all' ? 'All' : status === 'due-soon' ? 'Due Soon' : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
        <select
          value={filterVehicle}
          onChange={(e) => setFilterVehicle(e.target.value)}
          className="select-field text-sm ml-auto"
        >
          <option value="all">All Vehicles</option>
          {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filtered.map(task => {
          const Icon = task.icon;
          const milesLeft = getMilesUntilDue(task);
          const progress = getProgress(task);

          return (
            <div key={task.id} className={cn(
              'glass-card p-5 transition-all',
              task.status === 'overdue' && 'border-danger/30',
              task.status === 'due-soon' && 'border-warning/20'
            )}>
              <div className="flex items-center gap-5">
                {/* Icon */}
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                  task.status === 'ok' ? 'bg-success/10' : task.status === 'due-soon' ? 'bg-warning/10' : 'bg-danger/10'
                )}>
                  <Icon className={cn('w-6 h-6',
                    task.status === 'ok' ? 'text-success' : task.status === 'due-soon' ? 'text-warning' : 'text-danger'
                  )} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-white">{task.name}</h3>
                    <span className={cn('badge text-[10px]',
                      task.status === 'ok' ? 'badge-success' : task.status === 'due-soon' ? 'badge-warning' : 'badge-critical'
                    )}>
                      {task.status === 'ok' ? 'Up to Date' : task.status === 'due-soon' ? 'Due Soon' : 'Overdue'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-surface-400">
                    <span className="flex items-center gap-1"><Car className="w-3 h-3" /> Current Vehicle</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Last: {new Date(task.lastDone).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <span className="flex items-center gap-1"><Gauge className="w-3 h-3" /> Every {task.intervalMiles.toLocaleString()} mi / {task.intervalMonths} mo</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-surface-500">Mileage progress</span>
                      <span className={cn(
                        milesLeft > 2000 ? 'text-success' : milesLeft > 0 ? 'text-warning' : 'text-danger'
                      )}>
                        {milesLeft > 0 ? `${milesLeft.toLocaleString()} mi remaining` : `${Math.abs(milesLeft).toLocaleString()} mi overdue`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all',
                          progress < 70 ? 'bg-success' : progress < 90 ? 'bg-warning' : 'bg-danger'
                        )}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Cost */}
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-surface-500">Est. Cost</p>
                  <p className="text-sm font-medium text-white">
                    {task.estimatedCost.min === 0 && task.estimatedCost.max === 0 ? 'Free' : `$${task.estimatedCost.min} - $${task.estimatedCost.max}`}
                  </p>
                </div>

                {/* Action */}
                <button className={cn('px-4 py-2 rounded-xl text-xs font-medium transition-all flex-shrink-0',
                  task.status === 'overdue' ? 'bg-danger/15 text-danger hover:bg-danger/25 border border-danger/20'
                  : task.status === 'due-soon' ? 'bg-warning/15 text-warning hover:bg-warning/25 border border-warning/20'
                  : 'bg-surface-800/50 text-surface-400 hover:text-white border border-surface-700/30'
                )}>
                  <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />
                  Mark Done
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Wrench className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <p className="text-surface-400">No tasks match the current filters.</p>
        </div>
      )}
    </div>
  );
}
