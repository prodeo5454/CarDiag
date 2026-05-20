export interface ConnectionEvent {
  timestamp: string;
  adapterId?: string;
  adapterName?: string;
  connectionType?: string;
  success: boolean;
}

const STORAGE_KEY = 'cardiag-connection-events';
const MAX_EVENTS = 500;

export function recordConnectionEvent(event: Omit<ConnectionEvent, 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const events: ConnectionEvent[] = data ? JSON.parse(data) : [];
    events.push({ ...event, timestamp: new Date().toISOString() });
    const trimmed = events.slice(-MAX_EVENTS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to record connection event:', error);
  }
}

export function getConnectionEvents(): ConnectionEvent[] {
  if (typeof window === 'undefined') return [];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getConnectionTrends(months = 12): Array<{ period: string; value: number; label: string }> {
  const events = getConnectionEvents().filter(e => e.success);
  const now = new Date();
  const trends: Array<{ period: string; value: number; label: string }> = [];

  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = monthDate.toISOString().substring(0, 7);
    const count = events.filter(e => e.timestamp.startsWith(monthKey)).length;
    trends.push({
      period: monthKey,
      value: count,
      label: `${count} connection${count === 1 ? '' : 's'}`,
    });
  }

  return trends;
}
