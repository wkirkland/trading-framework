// lib/services/multiSourceDataService.ts (FIXED for deployment)

interface MetricValue {
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
    private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache for market data
  
    constructor() {
      this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
      
      if (!this.alphaVantageApiKey) {
        console.warn('Alpha Vantage API key not found.');
      }
    }
  
    /**
     * Check cache for market data
     */
    private getCachedMarketData(symbol: string): MetricValue | null {
      const cached = this.marketCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        console.log(`Using cached market data for ${symbol}`);
        return cached.data;
      }
      return null;
    }
  
    /**
     * Cache market data
     */
    private setCachedMarketData(symbol: string, data: MetricValue): void {
      this.marketCache.set(symbol, {
        data,
        timestamp: Date.now()
      });
    }
  
    /**
     * Provide fallback market data when API fails or hits limits
     */
    private getMarketFallbackData(symbol: string): MetricValue {
      const fallbacks: Record<string, MetricValue> = {
        'VIX Index': { 
          value: 18.5, 
          date: '2025-05-29', 
          formatted: '18.5', 
          source: 'Fallback Data',
          change: -0.2 
        },
        'S&P 500': { 
          value: 4385, 
          date: '2025-05-29', 
          formatted: '$4,385', 
          source: 'Fallback Data',
          change: 12.5 
        },
        'Dollar Index': { 
          value: 102.8, 
          date: '2025-05-29', 
          formatted: '102.8', 
          source: 'Fallback Data',
          change: 0.1 
        },
        'Gold Price': { 
          value: 1985, 
          date: '2025-05-29', 
          formatted: '$1,985', 
          source: 'Fallback Data',
          change: -5.2 
        }
      };
  
      console.log(`Using fallback data for ${symbol}`);
      return fallbacks[symbol] || { 
        value: null, 
        date: '', 
        formatted: 'No data', 
        source: 'Fallback Data' 
      };
    }
  
    /**
     * Fetch data from Alpha Vantage API with improved error handling
     */
    async getAlphaVantageData(symbol: string, displayName: string): Promise<MetricValue> {
      // Check cache first
      const cachedData = this.getCachedMarketData(displayName);
      if (cachedData) {
        return cachedData;
      }
  
      try {
        // Map symbols to ETF proxies to avoid complex symbol issues
        const symbolMap: Record<string, string> = {
          '^VIX': 'VIXY',    // VIX ETF proxy
          'SPY': 'SPY',      // S&P 500 ETF
          'DX-Y.NYB': 'UUP', // Dollar ETF proxy
          'GLD': 'GLD'       // Gold ETF
        };
  
        const actualSymbol = symbolMap[symbol] || symbol;
        const functionType = 'GLOBAL_QUOTE';
        const url = `${this.alphaVantageBaseUrl}?function=${functionType}&symbol=${actualSymbol}&apikey=${this.alphaVantageApiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Alpha Vantage API error for ${actualSymbol}: ${response.status}`);
          const fallback = this.getMarketFallbackData(displayName);
          this.setCachedMarketData(displayName, fallback);
          return fallback;
        }
  
        const data = await response.json();
        
        // Check for rate limit or error messages
        if (data['Error Message'] || data['Note']) {
          console.warn(`Alpha Vantage limit/error for ${actualSymbol}:`, data['Error Message'] || data['Note']);
          const fallback = this.getMarketFallbackData(displayName);
          this.setCachedMarketData(displayName, fallback);
          return fallback;
        }
  
        const quote = data['Global Quote'];
        if (!quote) {
          console.warn(`No quote data for ${actualSymbol}`);
          const fallback = this.getMarketFallbackData(displayName);
          this.setCachedMarketData(displayName, fallback);
          return fallback;
        }
  
        const price = parseFloat(quote['05. price'] || '0');
        const change = parseFloat(quote['09. change'] || '0');
        
        if (isNaN(price)) {
          console.warn(`Invalid price data for ${actualSymbol}`);
          const fallback = this.getMarketFallbackData(displayName);
          this.setCachedMarketData(displayName, fallback);
          return fallback;
        }
  
        const result: MetricValue = {
          value: price,
          date: quote['07. latest trading day'] || new Date().toISOString().split('T')[0],
          change: isNaN(change) ? undefined : change,
          formatted: this.formatMarketValue(displayName, price),
          source: 'Alpha Vantage'
        };
  
        // Cache the successful result
        this.setCachedMarketData(displayName, result);
        return result;
  
      } catch (error) {
        console.error(`Error fetching Alpha Vantage data for ${symbol}:`, error);
        const fallback = this.getMarketFallbackData(displayName);
        this.setCachedMarketData(displayName, fallback);
        return fallback;
      }
    }
  
    /**
     * Format market values consistently
     */
    private formatMarketValue(displayName: string, value: number): string {
      if (isNaN(value)) return 'N/A';
  
      switch (displayName) {
        case 'VIX Index':
          return value.toFixed(1);
        case 'S&P 500':
          return `$${value.toFixed(0)}`;
        case 'Dollar Index':
          return value.toFixed(1);
        case 'Gold Price':
          return `$${value.toFixed(0)}`;
        default:
          return value.toFixed(2);
      }
    }
  
    /**
     * Get specific market indicators with fallbacks
     */
    async getVIX(): Promise<MetricValue> {
      return this.getAlphaVantageData('^VIX', 'VIX Index');
    }
  
    async getSP500(): Promise<MetricValue> {
      return this.getAlphaVantageData('SPY', 'S&P 500');
    }
  
    async getDollarIndex(): Promise<MetricValue> {
      return this.getAlphaVantageData('DX-Y.NYB', 'Dollar Index');
    }
  
    async getGold(): Promise<MetricValue> {
      return this.getAlphaVantageData('GLD', 'Gold Price');
    }
  
    /**
     * Get all market data with rate limit protection
     */
    async getAllAdditionalData(): Promise<Record<string, MetricValue>> {
      const results: Record<string, MetricValue> = {};
  
      // Market data with sequential fetching to avoid overwhelming the API
      const marketIndicators = [
        { key: 'VIX Index', method: () => this.getVIX() },
        { key: 'S&P 500', method: () => this.getSP500() },
        { key: 'Dollar Index', method: () => this.getDollarIndex() },
        { key: 'Gold Price', method: () => this.getGold() }
      ];
  
      // Fetch market data sequentially with delays
      for (const indicator of marketIndicators) {
        try {
          results[indicator.key] = await indicator.method();
          
          // Add delay between requests to respect rate limits
          if (marketIndicators.indexOf(indicator) < marketIndicators.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          }
        } catch (error) {
          console.error(`Error fetching ${indicator.key}:`, error);
          results[indicator.key] = this.getMarketFallbackData(indicator.key);
        }
      }
  
      return results;
    }
  
    /**
     * Clear market data cache
     */
    clearMarketCache(): void {
      this.marketCache.clear();
    }
  
    /**
     * Get cache statistics
     */
    getMarketCacheStats(): { size: number; keys: string[] } {
      return {
        size: this.marketCache.size,
        keys: Array.from(this.marketCache.keys())
      };
    }
  }
  
  // Export singleton instance
  export const multiSourceDataService = new MultiSourceDataService();