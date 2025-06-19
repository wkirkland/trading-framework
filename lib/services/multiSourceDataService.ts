// lib/services/multiSourceDataService.ts
import type { Metric as PocMetricConfig, AlphaVantageFunctionParams } from '@/lib/data/metrics'; // Import PoC metric config

export interface MetricValue { // Exporting for use in route.ts
    value: number | null;
    date: string;
    change?: number;
    formatted?: string;
    source?: string;
}

interface CachedMarketData {
  data: MetricValue;
  timestamp: number;
}

class MultiSourceDataService {
  private alphaVantageBaseUrl = 'https://www.alphavantage.co/query';
  private alphaVantageApiKey: string;
  private marketCache: Map<string, CachedMarketData> = new Map();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
  private readonly API_REQUEST_DELAY = 15000; // Alpha Vantage free tier allows ~5 calls/min, so ~12-15s delay. Increased for safety.

  constructor() {
    this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
    if (!this.alphaVantageApiKey) {
      console.warn('Alpha Vantage API key not found. Set ALPHA_VANTAGE_API_KEY in environment variables.');
    }
  }

  private getCachedMarketData(metricName: string): MetricValue | null { // Key cache by metricName
    const cached = this.marketCache.get(metricName);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`AlphaVantage Service: Using cached market data for ${metricName}`);
      return cached.data;
    }
    return null;
  }

  private setCachedMarketData(metricName: string, data: MetricValue): void { // Key cache by metricName
    this.marketCache.set(metricName, {
      data,
      timestamp: Date.now()
    });
  }

  private getMarketFallbackData(metricName: string, errorReason: string = "Fallback"): MetricValue {
    console.log(`AlphaVantage Service: Using fallback data for ${metricName} due to: ${errorReason}`);
    const fallbacks: Record<string, MetricValue> = {
      'VIX Index': { value: 18.5, date: 'N/A', formatted: '18.5 (Fallback)', source: 'Fallback Data', change: 0 },
      'S&P 500': { value: 4385, date: 'N/A', formatted: '$4,385 (Fallback)', source: 'Fallback Data', change: 0 },
      'Consumer Confidence Index': { value: 100, date: 'N/A', formatted: '100.0 (Fallback)', source: 'Fallback Data', change: 0 }
    };
    return fallbacks[metricName] || { value: null, date: '', formatted: 'No Data (Fallback)', source: 'Fallback Data' };
  }

  // Modified to handle different AlphaVantageFunctionParams or simple symbols
  // The metricName is the display name from metrics.ts
  async fetchAVDataForMetric(metricConfig: PocMetricConfig): Promise<MetricValue> {
    const metricName = metricConfig.name;
    const cachedData = this.getCachedMarketData(metricName);
    if (cachedData) return cachedData;

    if (!metricConfig.apiIdentifier?.alphaVantage) {
      console.warn(`AlphaVantage Service: No AlphaVantage API identifier for metric: ${metricName}`);
      return this.getMarketFallbackData(metricName, "Missing API Identifier");
    }

    let url = '';
    let symbolForQuote = ''; // Used if function is GLOBAL_QUOTE or TIME_SERIES_DAILY

    const avIdentifier = metricConfig.apiIdentifier.alphaVantage;

    if (typeof avIdentifier === 'string') { // Simple symbol, assume GLOBAL_QUOTE or TIME_SERIES_DAILY
      symbolForQuote = avIdentifier;
      // For PoC, let's default to GLOBAL_QUOTE for simple symbols if they are ETFs like SPY
      // TIME_SERIES_DAILY for indices like ^VIX might need different parsing
      // We will adjust based on metrics.ts configuration
      // Defaulting to GLOBAL_QUOTE for simplicity if just a string is passed for now.
      // The updated metrics.ts uses object for VIX and SPY.
      // This path might not be hit with current PoC metrics.ts setup.
      url = `${this.alphaVantageBaseUrl}?function=GLOBAL_QUOTE&symbol=${symbolForQuote}&apikey=${this.alphaVantageApiKey}`;
      console.log(`AlphaVantage Service: Fetching (simple symbol) ${metricName} using GLOBAL_QUOTE for ${symbolForQuote}`);

    } else { // AlphaVantageFunctionParams object
      const params = avIdentifier as AlphaVantageFunctionParams;
      symbolForQuote = params.symbol || ''; // Store for parsing Global Quote or Time Series
      let queryString = `function=${params.function}`;
      if (params.symbol) queryString += `&symbol=${params.symbol}`;
      if (params.interval) queryString += `&interval=${params.interval}`;
      if (params.maturity) queryString += `&maturity=${params.maturity}`;
      if (params.from_symbol) queryString += `&from_symbol=${params.from_symbol}`;
      if (params.to_symbol) queryString += `&to_symbol=${params.to_symbol}`;
      // Add other params as needed
      url = `${this.alphaVantageBaseUrl}?${queryString}&apikey=${this.alphaVantageApiKey}`;
      console.log(`AlphaVantage Service: Fetching ${metricName} using function ${params.function} for symbol ${params.symbol || 'N/A'}`);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorBody = await response.text();
        console.warn(`AlphaVantage Service: API error for ${metricName} (${symbolForQuote || 'N/A'}): ${response.status}. Body: ${errorBody}`);
        return this.getMarketFallbackData(metricName, `API Error ${response.status}`);
      }

      const data = await response.json();

      if (data['Error Message'] || data['Note']) {
        const note = data['Note'];
        if (note && note.includes("Our standard API call frequency is 5 calls per minute and 100 calls per day.")) {
            console.error(`AlphaVantage Service: API LIMIT REACHED for ${metricName}. ${note}`);
            // Potentially implement a backoff or stop further AV calls for a period
        } else {
            console.warn(`AlphaVantage Service: API returned message for ${metricName}:`, data['Error Message'] || note);
        }
        return this.getMarketFallbackData(metricName, data['Error Message'] || note || "API Limit/Error");
      }

      // --- PARSING LOGIC based on AlphaVantage function ---
      let value: number | null = null;
      let date: string = new Date().toISOString().split('T')[0];
      let change: number | undefined = undefined;

      const avFunction = typeof avIdentifier === 'string' ? 'GLOBAL_QUOTE' : (avIdentifier as AlphaVantageFunctionParams).function;

      if (avFunction === 'GLOBAL_QUOTE' && data['Global Quote']) {
        const quote = data['Global Quote'];
        value = parseFloat(quote['05. price']);
        change = parseFloat(quote['09. change']);
        date = quote['07. latest trading day'] || date;
      } else if (avFunction === 'TIME_SERIES_DAILY' && data['Time Series (Daily)']) {
        // For VIX (^VIX) using TIME_SERIES_DAILY
        const timeSeries = data['Time Series (Daily)'];
        const latestDate = Object.keys(timeSeries)[0];
        if (latestDate && timeSeries[latestDate]) {
          value = parseFloat(timeSeries[latestDate]['4. close']); // Typically use close for daily series
          date = latestDate;
          // Calculate change if more than one date is available
          const prevDate = Object.keys(timeSeries)[1];
          if (prevDate && timeSeries[prevDate]) {
            const prevValue = parseFloat(timeSeries[prevDate]['4. close']);
            if (!isNaN(value) && !isNaN(prevValue)) {
              change = value - prevValue;
            }
          }
        }
      } else if (avFunction === 'CONSUMER_SENTIMENT' && data['data'] && data['data'].length > 0) {
        // For Consumer Sentiment
        const latestDataPoint = data['data'][0];
        value = parseFloat(latestDataPoint['value']);
        date = latestDataPoint['date'];
        // AV Consumer Sentiment often doesn't provide 'change' directly.
        if (data['data'].length > 1) {
            const prevDataPoint = data['data'][1];
            const prevValue = parseFloat(prevDataPoint['value']);
            if(!isNaN(value) && !isNaN(prevValue)) {
                change = value - prevValue;
            }
        }
      }
      // TODO: Add parsers for other AlphaVantage functions if used by PoC metrics
      // e.g., CPI, TREASURY_YIELD, FX_DAILY (if we switch Dollar Index back)

      if (value === null || isNaN(value)) {
        console.warn(`AlphaVantage Service: Could not parse value for ${metricName} from function ${avFunction}`);
        return this.getMarketFallbackData(metricName, `Parsing error for ${avFunction}`);
      }

      const result: MetricValue = {
        value, date, change,
        formatted: this.formatMarketValue(metricName, value),
        source: 'Alpha Vantage'
      };
      this.setCachedMarketData(metricName, result);
      return result;

    } catch (error: any) {
      console.error(`AlphaVantage Service: Error fetching/parsing for ${metricName}:`, error);
      return this.getMarketFallbackData(metricName, error.message || "Fetch/Parse error");
    }
  }


  private formatMarketValue(metricName: string, value: number): string {
    if (isNaN(value) || value === null) return 'N/A';
    switch (metricName) {
      case 'VIX Index': return value.toFixed(1);
      case 'S&P 500': return value.toFixed(0); // Assuming SPY price, not index points. $ can be added in UI.
      // case 'Dollar Index': return value.toFixed(1); // Dollar Index now from FRED for PoC
      case 'Consumer Confidence Index': return value.toFixed(1);
      // case 'Gold Price': return `$${value.toFixed(0)}`; // Not in PoC list
      default: return value.toFixed(2);
    }
  }

  // Modified to take a list of PoC metrics to fetch
  async getAllAdditionalData(alphaVantagePocMetrics: PocMetricConfig[]): Promise<Record<string, MetricValue>> {
    const results: Record<string, MetricValue> = {};

    console.log(`AlphaVantage Service: Preparing to fetch ${alphaVantagePocMetrics.length} configured metrics.`);

    for (const metricConfig of alphaVantagePocMetrics) {
      if (metricConfig.apiSource === 'AlphaVantage' && metricConfig.apiIdentifier?.alphaVantage) {
        console.log(`AlphaVantage Service: Queueing ${metricConfig.name}`);
        try {
          // Stagger API calls heavily for Alpha Vantage free tier
          await new Promise(resolve => setTimeout(resolve, this.API_REQUEST_DELAY * (Object.keys(results).length > 0 ? 1 : 0.1))); // Shorter delay for first, longer for subsequent
          
          const data = await this.fetchAVDataForMetric(metricConfig);
          results[metricConfig.name] = data;

        } catch (error) {
          console.error(`AlphaVantage Service: Error fetching ${metricConfig.name} in getAllAdditionalData loop:`, error);
          results[metricConfig.name] = this.getMarketFallbackData(metricConfig.name, "Loop error");
        }
      }
    }
    console.log(`AlphaVantage Service: Finished fetching ${Object.keys(results).length} metrics.`);
    return results;
  }

  clearMarketCache(): void {
    this.marketCache.clear();
    console.log("AlphaVantage Service: Market cache cleared.");
  }

  getMarketCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.marketCache.size,
      keys: Array.from(this.marketCache.keys())
    };
  }
}

export const multiSourceDataService = new MultiSourceDataService();