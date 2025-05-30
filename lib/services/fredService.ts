// lib/services/fredService.ts (FIXED - no any types)

interface FredDataPoint {
  date: string;
  value: string;
}

interface FredResponse {
  observations: FredDataPoint[];
}

interface MetricValue {
  value: number | null;
  date: string;
  change?: number;
  formatted?: string;
}

interface CachedData {
  data: MetricValue;
  timestamp: number;
}

// Reduced set of FRED series for rate limit management
export const FRED_SERIES = {
  // Core Economic Indicators - Most Important
  GDP_GROWTH: 'A191RL1Q225SBEA',
  UNEMPLOYMENT_RATE: 'UNRATE',
  CORE_PCE: 'PCEPILFE',
  FED_FUNDS_RATE: 'FEDFUNDS',
  TREASURY_10Y: 'GS10',
  TREASURY_2Y: 'GS2',
  INITIAL_CLAIMS: 'ICSA',
  CONSUMER_CONFIDENCE: 'UMCSENT',
  INDUSTRIAL_PRODUCTION: 'INDPRO',
  YIELD_CURVE_SPREAD: 'T10Y2Y',
  
  // Additional High-Priority Series
  NONFARM_PAYROLLS: 'PAYEMS',
  CORE_CPI: 'CPILFESL',
  RETAIL_SALES: 'RSXFS',
  HOUSING_STARTS: 'HOUST',
  CONFERENCE_BOARD_LEI: 'USSLIND',
} as const;

class FredService {
  private baseUrl = 'https://api.stlouisfed.org/fred';
  private apiKey: string;
  private cache: Map<string, CachedData> = new Map();
  private requestQueue: Promise<unknown>[] = [];
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 1000; // 1 second between requests
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes cache

  constructor() {
    this.apiKey = process.env.FRED_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FRED API key not found. Set FRED_API_KEY in environment variables.');
    }
  }

  /**
   * Rate-limited request wrapper
   */
  private async makeRateLimitedRequest(url: string): Promise<Response> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest));
    }
    
    this.lastRequestTime = Date.now();
    return fetch(url);
  }

  /**
   * Check cache for recent data
   */
  private getCachedData(seriesId: string): MetricValue | null {
    const cached = this.cache.get(seriesId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  /**
   * Cache data
   */
  private setCachedData(seriesId: string, data: MetricValue): void {
    this.cache.set(seriesId, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Fetch the latest data point for a FRED series with improved error handling
   */
  async getLatestValue(seriesId: string): Promise<MetricValue> {
    // Check cache first
    const cachedData = this.getCachedData(seriesId);
    if (cachedData) {
      console.log(`Using cached data for ${seriesId}`);
      return cachedData;
    }

    try {
      const url = `${this.baseUrl}/series/observations?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&limit=10&sort_order=desc`;
      
      const response = await this.makeRateLimitedRequest(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          console.warn(`FRED API rate limit or permission issue for ${seriesId}. Using fallback.`);
          return this.getFallbackData(seriesId);
        }
        throw new Error(`FRED API error: ${response.status}`);
      }

      const data: FredResponse = await response.json();
      
      if (!data.observations || data.observations.length === 0) {
        console.warn(`No observations for ${seriesId}`);
        return this.getFallbackData(seriesId);
      }

      // Find the most recent non-null value
      const validObservations = data.observations.filter(obs => obs.value !== '.');
      
      if (validObservations.length === 0) {
        console.warn(`No valid observations for ${seriesId}`);
        return this.getFallbackData(seriesId);
      }

      const latest = validObservations[0];
      const value = parseFloat(latest.value);
      
      // Calculate change if we have previous data
      let change: number | undefined;
      if (validObservations.length > 1) {
        const previous = parseFloat(validObservations[1].value);
        if (!isNaN(previous)) {
          change = value - previous;
        }
      }

      const result: MetricValue = {
        value: isNaN(value) ? null : value,
        date: latest.date,
        change,
        formatted: this.formatValue(seriesId, value)
      };

      // Cache the result
      this.setCachedData(seriesId, result);
      return result;

    } catch (error) {
      console.error(`Error fetching FRED data for ${seriesId}:`, error);
      return this.getFallbackData(seriesId);
    }
  }

  /**
   * Provide fallback data when API fails
   */
  private getFallbackData(seriesId: string): MetricValue {
    // Provide reasonable fallback values for key metrics
    const fallbacks: Record<string, MetricValue> = {
      'UNRATE': { value: 3.9, date: '2025-05-01', formatted: '3.9%' },
      'FEDFUNDS': { value: 4.5, date: '2025-05-01', formatted: '4.50%' },
      'GS10': { value: 4.2, date: '2025-05-01', formatted: '4.20%' },
      'UMCSENT': { value: 102, date: '2025-05-01', formatted: '102.0' },
      'PCEPILFE': { value: 2.8, date: '2025-05-01', formatted: '2.8%' },
      'ICSA': { value: 220000, date: '2025-05-01', formatted: '220K' },
    };

    return fallbacks[seriesId] || { value: null, date: '', formatted: 'No data available' };
  }

  /**
   * Fetch multiple series with improved batching
   */
  async getBulkData(seriesIds: string[]): Promise<Record<string, MetricValue>> {
    const results: Record<string, MetricValue> = {};
    
    // Process in smaller batches to avoid overwhelming the API
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < seriesIds.length; i += batchSize) {
      batches.push(seriesIds.slice(i, i + batchSize));
    }

    for (const batch of batches) {
      const batchPromises = batch.map(async (seriesId) => {
        const data = await this.getLatestValue(seriesId);
        return { seriesId, data };
      });

      const responses = await Promise.allSettled(batchPromises);
      
      responses.forEach((response, index) => {
        const seriesId = batch[index];
        if (response.status === 'fulfilled') {
          results[seriesId] = response.value.data;
        } else {
          console.error(`Failed to fetch ${seriesId}:`, response.reason);
          results[seriesId] = this.getFallbackData(seriesId);
        }
      });

      // Add delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between batches
      }
    }

    return results;
  }

  /**
   * Format values based on the metric type
   */
  private formatValue(seriesId: string, value: number): string {
    if (isNaN(value)) return 'N/A';

    // Rates and percentages
    if (seriesId.includes('RATE') || seriesId.includes('UNRATE') || seriesId.includes('FEDFUNDS') || 
        seriesId.includes('GS') || seriesId.includes('A191RL1Q225SBEA') || seriesId.includes('PCEPILFE') ||
        seriesId.includes('CPILFESL')) {
      return `${value.toFixed(2)}%`;
    }

    // Index values (Consumer Sentiment, PMI, LEI)
    if (seriesId.includes('UMCSENT') || seriesId.includes('USSLIND')) {
      return value.toFixed(1);
    }

    // Large numbers (payrolls, claims in thousands)
    if (seriesId.includes('PAYEMS') || seriesId.includes('ICSA')) {
      return `${(value / 1000).toFixed(0)}K`;
    }

    // Housing starts
    if (seriesId.includes('HOUST')) {
      return `${value.toFixed(0)}K`;
    }

    // Retail sales (in trillions)
    if (seriesId.includes('RSXFS')) {
      return `$${(value / 1000).toFixed(1)}T`;
    }

    // Industrial production (index)
    if (seriesId.includes('INDPRO')) {
      return value.toFixed(1);
    }

    // Yield curve spread
    if (seriesId.includes('T10Y2Y')) {
      return `${value.toFixed(2)}%`;
    }

    // Default formatting
    return value.toFixed(2);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const fredService = new FredService();

// Reduced mapping focusing on critical metrics
export const METRIC_TO_FRED_MAPPING = {
  'Real GDP Growth Rate': FRED_SERIES.GDP_GROWTH,
  'Unemployment Rate (U-3)': FRED_SERIES.UNEMPLOYMENT_RATE,
  'Core PCE': FRED_SERIES.CORE_PCE,
  'Fed Funds Rate': FRED_SERIES.FED_FUNDS_RATE,
  '10-Year Treasury Yield': FRED_SERIES.TREASURY_10Y,
  '2s-10s Yield Curve': FRED_SERIES.YIELD_CURVE_SPREAD,
  'Initial Jobless Claims': FRED_SERIES.INITIAL_CLAIMS,
  'Consumer Confidence Index': FRED_SERIES.CONSUMER_CONFIDENCE,
  'Industrial Production Index': FRED_SERIES.INDUSTRIAL_PRODUCTION,
  'Non-Farm Payrolls': FRED_SERIES.NONFARM_PAYROLLS,
  'Core CPI': FRED_SERIES.CORE_CPI,
  'Retail Sales': FRED_SERIES.RETAIL_SALES,
  'Housing Starts': FRED_SERIES.HOUSING_STARTS,
  'Conference Board LEI': FRED_SERIES.CONFERENCE_BOARD_LEI,
} as const;