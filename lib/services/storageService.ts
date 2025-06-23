// lib/services/storageService.ts
// Unified storage service that handles local persistence and caching

import { getFileStorage } from '@/lib/storage/fileStorage';
import type { LiveMetricData } from '@/lib/context/DataContext';
import type { DataFreshnessStatus } from '@/lib/services/dataFreshnessService';
import { metricsData } from '@/lib/data/metrics';

interface StorageConfig {
  enableStorage: boolean;
  maxDataAge: number; // milliseconds
  autoCleanup: boolean;
  cleanupInterval: number; // milliseconds
}

interface StorageMetrics {
  totalMetrics: number;
  totalDataPoints: number;
  storageSize: number;
  cacheHitRate: number;
  lastCleanup: Date | null;
}

class StorageService {
  private config: StorageConfig;
  private storage = getFileStorage();
  private cleanupTimer: NodeJS.Timeout | null = null;
  private lastCleanup: Date | null = null;
  private cacheHits = 0;
  private cacheRequests = 0;

  // Define storage frequencies based on metric characteristics
  private readonly STORAGE_FREQUENCIES = {
    // Daily updates (every 24 hours max)
    daily: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      metrics: [
        'Fed Funds Rate',
        '10-Year Treasury Yield', 
        'VIX Index',
        'S&P 500',
        'Dollar Index'
      ]
    },
    // Weekly updates (every 7 days max)  
    weekly: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      metrics: [
        'Initial Jobless Claims'
      ]
    },
    // Monthly updates (every 30 days max)
    monthly: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      metrics: [
        'Unemployment Rate (U-3)',
        'Manufacturing PMI',
        'Services PMI', 
        'Industrial Production Index',
        'Capacity Utilization Rate',
        'Job Openings (JOLTS)',
        'Labor Force Participation Rate',
        'Core CPI',
        'Consumer Confidence Index',
        'Conference Board LEI'
      ]
    },
    // Quarterly updates (every 90 days max)
    quarterly: {
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      metrics: [
        'Real GDP Growth Rate',
        '5Y5Y Forward Inflation Rate',
        'Goldman Sachs CAI',
        'Chicago Fed CFNAI'
      ]
    }
  };

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      enableStorage: true,
      maxDataAge: 30 * 24 * 60 * 60 * 1000, // 30 days default
      autoCleanup: true,
      cleanupInterval: 6 * 60 * 60 * 1000, // 6 hours
      ...config
    };

    if (this.config.autoCleanup) {
      this.startCleanupTimer();
    }
  }

  /**
   * Store metric data with frequency-based logic
   */
  async storeMetricData(metricName: string, data: LiveMetricData, responseTime?: number): Promise<boolean> {
    if (!this.config.enableStorage || !this.storage.isAvailable()) {
      return false;
    }

    try {
      // Check if we should store this data based on frequency
      if (!this.shouldStoreMetric(metricName, data)) {
        console.log(`Skipping storage for ${metricName} - too frequent`);
        return true; // Not an error, just skipped
      }

      const success = this.storage.storeMetricData(metricName, data, responseTime);
      
      if (success) {
        // Also store freshness information
        const freshness = this.calculateFreshness(metricName, data);
        this.storage.storeFreshnessData(metricName, freshness);
      }

      return success;
    } catch (error) {
      console.error('Error in storeMetricData:', error);
      return false;
    }
  }

  /**
   * Store multiple metrics data efficiently
   */
  async storeMetricsData(metricsData: Record<string, LiveMetricData>): Promise<boolean> {
    if (!this.config.enableStorage || !this.storage.isAvailable()) {
      return false;
    }

    try {
      let successCount = 0;
      const entries = Object.entries(metricsData);

      for (const [metricName, data] of entries) {
        if (await this.storeMetricData(metricName, data)) {
          successCount++;
        }
      }

      console.log(`Stored ${successCount}/${entries.length} metrics`);
      return successCount > 0;
    } catch (error) {
      console.error('Error in storeMetricsData:', error);
      return false;
    }
  }

  /**
   * Get cached metric data if available and fresh
   */
  async getCachedMetricData(metricName: string): Promise<LiveMetricData | null> {
    if (!this.config.enableStorage || !this.storage.isAvailable()) {
      return null;
    }

    try {
      this.cacheRequests++;
      
      const data = this.storage.getLatestMetricData(metricName);
      if (!data) {
        return null;
      }

      // Check if data is still fresh based on metric frequency
      if (this.isCachedDataFresh(metricName, data)) {
        this.cacheHits++;
        
        // Mark as cached data
        return {
          ...data,
          source: `${data.source} (cached)`,
          isFallback: true
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting cached metric data:', error);
      return null;
    }
  }

  /**
   * Get all cached metrics data
   */
  async getAllCachedMetricsData(): Promise<Record<string, LiveMetricData>> {
    if (!this.config.enableStorage || !this.storage.isAvailable()) {
      return {};
    }

    try {
      const allData = this.storage.getAllLatestMetricsData();
      const freshData: Record<string, LiveMetricData> = {};

      for (const [metricName, data] of Object.entries(allData)) {
        if (this.isCachedDataFresh(metricName, data)) {
          freshData[metricName] = {
            ...data,
            source: `${data.source} (cached)`,
            isFallback: true
          };
        }
      }

      return freshData;
    } catch (error) {
      console.error('Error getting all cached metrics data:', error);
      return {};
    }
  }

  /**
   * Determine if we should store this metric based on frequency rules
   */
  private shouldStoreMetric(metricName: string, data: LiveMetricData): boolean {
    // Always store if it's the first time
    const existing = this.storage.getLatestMetricData(metricName);
    if (!existing) {
      return true;
    }

    // Don't store fallback data unless it's the only data we have
    if (data.isFallback && !existing.isFallback) {
      return false;
    }

    // Check frequency rules
    const frequency = this.getMetricStorageFrequency(metricName);
    const lastStored = new Date(existing.lastUpdated);
    const timeSinceLastStored = Date.now() - lastStored.getTime();

    return timeSinceLastStored >= frequency.maxAge;
  }

  /**
   * Check if cached data is still fresh enough to use
   */
  private isCachedDataFresh(metricName: string, data: LiveMetricData): boolean {
    if (!data.lastUpdated) return false;

    const lastUpdated = new Date(data.lastUpdated);
    const ageMs = Date.now() - lastUpdated.getTime();
    const frequency = this.getMetricStorageFrequency(metricName);

    // Consider cached data fresh if it's within the storage frequency window
    return ageMs < frequency.maxAge;
  }

  /**
   * Get storage frequency settings for a metric
   */
  private getMetricStorageFrequency(metricName: string) {
    for (const [frequencyName, config] of Object.entries(this.STORAGE_FREQUENCIES)) {
      if (config.metrics.includes(metricName)) {
        return config;
      }
    }
    
    // Default to monthly for unknown metrics
    return this.STORAGE_FREQUENCIES.monthly;
  }

  /**
   * Calculate freshness status for a metric
   */
  private calculateFreshness(metricName: string, data: LiveMetricData): DataFreshnessStatus {
    const metricConfig = metricsData.find(m => m.name === metricName);
    const frequency = metricConfig?.frequency || 'monthly';
    const lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : null;

    // Simplified freshness calculation
    let status: 'fresh' | 'aging' | 'stale' | 'unknown' = 'unknown';
    let staleness = 0;

    if (lastUpdated) {
      staleness = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60); // hours
      
      // Simple freshness rules based on frequency
      switch (frequency) {
        case 'daily':
          status = staleness < 24 ? 'fresh' : staleness < 48 ? 'aging' : 'stale';
          break;
        case 'weekly': 
          status = staleness < 168 ? 'fresh' : staleness < 336 ? 'aging' : 'stale'; // 7/14 days
          break;
        case 'monthly':
          status = staleness < 720 ? 'fresh' : staleness < 1440 ? 'aging' : 'stale'; // 30/60 days  
          break;
        case 'quarterly':
          status = staleness < 2160 ? 'fresh' : staleness < 4320 ? 'aging' : 'stale'; // 90/180 days
          break;
      }
    }

    return {
      metricName,
      lastUpdated,
      expectedFrequency: frequency,
      status,
      staleness,
      nextExpectedUpdate: null // TODO: Calculate based on frequency
    };
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  /**
   * Clean up old data
   */
  async cleanup(): Promise<boolean> {
    if (!this.config.enableStorage || !this.storage.isAvailable()) {
      return false;
    }

    try {
      const success = this.storage.cleanup();
      if (success) {
        this.lastCleanup = new Date();
        console.log('Storage cleanup completed');
      }
      return success;
    } catch (error) {
      console.error('Error during storage cleanup:', error);
      return false;
    }
  }

  /**
   * Get storage metrics and statistics
   */
  getMetrics(): StorageMetrics | null {
    if (!this.storage.isAvailable()) {
      return null;
    }

    try {
      const stats = this.storage.getStats();
      if (!stats) return null;

      const cacheHitRate = this.cacheRequests > 0 ? (this.cacheHits / this.cacheRequests) * 100 : 0;

      return {
        totalMetrics: stats.metrics.count,
        totalDataPoints: stats.metricData.count, 
        storageSize: stats.totalSizeBytes,
        cacheHitRate,
        lastCleanup: this.lastCleanup
      };
    } catch (error) {
      console.error('Error getting storage metrics:', error);
      return null;
    }
  }

  /**
   * Get storage configuration
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Update storage configuration
   */
  updateConfig(newConfig: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.autoCleanup && !this.cleanupTimer) {
      this.startCleanupTimer();
    } else if (!this.config.autoCleanup && this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Check if storage is available and working
   */
  isAvailable(): boolean {
    return this.config.enableStorage && this.storage.isAvailable();
  }

  /**
   * Shutdown storage service
   */
  shutdown(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Singleton instance
let storageService: StorageService | null = null;

export function getStorageService(): StorageService {
  if (!storageService) {
    storageService = new StorageService();
  }
  return storageService;
}

export { StorageService };
export type { StorageConfig, StorageMetrics };