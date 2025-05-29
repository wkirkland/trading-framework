// lib/hooks/useLiveData.ts

import { useState, useEffect } from 'react';

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

export function useLiveData() {
  const [liveData, setLiveData] = useState<Record<string, LiveMetricData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/fred-data');
      const result: LiveDataResponse = await response.json();
      
      if (result.success) {
        setLiveData(result.data);
        setLastFetched(new Date());
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Network error - using cached data');
      console.error('Error fetching live data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getLiveValue = (metricName: string): LiveMetricData | null => {
    return liveData[metricName] || null;
  };

  const getChangeIndicator = (metricName: string): string => {
    const data = getLiveValue(metricName);
    if (!data || !data.change || !data.value) return '→';
    
    if (data.change > 0) {
      return '↑';
    } else if (data.change < 0) {
      return '↓';
    } else {
      return '→';
    }
  };

  const getChangeColor = (metricName: string): string => {
    const data = getLiveValue(metricName);
    if (!data || !data.change) return '#6b7280';
    
    if (data.change > 0) {
      return '#10b981'; // Green
    } else if (data.change < 0) {
      return '#ef4444'; // Red
    } else {
      return '#6b7280'; // Gray
    }
  };

  return {
    liveData,
    loading,
    error,
    lastFetched,
    fetchData,
    getLiveValue,
    getChangeIndicator,
    getChangeColor
  };
}