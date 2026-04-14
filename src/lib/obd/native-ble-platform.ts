/**
 * Capacitor native host detection + one-time BleClient init for @capacitor-community/bluetooth-le.
 * Dynamic imports keep web/desktop bundles from failing when Capacitor is not installed.
 */

let bleInitPromise: Promise<void> | null = null;

export async function isCapacitorNativeHost(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const { Capacitor } = await import('@capacitor/core');
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function ensureNativeBleInitialized(): Promise<void> {
  if (!bleInitPromise) {
    bleInitPromise = (async () => {
      const { BleClient } = await import('@capacitor-community/bluetooth-le');
      await BleClient.initialize({ androidNeverForLocation: true });
    })();
  }
  await bleInitPromise;
}
