import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import OBDWrapper from '@/components/providers/OBDWrapper';
import PWAProvider from '@/components/PWAProvider';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'CarDiag — Universal car diagnostic software',
  description: 'Professional OBD-II diagnostic software compatible with all car makes and models. Read/clear DTCs, live sensor data, predictive maintenance, and more.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CarDiag',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icons/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/icons/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
    ],
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans">
        <PWAProvider>
          <OBDWrapper>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-[260px] transition-all duration-300">
                <div className="p-6 max-w-[1600px] mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </OBDWrapper>
        </PWAProvider>
        <Toaster />
      </body>
    </html>
  );
}
