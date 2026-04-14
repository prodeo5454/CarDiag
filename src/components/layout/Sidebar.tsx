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
        'fixed left-0 bottom-0 lg:top-0 z-50 h-[72px] lg:h-screen w-full lg:w-[260px] flex flex-row lg:flex-col border-t lg:border-r border-surface-700/50 bg-surface-950 transition-all duration-300',
        !collapsed && 'lg:w-[260px]',
        collapsed && 'lg:w-[72px]'
      )}
    >
      {/* Logo - Hidden on mobile bottom bar */}
      <div className="hidden lg:flex items-center gap-3 px-4 h-16 border-b border-surface-700/50 flex-shrink-0">
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
      <nav className="flex-1 flex lg:flex-col flex-row items-center justify-around lg:justify-start lg:py-4 px-2 lg:px-2.5 lg:space-y-1 overflow-x-auto lg:overflow-y-auto no-scrollbar">
        {navItems.map(({ href, icon: Icon, label, description }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col lg:flex-row items-center lg:gap-3 px-1 lg:px-3 py-1.5 lg:py-2.5 rounded-xl transition-all duration-200 group relative flex-shrink-0 min-w-[60px] lg:min-w-0',
                isActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800/50 border border-transparent'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-brand-400' : 'text-surface-500 group-hover:text-white'
                )}
              />
              <span className={cn(
                'text-[9px] lg:text-sm font-medium lg:block',
                isActive ? 'text-brand-400' : 'text-surface-500',
                collapsed ? 'lg:hidden' : 'lg:block'
              )}>{label}</span>

              {!collapsed && (
                <div className="hidden lg:block animate-fade-in min-w-0">
                  <span className={cn(
                    'block text-[11px] truncate',
                    isActive ? 'text-brand-400/70' : 'text-surface-500'
                  )}>{description}</span>
                </div>
              )}
              {isActive && (
                <div className="absolute bottom-0 lg:bottom-auto lg:left-0 lg:top-1/2 lg:-translate-y-1/2 w-8 h-0.5 lg:w-0.5 lg:h-6 bg-brand-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse/Status - Hidden on mobile */}
      <div className="hidden lg:block p-2.5 border-t border-surface-700/50 flex-shrink-0">
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
