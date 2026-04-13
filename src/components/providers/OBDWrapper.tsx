'use client';

import { OBDProvider } from '@/lib/obd/OBDContext';

export default function OBDWrapper({ children }: { children: React.ReactNode }) {
  return <OBDProvider>{children}</OBDProvider>;
}
