// app/layout.tsx (UPDATED to wrap with DataProvider)

import './globals.css';
import type { Metadata } from 'next';
import Navigation from '@/components/layout/Navigation';
import { DataProvider } from '@/lib/context/DataContext';

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
        <DataProvider>
          <Navigation />
          {children}
        </DataProvider>
      </body>
    </html>
  );
}