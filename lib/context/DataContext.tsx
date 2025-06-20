// lib/context/DataContext.tsx - Using TanStack Query for data management
'use client'; // DataProvider uses client-side hooks

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

// --- Interfaces (largely the same, but `lastUpdated` in LiveMetricData and `timestamp` in LiveDataResponse
// --- might become redundant if you solely rely on React Query's `dataUpdatedAt`)

export interface LiveMetricData {
  value: number | null;
  formatted: string;
  date: string;
  change?: number;
  lastUpdated: string; // Provided by your API, keep if still useful, else can remove
}

export interface LiveDataResponse {
  success: boolean;
  data: Record<string, LiveMetricData>;
  timestamp: string; // Provided by your API, keep if still useful, else can remove
  error?: string;
}

// DataContextType remains conceptually similar
export interface DataContextType {
  liveData: Record<string, LiveMetricData>;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  fetchData: () => void; // This will trigger a refetch
  getLiveValue: (metricName: string) => LiveMetricData | null;
  getChangeIndicator: (metricName: string) => string;
  getChangeColor: (metricName: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// This is the function that React Query will call to fetch data
async function fetchLiveApiData(): Promise<Record<string, LiveMetricData>> {
  console.log('🔄 TanStack Query: Fetching live API data via fetchLiveApiData()...', new Date().toISOString());
  const response = await fetch('/api/fred-data'); // Your API endpoint

  if (!response.ok) {
    // Attempt to get more detailed error from response body if possible
    let errorMsg = `Network error: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMsg = errorData.error || errorData.message || errorMsg;
    } catch {
      // Ignore if response body isn't JSON
    }
    console.error('❌ TanStack Query: Network response was not ok.', errorMsg);
    throw new Error(errorMsg);
  }

  const result: LiveDataResponse = await response.json();

  if (!result.success || !result.data) {
    const apiErrorMsg = result.error || 'API returned unsuccessful or no data';
    console.error('❌ TanStack Query: API error -', apiErrorMsg);
    throw new Error(apiErrorMsg);
  }

  console.log('✅ TanStack Query: Data fetched successfully.');
  return result.data;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const {
    data: liveDataFromQuery, // Raw data from the query
    isLoading,              // True on initial load if no data yet
    isFetching,             // True whenever a fetch is in progress (initial or background)
    error: queryError,      // Error object if the query fails
    refetch,                // Function to manually trigger a refetch
    dataUpdatedAt,          // Timestamp of the last successful data fetch
  }: UseQueryResult<Record<string, LiveMetricData>, Error> = useQuery<
    Record<string, LiveMetricData>, // QueryFnData: type returned by queryFn
    Error,                          // Error: type of error queryFn can throw
    Record<string, LiveMetricData>, // Data: type of `data` property after select
    readonly ["liveApiData"]        // QueryKey: type of the query key
  >({
    queryKey: ['liveApiData'] as const, // Unique key for this query. `as const` is good for type inference.
    queryFn: fetchLiveApiData,
    refetchInterval: 15 * 60 * 1000, // 15 minutes auto-refresh
    staleTime: 5 * 60 * 1000,        // Data is considered fresh for 5 minutes
                                     // After 5 mins, it's "stale" and will refetch on next mount/window focus
                                     // (if not overridden by refetchOnWindowFocus: false etc.)
    // placeholderData: {}, // Optional: provide some initial data (e.g. empty object)
    // keepPreviousData: true, // Optional: useful for UX to show old data while new is fetching
    retry: 2, // Optional: retry failed queries 2 times
  });

  // Ensure liveData is always an object, even if query returns undefined initially
  const liveData = useMemo(() => liveDataFromQuery || {}, [liveDataFromQuery]);

  const getLiveValue = useCallback(
    (metricName: string): LiveMetricData | null => {
      return liveData[metricName] || null;
    },
    [liveData]
  );

  const getChangeIndicator = useCallback(
    (metricName: string): string => {
      const data = getLiveValue(metricName);
      // Ensure 'change' is explicitly checked for undefined
      if (!data || data.change === undefined || data.value === null) return '→';
      if (data.change > 0) return '↑';
      if (data.change < 0) return '↓';
      return '→';
    },
    [getLiveValue]
  );

  const getChangeColor = useCallback(
    (metricName: string): string => {
      const data = getLiveValue(metricName);
      // Ensure 'change' is explicitly checked for undefined
      if (!data || data.change === undefined) return '#6b7280'; // Gray for no change or no data
      if (data.change > 0) return '#10b981'; // Green
      if (data.change < 0) return '#ef4444'; // Red
      return '#6b7280'; // Gray
    },
    [getLiveValue]
  );

  const contextValue: DataContextType = useMemo(() => ({
    liveData,
    loading: isLoading || isFetching, // Show loading for initial fetch or background refetches
    error: queryError ? queryError.message : null,
    lastFetched: dataUpdatedAt ? new Date(dataUpdatedAt) : null,
    fetchData: () => {
      console.log('🔄 Manual data refresh triggered via context fetchData()');
      refetch();
    },
    getLiveValue,
    getChangeIndicator,
    getChangeColor,
  }), [
    liveData,
    isLoading,
    isFetching,
    queryError,
    dataUpdatedAt,
    refetch, // refetch is stable, but include if ESLint insists
    getLiveValue,
    getChangeIndicator,
    getChangeColor
  ]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
}

export function useLiveData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useLiveData must be used within a DataProvider');
  }
  return context;
}

// The DataWrappedLayout component might be removed if not explicitly needed elsewhere,
// as DataProvider will now be nested within Providers.tsx.
// If you had `export function DataWrappedLayout...`, you can likely remove it.