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
    const loadedVehicles = VehicleManager.getVehicles();
    setVehicles(loadedVehicles);
    
    const active = VehicleManager.getActiveVehicle();
    setActiveVehicle(active);
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Vehicle Profiles</h1>
          <p className="text-surface-400 text-sm mt-1">Manage your vehicles - {vehicles.length} vehicles registered</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowStats(!showStats)} className="btn-secondary flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4" /> {showStats ? 'Hide' : 'Show'} Stats
          </button>
          <button onClick={exportVehicles} className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <label className="btn-secondary flex items-center gap-2 text-sm cursor-pointer">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".json" onChange={importVehicles} className="hidden" />
          </label>
          {!isConnected && (
            <Link href="/connection" className="btn-primary flex items-center gap-2 text-sm">
              <Plug className="w-4 h-4" /> Connect Adapter
            </Link>
          )}
          <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Fleet Statistics */}
      {showStats && vehicles.length > 0 && (
        <div className="glass-card p-6">
          <h2 className="section-title mb-4">Fleet Overview</h2>
          <div className="grid grid-cols-4 gap-4">
            <div className="stat-card">
              <span className="text-surface-400 text-sm">Total Vehicles</span>
              <span className="text-3xl font-bold text-white">{vehicles.length}</span>
              <span className="text-xs text-surface-400">In fleet</span>
            </div>
            <div className="stat-card">
              <span className="text-surface-400 text-sm">Total Mileage</span>
              <span className="text-3xl font-bold text-brand-400">
                {vehicles.reduce((sum, v) => sum + v.currentMileage, 0).toLocaleString()}
              </span>
              <span className="text-xs text-surface-400">Combined miles</span>
            </div>
            <div className="stat-card">
              <span className="text-surface-400 text-sm">Average Age</span>
              <span className="text-3xl font-bold text-success">
                {vehicles.length > 0 ? Math.round(vehicles.reduce((sum, v) => sum + (new Date().getFullYear() - v.year), 0) / vehicles.length) : 0}
              </span>
              <span className="text-xs text-surface-400">Years old</span>
            </div>
            <div className="stat-card">
              <span className="text-surface-400 text-sm">Active Vehicle</span>
              <span className="text-3xl font-bold text-warning">{activeVehicle?.name || 'None'}</span>
              <span className="text-xs text-surface-400">Currently selected</span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vehicles..."
              className="input-field w-full pl-10 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterStatus(value as typeof filterStatus)}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
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
        <div className="glass-card p-5 border-l-4 border-l-brand-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand-400" />
              <h3 className="text-lg font-bold text-white">Current Vehicle (ECU)</h3>
            </div>
            <span className="badge badge-success text-xs">Connected</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-surface-500 mb-1">VIN</p>
              <p className="text-sm text-surface-300 font-mono">{currentVehicle.vin}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Protocol</p>
              <p className="text-sm text-surface-300">{connectionState.protocol || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">ECU Addresses</p>
              <p className="text-sm text-surface-300 font-mono">{connectionState.ecuAddresses.join(', ') || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Supported PIDs</p>
              <p className="text-sm text-surface-300">{connectionState.supportedPIDs.length}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn-secondary text-xs">Edit Profile</button>
            <button className="btn-secondary text-xs">Save as Profile</button>
          </div>
        </div>
      )}

      {/* Add Vehicle Form */}
      {showAddForm && (
        <div className="glass-card p-6 animate-scale-in">
          <h2 className="section-title mb-4">Add New Vehicle</h2>
          <div className="grid grid-cols-12 gap-6">
            {/* Make Selector */}
            <div className="col-span-4">
              <label className="text-xs text-surface-400 uppercase tracking-wider font-medium mb-2 block">Make</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  value={searchMake}
                  onChange={(e) => { setSearchMake(e.target.value); setSelectedMake(''); setSelectedModel(''); }}
                  placeholder="Search make..."
                  className="input-field w-full pl-10 text-sm"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {filteredMakes.map(make => {
                  const info = vehicleMakes.find(m => m.name === make);
                  return (
                    <button
                      key={make}
                      onClick={() => { setSelectedMake(make); setSelectedModel(''); setSelectedYear(''); setSearchMake(''); }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between transition-all',
                        selectedMake === make ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20' : 'text-surface-300 hover:bg-surface-800/50'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-surface-500" />
                        {make}
                      </span>
                      {info && <span className="text-[10px] text-surface-500 flex items-center gap-1"><Globe className="w-3 h-3" />{info.country}</span>}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-surface-500 mt-2">{allMakes.length} manufacturers supported</p>
            </div>

            {/* Model + Year + Details */}
            <div className="col-span-8">
              {selectedMake && (
                <div className="animate-fade-in">
                  <div className="flex items-center gap-2 mb-4 text-sm text-surface-300">
                    <span className="text-brand-400 font-medium">{selectedMake}</span>
                    {makeInfo && <span className="text-xs text-surface-500">({makeInfo.country})</span>}
                    {selectedModel && <><ChevronRight className="w-3 h-3 text-surface-500" /><span className="text-brand-400 font-medium">{selectedModel}</span></>}
                    {selectedYear && <><ChevronRight className="w-3 h-3 text-surface-500" /><span className="text-brand-400 font-medium">{selectedYear}</span></>}
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-surface-400 uppercase tracking-wider font-medium mb-2 block">Model</label>
                      <select
                        value={selectedModel}
                        onChange={(e) => { setSelectedModel(e.target.value); setSelectedYear(''); }}
                        className="select-field w-full text-sm"
                      >
                        <option value="">Select Model</option>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-surface-400 uppercase tracking-wider font-medium mb-2 block">Year</label>
                      <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="select-field w-full text-sm" disabled={!selectedModel}>
                        <option value="">Select Year</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-surface-400 uppercase tracking-wider font-medium mb-2 block">Engine</label>
                      <select className="select-field w-full text-sm" disabled={!selectedModel}>
                        <option value="">Select Engine</option>
                        {engines.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="text-xs text-surface-400 uppercase tracking-wider font-medium mb-2 block">Transmission</label>
                      <select className="select-field w-full text-sm" disabled={!selectedModel}>
                        <option value="">Select Transmission</option>
                        {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-surface-400 uppercase tracking-wider font-medium mb-2 block">VIN (Optional)</label>
                      <input type="text" placeholder="Enter VIN..." className="input-field w-full text-sm" maxLength={17} />
                    </div>
                    <div>
                      <label className="text-xs text-surface-400 uppercase tracking-wider font-medium mb-2 block">Mileage</label>
                      <input type="number" placeholder="Current mileage..." className="input-field w-full text-sm" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button onClick={() => setShowAddForm(false)} className="btn-secondary text-sm">Cancel</button>
                    <button className="btn-primary text-sm">Save Vehicle</button>
                  </div>
                </div>
              )}
              {!selectedMake && (
                <div className="flex items-center justify-center h-full text-surface-500 text-sm">
                  <div className="text-center">
                    <Car className="w-10 h-10 mx-auto mb-2 text-surface-600" />
                    <p>Select a make from the list to begin</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Vehicle List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Current Vehicle from ECU */}
        {currentVehicle && (
          <div className="glass-card-hover p-5 border-l-4 border-l-brand-500">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{currentVehicle.year} {currentVehicle.make} {currentVehicle.model}</h3>
                  <span className="text-xs text-surface-400">{currentVehicle.name}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className="badge badge-success text-xs">Connected</span>
              </div>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-surface-500">VIN</span><span className="text-surface-300 font-mono text-xs">{currentVehicle.vin}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">Protocol</span><span className="text-surface-300">{connectionState.protocol || 'Unknown'}</span></div>
              <div className="flex justify-between"><span className="text-surface-500">ECU Addresses</span><span className="text-surface-300 font-mono text-xs">{connectionState.ecuAddresses.join(', ') || 'Unknown'}</span></div>
            </div>
            <div className="flex gap-2 mt-4">
              <button className="btn-secondary flex-1 text-xs">Save as Profile</button>
            </div>
          </div>
        )}

        {/* Saved Vehicles */}
        {filteredVehicles.map(vehicle => {
          const isActive = activeVehicle?.id === vehicle.id;
          const stats = VehicleManager.getVehicleStats(vehicle.id);
          
          return (
            <div key={vehicle.id} className={cn('glass-card-hover p-5', isActive && 'border-l-4 border-l-brand-500')}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', 
                    isActive ? 'bg-brand-500/10' : 'bg-surface-800/50')}>
                    <Car className={cn('w-5 h-5', isActive ? 'text-brand-400' : 'text-surface-400')} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                    <span className="text-xs text-surface-400">{vehicle.name}</span>
                    {vehicle.isPrimary && <Star className="w-3 h-3 text-warning inline ml-1" />}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {isActive && <span className="badge badge-success text-xs">Active</span>}
                  <button className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-white transition-all">
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-1.5 text-sm">
                {vehicle.vin && <div className="flex justify-between"><span className="text-surface-500">VIN</span><span className="text-surface-300 font-mono text-xs">{vehicle.vin}</span></div>}
                {vehicle.engine && <div className="flex justify-between"><span className="text-surface-500">Engine</span><span className="text-surface-300">{vehicle.engine}</span></div>}
                {vehicle.transmission && <div className="flex justify-between"><span className="text-surface-500">Trans</span><span className="text-surface-300">{vehicle.transmission}</span></div>}
                <div className="flex justify-between"><span className="text-surface-500">Mileage</span><span className="text-surface-300">{vehicle.currentMileage.toLocaleString()} mi</span></div>
                <div className="flex justify-between"><span className="text-surface-500">Fuel</span><span className="text-surface-300 capitalize">{vehicle.fuelType}</span></div>
                {vehicle.licensePlate && <div className="flex justify-between"><span className="text-surface-500">Plate</span><span className="text-surface-300">{vehicle.licensePlate}</span></div>}
              </div>

              {/* Vehicle Stats */}
              <div className="mt-3 pt-3 border-t border-surface-700/50">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-surface-400">Services</p>
                    <p className="text-white font-bold">{stats.totalServices}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-surface-400">Total Cost</p>
                    <p className="text-white font-bold">${stats.totalCost.toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-surface-400">Health</p>
                    <p className={cn('font-bold', stats.totalServices === 0 ? 'text-success' : 'text-warning')}>
                      {stats.totalServices === 0 ? 'Good' : 'Check'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                {!isActive && (
                  <button 
                    onClick={() => setAsActive(vehicle.id)}
                    className="btn-primary flex-1 text-xs"
                  >
                    Set Active
                  </button>
                )}
                <button className="btn-secondary flex-1 text-xs">View Details</button>
                <button 
                  onClick={() => deleteVehicle(vehicle.id)}
                  className="btn-secondary text-xs p-2"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
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
