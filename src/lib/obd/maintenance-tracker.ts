import type { DTCCode, OBDConnectionState } from '@/types';

// Maintenance History and Tracking System
export interface MaintenanceRecord {
  id: string;
  timestamp: string;
  vehicleId: string;
  vin: string;
  mileage: number;
  type: 'service' | 'repair' | 'diagnostic' | 'inspection' | 'reset' | 'calibration';
  category: string;
  description: string;
  performedBy: 'user' | 'mechanic' | 'system';
  cost?: {
    parts: number;
    labor: number;
    total: number;
    currency: string;
  };
  parts?: Array<{
    name: string;
    partNumber: string;
    quantity: number;
    unitPrice: number;
  }>;
  labor?: Array<{
    task: string;
    hours: number;
    hourlyRate: number;
  }>;
  notes?: string;
  images?: string[];
  documents?: string[];
  warranty?: {
    provider: string;
    duration: string;
    coverage: string[];
  };
  nextService?: {
    type: string;
    intervalMiles: number;
    intervalMonths: number;
    estimatedDate: string;
  };
  dtcsCleared?: string[];
  parametersAdjusted?: Array<{
    parameter: string;
    oldValue: number;
    newValue: number;
  }>;
}

export interface MaintenanceSchedule {
  id: string;
  vehicleId: string;
  vin: string;
  task: string;
  category: 'oil' | 'tire' | 'brake' | 'fluid' | 'filter' | 'inspection' | 'custom';
  intervalMiles: number;
  intervalMonths: number;
  lastMileage: number;
  lastDate: string;
  nextMileage: number;
  nextDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: {
    min: number;
    max: number;
    currency: string;
  };
  estimatedDuration: number; // in hours
  difficulty: 'easy' | 'medium' | 'hard' | 'professional';
  parts?: Array<{
    name: string;
    partNumber: string;
    quantity: number;
    estimatedPrice: number;
  }>;
  instructions?: string[];
  warnings?: string[];
}

export class MaintenanceTracker {
  private static readonly STORAGE_KEY = 'car_maintenance_history';
  private static readonly SCHEDULE_KEY = 'car_maintenance_schedule';
  private static readonly VEHICLE_KEY = 'car_vehicles';

  // Maintenance History Management
  static async addMaintenanceRecord(record: Omit<MaintenanceRecord, 'id' | 'timestamp'>): Promise<string> {
    const id = this.generateId();
    const timestamp = new Date().toISOString();
    
    const fullRecord: MaintenanceRecord = {
      ...record,
      id,
      timestamp
    };

    const history = this.getMaintenanceHistory();
    history.push(fullRecord);
    this.saveMaintenanceHistory(history);

    // Update schedule if applicable
    if (record.nextService) {
      await this.updateScheduleFromRecord(fullRecord);
    }

    return id;
  }

  static getMaintenanceHistory(vehicleId?: string): MaintenanceRecord[] {
    // Check if localStorage is available (SSR compatibility)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      const history: MaintenanceRecord[] = data ? JSON.parse(data) : [];
      
      if (vehicleId) {
        return history.filter(record => record.vehicleId === vehicleId);
      }
      
      return history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('Error loading maintenance history:', error);
      return [];
    }
  }

  static getMaintenanceRecord(id: string): MaintenanceRecord | null {
    const history = this.getMaintenanceHistory();
    return history.find(record => record.id === id) || null;
  }

  static updateMaintenanceRecord(id: string, updates: Partial<MaintenanceRecord>): boolean {
    const history = this.getMaintenanceHistory();
    const index = history.findIndex(record => record.id === id);
    
    if (index === -1) return false;
    
    history[index] = { ...history[index], ...updates };
    this.saveMaintenanceHistory(history);
    return true;
  }

  static deleteMaintenanceRecord(id: string): boolean {
    const history = this.getMaintenanceHistory();
    const filtered = history.filter(record => record.id !== id);
    
    if (filtered.length === history.length) return false;
    
    this.saveMaintenanceHistory(filtered);
    return true;
  }

  // Maintenance Schedule Management
  static async createMaintenanceSchedule(schedule: Omit<MaintenanceSchedule, 'id' | 'nextMileage' | 'nextDate'>): Promise<string> {
    const id = this.generateId();
    
    const nextMileage = schedule.lastMileage + schedule.intervalMiles;
    const nextDate = this.calculateNextDate(schedule.lastDate, schedule.intervalMonths);
    
    const fullSchedule: MaintenanceSchedule = {
      ...schedule,
      id,
      nextMileage,
      nextDate
    };

    const schedules = this.getMaintenanceSchedules();
    schedules.push(fullSchedule);
    this.saveMaintenanceSchedules(schedules);

    return id;
  }

  static getMaintenanceSchedules(vehicleId?: string): MaintenanceSchedule[] {
    // Check if localStorage is available (SSR compatibility)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    
    try {
      const data = localStorage.getItem(this.SCHEDULE_KEY);
      const schedules: MaintenanceSchedule[] = data ? JSON.parse(data) : [];
      
      if (vehicleId) {
        return schedules.filter(schedule => schedule.vehicleId === vehicleId);
      }
      
      return schedules.sort((a, b) => new Date(a.nextDate).getTime() - new Date(b.nextDate).getTime());
    } catch (error) {
      console.error('Error loading maintenance schedules:', error);
      return [];
    }
  }

  static updateMaintenanceSchedule(id: string, updates: Partial<MaintenanceSchedule>): boolean {
    const schedules = this.getMaintenanceSchedules();
    const index = schedules.findIndex(schedule => schedule.id === id);
    
    if (index === -1) return false;
    
    // Recalculate next service if interval or last service changed
    if (updates.intervalMiles || updates.intervalMonths || updates.lastMileage || updates.lastDate) {
      const schedule = schedules[index];
      const updated = { ...schedule, ...updates };
      
      updated.nextMileage = updated.lastMileage + updated.intervalMiles;
      updated.nextDate = this.calculateNextDate(updated.lastDate, updated.intervalMonths);
      
      schedules[index] = updated;
    } else {
      schedules[index] = { ...schedules[index], ...updates };
    }
    
    this.saveMaintenanceSchedules(schedules);
    return true;
  }

  static completeMaintenanceSchedule(id: string, mileage: number, cost?: MaintenanceRecord['cost']): boolean {
    const schedules = this.getMaintenanceSchedules();
    const index = schedules.findIndex(schedule => schedule.id === id);
    
    if (index === -1) return false;
    
    const schedule = schedules[index];
    
    // Create maintenance record
    this.addMaintenanceRecord({
      vehicleId: schedule.vehicleId,
      vin: schedule.vin,
      mileage,
      type: 'service',
      category: schedule.category,
      description: `Completed ${schedule.task}`,
      performedBy: 'user',
      cost,
      nextService: {
        type: schedule.task,
        intervalMiles: schedule.intervalMiles,
        intervalMonths: schedule.intervalMonths,
        estimatedDate: this.calculateNextDate(new Date().toISOString(), schedule.intervalMonths)
      }
    });
    
    // Update schedule
    schedule.lastMileage = mileage;
    schedule.lastDate = new Date().toISOString();
    schedule.nextMileage = mileage + schedule.intervalMiles;
    schedule.nextDate = this.calculateNextDate(new Date().toISOString(), schedule.intervalMonths);
    
    this.saveMaintenanceSchedules(schedules);
    return true;
  }

  static deleteMaintenanceSchedule(id: string): boolean {
    const schedules = this.getMaintenanceSchedules();
    const filtered = schedules.filter(schedule => schedule.id !== id);
    
    if (filtered.length === schedules.length) return false;
    
    this.saveMaintenanceSchedules(filtered);
    return true;
  }

  // Analytics and Reporting
  static getMaintenanceAnalytics(vehicleId?: string): {
    totalRecords: number;
    totalCost: number;
    averageCostPerService: number;
    servicesByCategory: Record<string, number>;
    costsByCategory: Record<string, number>;
    servicesByMonth: Record<string, number>;
    upcomingServices: MaintenanceSchedule[];
    overdueServices: MaintenanceSchedule[];
    costTrend: Array<{ month: string; cost: number }>;
  } {
    const history = this.getMaintenanceHistory(vehicleId);
    const schedules = this.getMaintenanceSchedules(vehicleId);
    
    const totalRecords = history.length;
    const totalCost = history.reduce((sum, record) => sum + (record.cost?.total || 0), 0);
    const averageCostPerService = totalRecords > 0 ? totalCost / totalRecords : 0;
    
    const servicesByCategory: Record<string, number> = {};
    const costsByCategory: Record<string, number> = {};
    const servicesByMonth: Record<string, number> = {};
    
    history.forEach(record => {
      // Category counts
      servicesByCategory[record.category] = (servicesByCategory[record.category] || 0) + 1;
      costsByCategory[record.category] = (costsByCategory[record.category] || 0) + (record.cost?.total || 0);
      
      // Monthly counts
      const month = new Date(record.timestamp).toISOString().substring(0, 7);
      servicesByMonth[month] = (servicesByMonth[month] || 0) + 1;
    });
    
    // Upcoming and overdue services
    const now = new Date();
    const upcomingServices = schedules.filter(schedule => 
      new Date(schedule.nextDate) > now && 
      new Date(schedule.nextDate) <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days
    );
    
    const overdueServices = schedules.filter(schedule => 
      new Date(schedule.nextDate) < now
    );
    
    // Cost trend (last 12 months)
    const costTrend: Array<{ month: string; cost: number }> = [];
    const twelveMonthsAgo = new Date(now.getTime() - 12 * 30 * 24 * 60 * 60 * 1000);
    
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 7);
      const monthCost = history
        .filter(record => record.timestamp.startsWith(month))
        .reduce((sum, record) => sum + (record.cost?.total || 0), 0);
      
      costTrend.push({ month, cost: monthCost });
    }
    
    return {
      totalRecords,
      totalCost,
      averageCostPerService,
      servicesByCategory,
      costsByCategory,
      servicesByMonth,
      upcomingServices,
      overdueServices,
      costTrend
    };
  }

  // Vehicle Management
  static getVehicleInfo(vehicleId: string): {
    vehicleId: string;
    vin: string;
    make?: string;
    model?: string;
    year?: number;
    mileage?: number;
    lastUpdated: string;
  } | null {
    try {
      const data = localStorage.getItem(this.VEHICLE_KEY);
      const vehicles: any[] = data ? JSON.parse(data) : [];
      
      return vehicles.find(v => v.vehicleId === vehicleId) || null;
    } catch (error) {
      console.error('Error loading vehicle info:', error);
      return null;
    }
  }

  static updateVehicleInfo(vehicleId: string, updates: any): boolean {
    try {
      const data = localStorage.getItem(this.VEHICLE_KEY);
      const vehicles: any[] = data ? JSON.parse(data) : [];
      
      const index = vehicles.findIndex(v => v.vehicleId === vehicleId);
      if (index === -1) return false;
      
      vehicles[index] = { ...vehicles[index], ...updates, lastUpdated: new Date().toISOString() };
      localStorage.setItem(this.VEHICLE_KEY, JSON.stringify(vehicles));
      
      return true;
    } catch (error) {
      console.error('Error updating vehicle info:', error);
      return false;
    }
  }

  // Import/Export
  static exportMaintenanceData(vehicleId?: string): {
    history: MaintenanceRecord[];
    schedules: MaintenanceSchedule[];
    vehicle: any;
    exportDate: string;
  } {
    return {
      history: this.getMaintenanceHistory(vehicleId),
      schedules: this.getMaintenanceSchedules(vehicleId),
      vehicle: vehicleId ? this.getVehicleInfo(vehicleId) : null,
      exportDate: new Date().toISOString()
    };
  }

  static importMaintenanceData(data: {
    history: MaintenanceRecord[];
    schedules: MaintenanceSchedule[];
    vehicle?: any;
  }): boolean {
    try {
      // Import history
      if (data.history) {
        const existingHistory = this.getMaintenanceHistory();
        const mergedHistory = [...existingHistory, ...data.history];
        this.saveMaintenanceHistory(mergedHistory);
      }
      
      // Import schedules
      if (data.schedules) {
        const existingSchedules = this.getMaintenanceSchedules();
        const mergedSchedules = [...existingSchedules, ...data.schedules];
        this.saveMaintenanceSchedules(mergedSchedules);
      }
      
      // Import vehicle info
      if (data.vehicle) {
        const existingVehicles = JSON.parse(localStorage.getItem(this.VEHICLE_KEY) || '[]');
        const vehicleExists = existingVehicles.some((v: any) => v.vehicleId === data.vehicle.vehicleId);
        
        if (!vehicleExists) {
          existingVehicles.push(data.vehicle);
          localStorage.setItem(this.VEHICLE_KEY, JSON.stringify(existingVehicles));
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error importing maintenance data:', error);
      return false;
    }
  }

  // Helper methods
  private static saveMaintenanceHistory(history: MaintenanceRecord[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving maintenance history:', error);
    }
  }

  private static saveMaintenanceSchedules(schedules: MaintenanceSchedule[]): void {
    try {
      localStorage.setItem(this.SCHEDULE_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error('Error saving maintenance schedules:', error);
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private static calculateNextDate(lastDate: string, intervalMonths: number): string {
    const date = new Date(lastDate);
    date.setMonth(date.getMonth() + intervalMonths);
    return date.toISOString();
  }

  private static async updateScheduleFromRecord(record: MaintenanceRecord): Promise<void> {
    if (!record.nextService) return;
    
    const schedules = this.getMaintenanceSchedules(record.vehicleId);
    const relevantSchedule = schedules.find(s => s.task === record.nextService!.type);
    
    if (relevantSchedule) {
      this.updateMaintenanceSchedule(relevantSchedule.id, {
        lastMileage: record.mileage,
        lastDate: record.timestamp
      });
    }
  }

  static ensureDefaultSchedules(vehicleId: string, vin: string, currentMileage: number): MaintenanceSchedule[] {
    const existing = this.getMaintenanceSchedules(vehicleId);
    if (existing.length > 0) return existing;

    const defaults = this.createDefaultSchedules(vehicleId, vin, currentMileage);
    const all = [...this.getMaintenanceSchedules(), ...defaults];
    this.saveMaintenanceSchedules(all);
    return defaults;
  }

  // Default maintenance schedules
  static createDefaultSchedules(vehicleId: string, vin: string, currentMileage: number): MaintenanceSchedule[] {
    const defaults: Omit<MaintenanceSchedule, 'id' | 'nextMileage' | 'nextDate'>[] = [
      {
        vehicleId,
        vin,
        task: 'Engine Oil Change',
        category: 'oil',
        intervalMiles: 7500,
        intervalMonths: 6,
        lastMileage: currentMileage,
        lastDate: new Date().toISOString(),
        priority: 'medium',
        estimatedCost: { min: 40, max: 80, currency: 'USD' },
        estimatedDuration: 0.5,
        difficulty: 'easy',
        warnings: ['Use correct oil viscosity', 'Replace oil filter']
      },
      {
        vehicleId,
        vin,
        task: 'Tire Rotation',
        category: 'tire',
        intervalMiles: 5000,
        intervalMonths: 6,
        lastMileage: currentMileage,
        lastDate: new Date().toISOString(),
        priority: 'medium',
        estimatedCost: { min: 20, max: 50, currency: 'USD' },
        estimatedDuration: 0.5,
        difficulty: 'easy',
        warnings: ['Check tire pressure', 'Inspect for uneven wear']
      },
      {
        vehicleId,
        vin,
        task: 'Brake Inspection',
        category: 'brake',
        intervalMiles: 15000,
        intervalMonths: 12,
        lastMileage: currentMileage,
        lastDate: new Date().toISOString(),
        priority: 'high',
        estimatedCost: { min: 50, max: 150, currency: 'USD' },
        estimatedDuration: 1,
        difficulty: 'medium',
        warnings: ['Check pad thickness', 'Inspect rotors']
      },
      {
        vehicleId,
        vin,
        task: 'Air Filter Replacement',
        category: 'filter',
        intervalMiles: 15000,
        intervalMonths: 12,
        lastMileage: currentMileage,
        lastDate: new Date().toISOString(),
        priority: 'low',
        estimatedCost: { min: 15, max: 40, currency: 'USD' },
        estimatedDuration: 0.25,
        difficulty: 'easy'
      },
      {
        vehicleId,
        vin,
        task: 'Transmission Fluid Service',
        category: 'fluid',
        intervalMiles: 30000,
        intervalMonths: 24,
        lastMileage: currentMileage,
        lastDate: new Date().toISOString(),
        priority: 'high',
        estimatedCost: { min: 100, max: 250, currency: 'USD' },
        estimatedDuration: 2,
        difficulty: 'hard',
        warnings: ['Use correct fluid type', 'Check for leaks']
      },
      {
        vehicleId,
        vin,
        task: 'Coolant Flush',
        category: 'fluid',
        intervalMiles: 30000,
        intervalMonths: 24,
        lastMileage: currentMileage,
        lastDate: new Date().toISOString(),
        priority: 'medium',
        estimatedCost: { min: 70, max: 150, currency: 'USD' },
        estimatedDuration: 1.5,
        difficulty: 'medium',
        warnings: ['Use correct coolant type', 'Bleed system properly']
      },
      {
        vehicleId,
        vin,
        task: 'Spark Plug Replacement',
        category: 'inspection',
        intervalMiles: 30000,
        intervalMonths: 24,
        lastMileage: currentMileage,
        lastDate: new Date().toISOString(),
        priority: 'medium',
        estimatedCost: { min: 60, max: 150, currency: 'USD' },
        estimatedDuration: 1,
        difficulty: 'medium',
        warnings: ['Use correct plug gap', 'Apply anti-seize']
      },
      {
        vehicleId,
        vin,
        task: 'Battery Check',
        category: 'inspection',
        intervalMiles: 25000,
        intervalMonths: 12,
        lastMileage: currentMileage,
        lastDate: new Date().toISOString(),
        priority: 'low',
        estimatedCost: { min: 0, max: 0, currency: 'USD' },
        estimatedDuration: 0.25,
        difficulty: 'easy'
      }
    ];

    return defaults.map(defaultSchedule => {
      const id = this.generateId();
      const nextMileage = defaultSchedule.lastMileage + defaultSchedule.intervalMiles;
      const nextDate = this.calculateNextDate(defaultSchedule.lastDate, defaultSchedule.intervalMonths);
      
      return {
        ...defaultSchedule,
        id,
        nextMileage,
        nextDate
      };
    });
  }
}
