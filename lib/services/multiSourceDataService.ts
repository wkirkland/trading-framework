// lib/services/multiSourceDataService.ts

interface MetricValue {
    value: number | null;
    date: string;
    change?: number;
    formatted?: string;
    source?: string;
  }
  
  // BLS Series IDs for additional economic data
  export const BLS_SERIES = {
    SERVICES_PMI: 'LNS14000000', // BLS doesn't have ISM data directly, but has service employment
    ECOMMERCE_EMPLOYMENT: 'CES4300000001', // Electronic Shopping Employment
    WORK_FROM_HOME: 'LNU02073395', // Work from home data (limited)
  } as const;
  
  // Alpha Vantage symbols for market data
  export const ALPHA_VANTAGE_SYMBOLS = {
    VIX: '^VIX', // Volatility Index
    SPY: 'SPY', // S&P 500 ETF
    DXY: 'DX-Y.NYB', // Dollar Index
    GOLD: 'GLD', // Gold ETF
    BONDS_10Y: '^TNX', // 10-Year Treasury Yield
    NASDAQ: '^IXIC', // NASDAQ Composite
    RUSSELL_2000: '^RUT', // Russell 2000
  } as const;
  
  // Census Bureau series (using their API)
  export const CENSUS_SERIES = {
    ECOMMERCE_SALES: 'ECOMSA', // E-commerce sales data
    POPULATION: 'PEP_2021_PEPANNRES', // Annual population estimates
  } as const;
  
  class MultiSourceDataService {
    private blsBaseUrl = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';
    private alphaVantageBaseUrl = 'https://www.alphavantage.co/query';
    private censusBaseUrl = 'https://api.census.gov/data';
    private fredBaseUrl = 'https://api.stlouisfed.org/fred';
    
    private fredApiKey: string;
    private alphaVantageApiKey: string;
  
    constructor() {
      this.fredApiKey = process.env.FRED_API_KEY || '';
      this.alphaVantageApiKey = process.env.ALPHA_VANTAGE_API_KEY || '';
      
      if (!this.fredApiKey) {
        console.warn('FRED API key not found.');
      }
      if (!this.alphaVantageApiKey) {
        console.warn('Alpha Vantage API key not found.');
      }
    }
  
    /**
     * Fetch data from BLS API
     */
    async getBLSData(seriesId: string): Promise<MetricValue> {
      try {
        const currentYear = new Date().getFullYear();
        const lastYear = currentYear - 1;
        
        const requestBody = {
          seriesid: [seriesId],
          startyear: lastYear.toString(),
          endyear: currentYear.toString(),
          registrationkey: undefined // Using public API without registration
        };
  
        const response = await fetch(this.blsBaseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        });
  
        if (!response.ok) {
          throw new Error(`BLS API error: ${response.status}`);
        }
  
        const data = await response.json();
        
        if (!data.Results || !data.Results.series || data.Results.series.length === 0) {
          return { value: null, date: '', formatted: 'No data', source: 'BLS' };
        }
  
        const series = data.Results.series[0];
        if (!series.data || series.data.length === 0) {
          return { value: null, date: '', formatted: 'No data', source: 'BLS' };
        }
  
        // Get the most recent data point
        const latest = series.data[0];
        const value = parseFloat(latest.value);
        
        // Calculate change if we have previous data
        let change: number | undefined;
        if (series.data.length > 1) {
          const previous = parseFloat(series.data[1].value);
          if (!isNaN(previous)) {
            change = value - previous;
          }
        }
  
        return {
          value: isNaN(value) ? null : value,
          date: `${latest.year}-${latest.period.replace('M', '').padStart(2, '0')}-01`,
          change,
          formatted: this.formatBLSValue(seriesId, value),
          source: 'BLS'
        };
      } catch (error) {
        console.error(`Error fetching BLS data for ${seriesId}:`, error);
        return { value: null, date: '', formatted: 'Error', source: 'BLS' };
      }
    }
  
    /**
     * Fetch data from Alpha Vantage API
     */
    async getAlphaVantageData(symbol: string, type: 'INDEX' | 'ETF' | 'FOREX' = 'INDEX'): Promise<MetricValue> {
        try {
        let functionType = 'GLOBAL_QUOTE';
        let dataKey = 'Global Quote';
        let actualSymbol = symbol;
        
        // Special handling for different data types
        if (symbol === '^VIX') {
            // VIX handling - use VIX ETF instead
            actualSymbol = 'VIXY';
            functionType = 'GLOBAL_QUOTE';
        } else if (symbol === 'DX-Y.NYB') {
            // Dollar Index - use Dollar ETF proxy instead
            actualSymbol = 'UUP';
            functionType = 'GLOBAL_QUOTE';
        }
    
        const url = `${this.alphaVantageBaseUrl}?function=${functionType}&symbol=${actualSymbol}&apikey=${this.alphaVantageApiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Alpha Vantage API error: ${response.status}`);
        }
    
        const data = await response.json();
        
        if (data['Error Message'] || data['Note']) {
            console.warn(`Alpha Vantage error for ${actualSymbol}:`, data['Error Message'] || data['Note']);
            return { value: null, date: '', formatted: 'API limit', source: 'Alpha Vantage' };
        }
    
        const quote = data[dataKey];
        if (!quote) {
            return { value: null, date: '', formatted: 'No data', source: 'Alpha Vantage' };
        }
    
        const price = parseFloat(quote['05. price'] || quote['4. close'] || '0');
        const change = parseFloat(quote['09. change'] || quote['6. change'] || '0');
        
        return {
            value: isNaN(price) ? null : price,
            date: quote['07. latest trading day'] || new Date().toISOString().split('T')[0],
            change: isNaN(change) ? undefined : change,
            formatted: this.formatAlphaVantageValue(actualSymbol, price),
            source: 'Alpha Vantage'
        };
        } catch (error) {
        console.error(`Error fetching Alpha Vantage data for ${symbol}:`, error);
        return { value: null, date: '', formatted: 'Error', source: 'Alpha Vantage' };
        }
    }
  
    /**
     * Get specific market indicators
     */
    async getVIX(): Promise<MetricValue> {
      return this.getAlphaVantageData('^VIX', 'INDEX');
    }
  
    async getSP500(): Promise<MetricValue> {
      return this.getAlphaVantageData('SPY', 'ETF');
    }
  
    async getDollarIndex(): Promise<MetricValue> {
      return this.getAlphaVantageData('DX-Y.NYB', 'FOREX');
    }
  
    async getGold(): Promise<MetricValue> {
      return this.getAlphaVantageData('GLD', 'ETF');
    }
  
    /**
     * Fetch Census Bureau e-commerce data
     */
    async getCensusEcommerceData(): Promise<MetricValue> {
      try {
        // Census Bureau e-commerce data
        const url = 'https://api.census.gov/data/timeseries/eits/marts?get=cell_value,data_type_code,time_slot_id,error_data,category_code&for=us:*&time=2023';
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Census API error: ${response.status}`);
        }
  
        const data = await response.json();
        
        if (!data || data.length < 2) {
          return { value: null, date: '', formatted: 'No data', source: 'Census Bureau' };
        }
  
        // Find e-commerce data (this is a simplified approach)
        // Real implementation would need to parse the specific data structure
        const ecommerceData = data[1]; // Simplified - would need proper parsing
        const value = parseFloat(ecommerceData[0]);
        
        return {
          value: isNaN(value) ? null : value,
          date: new Date().toISOString().split('T')[0],
          change: undefined,
          formatted: this.formatCensusValue('ECOMMERCE', value),
          source: 'Census Bureau'
        };
      } catch (error) {
        console.error('Error fetching Census e-commerce data:', error);
        return { value: null, date: '', formatted: 'Error', source: 'Census Bureau' };
      }
    }
  
    /**
     * Format BLS values
     */
    private formatBLSValue(seriesId: string, value: number): string {
      if (isNaN(value)) return 'N/A';
  
      // Employment numbers (in thousands)
      if (seriesId.includes('CES') || seriesId.includes('LNS')) {
        return `${(value / 1000).toFixed(0)}K`;
      }
  
      // Default formatting
      return value.toFixed(1);
    }
  
    /**
     * Format Alpha Vantage values
     */
    private formatAlphaVantageValue(symbol: string, value: number): string {
      if (isNaN(value)) return 'N/A';
  
      // VIX (volatility index)
      if (symbol.includes('VIX')) {
        return value.toFixed(2);
      }
  
      // Stock prices and ETFs
      if (symbol.includes('SPY') || symbol.includes('GLD') || symbol.includes('IXIC') || symbol.includes('RUT')) {
        return `$${value.toFixed(2)}`;
      }
  
      // Dollar Index
      if (symbol.includes('DXY') || symbol.includes('DX-Y')) {
        return value.toFixed(2);
      }
  
      // Treasury yields (percentage)
      if (symbol.includes('TNX')) {
        return `${value.toFixed(2)}%`;
      }
  
      // Default
      return value.toFixed(2);
    }
  
    /**
     * Format Census values
     */
    private formatCensusValue(type: string, value: number): string {
      if (isNaN(value)) return 'N/A';
  
      if (type === 'ECOMMERCE') {
        return `${value.toFixed(1)}%`;
      }
  
      return value.toFixed(2);
    }
  
    /**
     * Get all additional data sources
     */
    async getAllAdditionalData(): Promise<Record<string, MetricValue>> {
      const results: Record<string, MetricValue> = {};
  
      // Alpha Vantage data (market indicators)
      const marketPromises = [
        { key: 'VIX Index', promise: this.getVIX() },
        { key: 'S&P 500', promise: this.getSP500() },
        { key: 'Dollar Index', promise: this.getDollarIndex() },
        { key: 'Gold Price', promise: this.getGold() }
      ];
  
      // BLS data (limited - most ISM data isn't directly available)
      const blsPromises = [
        { key: 'E-commerce Employment', promise: this.getBLSData(BLS_SERIES.ECOMMERCE_EMPLOYMENT) }
      ];
  
      // Execute all promises
      const allPromises = [...marketPromises, ...blsPromises];
      const responses = await Promise.allSettled(allPromises.map(p => p.promise));
  
      allPromises.forEach((item, index) => {
        const response = responses[index];
        if (response.status === 'fulfilled') {
          results[item.key] = response.value;
        } else {
          results[item.key] = { value: null, date: '', formatted: 'Error' };
        }
      });
  
      return results;
    }
  }
  
  // Export singleton instance
  export const multiSourceDataService = new MultiSourceDataService();