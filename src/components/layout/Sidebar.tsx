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
  BarChart3,
  Sparkles,
  Cpu,
  MoreHorizontal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOBD } from '@/lib/obd/OBDContext';
import { PROTOCOL_NAMES } from '@/lib/obd/elm327';

const navItems = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & Health' },
  { href: '/advanced', icon: Sparkles, label: 'Advanced AI', description: 'Pro Diagnostics & EV' },
  { href: '/diagnostics', icon: Scan, label: 'Diagnostics', description: 'DTC Scanner & Codes' },
  { href: '/programming', icon: Cpu, label: 'Programming', description: 'ECU Coding & Keys' },
  { href: '/live-data', icon: Activity, label: 'Live Data', description: 'Real-time Sensors' },
  { href: '/vehicles', icon: Car, label: 'Vehicles', description: 'Vehicle Profiles' },
  { href: '/reports', icon: FileText, label: 'Reports', description: 'Diagnostic Reports' },
  { href: '/maintenance', icon: Wrench, label: 'Maintenance', description: 'Service Scheduler' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Trends & Insights' },
  { href: '/connection', icon: Plug, label: 'Connection', description: 'OBD-II Adapter' },
  { href: '/settings', icon: Settings, label: 'Settings', description: 'App Preferences' },
];

const mobilePrimary = ['/', '/diagnostics', '/live-data', '/connection'] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { connectionState } = useOBD();
  const isConnected = connectionState.status === 'connected';

  const primaryItems = navItems.filter((n) =>
    (mobilePrimary as readonly string[]).includes(n.href)
  );
  const moreItems = navItems.filter(
    (n) => !(mobilePrimary as readonly string[]).includes(n.href)
  );
  const moreActive = moreItems.some((n) => pathname === n.href);

  const NavLink = ({
    href,
    icon: Icon,
    label,
    description,
    compact,
    onNavigate,
  }: (typeof navItems)[0] & { compact?: boolean; onNavigate?: () => void }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          'flex flex-col lg:flex-row items-center lg:gap-3 px-2 lg:px-3 py-2 lg:py-2.5 rounded-xl transition-all duration-200 group relative flex-shrink-0',
          compact ? 'min-w-[56px]' : 'min-w-0 w-full',
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
        <span
          className={cn(
            'text-[10px] lg:text-sm font-medium mt-0.5 lg:mt-0 text-center lg:text-left',
            isActive ? 'text-brand-400' : 'text-surface-500',
            collapsed && 'lg:hidden'
          )}
        >
          {label}
        </span>
        {!compact && !collapsed && (
          <span className="hidden lg:block text-[11px] truncate text-surface-500">{description}</span>
        )}
        {isActive && (
          <div className="absolute bottom-0 lg:bottom-auto lg:left-0 lg:top-1/2 lg:-translate-y-1/2 w-6 h-0.5 lg:w-0.5 lg:h-6 bg-brand-400 rounded-full" />
        )}
      </Link>
    );
  };

  return (
    <>
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed left-0 bottom-0 lg:top-0 z-[70] h-[72px] lg:h-screen w-full lg:w-[260px] flex flex-row lg:flex-col border-t lg:border-r border-surface-700/50 bg-surface-950 transition-all duration-300',
          collapsed && 'lg:w-[72px]',
          !collapsed && 'lg:w-[260px]'
        )}
      >
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

        <nav className="flex-1 flex lg:flex-col flex-row items-stretch lg:items-stretch justify-around lg:justify-start lg:py-4 px-1 lg:px-2.5 lg:space-y-1 overflow-visible lg:overflow-y-auto no-scrollbar relative">
          <div className="hidden lg:contents">
            {navItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          <div className="contents lg:hidden">
            {primaryItems.map((item) => (
              <NavLink key={item.href} {...item} compact />
            ))}
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={cn(
                'flex flex-col items-center justify-center min-w-[56px] py-2 rounded-xl flex-shrink-0',
                moreOpen || moreActive
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/20'
                  : 'text-surface-400'
              )}
            >
              <MoreHorizontal className="w-5 h-5" />
              <span className="text-[10px] font-medium mt-0.5">More</span>
            </button>
          </div>

          {moreOpen && (
            <div className="lg:hidden absolute bottom-full left-0 right-0 mb-2 mx-2 p-3 rounded-2xl border border-surface-700/50 bg-surface-900 shadow-2xl max-h-[min(70vh,420px)] overflow-y-auto custom-scrollbar animate-slide-up">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-sm font-semibold text-white">More tools</span>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800"
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {moreItems.map((item) => (
                  <NavLink
                    key={item.href}
                    {...item}
                    onNavigate={() => setMoreOpen(false)}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="hidden lg:block p-2.5 border-t border-surface-700/50 flex-shrink-0">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-surface-400 hover:text-white hover:bg-surface-800/50 transition-all"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
          {!collapsed && (
            <div
              className={cn(
                'mt-2 px-3 py-2 rounded-xl border',
                isConnected ? 'bg-surface-800/50 border-success/20' : 'bg-surface-800/30 border-surface-700/30'
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-2 h-2 rounded-full',
                    isConnected ? 'bg-success animate-pulse' : 'bg-surface-600'
                  )}
                />
                <span className="text-[11px] text-surface-400">
                  {isConnected ? 'ECU Connected' : 'No Connection'}
                </span>
              </div>
              {isConnected && connectionState.protocol && (
                <p className="text-[10px] text-surface-500 mt-1">
                  {PROTOCOL_NAMES[connectionState.protocol]}
                </p>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
