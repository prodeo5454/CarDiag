'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Wrench,
  Plus,
  Droplets,
  Disc,
  Wind,
  Gauge,
  Filter as FilterIcon,
  Plug,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useOBD } from '@/lib/obd/OBDContext';
import { MaintenanceTracker, type MaintenanceSchedule } from '@/lib/obd/maintenance-tracker';
import { STANDARD_PIDS } from '@/lib/obd/pids';
import { VehicleManager } from '@/lib/vehicle-manager';

type TaskStatus = 'ok' | 'due-soon' | 'overdue';

const CATEGORY_ICONS: Record<MaintenanceSchedule['category'], React.ElementType> = {
  oil: Droplets,
  tire: Disc,
  brake: Disc,
  fluid: Droplets,
  filter: Wind,
  inspection: Gauge,
  custom: Wrench,
};

function getScheduleStatus(schedule: MaintenanceSchedule, currentMileage: number): TaskStatus {
  const now = new Date();
  const dateOverdue = new Date(schedule.nextDate) < now;
  const milesOverdue = currentMileage >= schedule.nextMileage;

  if (dateOverdue || milesOverdue) return 'overdue';

  const milesUntil = schedule.nextMileage - currentMileage;
  const daysUntil =
    (new Date(schedule.nextDate).getTime() - now.getTime()) / (24 * 60 * 60 * 1000);

  if (milesUntil <= schedule.intervalMiles * 0.15 || daysUntil <= 30) return 'due-soon';
  return 'ok';
}

const DISTANCE_SINCE_CLEAR_PID = STANDARD_PIDS.find((p) => p.pid === '31' && p.mode === '01');

export default function MaintenancePage() {
  const { connectionState, readPIDValue } = useOBD();
  const isConnected = connectionState.status === 'connected';
  const [syncingMileage, setSyncingMileage] = useState(false);

  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [filterVehicle, setFilterVehicle] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newIntervalMiles, setNewIntervalMiles] = useState(7500);
  const [newIntervalMonths, setNewIntervalMonths] = useState(6);

  const activeVehicle = VehicleManager.getActiveVehicle();
  const vehicles = VehicleManager.getVehicles();
  const vehicleId = activeVehicle?.id || 'default';
  const currentMileage = activeVehicle?.currentMileage ?? 0;
  const vin = activeVehicle?.vin || connectionState.vin || '';

  const loadSchedules = useCallback(() => {
    MaintenanceTracker.ensureDefaultSchedules(vehicleId, vin, currentMileage);
    setSchedules(MaintenanceTracker.getMaintenanceSchedules(vehicleId));
  }, [vehicleId, vin, currentMileage]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const tasks = schedules.map(schedule => ({
    schedule,
    status: getScheduleStatus(schedule, currentMileage),
    Icon: CATEGORY_ICONS[schedule.category] || Wrench,
  }));

  const filtered = tasks.filter(t => {
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesVehicle =
      filterVehicle === 'all' || t.schedule.vehicleId === filterVehicle;
    return matchesStatus && matchesVehicle;
  });

  const overdue = tasks.filter(t => t.status === 'overdue').length;
  const dueSoon = tasks.filter(t => t.status === 'due-soon').length;

  const handleMarkDone = (scheduleId: string) => {
    const mileage = currentMileage || schedules.find(s => s.id === scheduleId)?.lastMileage || 0;
    if (MaintenanceTracker.completeMaintenanceSchedule(scheduleId, mileage)) {
      toast.success('Service recorded');
      loadSchedules();
    } else {
      toast.error('Failed to record service');
    }
  };

  const handleAddTask = async () => {
    if (!newTaskName.trim()) {
      toast.error('Task name is required');
      return;
    }

    await MaintenanceTracker.createMaintenanceSchedule({
      vehicleId,
      vin,
      task: newTaskName.trim(),
      category: 'custom',
      intervalMiles: newIntervalMiles,
      intervalMonths: newIntervalMonths,
      lastMileage: currentMileage,
      lastDate: new Date().toISOString(),
      priority: 'medium',
      estimatedCost: { min: 0, max: 0, currency: 'USD' },
      estimatedDuration: 1,
      difficulty: 'medium',
    });

    toast.success('Maintenance task added');
    setNewTaskName('');
    setShowAddForm(false);
    loadSchedules();
  };

  const getMilesUntilDue = (schedule: MaintenanceSchedule) =>
    schedule.nextMileage - currentMileage;

  const getProgress = (schedule: MaintenanceSchedule) => {
    const milesDone = currentMileage - schedule.lastMileage;
    return Math.min(100, (milesDone / schedule.intervalMiles) * 100);
  };

  const syncDistanceFromEcu = useCallback(async () => {
    if (!isConnected || !activeVehicle || !DISTANCE_SINCE_CLEAR_PID) {
      toast.error('Connect OBD and select a vehicle first');
      return;
    }
    setSyncingMileage(true);
    try {
      const reading = await readPIDValue(DISTANCE_SINCE_CLEAR_PID);
      if (!reading || reading.value == null) {
        toast.error('ECU did not return distance PID (0x31)');
        return;
      }
      const kmSinceClear = Math.round(reading.value);
      const updated = VehicleManager.updateVehicle(activeVehicle.id, {
        currentMileage: activeVehicle.currentMileage + kmSinceClear,
      });
      if (updated) {
        toast.success(
          `Added ${kmSinceClear} km since last clear to odometer (now ${updated.currentMileage.toLocaleString()} km)`
        );
        loadSchedules();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read distance from ECU');
    } finally {
      setSyncingMileage(false);
    }
  }, [isConnected, activeVehicle, readPIDValue, loadSchedules]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Maintenance</h1>
          <p className="text-surface-400 text-xs sm:text-sm mt-1">
            Track and manage vehicle service
            {activeVehicle ? ` — ${activeVehicle.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {isConnected && activeVehicle && (
            <button
              type="button"
              onClick={() => void syncDistanceFromEcu()}
              disabled={syncingMileage}
              className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2 disabled:opacity-50"
              title="Uses PID 0x31 distance since codes cleared — adds to vehicle mileage"
            >
              <Gauge className={cn('w-3.5 h-3.5 sm:w-4 h-4', syncingMileage && 'animate-pulse')} />
              {syncingMileage ? 'Reading…' : 'Sync distance'}
            </button>
          )}
          {!isConnected && (
            <Link href="/connection" className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3 py-2 sm:px-4 sm:py-2">
              <Plug className="w-3.5 h-3.5 sm:w-4 h-4" /> <span>Connect</span>
            </Link>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-4 py-2 sm:px-5 sm:py-2.5"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 h-4" /> <span>Add Task</span>
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="glass-card p-4 sm:p-5 animate-scale-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">Add Maintenance Task</h2>
            <button onClick={() => setShowAddForm(false)} className="p-1 text-surface-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label className="text-[10px] text-surface-400 uppercase mb-1 block">Task Name</label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="e.g. Cabin air filter"
                className="input-field w-full text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-surface-400 uppercase mb-1 block">Interval (miles)</label>
              <input
                type="number"
                value={newIntervalMiles}
                onChange={(e) => setNewIntervalMiles(Number(e.target.value))}
                className="input-field w-full text-sm"
                min={1000}
              />
            </div>
            <div>
              <label className="text-[10px] text-surface-400 uppercase mb-1 block">Interval (months)</label>
              <input
                type="number"
                value={newIntervalMonths}
                onChange={(e) => setNewIntervalMonths(Number(e.target.value))}
                className="input-field w-full text-sm"
                min={1}
              />
            </div>
            <div className="flex items-end">
              <button onClick={handleAddTask} className="btn-primary w-full text-sm py-2">
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}

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
          <span className="text-xl sm:text-3xl font-bold text-success">
            {tasks.length - overdue - dueSoon}
          </span>
        </div>
      </div>

      <div className="glass-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <FilterIcon className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" />
          <div className="flex gap-1.5">
            {(['all', 'overdue', 'due-soon', 'ok'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-medium transition-all whitespace-nowrap',
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
          {vehicles.map(v => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(({ schedule, status, Icon }) => {
          const milesLeft = getMilesUntilDue(schedule);
          const progress = getProgress(schedule);

          return (
            <div
              key={schedule.id}
              className={cn(
                'glass-card p-4 sm:p-5 transition-all',
                status === 'overdue' && 'border-danger/30',
                status === 'due-soon' && 'border-warning/20'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div
                    className={cn(
                      'w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0',
                      status === 'ok' ? 'bg-success/10' : status === 'due-soon' ? 'bg-warning/10' : 'bg-danger/10'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 sm:w-6 sm:h-6',
                        status === 'ok' ? 'text-success' : status === 'due-soon' ? 'text-warning' : 'text-danger'
                      )}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-white truncate">{schedule.task}</h3>
                      <span
                        className={cn(
                          'text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider',
                          status === 'ok'
                            ? 'bg-success/10 text-success'
                            : status === 'due-soon'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-danger/10 text-danger'
                        )}
                      >
                        {status === 'ok' ? 'OK' : status === 'due-soon' ? 'Soon' : 'Overdue'}
                      </span>
                    </div>
                    <p className="text-[10px] text-surface-500">
                      Last: {new Date(schedule.lastDate).toLocaleDateString(undefined, {
                        month: 'short',
                        year: 'numeric',
                      })}{' '}
                      • {schedule.intervalMiles / 1000}k mi interval
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 sm:min-w-[300px]">
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] mb-1 px-0.5">
                      <span className="text-surface-500">Service Progress</span>
                      <span className={cn('font-bold', milesLeft > 0 ? 'text-surface-400' : 'text-danger')}>
                        {milesLeft > 0
                          ? `${milesLeft.toLocaleString()} mi left`
                          : `${Math.abs(milesLeft).toLocaleString()} mi past`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          progress < 70 ? 'bg-success' : progress < 90 ? 'bg-warning' : 'bg-danger'
                        )}
                        style={{ width: `${Math.min(100, progress)}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleMarkDone(schedule.id)}
                    className={cn(
                      'px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                      status === 'overdue'
                        ? 'bg-danger/20 text-danger border border-danger/20 hover:bg-danger/30'
                        : status === 'due-soon'
                          ? 'bg-warning/20 text-warning border border-warning/20 hover:bg-warning/30'
                          : 'bg-surface-800/50 text-surface-400 border border-surface-700/50 hover:text-white'
                    )}
                  >
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

