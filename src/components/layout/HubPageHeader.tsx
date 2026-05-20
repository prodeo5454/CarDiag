'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type HubVariant = 'brand' | 'warning' | 'neutral';

const variantStyles: Record<
  HubVariant,
  { border: string; gradient: string; iconBg: string; iconText: string }
> = {
  brand: {
    border: 'border-brand-500/30',
    gradient: 'from-brand-600/15 to-transparent',
    iconBg: 'bg-brand-500/20 glow-brand',
    iconText: 'text-brand-400',
  },
  warning: {
    border: 'border-warning/25',
    gradient: 'from-warning/10 to-transparent',
    iconBg: 'bg-warning/15 glow-warning',
    iconText: 'text-warning',
  },
  neutral: {
    border: 'border-surface-700/50',
    gradient: 'from-surface-800/40 to-transparent',
    iconBg: 'bg-surface-800/60',
    iconText: 'text-surface-300',
  },
};

export function HubPageHeader({
  title,
  subtitle,
  icon: Icon,
  variant = 'brand',
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  variant?: HubVariant;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  const v = variantStyles[variant];
  return (
    <div
      className={cn(
        'glass-card p-5 sm:p-6 border bg-gradient-to-r',
        v.border,
        v.gradient
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        {Icon && (
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
              v.iconBg
            )}
          >
            <Icon className={cn('w-5 h-5', v.iconText)} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="section-subtitle mt-1.5 max-w-3xl">{subtitle}</p>}
          {children}
        </div>
      </div>
      {footer && <div className="mt-4 pt-4 border-t border-surface-700/40">{footer}</div>}
    </div>
  );
}

export function HubTabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; icon?: React.ElementType }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'hub-tab flex items-center gap-2 flex-shrink-0',
            active === id && 'hub-tab-active'
          )}
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
        </button>
      ))}
    </div>
  );
}
