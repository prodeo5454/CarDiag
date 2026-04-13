import { MaintenanceTracker } from './obd/maintenance-tracker';
import { VehicleManager } from './vehicle-manager';

export interface TrendData {
  period: string;
  value: number;
  label?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsData {
  vehicleId?: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  maintenanceTrends: {
    costs: TrendData[];
    frequency: TrendData[];
    categories: TrendData[];
  };
  healthTrends: {
    scores: TrendData[];
    issues: TrendData[];
    dtcFrequency: TrendData[];
  };
  usageTrends: {
    mileage: TrendData[];
    diagnostics: TrendData[];
    connections: TrendData[];
  };
  costAnalysis: {
    totalCost: number;
    averageCostPerMonth: number;
    costByCategory: Record<string, number>;
    costTrend: TrendData[];
    projectedAnnualCost: number;
  };
  predictions: {
    nextServiceDate: Date;
    nextServiceCost: number;
    projectedMileage: number;
    riskFactors: Array<{
      factor: string;
      risk: 'low' | 'medium' | 'high';
      description: string;
    }>;
  };
}

export class Analytics {
  // Generate comprehensive analytics for a vehicle or fleet
  static generateAnalytics(vehicleId?: string, months: number = 12): AnalyticsData {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - months * 30 * 24 * 60 * 60 * 1000);

    const maintenanceHistory = vehicleId 
      ? MaintenanceTracker.getMaintenanceHistory(vehicleId)
      : MaintenanceTracker.getMaintenanceHistory();
    
    const diagnosticReports = this.getDiagnosticReports(vehicleId);
    const vehicles = vehicleId 
      ? [VehicleManager.getVehicle(vehicleId)].filter(Boolean)
      : VehicleManager.getVehicles();

    return {
      vehicleId,
      dateRange: { start: startDate, end: endDate },
      maintenanceTrends: this.calculateMaintenanceTrends(maintenanceHistory, startDate, endDate),
      healthTrends: this.calculateHealthTrends(diagnosticReports, startDate, endDate),
      usageTrends: this.calculateUsageTrends(vehicles, diagnosticReports, startDate, endDate),
      costAnalysis: this.calculateCostAnalysis(maintenanceHistory, startDate, endDate),
      predictions: this.generatePredictions(vehicles[0], maintenanceHistory, diagnosticReports)
    };
  }

  // Maintenance trends
  private static calculateMaintenanceTrends(
    history: any[], 
    startDate: Date, 
    endDate: Date
  ) {
    const filteredHistory = history.filter(record => 
      new Date(record.timestamp) >= startDate && new Date(record.timestamp) <= endDate
    );

    // Group by month
    const monthlyData: Record<string, { count: number; cost: number; categories: Record<string, number> }> = {};
    
    filteredHistory.forEach(record => {
      const month = new Date(record.timestamp).toISOString().substring(0, 7);
      if (!monthlyData[month]) {
        monthlyData[month] = { count: 0, cost: 0, categories: {} };
      }
      
      monthlyData[month].count++;
      monthlyData[month].cost += record.cost?.total || 0;
      
      const category = record.category || 'other';
      monthlyData[month].categories[category] = (monthlyData[month].categories[category] || 0) + 1;
    });

    return {
      costs: Object.entries(monthlyData).map(([month, data]) => ({
        period: month,
        value: data.cost,
        label: `$${data.cost.toFixed(0)}`
      })),
      frequency: Object.entries(monthlyData).map(([month, data]) => ({
        period: month,
        value: data.count,
        label: `${data.count} services`
      })),
      categories: this.aggregateCategories(monthlyData)
    };
  }

  private static aggregateCategories(monthlyData: Record<string, any>): TrendData[] {
    const categoryTotals: Record<string, number> = {};
    
    Object.values(monthlyData).forEach(data => {
      Object.entries(data.categories).forEach(([category, count]) => {
        categoryTotals[category] = (categoryTotals[category] || 0) + (count as number);
      });
    });

    return Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([category, count]) => ({
        period: category,
        value: count,
        label: `${count} services`
      }));
  }

  // Health trends
  private static calculateHealthTrends(
    reports: any[], 
    startDate: Date, 
    endDate: Date
  ) {
    const filteredReports = reports.filter(report => 
      new Date(report.timestamp) >= startDate && new Date(report.timestamp) <= endDate
    );

    // Health scores over time
    const scores = filteredReports.map(report => ({
      period: new Date(report.timestamp).toISOString().substring(0, 7),
      value: report.healthScore,
      metadata: { timestamp: report.timestamp }
    }));

    // Issues frequency
    const issueCounts: Record<string, number> = {};
    filteredReports.forEach(report => {
      const totalCodes = report.codesStored.length + report.codesPending.length + report.codesPermanent.length;
      if (totalCodes > 0) {
        const month = new Date(report.timestamp).toISOString().substring(0, 7);
        issueCounts[month] = (issueCounts[month] || 0) + totalCodes;
      }
    });

    const issues = Object.entries(issueCounts).map(([month, count]) => ({
      period: month,
      value: count,
      label: `${count} codes`
    }));

    // DTC frequency analysis
    const dtcCounts: Record<string, number> = {};
    filteredReports.forEach(report => {
      [...report.codesStored, ...report.codesPending, ...report.codesPermanent].forEach((code: string) => {
        dtcCounts[code] = (dtcCounts[code] || 0) + 1;
      });
    });

    const dtcFrequency = Object.entries(dtcCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({
        period: code,
        value: count,
        label: `${count} occurrences`
      }));

    return {
      scores,
      issues,
      dtcFrequency
    };
  }

  // Usage trends
  private static calculateUsageTrends(
    vehicles: any[], 
    reports: any[], 
    startDate: Date, 
    endDate: Date
  ) {
    // Mileage trends (if available)
    const mileageData: Record<string, number> = {};
    vehicles.forEach(vehicle => {
      if (vehicle.currentMileage && vehicle.purchaseMileage && vehicle.purchaseDate) {
        const monthsSincePurchase = Math.floor(
          (new Date().getTime() - new Date(vehicle.purchaseDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
        );
        
        if (monthsSincePurchase > 0) {
          const avgMonthlyMileage = (vehicle.currentMileage - vehicle.purchaseMileage) / monthsSincePurchase;
          for (let i = 0; i < Math.min(monthsSincePurchase, 12); i++) {
            const monthDate = new Date(vehicle.purchaseDate);
            monthDate.setMonth(monthDate.getMonth() + i);
            const monthKey = monthDate.toISOString().substring(0, 7);
            mileageData[monthKey] = (mileageData[monthKey] || 0) + avgMonthlyMileage;
          }
        }
      }
    });

    const mileage = Object.entries(mileageData).map(([month, miles]) => ({
      period: month,
      value: Math.round(miles),
      label: `${Math.round(miles)} mi`
    }));

    // Diagnostic frequency
    const diagnosticCounts: Record<string, number> = {};
    reports.forEach(report => {
      const month = new Date(report.timestamp).toISOString().substring(0, 7);
      diagnosticCounts[month] = (diagnosticCounts[month] || 0) + 1;
    });

    const diagnostics = Object.entries(diagnosticCounts).map(([month, count]) => ({
      period: month,
      value: count,
      label: `${count} scans`
    }));

    // Connection trends (placeholder - would need actual connection data)
    const connections: TrendData[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthDate.toISOString().substring(0, 7);
      connections.push({
        period: monthKey,
        value: Math.floor(Math.random() * 20) + 5, // Placeholder data
        label: 'connections'
      });
    }

    return {
      mileage,
      diagnostics,
      connections
    };
  }

  // Cost analysis
  private static calculateCostAnalysis(
    history: any[], 
    startDate: Date, 
    endDate: Date
  ) {
    const filteredHistory = history.filter(record => 
      new Date(record.timestamp) >= startDate && new Date(record.timestamp) <= endDate
    );

    const totalCost = filteredHistory.reduce((sum, record) => sum + (record.cost?.total || 0), 0);
    const months = (endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000);
    const averageCostPerMonth = totalCost / Math.max(months, 1);

    // Cost by category
    const costByCategory: Record<string, number> = {};
    filteredHistory.forEach(record => {
      const category = record.category || 'other';
      costByCategory[category] = (costByCategory[category] || 0) + (record.cost?.total || 0);
    });

    // Cost trend over time
    const monthlyCosts: Record<string, number> = {};
    filteredHistory.forEach(record => {
      const month = new Date(record.timestamp).toISOString().substring(0, 7);
      monthlyCosts[month] = (monthlyCosts[month] || 0) + (record.cost?.total || 0);
    });

    const costTrend = Object.entries(monthlyCosts).map(([month, cost]) => ({
      period: month,
      value: cost,
      label: `$${cost.toFixed(0)}`
    }));

    // Projected annual cost
    const projectedAnnualCost = averageCostPerMonth * 12;

    return {
      totalCost,
      averageCostPerMonth,
      costByCategory,
      costTrend,
      projectedAnnualCost
    };
  }

  // Predictions
  private static generatePredictions(
    vehicle: any, 
    history: any[], 
    reports: any[]
  ) {
    if (!vehicle) {
      return {
        nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextServiceCost: 150,
        projectedMileage: 0,
        riskFactors: []
      };
    }

    // Calculate average service interval
    const serviceIntervals = history
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(1)
      .map((record, index, array) => {
        const prevRecord = array[index - 1];
        if (prevRecord) {
          return new Date(record.timestamp).getTime() - new Date(prevRecord.timestamp).getTime();
        }
        return 0;
      })
      .filter(interval => interval > 0);

    const avgServiceInterval = serviceIntervals.length > 0 
      ? serviceIntervals.reduce((sum, interval) => sum + interval, 0) / serviceIntervals.length 
      : 90 * 24 * 60 * 60 * 1000; // Default 90 days

    // Calculate average service cost
    const avgServiceCost = history.length > 0
      ? history.reduce((sum, record) => sum + (record.cost?.total || 0), 0) / history.length
      : 150;

    // Calculate mileage trend
    const mileageGrowthRate = this.calculateMileageGrowthRate(vehicle, history);

    // Predict next service date
    const lastService = history.length > 0 
      ? new Date(history[0].timestamp)
      : new Date(Date.now() - avgServiceInterval);
    
    const nextServiceDate = new Date(lastService.getTime() + avgServiceInterval);

    // Predict next service cost
    const nextServiceCost = avgServiceCost * (1 + (inflationRate / 12) * (avgServiceInterval / (30 * 24 * 60 * 60 * 1000)));

    // Project mileage
    const projectedMileage = vehicle.currentMileage + (mileageGrowthRate * 12);

    // Risk factors
    const riskFactors = this.calculateRiskFactors(vehicle, history, reports);

    return {
      nextServiceDate,
      nextServiceCost,
      projectedMileage,
      riskFactors
    };
  }

  private static calculateMileageGrowthRate(vehicle: any, history: any[]): number {
    if (!vehicle.currentMileage || !vehicle.purchaseMileage || !vehicle.purchaseDate) {
      return 1000; // Default 1000 miles per month
    }

    const monthsOwned = Math.floor(
      (Date.now() - new Date(vehicle.purchaseDate).getTime()) / (30 * 24 * 60 * 60 * 1000)
    );

    return monthsOwned > 0 
      ? (vehicle.currentMileage - vehicle.purchaseMileage) / monthsOwned
      : 1000;
  }

  private static calculateRiskFactors(
    vehicle: any, 
    history: any[], 
    reports: any[]
  ): Array<{ factor: string; risk: 'low' | 'medium' | 'high'; description: string }> {
    const riskFactors: Array<{ factor: string; risk: 'low' | 'medium' | 'high'; description: string }> = [];

    // Age-based risk
    const vehicleAge = new Date().getFullYear() - vehicle.year;
    if (vehicleAge > 10) {
      riskFactors.push({
        factor: 'Vehicle Age',
        risk: 'high',
        description: `Vehicle is ${vehicleAge} years old - increased maintenance likelihood`
      });
    } else if (vehicleAge > 5) {
      riskFactors.push({
        factor: 'Vehicle Age',
        risk: 'medium',
        description: `Vehicle is ${vehicleAge} years old - monitor components closely`
      });
    }

    // Mileage-based risk
    if (vehicle.currentMileage > 150000) {
      riskFactors.push({
        factor: 'High Mileage',
        risk: 'high',
        description: `${vehicle.currentMileage.toLocaleString()} miles - major components may need replacement`
      });
    } else if (vehicle.currentMileage > 100000) {
      riskFactors.push({
        factor: 'Mileage',
        risk: 'medium',
        description: `${vehicle.currentMileage.toLocaleString()} miles - increased wear on components`
      });
    }

    // Recent issues
    const recentReports = reports.filter(report => 
      Date.now() - new Date(report.timestamp).getTime() < 90 * 24 * 60 * 60 * 1000
    );

    const recentIssues = recentReports.reduce((sum, report) => 
      sum + report.codesStored.length + report.codesPending.length + report.codesPermanent.length, 0
    );

    if (recentIssues > 5) {
      riskFactors.push({
        factor: 'Recent Issues',
        risk: 'high',
        description: `${recentIssues} trouble codes in last 3 months - immediate attention required`
      });
    } else if (recentIssues > 0) {
      riskFactors.push({
        factor: 'Recent Issues',
        risk: 'medium',
        description: `${recentIssues} trouble codes in last 3 months - monitor closely`
      });
    }

    // Service frequency
    const recentServices = history.filter(record => 
      Date.now() - new Date(record.timestamp).getTime() < 180 * 24 * 60 * 60 * 1000
    ).length;

    if (recentServices > 3) {
      riskFactors.push({
        factor: 'Service Frequency',
        risk: 'medium',
        description: `${recentServices} services in last 6 months - may indicate underlying issues`
      });
    }

    // Cost trend
    const recentCosts = history
      .filter(record => Date.now() - new Date(record.timestamp).getTime() < 180 * 24 * 60 * 60 * 1000)
      .reduce((sum, record) => sum + (record.cost?.total || 0), 0);

    if (recentCosts > 1000) {
      riskFactors.push({
        factor: 'Cost Trend',
        risk: 'medium',
        description: `$${recentCosts.toFixed(0)} in maintenance costs last 6 months - budget impact`
      });
    }

    return riskFactors;
  }

  // Helper methods
  private static getDiagnosticReports(vehicleId?: string): any[] {
    try {
      const reportsData = localStorage.getItem('cardiag-scan-reports');
      if (!reportsData) return [];

      const reports = JSON.parse(reportsData);
      return vehicleId 
        ? reports.filter((report: any) => report.vin === vehicleId)
        : reports;
    } catch (error) {
      console.error('Error loading diagnostic reports:', error);
      return [];
    }
  }

  // Fleet analytics
  static generateFleetAnalytics(): AnalyticsData {
    const vehicles = VehicleManager.getVehicles();
    const allHistory = MaintenanceTracker.getMaintenanceHistory();
    const allReports = this.getDiagnosticReports();

    // Aggregate data across all vehicles
    const fleetAnalytics = this.generateAnalytics(undefined, 12);
    
    // Add fleet-specific metrics
    fleetAnalytics.predictions = {
      nextServiceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      nextServiceCost: vehicles.length * 150,
      projectedMileage: vehicles.reduce((sum, v) => sum + v.currentMileage, 0),
      riskFactors: this.calculateFleetRiskFactors(vehicles, allHistory, allReports)
    };

    return fleetAnalytics;
  }

  private static calculateFleetRiskFactors(
    vehicles: any[], 
    history: any[], 
    reports: any[]
  ): Array<{ factor: string; risk: 'low' | 'medium' | 'high'; description: string }> {
    const riskFactors: Array<{ factor: string; risk: 'low' | 'medium' | 'high'; description: string }> = [];

    // Fleet age distribution
    const avgAge = vehicles.reduce((sum, v) => sum + (new Date().getFullYear() - v.year), 0) / vehicles.length;
    if (avgAge > 8) {
      riskFactors.push({
        factor: 'Fleet Age',
        risk: 'high',
        description: `Average fleet age is ${avgAge.toFixed(1)} years - consider replacement planning`
      });
    }

    // Total maintenance cost
    const totalCost = history.reduce((sum, record) => sum + (record.cost?.total || 0), 0);
    const avgCostPerVehicle = totalCost / vehicles.length;
    
    if (avgCostPerVehicle > 500) {
      riskFactors.push({
        factor: 'Maintenance Costs',
        risk: 'medium',
        description: `Average $${avgCostPerVehicle.toFixed(0)} per vehicle - review maintenance strategy`
      });
    }

    // Vehicle downtime
    const issuesPerVehicle = reports.reduce((sum, report) => 
      sum + report.codesStored.length + report.codesPending.length + report.codesPermanent.length, 0
    ) / vehicles.length;

    if (issuesPerVehicle > 2) {
      riskFactors.push({
        factor: 'Vehicle Downtime',
        risk: 'high',
        description: `${issuesPerVehicle.toFixed(1)} issues per vehicle - high maintenance burden`
      });
    }

    return riskFactors;
  }
}

// Constants for calculations
const inflationRate = 0.03; // 3% annual inflation rate
