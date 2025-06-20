// lib/services/fredService.ts

import { getFredClient, FredRequestError, FredAuthError } from '@/lib/http/fredClient';

interface FredDataPoint {
  date: string;
  value: string; // Values from FRED API are strings initially
}

interface FredApiResponse {
  observations: FredDataPoint[];
}

// This interface is what the service's methods will return for each series.
// The API route will then map this to its ApiResponseMetricData.
export interface MetricValue {
  value: number | null;
  date: string;
  change?: number;       // Change from the immediate prior observation point
  formatted?: string;    // Formatted value string
  // Note: source, seriesId, originalName, units will be added by the API route
}

interface CachedData {
  data: MetricValue;
  timestamp: number;
}

// This object can be used internally by formatValue if needed,
// or formatValue can become more dynamic.
// These are the *actual correct FRED Series IDs* for our PoC metrics sourced from FRED.
const KNOWN_FRED_POC_SERIES_IDS = {
  REAL_GDP_GROWTH_RATE: 'A191RL1Q225SBEA',
  MANUFACTURING_PMI: 'NAPM',
  SERVICES_PMI: 'NMFCI', // Could also be ISMNNPMI, verify on FRED for best one
  INDUSTRIAL_PRODUCTION_INDEX_LEVEL: 'INDPRO', // Level, YoY calc needed if rules expect %
  CAPACITY_UTILIZATION_RATE: 'TCU',
  UNEMPLOYMENT_RATE_U3: 'UNRATE',
  INITIAL_JOBLESS_CLAIMS: 'ICSA',
  JOB_OPENINGS_JOLTS: 'JTSJOL',
  LABOR_FORCE_PARTICIPATION_RATE: 'CIVPART',
  CORE_CPI_STICKY_YOY: 'CORESTICKM159SFRBATL', // Sticky Price Core CPI YoY % SA
  // If CORESTICKM159SFRBATL is not desired, and you want traditional Core CPI YoY:
  // CORE_CPI_TRADITIONAL_YOY: 'CPIUFSL_PCH', // Or similar, after verifying on FRED
  // CORE_CPI_LEVEL_FOR_YOY_CALC: 'CPILFESL', // If calculating YoY manually
  FIVE_YEAR_FIVE_YEAR_FORWARD_INFLATION_RATE: 'T5YIFR',
  FED_FUNDS_RATE_DAILY: 'DFF',
  TEN_YEAR_TREASURY_YIELD_DAILY: 'DGS10',
  DOLLAR_INDEX_TRADE_WEIGHTED_BROAD: 'DTWEXBGS',
  CONFERENCE_BOARD_LEI: 'USSLIND',
  CHICAGO_FED_CFNAI: 'CFNAI',
} as const;


class FredService {
  private cache: Map<string, CachedData> = new Map();
  private lastRequestTime = 0;
  private readonly RATE_LIMIT_DELAY = 1200; // Milliseconds between requests
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
  private fredClient: ReturnType<typeof getFredClient>;

  constructor() {
    try {
      this.fredClient = getFredClient();
    } catch (error) {
      if (error instanceof FredAuthError) {
        console.warn('FRED SERVICE: API key not found. Set FRED_API_KEY in environment variables.');
        throw error;
      }
      throw error;
    }
  }

  private async makeRateLimitedRequest(seriesId: string): Promise<FredApiResponse> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
      const delay = this.RATE_LIMIT_DELAY - timeSinceLastRequest;
      console.log(`FRED Service: Rate limiting, delaying for ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    this.lastRequestTime = Date.now();
    
    const response = await this.fredClient.getSeriesObservations(seriesId, {
      limit: 10,
      sortOrder: 'desc',
      observationStart: '2000-01-01',
    });
    
    return response.fredJson<FredApiResponse>();
  }

  private getCachedData(seriesId: string): MetricValue | null {
    const cached = this.cache.get(seriesId);
    if (cached && (Date.now() - cached.timestamp < this.CACHE_DURATION)) {
      console.log(`FRED Service: Using cached data for ${seriesId}`);
      return cached.data;
    }
    this.cache.delete(seriesId); // Expired or not found
    return null;
  }

  private setCachedData(seriesId: string, data: MetricValue): void {
    this.cache.set(seriesId, { data, timestamp: Date.now() });
  }

  // TODO for full PoC: This function needs to be enhanced if YoY calculations are to be done here.
  // It would need to fetch more historical data (e.g., 13 points for monthly YoY)
  // and return both current and prior year values, or the calculated YoY.
  // For now, it fetches latest 10 points and calculates change from immediate prior point.
  async getLatestValue(seriesId: string): Promise<MetricValue> {
    const cachedData = this.getCachedData(seriesId);
    if (cachedData) return cachedData;

    try {
      console.log(`FRED Service: Fetching ${seriesId}`);
      
      const data = await this.makeRateLimitedRequest(seriesId);

      if (!data.observations || data.observations.length === 0) {
        console.warn(`FRED Service: No observations array for ${seriesId}`);
        return this.getFallbackData(seriesId, 'No observations array');
      }

      const validObservations = data.observations.filter(obs => obs.value !== '.' && obs.value !== null && obs.value !== undefined);

      if (validObservations.length === 0) {
        console.warn(`FRED Service: No valid (non-''.') observations for ${seriesId}`);
        return this.getFallbackData(seriesId, 'No valid observations');
      }

      const latestObservation = validObservations[0];
      const currentValue = parseFloat(latestObservation.value);

      let change: number | undefined;
      if (validObservations.length > 1) {
        const previousValue = parseFloat(validObservations[1].value);
        if (!isNaN(currentValue) && !isNaN(previousValue)) {
          change = currentValue - previousValue;
        }
      }

      const result: MetricValue = {
        value: isNaN(currentValue) ? null : currentValue,
        date: latestObservation.date,
        change,
        formatted: this.formatValue(seriesId, currentValue), // Pass only necessary info
      };

      this.setCachedData(seriesId, result);
      return result;

    } catch (error: any) {
      if (error instanceof FredRequestError) {
        console.warn(`FRED Service: API error for ${seriesId}: ${error.status} ${error.statusText}`);
        return this.getFallbackData(seriesId, `API Error ${error.status}`);
      }
      if (error instanceof FredAuthError) {
        console.error(`FRED Service: Authentication error for ${seriesId}:`, error.message);
        return this.getFallbackData(seriesId, 'Authentication Error');
      }
      console.error(`FRED Service: Unexpected error fetching ${seriesId}:`, error);
      return this.getFallbackData(seriesId, error.message || 'Generic fetch error');
    }
  }

  private getFallbackData(seriesId: string, errorReason?: string): MetricValue {
    const reason = errorReason || "Fallback";
    console.log(`FRED Service: Using fallback data for ${seriesId} due to: ${reason}`);
    // Fallbacks specific to PoC series IDs
    const fallbacks: Record<string, MetricValue> = {
      [KNOWN_FRED_POC_SERIES_IDS.UNEMPLOYMENT_RATE_U3]: { value: 3.9, date: 'N/A', formatted: '3.9%' },
      [KNOWN_FRED_POC_SERIES_IDS.FED_FUNDS_RATE_DAILY]: { value: 5.33, date: 'N/A', formatted: '5.33%' }, // Example
      [KNOWN_FRED_POC_SERIES_IDS.TEN_YEAR_TREASURY_YIELD_DAILY]: { value: 4.50, date: 'N/A', formatted: '4.50%' },
      [KNOWN_FRED_POC_SERIES_IDS.INITIAL_JOBLESS_CLAIMS]: { value: 230000, date: 'N/A', formatted: '230K' }, // Value is number, not K
      [KNOWN_FRED_POC_SERIES_IDS.CORE_CPI_STICKY_YOY]: { value: 3.0, date: 'N/A', formatted: '3.0%' }, // Example YoY
    };
    return fallbacks[seriesId] || { value: null, date: '', formatted: 'No Data (Fallback)' };
  }

  async getBulkData(seriesIds: string[]): Promise<Record<string, MetricValue>> {
    const results: Record<string, MetricValue> = {};
    const batchSize = Math.min(seriesIds.length, 5); // Ensure batchSize isn't larger than total series
    
    for (let i = 0; i < seriesIds.length; i += batchSize) {
      const batch = seriesIds.slice(i, i + batchSize);
      console.log(`FRED Service: Processing batch ${Math.floor(i/batchSize) + 1} for series: ${batch.join(', ')}`);
      
      const batchPromises = batch.map(seriesId =>
        this.getLatestValue(seriesId).then(data => ({ seriesId, data }))
      );

      const responses = await Promise.allSettled(batchPromises);

      responses.forEach(responseOutcome => { // Renamed for clarity
        if (responseOutcome.status === 'fulfilled') {
          const { seriesId, data } = responseOutcome.value;
          results[seriesId] = data;
        } else {
          // Error already logged in getLatestValue if it originated there.
          // If Promise.allSettled catches an error not from getLatestValue itself (unlikely here), log it.
          console.error(`FRED Service: Batch promise rejected for a series. Reason:`, responseOutcome.reason);
          // Fallback for the specific series ID would have been handled by getLatestValue,
          // but we need to ensure the key exists in results if an unexpected error happened before getLatestValue's try/catch.
          // This part is tricky without knowing which seriesId failed if the error isn't from getLatestValue.
          // For now, relying on getLatestValue to handle its own fallbacks and populate results.
        }
      });
      // Minimal delay between batches as makeRateLimitedRequest handles per-request delay
      if (i + batchSize < seriesIds.length) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Small courtesy delay
      }
    }
    return results;
  }

  // Updated formatValue to use KNOWN_FRED_POC_SERIES_IDS for more specific formatting.
  // The API route will ultimately decide the final "units" string based on metrics.ts.
  // This formatting is for the `formatted` field returned by the service.
  private formatValue(seriesId: string, value: number): string {
    if (value === null || isNaN(value)) return 'N/A';

    switch (seriesId) {
      case KNOWN_FRED_POC_SERIES_IDS.REAL_GDP_GROWTH_RATE: // A191RL1Q225SBEA
      case KNOWN_FRED_POC_SERIES_IDS.CAPACITY_UTILIZATION_RATE: // TCU
      case KNOWN_FRED_POC_SERIES_IDS.UNEMPLOYMENT_RATE_U3: // UNRATE
      case KNOWN_FRED_POC_SERIES_IDS.LABOR_FORCE_PARTICIPATION_RATE: // CIVPART
      case KNOWN_FRED_POC_SERIES_IDS.CORE_CPI_STICKY_YOY: // CORESTICKM159SFRBATL
      case KNOWN_FRED_POC_SERIES_IDS.FIVE_YEAR_FIVE_YEAR_FORWARD_INFLATION_RATE: // T5YIFR
      case KNOWN_FRED_POC_SERIES_IDS.FED_FUNDS_RATE_DAILY: // DFF
      case KNOWN_FRED_POC_SERIES_IDS.TEN_YEAR_TREASURY_YIELD_DAILY: // DGS10
        return `${value.toFixed(2)}%`;

      case KNOWN_FRED_POC_SERIES_IDS.MANUFACTURING_PMI: // NAPM
      case KNOWN_FRED_POC_SERIES_IDS.SERVICES_PMI:    // NMFCI
      case KNOWN_FRED_POC_SERIES_IDS.INDUSTRIAL_PRODUCTION_INDEX_LEVEL: // INDPRO
      case KNOWN_FRED_POC_SERIES_IDS.CONFERENCE_BOARD_LEI: // USSLIND
      case KNOWN_FRED_POC_SERIES_IDS.CHICAGO_FED_CFNAI: // CFNAI
      case KNOWN_FRED_POC_SERIES_IDS.DOLLAR_INDEX_TRADE_WEIGHTED_BROAD: // DTWEXBGS
        return value.toFixed(1); // Index values

      case KNOWN_FRED_POC_SERIES_IDS.INITIAL_JOBLESS_CLAIMS: // ICSA - value is number
        return `${Math.round(value / 1000)}K`;
      case KNOWN_FRED_POC_SERIES_IDS.JOB_OPENINGS_JOLTS: // JTSJOL - value is in thousands
        return `${(value / 1000).toFixed(1)}M`; // Display as Millions

      default:
        // Attempt generic formatting based on common FRED patterns if ID not in KNOWN_FRED_POC_SERIES_IDS
        if (seriesId.includes('RATE') || seriesId.endsWith('PCH') || seriesId.endsWith('PC1')) return `${value.toFixed(2)}%`;
        if (seriesId.startsWith('CPI') || seriesId.startsWith('PCE')) return value.toFixed(3); // Price index levels
        return value.toFixed(2); // Default
    }
  }

  clearCache(): void {
    this.cache.clear();
    console.log("FRED Service: Cache cleared.");
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const fredService = new FredService();

// The old METRIC_TO_FRED_MAPPING and FRED_SERIES are no longer needed here,
// as the API route will derive Series IDs directly from lib/data/metrics.ts.