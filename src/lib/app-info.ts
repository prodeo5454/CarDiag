import packageJson from '../../package.json';
import { Capacitor } from '@capacitor/core';

export const APP_VERSION = packageJson.version;

/** Shown in Settings; bump when shipping a release build. */
export const APP_BUILD_DATE = '2026.05.20';

export function getPlatformLabel(): string {
  const platform = Capacitor.getPlatform();
  if (platform === 'android') return 'Android';
  if (platform === 'ios') return 'iOS';
  if (Capacitor.isNativePlatform()) return 'Native';
  return 'Web / PWA';
}

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}
