/** Common BLE GATT UUIDs for ELM327-style OBD-II adapters (Web Bluetooth + Capacitor BLE). */

export const BLE_SERVICES = [
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '00001101-0000-1000-8000-00805f9b34fb',
] as const;

export const BLE_WRITE_CHARS = [
  '0000fff2-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
] as const;

export const BLE_NOTIFY_CHARS = [
  '0000fff1-0000-1000-8000-00805f9b34fb',
  '0000ffe1-0000-1000-8000-00805f9b34fb',
] as const;
