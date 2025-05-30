// lib/context/DataContext.tsx - Global data management

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface LiveMetricData {
  value: number | null;
  formatted: string;
  date: string;
  change?: number;
  lastUpdated: string;
}

interface LiveDataResponse {
  success: boolean;
  data: Record<string, LiveMetricData>;
  timestamp: string;
  error?: string;
}

interface DataContextType {
  liveData: Record<string, LiveMetricData>;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
  fetchData: () => Promise<void>;
  getLiveValue: (metricName: string) => LiveMetricData | null;
  getChangeIndicator: (metricName: string) => string;
  getChangeColor: (metricName: string) => string;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Global data provider
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [liveData, setLiveData] = useState<Record<string, LiveMetricData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (loading) {
      console.log('🔄 API call already in progress, skipping...');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log('🚀 Making API call to /api/fred-data');
      const response = await fetch('/api/fred-data');
      const result: LiveDataResponse = await response.json();
      
      if (result.success) {
        setLiveData(result.data);
        setLastFetched(new Date());
        console.log('✅ API call successful, data updated');
      } else {
        setError(result.error || 'Failed to fetch data');
        console.log('❌ API call failed:', result.error);
      }
    } catch (err) {
      setError('Network error - using cached data');
      console.error('❌ Network error:', err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Fetch data on mount (only once per app session)
  useEffect(() => {
    console.log('🏁 DataProvider mounted - initial fetch');
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 15 minutes (much less frequent)
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh triggered (15 min interval)');
      fetchData();
    }, 15 * 60 * 1000); // 15 minutes instead of 5

    return () => {
      console.log('🛑 Auto-refresh interval cleared');
      clearInterval(interval);
    };
  }, [fetchData]);

  const getLiveValue = useCallback((metricName: string): LiveMetricData | null => {
    return liveData[metricName] || null;
  }, [liveData]);

  const getChangeIndicator = useCallback((metricName: string): string => {
    const data = getLiveValue(metricName);
    if (!data || !data.change || !data.value) return '→';
    
    if (data.change > 0) {
      return '↑';
    } else if (data.change < 0) {
      return '↓';
    } else {
      return '→';
    }
  }, [getLiveValue]);

  const getChangeColor = useCallback((metricName: string): string => {
    const data = getLiveValue(metricName);
    if (!data || !data.change) return '#6b7280';
    
    if (data.change > 0) {
      return '#10b981'; // Green
    } else if (data.change < 0) {
      return '#ef4444'; // Red
    } else {
      return '#6b7280'; // Gray
    }
  }, [getLiveValue]);

  const value: DataContextType = {
    liveData,
    loading,
    error,
    lastFetched,
    fetchData,
    getLiveValue,
    getChangeIndicator,
    getChangeColor
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}

// Hook to use the data context
export function useLiveData(): DataContextType {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useLiveData must be used within a DataProvider');
  }
  return context;
}

// Updated root layout to wrap the app
export function DataWrappedLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      {children}
    </DataProvider>
  );
}