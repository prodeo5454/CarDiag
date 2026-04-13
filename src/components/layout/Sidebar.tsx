'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Scan,
  Activity,
  Car,
  FileText,
  Wrench,
  Plug,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOBD } from '@/lib/obd/OBDContext';
import { PROTOCOL_NAMES } from '@/lib/obd/elm327';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & Health' },
  { href: '/diagnostics', icon: Scan, label: 'Diagnostics', description: 'DTC Scanner & Codes' },
  { href: '/live-data', icon: Activity, label: 'Live Data', description: 'Real-time Sensors' },
  { href: '/vehicles', icon: Car, label: 'Vehicles', description: 'Vehicle Profiles' },
  { href: '/reports', icon: FileText, label: 'Reports', description: 'Diagnostic Reports' },
  { href: '/maintenance', icon: Wrench, label: 'Maintenance', description: 'Service Scheduler' },
  { href: '/connection', icon: Plug, label: 'Connection', description: 'OBD-II Adapter' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { connectionState } = useOBD();
  const isConnected = connectionState.status === 'connected';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-surface-700/50 bg-surface-950/95 backdrop-blur-xl transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-surface-700/50 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0 glow-brand">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-base font-bold text-white tracking-tight">CarDiag</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-surface-500">
              <Shield className="w-3 h-3 text-brand-400" />
              <span>OBD-II</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2.5 space-y-1 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label, description }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800/50 border border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-brand-400' : 'text-surface-500 group-hover:text-white'
                )}
              />
              {!collapsed && (
                <div className="animate-fade-in min-w-0">
                  <span className="block text-sm font-medium truncate">{label}</span>
                  <span className={cn(
                    'block text-[11px] truncate',
                    isActive ? 'text-brand-400/70' : 'text-surface-500'
                  )}>{description}</span>
                </div>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-2.5 border-t border-surface-700/50 flex-shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800/50 transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
        {!collapsed && (
          <div className={cn('mt-2 px-3 py-2 rounded-xl border', isConnected ? 'bg-surface-800/50 border-success/20' : 'bg-surface-800/30 border-surface-700/30')}>
            <div className="flex items-center gap-2">
              <div className={cn('w-2 h-2 rounded-full', isConnected ? 'bg-success animate-pulse' : 'bg-surface-600')} />
              <span className="text-[11px] text-surface-400">{isConnected ? 'ECU Connected' : 'No Connection'}</span>
            </div>
            {isConnected && connectionState.protocol && (
              <p className="text-[10px] text-surface-500 mt-1">{PROTOCOL_NAMES[connectionState.protocol]}</p>
            )}
            {isConnected && connectionState.vin && (
              <p className="text-[10px] text-surface-500 font-mono">{connectionState.vin}</p>
            )}
            {!isConnected && (
              <p className="text-[10px] text-surface-500 mt-1">Go to Connection to pair adapter</p>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
