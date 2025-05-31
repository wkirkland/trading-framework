/*
// lib/hooks/useLiveDataSingleton.ts
import { useState, useEffect, useCallback, useRef } from 'react';

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

// Global state manager (singleton pattern)
class LiveDataManager {
  private data: Record<string, LiveMetricData> = {};
  private loading = false;
  private error: string | null = null;
  private lastFetched: Date | null = null;
  private subscribers = new Set<() => void>();
  private intervalId: NodeJS.Timeout | null = null;
  private initialized = false;

  // Subscribe a component to data updates
  subscribe(callback: () => void) {
    console.log(`📡 Component subscribed. Total subscribers: ${this.subscribers.size + 1}`);
    this.subscribers.add(callback);
    
    // Initialize on first subscription
    if (!this.initialized) {
      this.initialize();
    }
    
    // Return unsubscribe function
    return () => {
      console.log(`📡 Component unsubscribed. Total subscribers: ${this.subscribers.size - 1}`);
      this.subscribers.delete(callback);
      
      // Clean up if no more subscribers
      if (this.subscribers.size === 0) {
        this.cleanup();
      }
    };
  }

  private initialize() {
    console.log('🚀 LiveDataManager: Initializing...');
    this.initialized = true;
    
    // Initial fetch
    this.fetchData();
    
    // Set up interval
    this.intervalId = setInterval(() => {
      console.log('⏰ LiveDataManager: Auto-refresh triggered');
      this.fetchData();
    }, 5 * 60 * 1000); // 5 minutes
  }

  private cleanup() {
    console.log('🧹 LiveDataManager: Cleaning up...');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.initialized = false;
  }

  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  private async fetchData() {
    console.log('🔄 LiveDataManager: Fetching data...', new Date().toISOString());
    
    this.loading = true;
    this.error = null;
    this.notifySubscribers();
    
    try {
      const response = await fetch('/api/fred-data');
      const result: LiveDataResponse = await response.json();
      
      if (result.success) {
        this.data = result.data;
        this.lastFetched = new Date();
        console.log('✅ LiveDataManager: Data updated successfully');
      } else {
        this.error = result.error || 'Failed to fetch data';
        console.error('❌ LiveDataManager: API returned error:', result.error);
      }
    } catch (err) {
      this.error = 'Network error - using cached data';
      console.error('❌ LiveDataManager: Network error:', err);
    } finally {
      this.loading = false;
      this.notifySubscribers();
    }
  }

  // Public getters
  getData() { return this.data; }
  getLoading() { return this.loading; }
  getError() { return this.error; }
  getLastFetched() { return this.lastFetched; }
  
  // Manual refresh
  refresh() {
    console.log('🔄 LiveDataManager: Manual refresh requested');
    this.fetchData();
  }
}

// Global instance
const liveDataManager = new LiveDataManager();

// React hook that uses the global manager
export function useLiveData() {
  const [, forceUpdate] = useState({});
  const mountedRef = useRef(true);

  // Force re-render when data changes
  const triggerUpdate = useCallback(() => {
    if (mountedRef.current) {
      forceUpdate({});
    }
  }, []);

  useEffect(() => {
    // Subscribe to updates
    const unsubscribe = liveDataManager.subscribe(triggerUpdate);
    
    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [triggerUpdate]);

  // Helper functions
  const getLiveValue = useCallback((metricName: string): LiveMetricData | null => {
    return liveDataManager.getData()[metricName] || null;
  }, [liveDataManager.getData()]);

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

  return {
    liveData: liveDataManager.getData(),
    loading: liveDataManager.getLoading(),
    error: liveDataManager.getError(),
    lastFetched: liveDataManager.getLastFetched(),
    fetchData: () => liveDataManager.refresh(),
    getLiveValue,
    getChangeIndicator,
    getChangeColor
  };
}*/