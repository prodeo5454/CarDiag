import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getHealthColor(score: number): string {
  if (score >= 85) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-danger';
}

export function getHealthBg(score: number): string {
  if (score >= 85) return 'bg-success';
  if (score >= 60) return 'bg-warning';
  return 'bg-danger';
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return 'text-danger bg-danger/10 border-danger/30';
    case 'warning': return 'text-warning bg-warning/10 border-warning/30';
    case 'info': return 'text-info bg-info/10 border-info/30';
    case 'pending': return 'text-surface-400 bg-surface-400/10 border-surface-400/30';
    default: return 'text-surface-400 bg-surface-100 border-surface-300';
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ok': return 'text-success';
    case 'warning': return 'text-warning';
    case 'critical': return 'text-danger';
    default: return 'text-surface-400';
  }
}

export function getStatusBg(status: string): string {
  switch (status) {
    case 'ok': return 'bg-success/10';
    case 'warning': return 'bg-warning/10';
    case 'critical': return 'bg-danger/10';
    default: return 'bg-surface-100';
  }
}
