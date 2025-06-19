// lib/data/metrics.ts

export interface AlphaVantageFunctionParams {
  function: string;
  symbol?: string;
  from_symbol?: string;
  to_symbol?: string;
  interval?: string; // e.g., 'monthly', 'semiannual' for CPI from AV
  maturity?: string; // for TREASURY_YIELD
}

export interface Metric {
  category: 'economic' | 'political' | 'social' | 'environmental' | 'composite' | 'market';
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  timing: 'leading' | 'coincident' | 'lagging';
  source: string; // Descriptive source
  impact: string;
  apiIdentifier?: {
    fred?: string;
    alphaVantage?: string | AlphaVantageFunctionParams;
    other?: string;
  };
  apiSource?: 'FRED' | 'AlphaVantage' | 'Calculated' | 'Manual' | 'Other';
  isPocMetric?: boolean;
  units?: string;
}

export const metricsData: Metric[] = [
  // == POCOC METRICS START (Existing entries will be MODIFIED if they are PoC metrics) ==
  {
    category: 'economic',
    name: 'Real GDP Growth Rate',
    description: 'Quarterly, Seasonally Adjusted Annual Rate (%). Actual percentage growth rate.',
    priority: 'critical',
    frequency: 'quarterly',
    timing: 'lagging',
    source: 'Bureau of Economic Analysis (via FRED)',
    impact: 'Primary economic health indicator.',
    apiIdentifier: { fred: 'A191RL1Q225SBEA' }, // This series is "Percent Change from Preceding Period"
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Manufacturing PMI',
    description: 'ISM Manufacturing Index (Index, 50 = neutral).',
    priority: 'high',
    frequency: 'monthly',
    timing: 'leading',
    source: 'Institute for Supply Management (via FRED)',
    impact: 'Key business cycle indicator for goods sector.',
    apiIdentifier: { fred: 'NAPM' },
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Services PMI',
    description: 'ISM Services PMI / Non-Manufacturing Index (Index, 50 = neutral).', // Changed NMFCI to more common name
    priority: 'high',
    frequency: 'monthly',
    timing: 'leading',
    source: 'Institute for Supply Management (via FRED)',
    impact: 'Key business cycle indicator for services sector.',
    apiIdentifier: { fred: 'NMFCI' }, // Or ISMNNPMI if NMFCI doesn't behave as expected.
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Industrial Production Index',
    description: 'Index of industrial output. Consider using YoY % change for rules.', // Base is Index 2017=100
    priority: 'medium',
    frequency: 'monthly',
    timing: 'coincident',
    source: 'Federal Reserve (via FRED)',
    impact: 'Reflects industrial sector health.',
    apiIdentifier: { fred: 'INDPRO' }, // This is the level. YoY % change: IPHSA এছাড়াও দেখতে পারেন
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Capacity Utilization Rate',
    description: 'Total Industry Capacity Utilization (Percent of Capacity).',
    priority: 'medium',
    frequency: 'monthly',
    timing: 'coincident',
    source: 'Federal Reserve (via FRED)',
    impact: 'Inflation pressure indicator.',
    apiIdentifier: { fred: 'TCU' },
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Unemployment Rate (U-3)',
    description: 'Percentage of labor force actively seeking work (%).',
    priority: 'critical',
    frequency: 'monthly',
    timing: 'lagging',
    source: 'Bureau of Labor Statistics (via FRED)',
    impact: 'Fed dual mandate metric, consumer spending driver.',
    apiIdentifier: { fred: 'UNRATE' },
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Initial Jobless Claims',
    description: 'Weekly new unemployment insurance applications (Number, Thousands).',
    priority: 'high',
    frequency: 'weekly',
    timing: 'leading',
    source: 'Department of Labor (via FRED)',
    impact: 'Real-time labor market health.',
    apiIdentifier: { fred: 'ICSA' }, // Initial Claims, Seasonally Adjusted
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Job Openings (JOLTS)',
    description: 'Total Nonfarm Job Openings (Number, Thousands).',
    priority: 'high',
    frequency: 'monthly',
    timing: 'leading',
    source: 'Bureau of Labor Statistics (via FRED)',
    impact: 'Labor market tightness, wage pressure indicator.',
    apiIdentifier: { fred: 'JTSJOL' },
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Labor Force Participation Rate',
    description: 'Percentage of working-age population in labor force (%).',
    priority: 'medium',
    frequency: 'monthly',
    timing: 'lagging',
    source: 'Bureau of Labor Statistics (via FRED)',
    impact: 'Structural employment trends.',
    apiIdentifier: { fred: 'CIVPART' },
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Core CPI', // You can keep this name for simplicity in your UI and rules
    description: 'Sticky Price Core CPI (less Food & Energy), YoY % Change, Seasonally Adjusted.', // Update description
    priority: 'critical',
    frequency: 'monthly',
    timing: 'lagging',
    source: 'Federal Reserve Bank of Atlanta (via FRED)', // Source is Atlanta Fed
    impact: 'Key underlying inflation measure.',
    apiIdentifier: { fred: 'CORESTICKM159SFRBATL' }, // <<<< UPDATED SERIES ID
    apiSource: 'FRED',
    isPocMetric: true,
    units: '% YoY SA', // Explicit units
  },
  {
    category: 'economic',
    name: '5Y5Y Forward Inflation Rate',
    description: 'Market-implied inflation expectations 5 years forward (%).',
    priority: 'high',
    frequency: 'daily', // FRED series T5YIFR is daily
    timing: 'leading',
    source: 'Federal Reserve Bank of St. Louis (via FRED)',
    impact: 'Long-term inflation expectations.',
    apiIdentifier: { fred: 'T5YIFR' },
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Consumer Confidence Index',
    description: 'Consumer sentiment/confidence index (Index Value). Scale varies by source.',
    priority: 'high',
    frequency: 'monthly',
    timing: 'leading',
    source: 'The Conference Board (via AlphaVantage) or University of Michigan (FRED: UMCSENT)',
    impact: 'Consumer spending predictor.',
    apiIdentifier: { alphaVantage: { function: 'CONSUMER_SENTIMENT' } }, // This is often UMich. Rules need to match this scale.
    // Alternative FRED UMich: { fred: 'UMCSENT' }
    // Alternative FRED Conf Board (via OECD): { fred: 'CSCICP03USM665S' } (check update frequency)
    apiSource: 'AlphaVantage',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: 'Fed Funds Rate',
    description: 'Effective Federal Funds Rate (%).',
    priority: 'critical',
    frequency: 'daily', // DFF is daily, FEDFUNDS is monthly average of daily
    timing: 'leading', // Policy instrument
    source: 'Federal Reserve (via FRED)',
    impact: 'Risk-free rate benchmark.',
    apiIdentifier: { fred: 'DFF' }, // Daily effective rate
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'economic',
    name: '10-Year Treasury Yield',
    description: 'Market Yield on U.S. Treasury Securities at 10-Year Constant Maturity (%).',
    priority: 'critical',
    frequency: 'daily',
    timing: 'leading',
    source: 'U.S. Department of the Treasury (via FRED)',
    impact: 'Benchmark long-term interest rate.',
    apiIdentifier: { fred: 'DGS10' }, // Daily series
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'market',
    name: 'VIX Index',
    description: 'CBOE Volatility Index (Index Value).',
    priority: 'critical',
    frequency: 'daily',
    timing: 'leading',
    source: 'CBOE (via Alpha Vantage)',
    impact: 'Market fear gauge.',
    apiIdentifier: { alphaVantage: { function: 'TIME_SERIES_DAILY', symbol: '^VIX' } }, // Check if AV supports ^VIX directly, or if another AV VIX function is better
    apiSource: 'AlphaVantage',
    isPocMetric: true,
  },
  {
    category: 'market',
    name: 'S&P 500',
    description: 'S&P 500 Index Level. Consider using YoY % change for rules.',
    priority: 'critical',
    frequency: 'daily',
    timing: 'coincident',
    source: 'S&P Dow Jones Indices (via Alpha Vantage - e.g. SPY ETF as proxy)',
    impact: 'Broad market performance indicator.',
    apiIdentifier: { alphaVantage: { function: 'TIME_SERIES_DAILY', symbol: 'SPY' } }, // SPY ETF as a common proxy for S&P 500 index
    apiSource: 'AlphaVantage',
    isPocMetric: true,
  },
  {
    category: 'market',
    name: 'Dollar Index',
    description: 'Trade Weighted U.S. Dollar Index: Broad, Goods and Services (Index Mar 1973=100).',
    priority: 'high',
    frequency: 'daily', // DTWEXBGS is daily
    timing: 'leading',
    source: 'Federal Reserve (via FRED)',
    impact: 'Currency strength, competitiveness.',
    apiIdentifier: { fred: 'DTWEXBGS' }, // This is a comprehensive Dollar Index from FRED
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'composite',
    name: 'Conference Board LEI',
    description: 'Leading Economic Index for the U.S. (Index). Consider MoM % change for rules.',
    priority: 'critical',
    frequency: 'monthly',
    timing: 'leading',
    source: 'The Conference Board (via FRED)',
    impact: 'Predicts economic turning points.',
    apiIdentifier: { fred: 'USSLIND' },
    apiSource: 'FRED',
    isPocMetric: true,
  },
  {
    category: 'composite',
    name: 'Goldman Sachs CAI', // Concept/Proxy
    description: 'Proxy for high-frequency Current Activity Indicator (Conceptual Index/Value).',
    priority: 'high',
    frequency: 'weekly', // Assuming proxy would be if available
    timing: 'coincident',
    source: 'Conceptual (No direct free API)',
    impact: 'Real-time economic pulse.',
    apiIdentifier: { other: 'GS_CAI_PROXY' },
    apiSource: 'Manual', // Or 'Other' if you find a proxy source. Rules need to match proxy scale.
    isPocMetric: true,
  },
  {
    category: 'composite',
    name: 'Chicago Fed CFNAI',
    description: 'Chicago Fed National Activity Index (Index, 0 = trend growth).',
    priority: 'medium',
    frequency: 'monthly',
    timing: 'coincident',
    source: 'Federal Reserve Bank of Chicago (via FRED)',
    impact: 'Broad measure of economic activity and inflation pressure.',
    apiIdentifier: { fred: 'CFNAI' },
    apiSource: 'FRED',
    isPocMetric: true,
  },
  // == POCOC METRICS END ==

  // == NON-POC METRICS (Your existing list, untouched unless they were PoC metrics) ==
  // Example:
  /*
  {
    category: 'economic',
    name: 'GDP Now',
    description: 'Fed\'s real-time estimate of current quarter GDP growth',
    priority: 'critical',
    frequency: 'weekly',
    timing: 'coincident',
    source: 'Federal Reserve Bank of Atlanta',
    impact: 'Early GDP signal, affects Fed policy expectations'
    // isPocMetric: false, // or leave undefined
  },
  */
  // ... (The rest of your extensive metricsData array) ...
  // Ensure all metrics from your previous full list are still here,
  // with non-PoC ones having 'isPocMetric: false' or isPocMetric undefined.
  // For brevity, I am not re-pasting your entire original list here.
  // Just make sure the PoC ones above are updated and the rest are preserved.
];


// Helper function to get only PoC metrics
export const getPocMetrics = (): Metric[] => {
  return metricsData.filter(metric => metric.isPocMetric);
};

export default metricsData;