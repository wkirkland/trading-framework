// lib/storage/fileStorage.ts
// File-based storage service for local data persistence (SQLite alternative)

import fs from 'fs';
import path from 'path';

import type { LiveMetricData } from '@/lib/context/DataContext';
import type { DataFreshnessStatus } from '@/lib/services/dataFreshnessService';
import { metricsData } from '@/lib/data/metrics';

// Storage directory
const STORAGE_DIR = path.join(process.cwd(), 'data');
const METRICS_FILE = path.join(STORAGE_DIR, 'metrics.json');
const METRIC_DATA_FILE = path.join(STORAGE_DIR, 'metric-data.json');
const FRESHNESS_FILE = path.join(STORAGE_DIR, 'freshness.json');
const API_HEALTH_FILE = path.join(STORAGE_DIR, 'api-health.json');
const CACHE_FILE = path.join(STORAGE_DIR, 'cache.json');

// Data structures
interface StoredMetric {
  id: string;
  name: string;
  category: string;
  description?: string;
  priority: string;
  frequency: string;
  timing: string;
  source: string;
  apiSource?: string;
  apiIdentifier?: any;
  units?: string;
  isPocMetric: boolean;
  isMarketDependent: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoredMetricData {
  metricName: string;
  value: number | null;
  formattedValue: string;
  date: string;
  changeValue: number | null;
  source: string;
  apiResponseTimeMs: number | null;
  isFallback: boolean;
  errorMessage: string | null;
  createdAt: string;
  fetchedAt: string;
}

interface StoredFreshness {
  metricName: string;
  lastSuccessfulFetch: string | null;
  lastAttemptedFetch: string | null;
  stalenessHours: number | null;
  freshnessStatus: string;
  nextExpectedUpdate: string | null;
  consecutiveFailures: number;
  updatedAt: string;
}

interface StoredApiHealth {
  apiName: string;
  status: string;
  responseTimeMs: number | null;
  errorMessage: string | null;
  consecutiveFailures: number;
  successRate: number;
  checkedAt: string;
}

interface CacheEntry {
  key: string;
  data: any;
  expiresAt: string;
  createdAt: string;
  accessCount: number;
  lastAccessed: string;
}

interface StorageFiles {
  metrics: StoredMetric[];
  metricData: StoredMetricData[];
  freshness: StoredFreshness[];
  apiHealth: StoredApiHealth[];
  cache: CacheEntry[];
}

class FileStorage {
  private isInitialized = false;
  private readonly maxDataAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly maxHistoryPerMetric = 100; // Keep last 100 data points per metric

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      // Ensure storage directory exists
      if (!fs.existsSync(STORAGE_DIR)) {
        fs.mkdirSync(STORAGE_DIR, { recursive: true });
      }

      // Initialize files if they don't exist
      this.initializeFile(METRICS_FILE, []);
      this.initializeFile(METRIC_DATA_FILE, []);
      this.initializeFile(FRESHNESS_FILE, []);
      this.initializeFile(API_HEALTH_FILE, []);
      this.initializeFile(CACHE_FILE, []);

      // Seed metrics
      this.seedMetrics();
      
      // Clean up old data
      this.cleanup();

      this.isInitialized = true;
      console.log('File storage initialized at:', STORAGE_DIR);
    } catch (error) {
      console.error('Failed to initialize file storage:', error);
    }
  }

  private initializeFile(filePath: string, defaultData: any) {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
    }
  }

  private readFile<T>(filePath: string, defaultValue: T): T {
    try {
      if (!fs.existsSync(filePath)) {
        return defaultValue;
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error);
      return defaultValue;
    }
  }

  private writeFile(filePath: string, data: any): boolean {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error(`Error writing ${filePath}:`, error);
      return false;
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private isMarketDependentMetric(metricName: string): boolean {
    const marketMetrics = ['VIX Index', 'S&P 500', 'Dollar Index'];
    return marketMetrics.includes(metricName);
  }

  private seedMetrics() {
    try {
      const existingMetrics = this.readFile<StoredMetric[]>(METRICS_FILE, []);
      const existingNames = new Set(existingMetrics.map(m => m.name));
      
      const newMetrics: StoredMetric[] = [];
      const now = new Date().toISOString();

      for (const metric of metricsData) {
        if (!existingNames.has(metric.name)) {
          newMetrics.push({
            id: this.generateId(),
            name: metric.name,
            category: metric.category,
            description: metric.description,
            priority: metric.priority,
            frequency: metric.frequency,
            timing: metric.timing,
            source: metric.source,
            apiSource: metric.apiSource,
            apiIdentifier: metric.apiIdentifier,
            units: metric.units,
            isPocMetric: metric.isPocMetric || false,
            isMarketDependent: this.isMarketDependentMetric(metric.name),
            createdAt: now,
            updatedAt: now
          });
        }
      }

      if (newMetrics.length > 0) {
        const allMetrics = [...existingMetrics, ...newMetrics];
        this.writeFile(METRICS_FILE, allMetrics);
        console.log(`Seeded ${newMetrics.length} new metrics`);
      }
    } catch (error) {
      console.error('Error seeding metrics:', error);
    }
  }

  // Store metric data
  storeMetricData(metricName: string, data: LiveMetricData, responseTime?: number): boolean {
    try {
      const metricData = this.readFile<StoredMetricData[]>(METRIC_DATA_FILE, []);
      const now = new Date().toISOString();

      const newData: StoredMetricData = {
        metricName,
        value: data.value,
        formattedValue: data.formatted,
        date: data.date,
        changeValue: data.change || null,
        source: data.source || 'Unknown',
        apiResponseTimeMs: responseTime || null,
        isFallback: data.isFallback || false,
        errorMessage: data.error || null,
        createdAt: now,
        fetchedAt: data.lastUpdated || now
      };

      metricData.push(newData);

      // Keep only recent data per metric
      const metricDataByName = new Map<string, StoredMetricData[]>();
      for (const item of metricData) {
        if (!metricDataByName.has(item.metricName)) {
          metricDataByName.set(item.metricName, []);
        }
        metricDataByName.get(item.metricName)!.push(item);
      }

      // Trim to max history per metric
      const trimmedData: StoredMetricData[] = [];
      for (const [name, items] of metricDataByName) {
        const sorted = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        trimmedData.push(...sorted.slice(0, this.maxHistoryPerMetric));
      }

      return this.writeFile(METRIC_DATA_FILE, trimmedData);
    } catch (error) {
      console.error('Error storing metric data:', error);
      return false;
    }
  }

  // Store multiple metrics data
  storeMetricsData(metricsData: Record<string, LiveMetricData>): boolean {
    try {
      let success = true;
      for (const [metricName, data] of Object.entries(metricsData)) {
        if (!this.storeMetricData(metricName, data)) {
          success = false;
        }
      }
      return success;
    } catch (error) {
      console.error('Error storing metrics data:', error);
      return false;
    }
  }

  // Get latest metric data
  getLatestMetricData(metricName: string): LiveMetricData | null {
    try {
      const metricData = this.readFile<StoredMetricData[]>(METRIC_DATA_FILE, []);
      const metricEntries = metricData
        .filter(d => d.metricName === metricName)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      if (metricEntries.length === 0) return null;

      const latest = metricEntries[0];
      return {
        value: latest.value,
        formatted: latest.formattedValue,
        date: latest.date,
        change: latest.changeValue,
        lastUpdated: latest.fetchedAt,
        source: latest.source,
        isFallback: latest.isFallback,
        error: latest.errorMessage
      };
    } catch (error) {
      console.error('Error getting latest metric data:', error);
      return null;
    }
  }

  // Get all latest metrics data
  getAllLatestMetricsData(): Record<string, LiveMetricData> {
    try {
      const metricData = this.readFile<StoredMetricData[]>(METRIC_DATA_FILE, []);
      const result: Record<string, LiveMetricData> = {};

      // Group by metric name and get latest for each
      const byMetric = new Map<string, StoredMetricData[]>();
      for (const item of metricData) {
        if (!byMetric.has(item.metricName)) {
          byMetric.set(item.metricName, []);
        }
        byMetric.get(item.metricName)!.push(item);
      }

      for (const [metricName, items] of byMetric) {
        const latest = items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
        if (latest) {
          result[metricName] = {
            value: latest.value,
            formatted: latest.formattedValue,
            date: latest.date,
            change: latest.changeValue,
            lastUpdated: latest.fetchedAt,
            source: latest.source,
            isFallback: latest.isFallback,
            error: latest.errorMessage
          };
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting all latest metrics data:', error);
      return {};
    }
  }

  // Store freshness data
  storeFreshnessData(metricName: string, freshness: DataFreshnessStatus): boolean {
    try {
      const freshnessData = this.readFile<StoredFreshness[]>(FRESHNESS_FILE, []);
      const now = new Date().toISOString();

      // Remove existing entry for this metric
      const filtered = freshnessData.filter(f => f.metricName !== metricName);

      // Add new entry
      const newFreshness: StoredFreshness = {
        metricName,
        lastSuccessfulFetch: freshness.lastUpdated?.toISOString() || null,
        lastAttemptedFetch: now,
        stalenessHours: freshness.staleness,
        freshnessStatus: freshness.status,
        nextExpectedUpdate: freshness.nextExpectedUpdate?.toISOString() || null,
        consecutiveFailures: 0, // TODO: Track failures
        updatedAt: now
      };

      filtered.push(newFreshness);
      return this.writeFile(FRESHNESS_FILE, filtered);
    } catch (error) {
      console.error('Error storing freshness data:', error);
      return false;
    }
  }

  // Get freshness data
  getFreshnessData(metricName: string): StoredFreshness | null {
    try {
      const freshnessData = this.readFile<StoredFreshness[]>(FRESHNESS_FILE, []);
      return freshnessData.find(f => f.metricName === metricName) || null;
    } catch (error) {
      console.error('Error getting freshness data:', error);
      return null;
    }
  }

  // Store API health data
  storeApiHealth(apiName: string, status: string, responseTime?: number, errorMessage?: string): boolean {
    try {
      const healthData = this.readFile<StoredApiHealth[]>(API_HEALTH_FILE, []);
      const now = new Date().toISOString();

      const newHealth: StoredApiHealth = {
        apiName,
        status,
        responseTimeMs: responseTime || null,
        errorMessage: errorMessage || null,
        consecutiveFailures: 0, // TODO: Calculate from history
        successRate: 100.0, // TODO: Calculate from recent history
        checkedAt: now
      };

      healthData.push(newHealth);

      // Keep only recent health data (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const filtered = healthData.filter(h => h.checkedAt > sevenDaysAgo);

      return this.writeFile(API_HEALTH_FILE, filtered);
    } catch (error) {
      console.error('Error storing API health data:', error);
      return false;
    }
  }

  // Cache data with expiration
  cacheData(key: string, data: any, expirationMs: number = 60 * 60 * 1000): boolean {
    try {
      const cacheData = this.readFile<CacheEntry[]>(CACHE_FILE, []);
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + expirationMs).toISOString();

      // Remove existing entry
      const filtered = cacheData.filter(c => c.key !== key);

      // Add new entry
      const newEntry: CacheEntry = {
        key,
        data,
        expiresAt,
        createdAt: now,
        accessCount: 1,
        lastAccessed: now
      };

      filtered.push(newEntry);
      return this.writeFile(CACHE_FILE, filtered);
    } catch (error) {
      console.error('Error caching data:', error);
      return false;
    }
  }

  // Get cached data
  getCachedData(key: string): any | null {
    try {
      const cacheData = this.readFile<CacheEntry[]>(CACHE_FILE, []);
      const entry = cacheData.find(c => c.key === key);

      if (!entry) return null;

      // Check expiration
      if (new Date(entry.expiresAt) < new Date()) {
        // Remove expired entry
        const filtered = cacheData.filter(c => c.key !== key);
        this.writeFile(CACHE_FILE, filtered);
        return null;
      }

      // Update access count and time
      entry.accessCount++;
      entry.lastAccessed = new Date().toISOString();
      this.writeFile(CACHE_FILE, cacheData);

      return entry.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  // Clean up old data
  cleanup(): boolean {
    try {
      const cutoffDate = new Date(Date.now() - this.maxDataAge).toISOString();

      // Clean metric data
      const metricData = this.readFile<StoredMetricData[]>(METRIC_DATA_FILE, []);
      const cleanMetricData = metricData.filter(d => d.createdAt > cutoffDate);
      this.writeFile(METRIC_DATA_FILE, cleanMetricData);

      // Clean API health data (keep 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const healthData = this.readFile<StoredApiHealth[]>(API_HEALTH_FILE, []);
      const cleanHealthData = healthData.filter(h => h.checkedAt > sevenDaysAgo);
      this.writeFile(API_HEALTH_FILE, cleanHealthData);

      // Clean expired cache
      const cacheData = this.readFile<CacheEntry[]>(CACHE_FILE, []);
      const now = new Date().toISOString();
      const cleanCacheData = cacheData.filter(c => c.expiresAt > now);
      this.writeFile(CACHE_FILE, cleanCacheData);

      console.log('File storage cleanup completed');
      return true;
    } catch (error) {
      console.error('Error during cleanup:', error);
      return false;
    }
  }

  // Get storage statistics
  getStats() {
    try {
      const metrics = this.readFile<StoredMetric[]>(METRICS_FILE, []);
      const metricData = this.readFile<StoredMetricData[]>(METRIC_DATA_FILE, []);
      const freshness = this.readFile<StoredFreshness[]>(FRESHNESS_FILE, []);
      const apiHealth = this.readFile<StoredApiHealth[]>(API_HEALTH_FILE, []);
      const cache = this.readFile<CacheEntry[]>(CACHE_FILE, []);

      // Calculate directory size
      let totalSize = 0;
      try {
        const files = [METRICS_FILE, METRIC_DATA_FILE, FRESHNESS_FILE, API_HEALTH_FILE, CACHE_FILE];
        for (const file of files) {
          if (fs.existsSync(file)) {
            totalSize += fs.statSync(file).size;
          }
        }
      } catch (error) {
        console.warn('Could not calculate storage size:', error);
      }

      return {
        metrics: { count: metrics.length },
        metricData: { count: metricData.length },
        freshness: { count: freshness.length },
        apiHealth: { count: apiHealth.length },
        cache: { count: cache.length },
        totalSizeBytes: totalSize,
        storageDir: STORAGE_DIR
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return null;
    }
  }

  // Get historical metric data for a specific metric
  getHistoricalMetricData(metricName: string, limit: number = 100): StoredMetricData[] {
    try {
      const metricData = this.readFile<StoredMetricData[]>(METRIC_DATA_FILE, []);
      return metricData
        .filter(d => d.metricName === metricName)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting historical metric data:', error);
      return [];
    }
  }

  // Get all historical data (for multiple metrics)
  getAllHistoricalData(): StoredMetricData[] {
    try {
      const metricData = this.readFile<StoredMetricData[]>(METRIC_DATA_FILE, []);
      return metricData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error getting all historical data:', error);
      return [];
    }
  }

  // Check if storage is available
  isAvailable(): boolean {
    return this.isInitialized;
  }
}

// Singleton instance
let fileStorage: FileStorage | null = null;

export function getFileStorage(): FileStorage {
  if (!fileStorage) {
    fileStorage = new FileStorage();
  }
  return fileStorage;
}

export { FileStorage };
export type { StoredMetric, StoredMetricData, StoredFreshness, StoredApiHealth, CacheEntry };