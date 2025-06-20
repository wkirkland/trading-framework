// app/layout.tsx
// (You might have other imports like globals.css, Navigation, DataProvider here)

import './globals.css'; // Your global styles
import type { Metadata } from 'next';

import MainLayout from '@/components/layout/MainLayout';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'Trading Framework',
  description: 'Systematic trading framework with live market analysis',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}