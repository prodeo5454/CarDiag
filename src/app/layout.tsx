import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/layout/Sidebar';
import OBDWrapper from '@/components/providers/OBDWrapper';
import PWAProvider from '@/components/PWAProvider';
import { PreferencesProvider } from '@/components/providers/PreferencesProvider';
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
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="font-sans overflow-x-hidden">
        <PreferencesProvider>
        <PWAProvider>
          <OBDWrapper>
            <div className="flex min-h-screen relative">
              <Sidebar />
              <main className="flex-1 transition-all duration-300 ml-0 lg:ml-[260px]">
                <div className="p-3 md:p-6 max-w-[1600px] mx-auto pb-24 lg:pb-6">
                  {children}
                </div>
              </main>
            </div>
          </OBDWrapper>
        </PWAProvider>
        </PreferencesProvider>
        <Toaster />
      </body>
    </html>
  );
}
