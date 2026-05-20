import { APP_VERSION } from './app-info';
import { MaintenanceTracker } from './obd/maintenance-tracker';
import { VehicleManager } from './vehicle-manager';
import { DiagnosticWorkflows } from './obd/diagnostic-workflows';
import { CostEstimator } from './obd/cost-estimator';

export interface ExportData {
  version: string;
  exportDate: string;
  appInfo: {
    name: string;
    version: string;
    platform: string;
  };
  vehicles: any[];
  maintenanceHistory: any[];
  maintenanceSchedules: any[];
  diagnosticReports: any[];
  userPreferences: any;
  appSettings: any;
  statistics: {
    totalVehicles: number;
    totalServices: number;
    totalCost: number;
    totalReports: number;
    exportSize: number;
  };
}

export interface ImportResult {
  success: boolean;
  imported: {
    vehicles: number;
    maintenanceRecords: number;
    schedules: number;
    reports: number;
  };
  duplicates: {
    vehicles: number;
    maintenanceRecords: number;
    schedules: number;
    reports: number;
  };
  errors: string[];
  warnings: string[];
}

export class DataManager {
  private static readonly SUPPORTED_VERSIONS = ['1.0.0', '2.0.0', '2.0.1', '2.0.2'];

  // Export Functions
  static exportAllData(): ExportData {
    const vehicles = VehicleManager.getVehicles();
    const maintenanceHistory = MaintenanceTracker.getMaintenanceHistory();
    const maintenanceSchedules = MaintenanceTracker.getMaintenanceSchedules();
    
    // Get diagnostic reports from localStorage
    let diagnosticReports: any[] = [];
    try {
      const reportsData = localStorage.getItem('cardiag-scan-reports');
      if (reportsData) {
        diagnosticReports = JSON.parse(reportsData);
      }
    } catch (error) {
      console.error('Error loading diagnostic reports:', error);
    }

    // Get user preferences
    let userPreferences: any = {};
    try {
      const prefsData = localStorage.getItem('cardiag-preferences');
      if (prefsData) {
        userPreferences = JSON.parse(prefsData);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }

    // Get app settings
    let appSettings: any = {};
    try {
      const settingsData = localStorage.getItem('cardiag-app-settings');
      if (settingsData) {
        appSettings = JSON.parse(settingsData);
      }
    } catch (error) {
      console.error('Error loading app settings:', error);
    }

    const exportData: ExportData = {
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      appInfo: {
        name: 'CarDiag Pro',
        version: APP_VERSION,
        platform: 'PWA'
      },
      vehicles,
      maintenanceHistory,
      maintenanceSchedules,
      diagnosticReports,
      userPreferences,
      appSettings,
      statistics: {
        totalVehicles: vehicles.length,
        totalServices: maintenanceHistory.length,
        totalCost: maintenanceHistory.reduce((sum, record) => sum + (record.cost?.total || 0), 0),
        totalReports: diagnosticReports.length,
        exportSize: 0 // Will be calculated after JSON.stringify
      }
    };

    // Calculate export size
    exportData.statistics.exportSize = JSON.stringify(exportData).length;

    return exportData;
  }

  static exportVehiclesOnly(): any {
    return {
      vehicles: VehicleManager.getVehicles(),
      exportDate: new Date().toISOString(),
      version: APP_VERSION
    };
  }

  static exportMaintenanceOnly(): any {
    return {
      maintenanceHistory: MaintenanceTracker.getMaintenanceHistory(),
      maintenanceSchedules: MaintenanceTracker.getMaintenanceSchedules(),
      exportDate: new Date().toISOString(),
      version: APP_VERSION
    };
  }

  static exportReportsOnly(): any {
    let reports: any[] = [];
    try {
      const reportsData = localStorage.getItem('cardiag-scan-reports');
      if (reportsData) {
        reports = JSON.parse(reportsData);
      }
    } catch (error) {
      console.error('Error loading diagnostic reports:', error);
    }

    return {
      diagnosticReports: reports,
      exportDate: new Date().toISOString(),
      version: APP_VERSION
    };
  }

  // Import Functions
  static importAllData(data: any): ImportResult {
    const result: ImportResult = {
      success: true,
      imported: { vehicles: 0, maintenanceRecords: 0, schedules: 0, reports: 0 },
      duplicates: { vehicles: 0, maintenanceRecords: 0, schedules: 0, reports: 0 },
      errors: [],
      warnings: []
    };

    try {
      // Validate data structure
      if (!this.validateImportData(data)) {
        result.success = false;
        result.errors.push('Invalid data format or version');
        return result;
      }

      // Import vehicles
      if (data.vehicles && Array.isArray(data.vehicles)) {
        const vehicleResult = VehicleManager.importVehicles({ vehicles: data.vehicles });
        result.imported.vehicles = vehicleResult.imported;
        result.duplicates.vehicles = vehicleResult.duplicates;
        result.errors.push(...vehicleResult.errors);
      }

      // Import maintenance history
      if (data.maintenanceHistory && Array.isArray(data.maintenanceHistory)) {
        const existingHistory = MaintenanceTracker.getMaintenanceHistory();
        const existingIds = new Set(existingHistory.map(r => r.id));
        
        let importedCount = 0;
        data.maintenanceHistory.forEach((record: any) => {
          if (!existingIds.has(record.id)) {
            existingHistory.push(record);
            importedCount++;
          }
        });
        
        result.imported.maintenanceRecords = importedCount;
        result.duplicates.maintenanceRecords = data.maintenanceHistory.length - importedCount;
        try {
          localStorage.setItem('cardiag-maintenance-history', JSON.stringify(existingHistory));
        } catch (error) {
          result.errors.push('Failed to save maintenance history');
        }
      }

      // Import maintenance schedules
      if (data.maintenanceSchedules && Array.isArray(data.maintenanceSchedules)) {
        const existingSchedules = MaintenanceTracker.getMaintenanceSchedules();
        const existingIds = new Set(existingSchedules.map(s => s.id));
        
        let importedCount = 0;
        data.maintenanceSchedules.forEach((schedule: any) => {
          if (!existingIds.has(schedule.id)) {
            existingSchedules.push(schedule);
            importedCount++;
          }
        });
        
        result.imported.schedules = importedCount;
        result.duplicates.schedules = data.maintenanceSchedules.length - importedCount;
        try {
          localStorage.setItem('cardiag-maintenance-schedules', JSON.stringify(existingSchedules));
        } catch (error) {
          result.errors.push('Failed to save maintenance schedules');
        }
      }

      // Import diagnostic reports
      if (data.diagnosticReports && Array.isArray(data.diagnosticReports)) {
        let existingReports: any[] = [];
        try {
          const reportsData = localStorage.getItem('cardiag-scan-reports');
          if (reportsData) {
            existingReports = JSON.parse(reportsData);
          }
        } catch (error) {
          console.error('Error loading existing reports:', error);
        }

        const existingIds = new Set(existingReports.map(r => r.id));
        let importedCount = 0;
        
        data.diagnosticReports.forEach((report: any) => {
          if (!existingIds.has(report.id)) {
            existingReports.push(report);
            importedCount++;
          }
        });
        
        result.imported.reports = importedCount;
        result.duplicates.reports = data.diagnosticReports.length - importedCount;
        
        try {
          localStorage.setItem('cardiag-scan-reports', JSON.stringify(existingReports));
        } catch (error) {
          result.errors.push('Failed to save diagnostic reports');
        }
      }

      // Import user preferences
      if (data.userPreferences && typeof data.userPreferences === 'object') {
        try {
          localStorage.setItem('cardiag-preferences', JSON.stringify(data.userPreferences));
          result.warnings.push('User preferences imported');
        } catch (error) {
          result.errors.push('Failed to import user preferences');
        }
      }

      // Import app settings
      if (data.appSettings && typeof data.appSettings === 'object') {
        try {
          localStorage.setItem('cardiag-app-settings', JSON.stringify(data.appSettings));
          result.warnings.push('App settings imported');
        } catch (error) {
          result.errors.push('Failed to import app settings');
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  static importVehiclesOnly(data: any): ImportResult {
    const result: ImportResult = {
      success: true,
      imported: { vehicles: 0, maintenanceRecords: 0, schedules: 0, reports: 0 },
      duplicates: { vehicles: 0, maintenanceRecords: 0, schedules: 0, reports: 0 },
      errors: [],
      warnings: []
    };

    try {
      if (data.vehicles && Array.isArray(data.vehicles)) {
        const vehicleResult = VehicleManager.importVehicles({ vehicles: data.vehicles });
        result.imported.vehicles = vehicleResult.imported;
        result.duplicates.vehicles = vehicleResult.duplicates;
        result.errors.push(...vehicleResult.errors);
      } else {
        result.errors.push('No vehicle data found');
        result.success = false;
      }
    } catch (error) {
      result.success = false;
      result.errors.push(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  // File Operations
  static downloadExport(data: any, filename: string): void {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async readImportFile(file: File): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Data Validation
  static validateImportData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Check version compatibility
    if (data.version && !this.SUPPORTED_VERSIONS.includes(data.version)) {
      console.warn(`Unsupported data version: ${data.version}`);
    }
    
    // Validate basic structure
    const hasValidVehicles = !data.vehicles || Array.isArray(data.vehicles);
    const hasValidMaintenance = !data.maintenanceHistory || Array.isArray(data.maintenanceHistory);
    const hasValidSchedules = !data.maintenanceSchedules || Array.isArray(data.maintenanceSchedules);
    const hasValidReports = !data.diagnosticReports || Array.isArray(data.diagnosticReports);
    
    return hasValidVehicles && hasValidMaintenance && hasValidSchedules && hasValidReports;
  }

  // Data Cleanup
  static cleanupOldData(): void {
    const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    const now = Date.now();
    
    // Clean old diagnostic reports
    try {
      const reportsData = localStorage.getItem('cardiag-scan-reports');
      if (reportsData) {
        const reports: any[] = JSON.parse(reportsData);
        const filteredReports = reports.filter(report => 
          (now - new Date(report.timestamp).getTime()) < maxAge
        );
        
        if (filteredReports.length < reports.length) {
          localStorage.setItem('cardiag-scan-reports', JSON.stringify(filteredReports));
          console.log(`Cleaned up ${reports.length - filteredReports.length} old diagnostic reports`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up diagnostic reports:', error);
    }

    // Clean old maintenance records
    try {
      const history = MaintenanceTracker.getMaintenanceHistory();
      const filteredHistory = history.filter(record => 
        (now - new Date(record.timestamp).getTime()) < maxAge
      );
      
      if (filteredHistory.length < history.length) {
        try {
          localStorage.setItem('cardiag-maintenance-history', JSON.stringify(filteredHistory));
          console.log(`Cleaned up ${history.length - filteredHistory.length} old maintenance records`);
        } catch (error) {
          console.error('Error cleaning up maintenance history:', error);
        }
      }
    } catch (error) {
      console.error('Error cleaning up maintenance history:', error);
    }
  }

  // Data Statistics
  static getDataStatistics(): {
    totalSize: number;
    vehicles: number;
    maintenanceRecords: number;
    schedules: number;
    reports: number;
    lastExport?: string;
    lastImport?: string;
  } {
    let totalSize = 0;
    
    // Calculate localStorage size
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }

    const vehicles = VehicleManager.getVehicles().length;
    const maintenanceRecords = MaintenanceTracker.getMaintenanceHistory().length;
    const schedules = MaintenanceTracker.getMaintenanceSchedules().length;
    
    let reports = 0;
    try {
      const reportsData = localStorage.getItem('cardiag-scan-reports');
      if (reportsData) {
        reports = JSON.parse(reportsData).length;
      }
    } catch (error) {
      console.error('Error counting reports:', error);
    }

    // Get last export/import dates
    let lastExport: string | undefined;
    let lastImport: string | undefined;
    
    try {
      const exportData = localStorage.getItem('cardiag-last-export');
      if (exportData) lastExport = exportData;
    } catch (error) {
      // Ignore
    }
    
    try {
      const importData = localStorage.getItem('cardiag-last-import');
      if (importData) lastImport = importData;
    } catch (error) {
      // Ignore
    }

    return {
      totalSize,
      vehicles,
      maintenanceRecords,
      schedules,
      reports,
      lastExport,
      lastImport
    };
  }

  // Backup and Restore
  static createBackup(): string {
    const backupData = this.exportAllData();
    const backupString = JSON.stringify(backupData);
    
    // Store backup timestamp
    localStorage.setItem('cardiag-last-backup', new Date().toISOString());
    
    return backupString;
  }

  static restoreFromBackup(backupString: string): ImportResult {
    try {
      const backupData = JSON.parse(backupString);
      const result = this.importAllData(backupData);
      
      if (result.success) {
        localStorage.setItem('cardiag-last-restore', new Date().toISOString());
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        imported: { vehicles: 0, maintenanceRecords: 0, schedules: 0, reports: 0 },
        duplicates: { vehicles: 0, maintenanceRecords: 0, schedules: 0, reports: 0 },
        errors: ['Invalid backup format'],
        warnings: []
      };
    }
  }

  // Auto-backup functionality
  static enableAutoBackup(intervalMinutes: number = 60): void {
    setInterval(() => {
      try {
        this.createBackup();
        console.log('Auto-backup completed');
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, intervalMinutes * 60 * 1000);
  }

  // Data migration
  static migrateData(fromVersion: string, toVersion: string): boolean {
    try {
      // Handle version-specific migrations
      if (fromVersion === '1.0.0' && toVersion === '2.0.0') {
        // Migration logic from v1.0.0 to v2.0.0
        return this.migrateFromV1ToV2();
      }
      
      return true;
    } catch (error) {
      console.error('Data migration failed:', error);
      return false;
    }
  }

  private static migrateFromV1ToV2(): boolean {
    try {
      // Example migration: update vehicle structure
      const vehicles = VehicleManager.getVehicles();
      const updatedVehicles = vehicles.map(vehicle => ({
        ...vehicle,
        // Add new fields or update existing ones
        tags: vehicle.tags || [],
        isPrimary: vehicle.isPrimary || false,
        createdAt: vehicle.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));

      // Save updated vehicles
      updatedVehicles.forEach(vehicle => {
        VehicleManager.updateVehicle(vehicle.id, vehicle);
      });

      return true;
    } catch (error) {
      console.error('Migration from v1.0.0 to v2.0.0 failed:', error);
      return false;
    }
  }
}
