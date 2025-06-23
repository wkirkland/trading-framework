// lib/services/fallbackService.ts

interface FallbackData {
  value: number | null;
  formatted: string;
  date: string;
  change?: number;
  lastUpdated: string;
  source: string;
  isFallback: true;
}

interface CachedData {
  value: number | null;
  formatted: string;
  date: string;
  change?: number;
  lastUpdated: string;
  source: string;
  timestamp: number;
}

class FallbackService {
  private cache: Map<string, CachedData> = new Map();
  private readonly CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Store data in cache for potential fallback use
   */
  cacheData(metricName: string, data: Omit<CachedData, 'timestamp'>) {
    this.cache.set(metricName, {
      ...data,
      timestamp: Date.now()
    });
  }

  /**
   * Get cached data for a metric
   */
  getCachedData(metricName: string): CachedData | null {
    const cached = this.cache.get(metricName);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > this.CACHE_EXPIRY) {
      this.cache.delete(metricName);
      return null;
    }

    return cached;
  }

  /**
   * Get fallback data for a metric when APIs fail
   */
  getFallbackData(metricName: string): FallbackData | null {
    // First try cached data
    const cached = this.getCachedData(metricName);
    if (cached) {
      return {
        ...cached,
        source: `${cached.source} (cached)`,
        isFallback: true
      };
    }

    // Then try static fallbacks
    const staticFallback = this.getStaticFallback(metricName);
    if (staticFallback) {
      return {
        ...staticFallback,
        isFallback: true
      };
    }

    return null;
  }

  /**
   * Static fallback data for critical metrics
   */
  private getStaticFallback(metricName: string): Omit<FallbackData, 'isFallback'> | null {
    const fallbacks: Record<string, Omit<FallbackData, 'isFallback'>> = {
      'Unemployment Rate (U-3)': {
        value: 3.9,
        formatted: '3.9%',
        date: '2024-12-01',
        change: -0.1,
        lastUpdated: '2024-12-01T00:00:00Z',
        source: 'Historical Average (Fallback)'
      },
      'Fed Funds Rate': {
        value: 5.25,
        formatted: '5.25%',
        date: '2024-12-01',
        change: 0,
        lastUpdated: '2024-12-01T00:00:00Z',
        source: 'Federal Reserve (Fallback)'
      },
      '10-Year Treasury Yield': {
        value: 4.45,
        formatted: '4.45%',
        date: '2024-12-01',
        change: 0.05,
        lastUpdated: '2024-12-01T00:00:00Z',
        source: 'Treasury (Fallback)'
      },
      'VIX Index': {
        value: 18.5,
        formatted: '18.5',
        date: '2024-12-01',
        change: -0.8,
        lastUpdated: '2024-12-01T00:00:00Z',
        source: 'CBOE (Fallback)'
      },
      'S&P 500': {
        value: 4750,
        formatted: '4,750',
        date: '2024-12-01',
        change: 25.5,
        lastUpdated: '2024-12-01T00:00:00Z',
        source: 'Market Data (Fallback)'
      },
      'Core CPI': {
        value: 3.2,
        formatted: '3.2%',
        date: '2024-11-01',
        change: -0.1,
        lastUpdated: '2024-11-01T00:00:00Z',
        source: 'BLS (Fallback)'
      },
      'Manufacturing PMI': {
        value: 48.7,
        formatted: '48.7',
        date: '2024-11-01',
        change: -0.3,
        lastUpdated: '2024-11-01T00:00:00Z',
        source: 'ISM (Fallback)'
      },
      'Initial Jobless Claims': {
        value: 225000,
        formatted: '225K',
        date: '2024-12-01',
        change: -5000,
        lastUpdated: '2024-12-01T00:00:00Z',
        source: 'DOL (Fallback)'
      }
    };

    return fallbacks[metricName] || null;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, data] of this.cache.entries()) {
      if (now - data.timestamp > this.CACHE_EXPIRY) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      metrics: Array.from(this.cache.keys()),
      oldestEntry: Math.min(...Array.from(this.cache.values()).map(d => d.timestamp)),
      newestEntry: Math.max(...Array.from(this.cache.values()).map(d => d.timestamp))
    };
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Determine if data should trigger fallback mode
   */
  shouldUseFallback(data: any, error?: Error): boolean {
    // Use fallback if there's an error
    if (error) return true;

    // Use fallback if data is null/undefined
    if (!data || data.value === null || data.value === undefined) return true;

    // Use fallback if data looks like an error response
    if (data.error || data.message?.includes('error')) return true;

    // Use fallback if data is very stale (older than 7 days)
    if (data.lastUpdated) {
      const lastUpdate = new Date(data.lastUpdated);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceUpdate > 7) return true;
    }

    return false;
  }

  /**
   * Wrap data with fallback capability
   */
  withFallback<T>(
    dataFetcher: () => Promise<T>,
    metricName: string,
    options: {
      cacheDuration?: number;
      retries?: number;
      retryDelay?: number;
    } = {}
  ): Promise<T | FallbackData> {
    const { retries = 2, retryDelay = 1000 } = options;

    return new Promise(async (resolve) => {
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const data = await dataFetcher();
          
          // If data is good, cache it and return
          if (!this.shouldUseFallback(data)) {
            if (data && typeof data === 'object') {
              this.cacheData(metricName, data as any);
            }
            resolve(data);
            return;
          }
        } catch (error) {
          lastError = error as Error;
          console.warn(`Data fetch attempt ${attempt + 1} failed for ${metricName}:`, error);
          
          // Wait before retrying (except on last attempt)
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
          }
        }
      }

      // All attempts failed, use fallback
      console.warn(`All fetch attempts failed for ${metricName}, using fallback data`);
      const fallbackData = this.getFallbackData(metricName);
      
      if (fallbackData) {
        resolve(fallbackData as T);
      } else {
        // If no fallback available, resolve with null/error data
        resolve({
          value: null,
          formatted: 'N/A',
          date: '',
          lastUpdated: new Date().toISOString(),
          source: 'Error (No Fallback)',
          error: lastError?.message || 'Unknown error',
          isFallback: true
        } as T);
      }
    });
  }
}

export const fallbackService = new FallbackService();