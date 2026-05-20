import { APP_VERSION } from './app-info';
import { MaintenanceTracker } from './obd/maintenance-tracker';

export interface Vehicle {
  id: string;
  name: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  licensePlate?: string;
  color?: string;
  engine: string;
  transmission: string;
  fuelType: 'gasoline' | 'diesel' | 'electric' | 'hybrid' | 'plugin_hybrid' | 'flex';
  odometer: number;
  purchaseDate?: string;
  purchaseMileage?: number;
  currentMileage: number;
  lastServiceDate?: string;
  lastServiceMileage?: number;
  nextServiceMileage?: number;
  nextServiceDate?: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  notes?: string;
  image?: string;
  tags: string[];
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleProfile {
  vehicle: Vehicle;
  maintenanceHistory: any[];
  diagnosticReports: any[];
  maintenanceSchedules: any[];
  customSettings: {
    units: 'metric' | 'imperial';
    preferredProtocol?: string;
    customPIDs: Array<{
      pid: string;
      name: string;
      formula: string;
      unit: string;
    }>;
    alerts: {
      lowFuel: boolean;
      highTemp: boolean;
      lowBattery: boolean;
      checkEngine: boolean;
      maintenanceDue: boolean;
    };
  };
}

export class VehicleManager {
  private static readonly STORAGE_KEY = 'cardiag-vehicles';
  private static readonly ACTIVE_VEHICLE_KEY = 'cardiag-active-vehicle';

  // Vehicle CRUD Operations
  static createVehicle(vehicleData: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Vehicle {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const vehicle: Vehicle = {
      ...vehicleData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const vehicles = this.getVehicles();
    
    // If this is the first vehicle or marked as primary, make it primary
    if (vehicles.length === 0 || vehicleData.isPrimary) {
      vehicles.forEach(v => v.isPrimary = false);
      vehicle.isPrimary = true;
    }

    vehicles.push(vehicle);
    this.saveVehicles(vehicles);
    
    // Set as active vehicle if it's the first one
    if (vehicles.length === 1) {
      this.setActiveVehicle(vehicle.id);
    }

    return vehicle;
  }

  static getVehicles(): Vehicle[] {
    // Check if localStorage is available (SSR compatibility)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [];
    }
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading vehicles:', error);
      return [];
    }
  }

  static getVehicle(id: string): Vehicle | null {
    const vehicles = this.getVehicles();
    return vehicles.find(v => v.id === id) || null;
  }

  static updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | null {
    const vehicles = this.getVehicles();
    const index = vehicles.findIndex(v => v.id === id);
    
    if (index === -1) return null;

    // Handle primary vehicle changes
    if (updates.isPrimary) {
      vehicles.forEach(v => v.isPrimary = false);
    }

    vehicles[index] = {
      ...vehicles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveVehicles(vehicles);
    return vehicles[index];
  }

  static deleteVehicle(id: string): boolean {
    const vehicles = this.getVehicles();
    const index = vehicles.findIndex(v => v.id === id);
    
    if (index === -1) return false;

    const wasPrimary = vehicles[index].isPrimary;
    vehicles.splice(index, 1);

    // If we deleted the primary vehicle and there are others, make the first one primary
    if (wasPrimary && vehicles.length > 0) {
      vehicles[0].isPrimary = true;
      this.setActiveVehicle(vehicles[0].id);
    }

    this.saveVehicles(vehicles);

    // Clean up related data
    this.cleanupVehicleData(id);

    return true;
  }

  // Active Vehicle Management
  static getActiveVehicle(): Vehicle | null {
    // Check if localStorage is available (SSR compatibility)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null;
    }
    
    const activeId = localStorage.getItem(this.ACTIVE_VEHICLE_KEY);
    if (!activeId) return null;

    const vehicles = this.getVehicles();
    return vehicles.find(v => v.id === activeId) || null;
  }

  static setActiveVehicle(vehicleId: string): boolean {
    const vehicle = this.getVehicle(vehicleId);
    if (!vehicle) return false;

    // Check if localStorage is available (SSR compatibility)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      localStorage.setItem(this.ACTIVE_VEHICLE_KEY, vehicleId);
    }
    return true;
  }

  static getPrimaryVehicle(): Vehicle | null {
    const vehicles = this.getVehicles();
    return vehicles.find(v => v.isPrimary) || null;
  }

  // Vehicle Search and Filter
  static searchVehicles(query: string): Vehicle[] {
    const vehicles = this.getVehicles();
    const searchTerm = query.toLowerCase();

    return vehicles.filter(vehicle => 
      vehicle.name.toLowerCase().includes(searchTerm) ||
      vehicle.make.toLowerCase().includes(searchTerm) ||
      vehicle.model.toLowerCase().includes(searchTerm) ||
      vehicle.vin.toLowerCase().includes(searchTerm) ||
      vehicle.licensePlate?.toLowerCase().includes(searchTerm) ||
      vehicle.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  static filterVehicles(filters: {
    make?: string;
    fuelType?: string;
    year?: number;
    minMileage?: number;
    maxMileage?: number;
    tags?: string[];
  }): Vehicle[] {
    const vehicles = this.getVehicles();

    return vehicles.filter(vehicle => {
      if (filters.make && vehicle.make !== filters.make) return false;
      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) return false;
      if (filters.year && vehicle.year !== filters.year) return false;
      if (filters.minMileage && vehicle.currentMileage < filters.minMileage) return false;
      if (filters.maxMileage && vehicle.currentMileage > filters.maxMileage) return false;
      if (filters.tags && !filters.tags.every(tag => vehicle.tags.includes(tag))) return false;
      
      return true;
    });
  }

  // Vehicle Analytics
  static getVehicleStats(vehicleId: string): {
    totalServices: number;
    totalCost: number;
    averageCostPerService: number;
    lastServiceDate: string | null;
    nextServiceDue: boolean;
    servicesByMonth: Record<string, number>;
    commonIssues: Array<{ issue: string; count: number }>;
  } {
    const maintenanceHistory = MaintenanceTracker.getMaintenanceHistory(vehicleId);
    const schedules = MaintenanceTracker.getMaintenanceSchedules(vehicleId);
    
    const totalServices = maintenanceHistory.length;
    const totalCost = maintenanceHistory.reduce((sum, record) => sum + (record.cost?.total || 0), 0);
    const averageCostPerService = totalServices > 0 ? totalCost / totalServices : 0;
    
    const lastServiceDate = maintenanceHistory.length > 0 
      ? maintenanceHistory[0].timestamp 
      : null;

    const now = new Date();
    const nextServiceDue = schedules.some(schedule => 
      new Date(schedule.nextDate) <= now
    );

    // Services by month
    const servicesByMonth: Record<string, number> = {};
    maintenanceHistory.forEach(record => {
      const month = new Date(record.timestamp).toISOString().substring(0, 7);
      servicesByMonth[month] = (servicesByMonth[month] || 0) + 1;
    });

    // Common issues from DTCs
    const dtcCounts: Record<string, number> = {};
    maintenanceHistory.forEach(record => {
      record.dtcsCleared?.forEach(dtc => {
        dtcCounts[dtc] = (dtcCounts[dtc] || 0) + 1;
      });
    });

    const commonIssues = Object.entries(dtcCounts)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalServices,
      totalCost,
      averageCostPerService,
      lastServiceDate,
      nextServiceDue,
      servicesByMonth,
      commonIssues,
    };
  }

  // Fleet Management
  static getFleetStats(): {
    totalVehicles: number;
    totalMileage: number;
    averageAge: number;
    fuelTypeBreakdown: Record<string, number>;
    makeBreakdown: Record<string, number>;
    upcomingServices: number;
    totalMaintenanceCost: number;
  } {
    const vehicles = this.getVehicles();
    const now = new Date().getFullYear();

    const totalVehicles = vehicles.length;
    const totalMileage = vehicles.reduce((sum, v) => sum + v.currentMileage, 0);
    const averageAge = vehicles.length > 0 
      ? vehicles.reduce((sum, v) => sum + (now - v.year), 0) / vehicles.length 
      : 0;

    const fuelTypeBreakdown: Record<string, number> = {};
    const makeBreakdown: Record<string, number> = {};

    vehicles.forEach(vehicle => {
      fuelTypeBreakdown[vehicle.fuelType] = (fuelTypeBreakdown[vehicle.fuelType] || 0) + 1;
      makeBreakdown[vehicle.make] = (makeBreakdown[vehicle.make] || 0) + 1;
    });

    let upcomingServices = 0;
    let totalMaintenanceCost = 0;

    vehicles.forEach(vehicle => {
      const stats = this.getVehicleStats(vehicle.id);
      if (stats.nextServiceDue) upcomingServices++;
      totalMaintenanceCost += stats.totalCost;
    });

    return {
      totalVehicles,
      totalMileage,
      averageAge,
      fuelTypeBreakdown,
      makeBreakdown,
      upcomingServices,
      totalMaintenanceCost,
    };
  }

  // Vehicle Import/Export
  static exportVehicles(): {
    vehicles: Vehicle[];
    exportDate: string;
    version: string;
  } {
    return {
      vehicles: this.getVehicles(),
      exportDate: new Date().toISOString(),
      version: APP_VERSION,
    };
  }

  static importVehicles(data: {
    vehicles: Vehicle[];
  }): { imported: number; duplicates: number; errors: string[] } {
    const existingVehicles = this.getVehicles();
    const existingVINs = new Set(existingVehicles.map(v => v.vin));
    
    let imported = 0;
    let duplicates = 0;
    const errors: string[] = [];

    data.vehicles.forEach(vehicle => {
      try {
        if (existingVINs.has(vehicle.vin)) {
          duplicates++;
          return;
        }

        // Validate required fields
        if (!vehicle.vin || !vehicle.make || !vehicle.model || !vehicle.year) {
          errors.push(`Invalid vehicle data: ${vehicle.name || 'Unknown'}`);
          return;
        }

        // Generate new ID and timestamps
        const newVehicle = {
          ...vehicle,
          id: this.generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        existingVehicles.push(newVehicle);
        imported++;
      } catch (error) {
        errors.push(`Error importing vehicle: ${vehicle.name || 'Unknown'}`);
      }
    });

    if (imported > 0) {
      this.saveVehicles(existingVehicles);
    }

    return { imported, duplicates, errors };
  }

  // Helper methods
  private static saveVehicles(vehicles: Vehicle[]): void {
    // Check if localStorage is available (SSR compatibility)
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return;
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(vehicles));
    } catch (error) {
      console.error('Error saving vehicles:', error);
    }
  }

  private static cleanupVehicleData(vehicleId: string): void {
    // Clean up maintenance history, schedules, etc. for deleted vehicle
    const maintenanceHistory = MaintenanceTracker.getMaintenanceHistory();
    const filteredHistory = maintenanceHistory.filter(record => record.vehicleId !== vehicleId);
    try {
      localStorage.setItem('cardiag-maintenance-history', JSON.stringify(filteredHistory));
    } catch (error) {
      console.error('Error cleaning up maintenance history:', error);
    }

    const schedules = MaintenanceTracker.getMaintenanceSchedules();
    const filteredSchedules = schedules.filter(schedule => schedule.vehicleId !== vehicleId);
    try {
      localStorage.setItem('cardiag-maintenance-schedules', JSON.stringify(filteredSchedules));
    } catch (error) {
      console.error('Error cleaning up maintenance schedules:', error);
    }
  }

  private static generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Vehicle Validation
  static validateVehicle(vehicle: Partial<Vehicle>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!vehicle.make || vehicle.make.trim().length === 0) {
      errors.push('Make is required');
    }

    if (!vehicle.model || vehicle.model.trim().length === 0) {
      errors.push('Model is required');
    }

    if (!vehicle.year || vehicle.year < 1900 || vehicle.year > new Date().getFullYear() + 1) {
      errors.push('Invalid year');
    }

    if (!vehicle.vin || vehicle.vin.trim().length === 0) {
      errors.push('VIN is required');
    } else if (vehicle.vin.length !== 17) {
      errors.push('VIN must be 17 characters');
    }

    if (vehicle.currentMileage && vehicle.currentMileage < 0) {
      errors.push('Mileage cannot be negative');
    }

    if (vehicle.odometer && vehicle.odometer < 0) {
      errors.push('Odometer cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Vehicle Suggestions
  static getMakes(): string[] {
    return [
      'Toyota', 'Honda', 'Ford', 'Chevrolet', 'BMW', 'Mercedes-Benz', 'Audi', 'Volkswagen',
      'Nissan', 'Hyundai', 'Kia', 'Subaru', 'Mazda', 'Mitsubishi', 'Jeep', 'Ram',
      'Tesla', 'Rivian', 'Lucid', 'Porsche', 'Lexus', 'Infiniti', 'Acura', 'Cadillac',
      'Lincoln', 'Buick', 'GMC', 'Volvo', 'Land Rover', 'Jaguar', 'Mini', 'Fiat',
      'Alfa Romeo', 'Maserati', 'Ferrari', 'Lamborghini', 'Bentley', 'Rolls-Royce',
    ];
  }

  static getFuelTypes(): Array<{ value: string; label: string }> {
    return [
      { value: 'gasoline', label: 'Gasoline' },
      { value: 'diesel', label: 'Diesel' },
      { value: 'electric', label: 'Electric' },
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'plugin_hybrid', label: 'Plug-in Hybrid' },
      { value: 'flex', label: 'Flex Fuel' },
    ];
  }

  static getCommonTags(): string[] {
    return [
      'Daily Driver', 'Weekend Car', 'Work Vehicle', 'Family Car', 'Sports Car',
      'Classic', 'Project Car', 'Off-Road', 'Track Car', 'Show Car',
      'Winter Car', 'Summer Car', 'Backup Vehicle', 'Fleet Vehicle',
    ];
  }
}
