'use client';

import { useEffect } from 'react';
import { OBDProvider } from '@/lib/obd/OBDContext';
import { ensureNativeBleInitialized, isCapacitorNativeHost } from '@/lib/obd/native-ble-platform';

export default function OBDWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await isCapacitorNativeHost())) return;
      if (cancelled) return;
      try {
        await ensureNativeBleInitialized();
      } catch {
        /* BLE unavailable or permissions denied */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <OBDProvider>{children}</OBDProvider>;
}
