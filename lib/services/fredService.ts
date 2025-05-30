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

// FRED Series IDs for key economic indicators - MASSIVE EXPANSION
export const FRED_SERIES = {
  // GDP and Growth
  GDP_GROWTH: 'A191RL1Q225SBEA', // Real GDP Growth Rate (quarterly, annualized %)
  GDP_NOW: 'GDPPOT', // Real Potential GDP, or
// GDP_NOW: 'A191RL1Q225SBEA', // Same as GDP growth but different formatting
  
  // Employment - Full Coverage
  UNEMPLOYMENT_RATE: 'UNRATE',
  NONFARM_PAYROLLS: 'PAYEMS',
  INITIAL_CLAIMS: 'ICSA',
  JOB_OPENINGS: 'JTSJOL', // JOLTS Job Openings
  AVERAGE_HOURLY_EARNINGS: 'CES0500000003', // Average Hourly Earnings
  LABOR_FORCE_PARTICIPATION: 'CIVPART', // Labor Force Participation Rate
  
  // Manufacturing & Production
  INDUSTRIAL_PRODUCTION: 'INDPRO',
  CAPACITY_UTILIZATION: 'TCU', // Total Capacity Utilization
  MANUFACTURING_PMI: 'NAPM', // ISM Manufacturing PMI (may be discontinued)
  SERVICES_PMI: 'NAPM', // Services PMI - may need different series
  
  // Inflation - Complete Set
  CORE_CPI: 'CPILFESL',
  CORE_PCE: 'PCEPILFE',
  PPI: 'PPIACO', // Producer Price Index
  FORWARD_INFLATION_5Y5Y: 'T5YIE', // 5-Year 5-Year Forward Inflation Expectation Rate
  TIPS_5Y: 'T5YIE', // 5-Year TIPS Breakeven
  TIPS_10Y: 'T10YIE', // 10-Year TIPS Breakeven
  
  // Fed Policy & Rates - Comprehensive
  FED_FUNDS_RATE: 'FEDFUNDS',
  TREASURY_10Y: 'GS10',
  TREASURY_2Y: 'GS2',
  FED_BALANCE_SHEET: 'WALCL', // Fed Total Assets
  
  // Credit & Financial Conditions
  YIELD_CURVE_SPREAD: 'T10Y2Y',
  TED_SPREAD: 'TEDRATE', // TED Spread
  CREDIT_SPREAD_IG: 'BAMLC0A0CM', // Investment Grade Credit Spread
  CREDIT_SPREAD_HY: 'BAMLH0A0HYM2', // High Yield Credit Spread
  
  // Consumer & Business
  CONSUMER_CONFIDENCE: 'UMCSENT', // University of Michigan Consumer Sentiment
  RETAIL_SALES: 'RSXFS',
  PERSONAL_CONSUMPTION: 'PCE', // Personal Consumption Expenditures
  DURABLE_GOODS: 'DGORDER', // Durable Goods Orders
  
  // Housing - Complete Set
  HOUSING_STARTS: 'HOUST', // Housing Starts
  EXISTING_HOME_SALES: 'EXHOSLUSM495S', // Existing Home Sales
  HOME_OWNERSHIP_RATE: 'RHORUSQ156N', // Homeownership Rate
  HOUSE_PRICE_INDEX: 'CSUSHPISA', // Case-Shiller Home Price Index
  
  // Composite Indicators
  CONFERENCE_BOARD_LEI: 'USSLIND', // US Leading Indicators Index
  CHICAGO_FED_CFNAI: 'CFNAI', // Chicago Fed National Activity Index
  CHICAGO_FED_NFCI: 'NFCI', // Chicago Fed National Financial Conditions Index
  
  // International Trade
  TRADE_BALANCE: 'BOPGSTB', // Trade Balance
  IMPORTS: 'IMPGS', // Imports of Goods and Services
  EXPORTS: 'EXPGS', // Exports of Goods and Services
  
  // Government Finances
  GOVERNMENT_DEBT: 'GFDEBTN', // Federal Debt Total Public Debt
  FEDERAL_DEFICIT: 'FYFSGDA188S', // Federal Surplus or Deficit
  
  // Demographics & Social (Limited FRED coverage)
  POPULATION: 'POPTHM', // Total Population
  LABOR_FORCE: 'CLF16OV', // Civilian Labor Force
  
  // Energy & Environment (EIA data via FRED)
  OIL_PRICE: 'DCOILWTICO', // Crude Oil Prices: West Texas Intermediate
  NATURAL_GAS_PRICE: 'DHHNGSP', // Natural Gas Price
  
  // Real Estate & Construction
  CONSTRUCTION_SPENDING: 'TTLCONS', // Total Construction Spending
  
  // Business Investment
  BUSINESS_INVESTMENT: 'PNFIC1', // Nonresidential Fixed Investment
  
  // Additional Financial Markets
  DOLLAR_INDEX: 'DTWEXBGS', // Dollar Index (Broad, Goods and Services)
  GOLD_PRICE: 'GOLDAMGBD228NLBM', // Gold Price
  
  // Student Loans & Education
  STUDENT_LOANS: 'SLOAS', // Student Loans Outstanding
  
  // Technology & Innovation (Limited)
  PRODUCTIVITY: 'OPHNFB', // Nonfarm Business Sector: Output Per Hour
  
  // Additional Employment Metrics
  PART_TIME_WORKERS: 'LNS12032194', // Part Time for Economic Reasons
  MULTIPLE_JOB_HOLDERS: 'LNS12026620', // Multiple Jobholders
  
  // Regional Economic Indicators
  REGIONAL_HPI: 'RSXFS', // Regional indicators (can expand)
  
  // Velocity of Money
  MONEY_VELOCITY: 'M2V', // Velocity of M2 Money Stock
  
  // Savings Rate
  PERSONAL_SAVINGS_RATE: 'PSAVERT', // Personal Saving Rate
  
  // Corporate Profits
  CORPORATE_PROFITS: 'CP', // Corporate Profits After Tax
  
  // Manufacturing New Orders
  MANUFACTURING_ORDERS: 'AMTMNO', // Manufacturers' New Orders
  
  // Small Business
  SMALL_BUS_OPTIMISM: 'NFIB', // NFIB Small Business Optimism (if available)
  
  // Additional Credit Metrics
  COMMERCIAL_PAPER: 'CPF3M', // 3-Month Commercial Paper Rate
  PRIME_RATE: 'DPRIME', // Bank Prime Loan Rate
  
  // International Comparisons
  USD_EUR: 'DEXUSEU', // US Dollar to Euro Exchange Rate
  USD_CNY: 'DEXCHUS', // US Dollar to Chinese Yuan Exchange Rate
  
  // Additional Real Estate
  COMMERCIAL_RE: 'COMPREAL', // Commercial Real Estate Loans
  
  // Innovation Proxies
  PATENTS: 'PATENTAPPLN', // Patent applications (if available)
  
  // Supply Chain
  SUPPLIER_DELIVERIES: 'NAPMSD', // ISM Supplier Deliveries Index
  
  // Additional Inflation Measures
  SHELTER_CPI: 'CUSR0000SAH1', // CPI for Shelter
  FOOD_CPI: 'CUSR0000SAF1', // CPI for Food
  ENERGY_CPI: 'CUSR0000SAE', // CPI for Energy
  
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
   * Format values based on the metric type - EXPANDED
   */
  private formatValue(seriesId: string, value: number): string {
    if (isNaN(value)) return 'N/A';

      // CPI and Index values - ADD THIS FIRST
    if (seriesId.includes('CPILFESL') || seriesId.includes('CPILFESL')) {
    return value.toFixed(1);
   }
    // Rates and percentages (including GDP growth rate, all rates, savings rate)
    if (seriesId.includes('RATE') || seriesId.includes('UNRATE') || seriesId.includes('FEDFUNDS') || 
        seriesId.includes('GS') || seriesId.includes('A191RL1Q225SBEA') || seriesId.includes('T5YIE') || 
        seriesId.includes('T10YIE') || seriesId.includes('PSAVERT') || seriesId.includes('RHORUSQ156N') ||
        seriesId.includes('CPF3M') || seriesId.includes('DPRIME')) {
      return `${value.toFixed(2)}%`;
    }

    // PMI and Index values (Consumer Sentiment, PMI, LEI, Activity Indexes)
    if (seriesId.includes('UMCSENT') || seriesId.includes('NAPM') || seriesId.includes('USSLIND') || 
        seriesId.includes('CFNAI') || seriesId.includes('NFCI') || seriesId.includes('DTWEXBGS') ||
        seriesId.includes('CSUSHPISA') || seriesId.includes('OPHNFB')) {
      return value.toFixed(1);
    }

    // Large numbers in thousands (payrolls, claims, job openings)
    if (seriesId.includes('PAYEMS') || seriesId.includes('ICSA')) {
      return `${(value / 1000).toFixed(0)}K`;
    }

    // JOLTS is already in thousands, so just add K
    if (seriesId.includes('JTSJOL')) {
      return `${value.toFixed(0)}K`;
    }

    // Fed Balance Sheet, Government Debt (in trillions)
    if (seriesId.includes('WALCL') || seriesId.includes('GFDEBTN')) {
      return `$${(value / 1000).toFixed(1)}T`;
    }

    // Housing data (in thousands or millions)
    if (seriesId.includes('HOUST') || seriesId.includes('EXHOSLUSM495S')) {
      return `${value.toFixed(0)}K`;
    }

    // Hourly earnings (currency)
    if (seriesId.includes('CES0500000003')) {
      return `$${value.toFixed(2)}`;
    }

    // Participation rate, part-time workers (percentage)
    if (seriesId.includes('CIVPART') || seriesId.includes('LNS12032194') || seriesId.includes('LNS12026620')) {
      return `${value.toFixed(1)}%`;
    }

    // TED Spread (basis points, but show as percentage)
    if (seriesId.includes('TEDRATE') || seriesId.includes('BAMLC0A0CM') || seriesId.includes('BAMLH0A0HYM2')) {
      return `${value.toFixed(2)}%`;
    }

    // Oil and commodity prices
    if (seriesId.includes('DCOILWTICO') || seriesId.includes('GOLDAMGBD228NLBM')) {
      return `$${value.toFixed(2)}`;
    }

    // Natural gas (different unit)
    if (seriesId.includes('DHHNGSP')) {
      return `$${value.toFixed(2)}/MMBtu`;
    }

    // Exchange rates
    if (seriesId.includes('DEXUSEU') || seriesId.includes('DEXCHUS')) {
      return value.toFixed(4);
    }

    // Population (in millions)
    if (seriesId.includes('POPTHM') || seriesId.includes('CLF16OV')) {
      return `${(value / 1000).toFixed(1)}M`;
    }

    // Student loans, corporate profits (in billions)
    if (seriesId.includes('SLOAS') || seriesId.includes('CP')) {
      return `$${(value / 1000).toFixed(0)}B`;
    }
    // CPI values (index values, not currency)
    if (seriesId.includes('CPILFESL') || seriesId.includes('CPI')) {
    return value.toFixed(1);
    }
    // GDP and other large economic indicators (trillions) - EXCLUDE CPI series
    if ((seriesId.includes('GDP') || seriesId.includes('PCE') || seriesId.includes('DGORDER') || 
    seriesId.includes('TTLCONS') || seriesId.includes('PNFIC1') || seriesId.includes('BOPGSTB') ||
    seriesId.includes('IMPGS') || seriesId.includes('EXPGS')) && 
    !seriesId.includes('CPI')) { // EXCLUDE CPI series from this formatting
      if (value > 1000) {
        return `$${(value / 1000).toFixed(1)}T`;
      }
      return `$${value.toFixed(1)}B`;
    }

    // Retail sales (in trillions)
    if (seriesId.includes('RSXFS')) {
      return `$${(value / 1000).toFixed(1)}T`;
    }

    // PPI, CPI components (index values)
    if (seriesId.includes('PPIACO') || seriesId.includes('CUSR0000')) {
      return value.toFixed(1);
    }

    // Money velocity (ratio)
    if (seriesId.includes('M2V')) {
      return value.toFixed(2);
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

// Export mapping of our metric names to FRED series - MASSIVE EXPANSION
export const METRIC_TO_FRED_MAPPING = {
  // GDP & Growth
  'Real GDP Growth Rate': FRED_SERIES.GDP_GROWTH,
  
  // Employment - Complete Coverage
  'Unemployment Rate (U-3)': FRED_SERIES.UNEMPLOYMENT_RATE,
  'Non-Farm Payrolls': FRED_SERIES.NONFARM_PAYROLLS,
  'Initial Jobless Claims': FRED_SERIES.INITIAL_CLAIMS,
  'Job Openings (JOLTS)': FRED_SERIES.JOB_OPENINGS,
  'Average Hourly Earnings': FRED_SERIES.AVERAGE_HOURLY_EARNINGS,
  'Labor Force Participation Rate': FRED_SERIES.LABOR_FORCE_PARTICIPATION,
  
  // Manufacturing & Production
  'Industrial Production Index': FRED_SERIES.INDUSTRIAL_PRODUCTION,
  'Capacity Utilization Rate': FRED_SERIES.CAPACITY_UTILIZATION,
  'Manufacturing PMI': FRED_SERIES.MANUFACTURING_PMI,
  
  // Inflation - Complete Set
  'Core CPI': FRED_SERIES.CORE_CPI,
  'Core PCE': FRED_SERIES.CORE_PCE,
  'Producer Price Index (PPI)': FRED_SERIES.PPI,
  '5Y5Y Forward Inflation Rate': FRED_SERIES.FORWARD_INFLATION_5Y5Y,
  'TIPS Breakeven Rates': FRED_SERIES.TIPS_10Y,
  
  // Fed Policy & Rates
  'Fed Funds Rate': FRED_SERIES.FED_FUNDS_RATE,
  '10-Year Treasury Yield': FRED_SERIES.TREASURY_10Y,
  '2s-10s Yield Curve': FRED_SERIES.YIELD_CURVE_SPREAD,
  'TED Spread': FRED_SERIES.TED_SPREAD,
  'Fed Balance Sheet': FRED_SERIES.FED_BALANCE_SHEET,
  
  // Credit Spreads
  'Credit Spreads (IG)': FRED_SERIES.CREDIT_SPREAD_IG,
  'Credit Spreads (HY)': FRED_SERIES.CREDIT_SPREAD_HY,
  
  // Consumer & Business
  'Consumer Confidence Index': FRED_SERIES.CONSUMER_CONFIDENCE,
  'Retail Sales': FRED_SERIES.RETAIL_SALES,
  'Personal Consumption Expenditures': FRED_SERIES.PERSONAL_CONSUMPTION,
  'Durable Goods Orders': FRED_SERIES.DURABLE_GOODS,
  
  // Housing - Now Complete
  'Housing Starts': FRED_SERIES.HOUSING_STARTS,
  
  // Composite Indicators
  'Conference Board LEI': FRED_SERIES.CONFERENCE_BOARD_LEI,
  'Chicago Fed CFNAI': FRED_SERIES.CHICAGO_FED_CFNAI,
  'Chicago Fed NFCI': FRED_SERIES.CHICAGO_FED_NFCI,
  
  // Additional metrics that map to FRED data
  'Student Loan Debt Levels': FRED_SERIES.STUDENT_LOANS,
  
} as const;