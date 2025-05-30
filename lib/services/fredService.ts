// lib/services/fredService.ts

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

// FRED Series IDs for key economic indicators
export const FRED_SERIES = {
  // GDP and Growth
  GDP_GROWTH: 'A191RL1Q225SBEA', // Real GDP Growth Rate (quarterly, annualized %)
  GDP_NOW: 'GDPNOW', // GDPNow (if available, otherwise use quarterly GDP)
  
  // Employment
  UNEMPLOYMENT_RATE: 'UNRATE',
  NONFARM_PAYROLLS: 'PAYEMS',
  INITIAL_CLAIMS: 'ICSA',
  JOB_OPENINGS: 'JTSJOL', // JOLTS Job Openings
  AVERAGE_HOURLY_EARNINGS: 'CES0500000003', // Average Hourly Earnings
  LABOR_FORCE_PARTICIPATION: 'CIVPART', // Labor Force Participation Rate
  
  // Inflation
  CORE_CPI: 'CPILFESL',
  CORE_PCE: 'PCEPILFE',
  PPI: 'PPIACO', // Producer Price Index
  FORWARD_INFLATION_5Y5Y: 'T5YIE', // 5-Year 5-Year Forward Inflation Expectation Rate
  
  // Fed Policy & Rates
  FED_FUNDS_RATE: 'FEDFUNDS',
  TREASURY_10Y: 'GS10',
  TREASURY_2Y: 'GS2',
  FED_BALANCE_SHEET: 'WALCL', // Fed Total Assets
  
  // Consumer & Business
  CONSUMER_CONFIDENCE: 'UMCSENT', // University of Michigan Consumer Sentiment
  RETAIL_SALES: 'RSXFS',
  INDUSTRIAL_PRODUCTION: 'INDPRO',
  PERSONAL_CONSUMPTION: 'PCE', // Personal Consumption Expenditures
  DURABLE_GOODS: 'DGORDER', // Durable Goods Orders
  MANUFACTURING_PMI: 'NAPM', // ISM Manufacturing PMI
  
  // Financial Conditions
  YIELD_CURVE_SPREAD: 'T10Y2Y',
  TED_SPREAD: 'TEDRATE', // TED Spread
  
  // Housing
  HOUSING_STARTS: 'HOUST',
  
  // Composite Indicators
  CONFERENCE_BOARD_LEI: 'LEADRATE', // Conference Board Leading Economic Index
  CHICAGO_FED_CFNAI: 'CFNAI', // Chicago Fed National Activity Index
  CHICAGO_FED_NFCI: 'NFCI', // Chicago Fed National Financial Conditions Index
} as const;

class FredService {
  private baseUrl = 'https://api.stlouisfed.org/fred';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FRED_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FRED API key not found. Set FRED_API_KEY in environment variables.');
    }
  }

  /**
   * Fetch the latest data point for a FRED series
   */
  async getLatestValue(seriesId: string): Promise<MetricValue> {
    try {
      const url = `${this.baseUrl}/series/observations?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&limit=10&sort_order=desc`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`FRED API error: ${response.status}`);
      }

      const data: FredResponse = await response.json();
      
      if (!data.observations || data.observations.length === 0) {
        return { value: null, date: '', formatted: 'No data' };
      }

      // Find the most recent non-null value
      const validObservations = data.observations.filter(obs => obs.value !== '.');
      
      if (validObservations.length === 0) {
        return { value: null, date: '', formatted: 'No data' };
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

      return {
        value: isNaN(value) ? null : value,
        date: latest.date,
        change,
        formatted: this.formatValue(seriesId, value)
      };
    } catch (error) {
      console.error(`Error fetching FRED data for ${seriesId}:`, error);
      return { value: null, date: '', formatted: 'Error' };
    }
  }

  /**
   * Fetch multiple series at once
   */
  async getBulkData(seriesIds: string[]): Promise<Record<string, MetricValue>> {
    const results: Record<string, MetricValue> = {};
    
    // Fetch all series in parallel
    const promises = seriesIds.map(async (seriesId) => {
      const data = await this.getLatestValue(seriesId);
      return { seriesId, data };
    });

    const responses = await Promise.allSettled(promises);
    
    responses.forEach((response, index) => {
      if (response.status === 'fulfilled') {
        results[seriesIds[index]] = response.value.data;
      } else {
        results[seriesIds[index]] = { value: null, date: '', formatted: 'Error' };
      }
    });

    return results;
  }

  /**
   * Format values based on the metric type
   */
  private formatValue(seriesId: string, value: number): string {
    if (isNaN(value)) return 'N/A';

    // Rates and percentages (including GDP growth rate)
    if (seriesId.includes('RATE') || seriesId.includes('UNRATE') || seriesId.includes('FEDFUNDS') || seriesId.includes('GS') || seriesId.includes('A191RL1Q225SBEA') || seriesId.includes('T5YIE')) {
      return `${value.toFixed(2)}%`;
    }

    // PMI and Index values (like Consumer Sentiment, PMI, LEI)
    if (seriesId.includes('UMCSENT') || seriesId.includes('NAPM') || seriesId.includes('LEADRATE') || seriesId.includes('CFNAI') || seriesId.includes('NFCI')) {
      return value.toFixed(1);
    }

    // Large numbers (like payrolls, in thousands - but JOLTS is already in thousands)
    if (seriesId.includes('PAYEMS') || seriesId.includes('ICSA')) {
      return `${(value / 1000).toFixed(0)}K`;
    }

    // JOLTS is already in thousands, so just add K
    if (seriesId.includes('JTSJOL')) {
      return `${value.toFixed(0)}K`;
    }

    // Fed Balance Sheet (in trillions)
    if (seriesId.includes('WALCL')) {
      return `$${(value / 1000).toFixed(1)}T`;
    }

    // Housing starts (in thousands)
    if (seriesId.includes('HOUST')) {
      return `${value.toFixed(0)}K`;
    }

    // Hourly earnings (currency)
    if (seriesId.includes('CES0500000003')) {
      return `$${value.toFixed(2)}`;
    }

    // Participation rate (percentage)
    if (seriesId.includes('CIVPART')) {
      return `${value.toFixed(1)}%`;
    }

    // TED Spread (basis points, but show as percentage)
    if (seriesId.includes('TEDRATE')) {
      return `${value.toFixed(2)}%`;
    }

    // GDP and other large economic indicators
    if (seriesId.includes('GDP') || seriesId.includes('RSXFS') || seriesId.includes('INDPRO') || seriesId.includes('PCE') || seriesId.includes('DGORDER')) {
      if (value > 1000) {
        return `${(value / 1000).toFixed(1)}T`;
      }
      return value.toFixed(1);
    }

    // PPI (index value)
    if (seriesId.includes('PPIACO')) {
      return value.toFixed(1);
    }

    // Default formatting
    return value.toFixed(2);
  }

  /**
   * Get formatted change indicator (up/down arrow with value)
   */
  getChangeIndicator(current: number, previous: number): string {
    const change = current - previous;
    const changePercent = ((change / previous) * 100);
    
    if (change > 0) {
      return `↑ +${Math.abs(changePercent).toFixed(1)}%`;
    } else if (change < 0) {
      return `↓ -${Math.abs(changePercent).toFixed(1)}%`;
    } else {
      return `→ 0.0%`;
    }
  }

  /**
   * Calculate trend over multiple periods
   */
  async getTrend(seriesId: string, periods: number = 3): Promise<'up' | 'down' | 'flat'> {
    try {
      const url = `${this.baseUrl}/series/observations?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&limit=${periods + 1}&sort_order=desc`;
      
      const response = await fetch(url);
      const data: FredResponse = await response.json();
      
      const validObservations = data.observations
        .filter(obs => obs.value !== '.')
        .map(obs => parseFloat(obs.value))
        .filter(val => !isNaN(val));

      if (validObservations.length < 2) return 'flat';

      const recent = validObservations.slice(0, Math.min(periods, validObservations.length));
      const isUpTrend = recent[0] > recent[recent.length - 1];
      const isDownTrend = recent[0] < recent[recent.length - 1];

      if (isUpTrend) return 'up';
      if (isDownTrend) return 'down';
      return 'flat';
    } catch {
      return 'flat';
    }
  }
}

// Export singleton instance
export const fredService = new FredService();

// Export mapping of our metric names to FRED series
export const METRIC_TO_FRED_MAPPING = {
  // GDP & Growth
  'Real GDP Growth Rate': FRED_SERIES.GDP_GROWTH,
  
  // Employment  
  'Unemployment Rate (U-3)': FRED_SERIES.UNEMPLOYMENT_RATE,
  'Non-Farm Payrolls': FRED_SERIES.NONFARM_PAYROLLS,
  'Initial Jobless Claims': FRED_SERIES.INITIAL_CLAIMS,
  'Job Openings (JOLTS)': FRED_SERIES.JOB_OPENINGS,
  'Average Hourly Earnings': FRED_SERIES.AVERAGE_HOURLY_EARNINGS,
  'Labor Force Participation Rate': FRED_SERIES.LABOR_FORCE_PARTICIPATION,
  
  // Inflation
  'Core CPI': FRED_SERIES.CORE_CPI,
  'Core PCE': FRED_SERIES.CORE_PCE,
  'Producer Price Index (PPI)': FRED_SERIES.PPI,
  '5Y5Y Forward Inflation Rate': FRED_SERIES.FORWARD_INFLATION_5Y5Y,
  
  // Fed Policy & Rates
  'Fed Funds Rate': FRED_SERIES.FED_FUNDS_RATE,
  '10-Year Treasury Yield': FRED_SERIES.TREASURY_10Y,
  '2s-10s Yield Curve': FRED_SERIES.YIELD_CURVE_SPREAD,
  'TED Spread': FRED_SERIES.TED_SPREAD,
  'Fed Balance Sheet': FRED_SERIES.FED_BALANCE_SHEET,
  
  // Consumer & Business
  'Consumer Confidence Index': FRED_SERIES.CONSUMER_CONFIDENCE,
  'Retail Sales': FRED_SERIES.RETAIL_SALES,
  'Industrial Production Index': FRED_SERIES.INDUSTRIAL_PRODUCTION,
  'Personal Consumption Expenditures': FRED_SERIES.PERSONAL_CONSUMPTION,
  'Durable Goods Orders': FRED_SERIES.DURABLE_GOODS,
  'Manufacturing PMI': FRED_SERIES.MANUFACTURING_PMI,
  
  // Housing
  'Housing Starts': FRED_SERIES.HOUSING_STARTS,
  
  // Composite Indicators
  'Conference Board LEI': FRED_SERIES.CONFERENCE_BOARD_LEI,
  'Chicago Fed CFNAI': FRED_SERIES.CHICAGO_FED_CFNAI,
  'Chicago Fed NFCI': FRED_SERIES.CHICAGO_FED_NFCI,
} as const;