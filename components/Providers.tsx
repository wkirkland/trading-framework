// app/components/Providers.tsx
'use client'; // This is crucial!

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { DataProvider } from '@/lib/context/DataContext'; // Import DataProvider

// Helper function to create a QueryClient instance
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // You can set default options for all queries here
        // For example, staleTime defines how long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes
        // refetchOnWindowFocus: false, // Optional: disable refetch on window focus if desired
      },
    },
  });
}

// Global/singleton QueryClient instance for the browser
let browserQueryClient: QueryClient | undefined = undefined;

// Function to get the QueryClient instance
// Ensures a new client for SSR and a singleton for the browser
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always make a new query client to avoid sharing data between requests
    return makeQueryClient();
  } else {
    // Browser: use a singleton pattern to keep the same query client across re-renders
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient();
    }
    return browserQueryClient;
  }
}

export default function Providers({ children }: { children: React.ReactNode }) {
  // Get the QueryClient instance.
  // NOTE: Using `getQueryClient()` directly (without useState) is generally preferred
  // in Next.js App Router to ensure proper behavior with SSR and hydration,
  // especially if you might prefetch data on the server in the future.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {/* DataProvider is now nested inside QueryClientProvider */}
      {/* This allows DataProvider to use hooks like useQuery from TanStack Query */}
      <DataProvider>
        {children}
      </DataProvider>

      {/* React Query Devtools - only included in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}