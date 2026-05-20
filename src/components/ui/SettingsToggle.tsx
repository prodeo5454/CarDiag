'use client';

import { cn } from '@/lib/utils';

export default function SettingsToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-surface-500 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'w-12 h-6 rounded-full transition-all flex-shrink-0',
          checked ? 'bg-brand-500' : 'bg-surface-700'
        )}
      >
        <div
          className={cn(
            'w-5 h-5 bg-white rounded-full transition-transform shadow-sm',
            checked ? 'translate-x-6' : 'translate-x-0.5'
          )}
        />
      </button>
    </div>
  );
}
