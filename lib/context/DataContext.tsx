// lib/context/DataContext.tsx - Using TanStack Query for data management
'use client'; // DataProvider uses client-side hooks

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useQuery, UseQueryResult } from '@tanstack/react-query';

import { fallbackService } from '@/lib/services/fallbackService';

// --- Interfaces (largely the same, but `lastUpdated` in LiveMetricData and `timestamp` in LiveDataResponse
// --- might become redundant if you solely rely on React Query's `dataUpdatedAt`)

export interface LiveMetricData {
  value: number | null;
  formatted: string;
  date: string;
  change?: number;
  lastUpdated: string; // Provided by your API, keep if still useful, else can remove
  source?: string;
  isFallback?: boolean;
  error?: string;
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
  console.log('📍 About to fetch from:', window.location.origin + '/api/fred-data');
  
  return fallbackService.withFallback(
    async () => {
      // Fetch from API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      try {
        const response = await fetch('/api/fred-data', {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        });
        clearTimeout(timeoutId);
        console.log('📊 Received response:', response.status, response.statusText);

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
      console.log('📦 API result received:', {
        success: result.success,
        dataKeys: result.data ? Object.keys(result.data) : 'none',
        dataCount: result.data ? Object.keys(result.data).length : 0
      });

      if (!result.success || !result.data) {
        const apiErrorMsg = result.error || 'API returned unsuccessful or no data';
        console.error('❌ TanStack Query: API error -', apiErrorMsg);
        throw new Error(apiErrorMsg);
      }

      // Store successful API data in fallback service cache (memory only on client)
      Object.entries(result.data).forEach(([metricName, data]) => {
        if (data && !data.isFallback) {
          fallbackService.cacheData(metricName, {
            ...data,
            source: data.source || 'API'
          });
        }
      });

        console.log('✅ TanStack Query: Data fetched and stored successfully.');
        return result.data;
      
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('❌ TanStack Query: Request timed out after 60 seconds');
          throw new Error('Request timed out - API took too long to respond');
        }
        console.error('❌ TanStack Query: Fetch error -', fetchError);
        throw fetchError;
      }
    },
    'AllMetrics',
    { retries: 2, retryDelay: 2000 }
  ) as Promise<Record<string, LiveMetricData>>;
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
    refetchInterval: 60 * 60 * 1000,  // 1 hour auto-refresh (was 15 minutes)
    staleTime: 30 * 60 * 1000,        // Data is considered fresh for 30 minutes (was 5 minutes)
                                      // Economic data doesn't need high frequency updates
    refetchOnWindowFocus: false,      // Don't refetch when window regains focus (too aggressive)
    refetchOnMount: true,             // Refetch when component mounts
    retry: 3,                         // Retry failed queries 3 times
    retryDelay: 1000,                 // Wait 1 second between retries
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