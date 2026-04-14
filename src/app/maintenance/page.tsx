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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-surface-400 text-xs sm:text-sm mt-1">Track and manage vehicle service</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {!isConnected && (
            <Link href="/connection" className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2">
              <Plug className="w-3.5 h-3.5 sm:w-4 h-4" /> <span>Connect</span>
            </Link>
          )}
          <button className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5">
            <Plus className="w-3.5 h-3.5 sm:w-4 h-4" /> <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="stat-card p-3 sm:p-4">
          <span className="text-surface-400 text-[10px] sm:text-xs">Total Tasks</span>
          <span className="text-xl sm:text-3xl font-bold text-white">{tasks.length}</span>
        </div>
        <div className="stat-card p-3 sm:p-4 border-danger/20">
          <span className="text-surface-400 text-[10px] sm:text-xs">Overdue</span>
          <span className="text-xl sm:text-3xl font-bold text-danger">{overdue}</span>
        </div>
        <div className="stat-card p-3 sm:p-4 border-warning/20">
          <span className="text-surface-400 text-[10px] sm:text-xs">Due Soon</span>
          <span className="text-xl sm:text-3xl font-bold text-warning">{dueSoon}</span>
        </div>
        <div className="stat-card p-3 sm:p-4">
          <span className="text-surface-400 text-[10px] sm:text-xs">Healthy</span>
          <span className="text-xl sm:text-3xl font-bold text-success">{tasks.length - overdue - dueSoon}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <Filter className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
          <div className="flex gap-1.5">
            {(['all', 'overdue', 'due-soon', 'ok'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn('px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap',
                  filterStatus === status
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500'
                    : 'bg-surface-800/50 text-surface-400 border border-transparent'
                )}
              >
                {status === 'all' ? 'All' : status === 'due-soon' ? 'Soon' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <select
          value={filterVehicle}
          onChange={(e) => setFilterVehicle(e.target.value)}
          className="select-field text-xs py-1.5 sm:ml-auto"
        >
          <option value="all">All Vehicles</option>
          {vehicles.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      </div>

      {/* Task List */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(task => {
          const Icon = task.icon;
          const milesLeft = getMilesUntilDue(task);
          const progress = getProgress(task);

          return (
            <div key={task.id} className={cn(
              'glass-card p-4 sm:p-5 transition-all',
              task.status === 'overdue' && 'border-danger/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.1)]',
              task.status === 'due-soon' && 'border-warning/20'
            )}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Icon & Title */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className={cn('w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                    task.status === 'ok' ? 'bg-success/10' : task.status === 'due-soon' ? 'bg-warning/10' : 'bg-danger/10'
                  )}>
                    <Icon className={cn('w-5 h-5 sm:w-6 sm:h-6',
                      task.status === 'ok' ? 'text-success' : task.status === 'due-soon' ? 'text-warning' : 'text-danger'
                    )} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-white truncate">{task.name}</h3>
                      <span className={cn('text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider',
                        task.status === 'ok' ? 'bg-success/10 text-success' : task.status === 'due-soon' ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
                      )}>
                        {task.status === 'ok' ? 'OK' : task.status === 'due-soon' ? 'Soon' : 'Overdue'}
                      </span>
                    </div>
                    <p className="text-[10px] text-surface-500 flex items-center gap-1.5">
                      Last: {new Date(task.lastDone).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} • {task.intervalMiles / 1000}k mi
                    </p>
                  </div>
                </div>

                {/* Progress & Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:min-w-[300px]">
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] mb-1 px-0.5">
                      <span className="text-surface-500">Service Progress</span>
                      <span className={cn('font-bold', milesLeft > 0 ? 'text-surface-400' : 'text-danger')}>
                        {milesLeft > 0 ? `${milesLeft.toLocaleString()} mi left` : `${Math.abs(milesLeft).toLocaleString()} mi past`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700',
                          progress < 70 ? 'bg-success' : progress < 90 ? 'bg-warning' : 'bg-danger'
                        )}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  <button className={cn('px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                    task.status === 'overdue' ? 'bg-danger/20 text-danger border border-danger/20 hover:bg-danger/30'
                    : task.status === 'due-soon' ? 'bg-warning/20 text-warning border border-warning/20 hover:bg-warning/30'
                    : 'bg-surface-800/50 text-surface-400 border border-surface-700/50 hover:text-white'
                  )}>
                    Mark Done
                  </button>
                </div>
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
