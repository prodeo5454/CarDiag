import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cardiag.app',
  appName: 'CarDiag',
  webDir: 'out',
  plugins: {
    BluetoothLe: {
      displayStrings: {
        scanning: 'Scanning for OBD adapters…',
        cancel: 'Cancel',
        availableDevices: 'Available devices',
        noDeviceFound: 'No Bluetooth device found',
      },
    },
  },
  server: {
    androidScheme: 'https',
    /** Allow ws:// / http:// WiFi OBD adapters from file-backed WebView */
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
