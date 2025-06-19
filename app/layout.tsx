// app/layout.tsx
// (You might have other imports like globals.css, Navigation, DataProvider here)

import './globals.css'; // Your global styles
import type { Metadata } from 'next';

import Navigation from '@/components/layout/Navigation';
// Remove DataProvider import for now, we will refactor it
// import { DataProvider } from '@/lib/context/DataContext';
import Providers from '@/components/Providers'; // Import your new Providers component

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
        {/* Wrap with your new Providers component */}
        <Providers>
          {/* 
            We will refactor DataProvider soon. For now, 
            if you still have it here from the previous step,
            it would look like this, but the goal is to have
            React Query manage the fetching, and DataProvider
            might just consume that data or be refactored differently.
          */}
          {/* <DataProvider> */}
            <Navigation />
            {children}
          {/* </DataProvider> */}
        </Providers>
      </body>
    </html>
  );
}