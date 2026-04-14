'use client';

import { useState, useEffect } from 'react';
import { Car, Plus, Search, Edit3, Trash2, ChevronRight, Globe, MapPin, Plug, CheckCircle2, Star, Settings, Download, Upload, Filter, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useOBD } from '@/lib/obd/OBDContext';
import { vehicleMakes, getAllMakeNames, getModelsByMake, getYearsByMakeModel, getEnginesByMakeModel, getTransmissionsByMakeModel } from '@/lib/vehicle-database';
import { VehicleManager, type Vehicle as VehicleType } from '@/lib/vehicle-manager';
import { MaintenanceTracker } from '@/lib/obd/maintenance-tracker';

export default function VehiclesPage() {
  const { connectionState } = useOBD();
  const isConnected = connectionState.status === 'connected';

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchMake, setSearchMake] = useState('');
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [activeVehicle, setActiveVehicle] = useState<VehicleType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showStats, setShowStats] = useState(false);

  // Load vehicles from storage
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const loadedVehicles = VehicleManager.getVehicles();
      setVehicles(loadedVehicles);
      
      const active = VehicleManager.getActiveVehicle();
      setActiveVehicle(active);
    }
  }, []);

  // Build current vehicle from real ECU data if connected
  const currentVehicle: VehicleType | null = isConnected && connectionState.vin ? {
    id: 'current',
    name: 'Current Vehicle',
    make: 'Unknown',
    model: 'Unknown',
    year: new Date().getFullYear(),
    vin: connectionState.vin,
    engine: 'Unknown',
    transmission: 'Unknown',
    odometer: 0,
    currentMileage: 0,
    fuelType: 'gasoline' as const,
    isPrimary: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  } : null;

  // Form state for new vehicle
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    vin: '',
    engine: '',
    transmission: '',
    fuelType: 'gasoline' as const,
    odometer: 0,
    currentMileage: 0,
    licensePlate: '',
    color: '',
    notes: '',
    tags: [] as string[],
    isPrimary: false,
  });

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = vehicle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vehicle.vin.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'active' && activeVehicle?.id === vehicle.id) ||
                         (filterStatus === 'inactive' && activeVehicle?.id !== vehicle.id);

    return matchesSearch && matchesFilter;
  });

  // Vehicle operations
  const saveVehicle = () => {
    const validation = VehicleManager.validateVehicle(newVehicle);
    if (!validation.isValid) {
      alert('Please fix the following errors:\n' + validation.errors.join('\n'));
      return;
    }

    const vehicle = VehicleManager.createVehicle(newVehicle);
    setVehicles([...vehicles, vehicle]);
    
    if (vehicle.isPrimary || vehicles.length === 0) {
      setActiveVehicle(vehicle);
      VehicleManager.setActiveVehicle(vehicle.id);
    }

    // Reset form
    setNewVehicle({
      name: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      vin: '',
      engine: '',
      transmission: '',
      fuelType: 'gasoline',
      odometer: 0,
      currentMileage: 0,
      licensePlate: '',
      color: '',
      notes: '',
      tags: [],
      isPrimary: false,
    });
    setShowAddForm(false);
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear('');
  };

  const deleteVehicle = (id: string) => {
    if (confirm('Are you sure you want to delete this vehicle? All associated data will be removed.')) {
      VehicleManager.deleteVehicle(id);
      setVehicles(vehicles.filter(v => v.id !== id));
      if (activeVehicle?.id === id) {
        setActiveVehicle(VehicleManager.getActiveVehicle());
      }
    }
  };

  const setAsActive = (id: string) => {
    VehicleManager.setActiveVehicle(id);
    setActiveVehicle(VehicleManager.getVehicle(id));
  };

  const exportVehicles = () => {
    const data = VehicleManager.exportVehicles();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicles-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importVehicles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          const result = VehicleManager.importVehicles(data);
          setVehicles(VehicleManager.getVehicles());
          alert(`Imported ${result.imported} vehicles. ${result.duplicates} duplicates skipped.`);
        } catch (error) {
          alert('Failed to import vehicles. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const allMakes = getAllMakeNames();
  const filteredMakes = searchMake ? allMakes.filter(m => m.toLowerCase().includes(searchMake.toLowerCase())) : allMakes;
  const models = selectedMake ? getModelsByMake(selectedMake) : [];
  const years = selectedMake && selectedModel ? getYearsByMakeModel(selectedMake, selectedModel) : [];
  const engines = selectedMake && selectedModel ? getEnginesByMakeModel(selectedMake, selectedModel) : [];
  const transmissions = selectedMake && selectedModel ? getTransmissionsByMakeModel(selectedMake, selectedModel) : [];

  const makeInfo = vehicleMakes.find(m => m.name === selectedMake);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Vehicle Profiles</h1>
          <p className="text-surface-400 text-xs sm:text-sm mt-1">{vehicles.length} vehicles registered</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => setShowStats(!showStats)} className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 h-4" /> <span className="hidden xs:inline">{showStats ? 'Hide' : 'Show'} Stats</span>
          </button>
          <button onClick={exportVehicles} className="btn-secondary flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
            <Download className="w-3.5 h-3.5 sm:w-4 h-4" /> <span className="hidden xs:inline">Export</span>
          </button>
          {!isConnected && (
            <Link href="/connection" className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
              <Plug className="w-3.5 h-3.5 sm:w-4 h-4" /> Connect
            </Link>
          )}
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary flex items-center gap-2 text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2">
            <Plus className="w-3.5 h-3.5 sm:w-4 h-4" /> Add
          </button>
        </div>
      </div>

      {/* Fleet Statistics */}
      {showStats && vehicles.length > 0 && (
        <div className="glass-card p-4 sm:p-6">
          <h2 className="section-title mb-4">Fleet Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="stat-card p-3 sm:p-4">
              <span className="text-surface-400 text-[10px] sm:text-sm">Total Vehicles</span>
              <span className="text-xl sm:text-3xl font-bold text-white">{vehicles.length}</span>
            </div>
            <div className="stat-card p-3 sm:p-4">
              <span className="text-surface-400 text-[10px] sm:text-sm">Total Mileage</span>
              <span className="text-xl sm:text-3xl font-bold text-brand-400">
                {vehicles.reduce((sum, v) => sum + v.currentMileage, 0).toLocaleString()}
              </span>
            </div>
            <div className="stat-card p-3 sm:p-4">
              <span className="text-surface-400 text-[10px] sm:text-sm">Average Age</span>
              <span className="text-xl sm:text-3xl font-bold text-success">
                {vehicles.length > 0 ? Math.round(vehicles.reduce((sum, v) => sum + (new Date().getFullYear() - v.year), 0) / vehicles.length) : 0}
              </span>
            </div>
            <div className="stat-card p-3 sm:p-4">
              <span className="text-surface-400 text-[10px] sm:text-sm">Active Vehicle</span>
              <span className="text-sm sm:text-xl font-bold text-warning truncate block">{activeVehicle?.name || 'None'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="glass-card p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicles..."
              className="input-field w-full pl-9 sm:pl-10 text-xs sm:text-sm py-1.5 sm:py-2"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value as typeof filterStatus)}
                className={`px-3 py-1 sm:py-1.5 rounded-lg text-[10px] sm:text-xs transition-all whitespace-nowrap ${
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
      </div>

      {/* Current Vehicle from ECU */}
      {currentVehicle && (
        <div className="glass-card p-4 sm:p-5 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 h-5 text-brand-400" />
              <h3 className="text-sm sm:text-lg font-bold text-white uppercase tracking-tight">ECU Detected</h3>
            </div>
            <span className="badge badge-success text-[10px]">Connected</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[10px] text-surface-500 mb-0.5">VIN</p>
              <p className="text-xs text-surface-300 font-mono truncate">{currentVehicle.vin}</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-500 mb-0.5">Protocol</p>
              <p className="text-xs text-surface-300 truncate">{connectionState.protocol || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-500 mb-0.5">ECU Addr</p>
              <p className="text-xs text-surface-300 font-mono">{connectionState.ecuAddresses[0] || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-[10px] text-surface-500 mb-0.5">PIDs</p>
              <p className="text-xs text-surface-300">{connectionState.supportedPIDs.length} available</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-primary flex-1 text-[10px] py-1.5">Save Profile</button>
          </div>
        </div>
      )}

      {/* Add Vehicle Form */}
      {showAddForm && (
        <div className="glass-card p-4 sm:p-6 animate-scale-in">
          <h2 className="section-title mb-4">Add New Vehicle</h2>
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Make Selector */}
            <div className="w-full lg:w-1/3">
              <label className="text-[10px] text-surface-400 uppercase tracking-wider font-medium mb-2 block">Make</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-400" />
                <input
                  type="text"
                  value={searchMake}
                  onChange={(e) => { setSearchMake(e.target.value); setSelectedMake(''); setSelectedModel(''); }}
                  placeholder="Search make..."
                  className="input-field w-full pl-9 text-xs py-1.5"
                />
              </div>
              <div className="max-h-40 lg:max-h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {filteredMakes.map(make => {
                  const info = vehicleMakes.find(m => m.name === make);
                  return (
                    <button
                      key={make}
                      onClick={() => { setSelectedMake(make); setSelectedModel(''); setSelectedYear(''); setSearchMake(''); }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-all',
                        selectedMake === make ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20' : 'text-surface-300 hover:bg-surface-800/50'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Car className="w-3.5 h-3.5 text-surface-500" />
                        {make}
                      </span>
                      {info && <span className="text-[9px] text-surface-500">{info.country}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Model + Year + Details */}
            <div className="flex-1">
              {selectedMake ? (
                <div className="animate-fade-in space-y-4">
                  <div className="flex items-center gap-2 text-xs text-surface-300">
                    <span className="text-brand-400 font-bold">{selectedMake}</span>
                    {selectedModel && <><ChevronRight className="w-3 h-3 text-surface-500" /><span className="text-brand-400 font-bold">{selectedModel}</span></>}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="col-span-1">
                      <label className="text-[10px] text-surface-400 uppercase mb-1 block">Model</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => { setSelectedModel(e.target.value); setSelectedYear(''); }}
                        className="select-field w-full text-xs py-1.5"
                      >
                        <option value="">Model</option>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] text-surface-400 uppercase mb-1 block">Year</label>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="select-field w-full text-xs py-1.5" disabled={!selectedModel}>
                        <option value="">Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[10px] text-surface-400 uppercase mb-1 block">Engine</label>
                      <select className="select-field w-full text-xs py-1.5" disabled={!selectedModel}>
                        <option value="">Engine</option>
                        {engines.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] text-surface-400 uppercase mb-1 block">VIN</label>
                      <input type="text" placeholder="VIN..." className="input-field w-full text-xs py-1.5" maxLength={17} />
                    </div>
                    <div className="col-span-1">
                      <label className="text-[10px] text-surface-400 uppercase mb-1 block">Mileage</label>
                      <input type="number" placeholder="0" className="input-field w-full text-xs py-1.5" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowAddForm(false)} className="btn-secondary text-xs px-4 py-1.5">Cancel</button>
                    <button className="btn-primary text-xs px-4 py-1.5">Save Vehicle</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-surface-500">
                  <Car className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">Select a manufacturer to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {/* Saved Vehicles */}
        {filteredVehicles.map(vehicle => {
          const isActive = activeVehicle?.id === vehicle.id;
          const stats = VehicleManager.getVehicleStats(vehicle.id);
          
          return (
            <div key={vehicle.id} className={cn('glass-card-hover p-4 sm:p-5', isActive && 'border-l-4 border-l-brand-500')}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center',
                    isActive ? 'bg-brand-500/10' : 'bg-surface-800/50')}>
                    <Car className={cn('w-4 h-4 sm:w-5 h-5', isActive ? 'text-brand-400' : 'text-surface-400')} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-white truncate">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <p className="text-[10px] text-surface-500 truncate">{vehicle.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isActive && <span className="badge badge-success text-[10px] px-1.5 py-0">Active</span>}
                  <button className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400">
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] sm:text-xs">
                <div className="flex justify-between"><span className="text-surface-500">VIN</span><span className="text-surface-300 font-mono truncate ml-2">{vehicle.vin ? `...${vehicle.vin.slice(-6)}` : '--'}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Mileage</span><span className="text-surface-300">{vehicle.currentMileage.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Fuel</span><span className="text-surface-300 capitalize">{vehicle.fuelType}</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Plate</span><span className="text-surface-300">{vehicle.licensePlate || '--'}</span></div>
              </div>

              {/* Mini Stats Bar */}
              <div className="mt-4 pt-3 border-t border-surface-700/30">
                <div className="flex justify-between items-center px-1">
                  <div className="text-center">
                    <p className="text-[9px] text-surface-500 uppercase">Services</p>
                    <p className="text-xs font-bold text-white">{stats.totalServices}</p>
                  </div>
                  <div className="h-6 w-px bg-surface-700/50" />
                  <div className="text-center">
                    <p className="text-[9px] text-surface-500 uppercase">Total Cost</p>
                    <p className="text-xs font-bold text-white">${stats.totalCost.toFixed(0)}</p>
                  </div>
                  <div className="h-6 w-px bg-surface-700/50" />
                  <div className="text-center">
                    <p className="text-[9px] text-surface-500 uppercase">Health</p>
                    <p className={cn('text-xs font-bold', stats.totalServices === 0 ? 'text-success' : 'text-warning')}>
                      {stats.totalServices === 0 ? 'Good' : 'Check'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {!isActive ? (
                  <button 
                    onClick={() => setAsActive(vehicle.id)}
                    className="btn-primary flex-1 text-[10px] py-1.5"
                  >
                    Activate
                  </button>
                ) : (
                  <button className="btn-secondary flex-1 text-[10px] py-1.5">Manage</button>
                )}
                <button
                  onClick={() => deleteVehicle(vehicle.id)}
                  className="btn-secondary px-2 text-danger hover:bg-danger/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredVehicles.length === 0 && !currentVehicle && (
          <div className="col-span-full glass-card p-12 text-center">
            <Car className="w-12 h-12 text-surface-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-white mb-2">No Vehicle Profiles</h3>
            <p className="text-surface-400 text-sm max-w-md mx-auto mb-4">
              {searchQuery || filterStatus !== 'all' 
                ? 'No vehicles match your search criteria. Try adjusting your filters.'
                : 'Connect your OBD-II adapter to automatically detect your vehicle, or add a vehicle profile manually.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              {(searchQuery || filterStatus !== 'all') && (
                <button 
                  onClick={() => { setSearchQuery(''); setFilterStatus('all'); }}
                  className="btn-secondary inline-flex items-center gap-2 text-sm"
                >
                  <Filter className="w-4 h-4" /> Clear Filters
                </button>
              )}
              {!isConnected && !(searchQuery || filterStatus !== 'all') && (
                <Link href="/connection" className="btn-primary inline-flex items-center gap-2 text-sm">
                  <Plug className="w-4 h-4" /> Connect Adapter
                </Link>
              )}
              <button onClick={() => setShowAddForm(true)} className="btn-secondary inline-flex items-center gap-2 text-sm">
                <Plus className="w-4 h-4" /> Add Manually
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Supported Makes */}
      <div className="glass-card p-5">
        <h2 className="section-title mb-1">Supported Manufacturers</h2>
        <p className="section-subtitle mb-4">CarDiag supports {allMakes.length}+ manufacturers and thousands of models</p>
        <div className="flex flex-wrap gap-2">
          {allMakes.map(make => (
            <span key={make} className="px-3 py-1.5 rounded-lg bg-surface-800/50 border border-surface-700/30 text-xs text-surface-300 hover:text-white hover:border-brand-500/30 transition-all cursor-default">
              {make}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
