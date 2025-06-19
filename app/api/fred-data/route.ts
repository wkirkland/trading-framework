// app/api/fred-data/route.ts
import { NextResponse } from 'next/server';
import { fredService, MetricValue as FredMetricValue } from '@/lib/services/fredService';
import { multiSourceDataService, MetricValue as AVMetricValue } from '@/lib/services/multiSourceDataService';
import { getPocMetrics, Metric as PocMetricConfig, AlphaVantageFunctionParams } from '@/lib/data/metrics'; // Added AlphaVantageFunctionParams

// Define a consistent structure for the data items in the API response
interface ApiResponseMetricData {
  value: number | null;
  formatted: string;
  date: string;
  change?: number; // Change from immediate previous period
  yoYChange?: number; // Year-over-Year change, if applicable
  lastUpdated: string;
  source?: string;
  seriesId?: string; // For debugging FRED series
  originalName?: string; // From metrics.ts
  units?: string;
  rawValue?: number | null; // If value is calculated (e.g. YoY), store original level here
}

interface DebugInfo {
  statuses: Record<string, string>;
  errors: string[];
  apiKeys: {
    fredPresent: boolean;
    alphaVantagePresent: boolean;
  };
  timestamp: string;
  fetchTimes: Record<string, number>;
  fetchedMetricsCount: {
    pocDefined: number;
    fredAttempted: number;
    fredFetchedSuccessfully: number;
    alphaVantageAttempted: number;
    alphaVantageFetchedSuccessfully: number;
    manualOrOther: number;
    totalSuccessfullyTransformed: number;
  };
  cacheStats?: {
    fredCache: { size: number; keys: string[] };
    marketCache: { size: number; keys: string[] };
  };
}

// Type for the getLiveValue function signature if needed here (though it's primarily a client-side concept)
// For server-side, we deal with the direct output of services.
// However, if any utility here *needed* that signature for some reason:
/*
interface LiveMetricData {
  value: number | null;
  formatted: string;
  date: string;
  change?: number;
  lastUpdated: string;
}
type GetLiveValueFunction = (metricName: string) => LiveMetricData | null;
*/


// Helper function to attempt to extract units from description (can be improved)
function extractUnitsFromDescription(description: string): string {
    const match = description.match(/\(([^)]+)\)/);
    if (match && match[1]) {
        // Further check if it looks like a unit (e.g., %, Index, Thousands)
        if (match[1].includes('%') || match[1].toLowerCase().includes('index') || 
            match[1].toLowerCase().includes('saar') || match[1].toLowerCase().includes('number') ||
            match[1].toLowerCase().includes('thousands') || match[1].toLowerCase().includes('millions') ||
            match[1].toLowerCase().includes('billions') || match[1].toLowerCase().includes('level')) {
            return match[1];
        }
    }
    // Fallback or more specific logic based on metric names can be added
    if (description.toLowerCase().includes('percent') || description.toLowerCase().includes('%')) return '%';
    if (description.toLowerCase().includes('index')) return 'Index';
    return 'N/A';
}


export async function GET() {
  const pocMetricsToFetch: PocMetricConfig[] = getPocMetrics();
  const currentTimestamp = new Date().toISOString();

  const debugInfo: DebugInfo = {
    statuses: { fred: 'pending', alphaVantage: 'pending', manualOrOther: 'pending' },
    errors: [],
    apiKeys: {
      fredPresent: !!process.env.FRED_API_KEY,
      alphaVantagePresent: !!process.env.ALPHA_VANTAGE_API_KEY,
    },
    timestamp: currentTimestamp,
    fetchTimes: {},
    fetchedMetricsCount: {
      pocDefined: pocMetricsToFetch.length,
      fredAttempted: 0,
      fredFetchedSuccessfully: 0,
      alphaVantageAttempted: 0,
      alphaVantageFetchedSuccessfully: 0,
      manualOrOther: 0,
      totalSuccessfullyTransformed: 0,
    },
  };

  const transformedData: Record<string, ApiResponseMetricData> = {};

  const fredMetricsConfig: PocMetricConfig[] = [];
  const alphaVantageMetricsConfig: PocMetricConfig[] = [];
  const manualOrOtherMetricsConfig: PocMetricConfig[] = [];

  pocMetricsToFetch.forEach(metric => {
    if (metric.apiSource === 'FRED' && metric.apiIdentifier?.fred) {
      fredMetricsConfig.push(metric);
    } else if (metric.apiSource === 'AlphaVantage' && metric.apiIdentifier?.alphaVantage) {
      alphaVantageMetricsConfig.push(metric);
    } else if (metric.apiSource === 'Manual' || metric.apiSource === 'Other') {
      manualOrOtherMetricsConfig.push(metric);
    }
  });

  debugInfo.fetchedMetricsCount.fredAttempted = fredMetricsConfig.length;
  debugInfo.fetchedMetricsCount.alphaVantageAttempted = alphaVantageMetricsConfig.length;
  debugInfo.fetchedMetricsCount.manualOrOther = manualOrOtherMetricsConfig.length;

  try {
    console.log(`🚀 API Route: Fetching ${pocMetricsToFetch.length} PoC metrics.`);

    // 1. Fetch FRED Data
    if (fredMetricsConfig.length > 0) {
      const fredSeriesIdsToFetch = fredMetricsConfig.map(m => m.apiIdentifier!.fred!);
      console.log(`⏳ API Route: Fetching ${fredSeriesIdsToFetch.length} series from FRED:`, fredSeriesIdsToFetch);
      const fredStartTime = Date.now();
      try {
        const fredRawDataMap = await fredService.getBulkData(fredSeriesIdsToFetch);
        debugInfo.statuses.fred = 'completed';
        debugInfo.fetchTimes.fred = Date.now() - fredStartTime;
        console.log(`✅ API Route: FRED data bulk fetch completed in ${debugInfo.fetchTimes.fred}ms`);

        for (const metricConfig of fredMetricsConfig) {
          const seriesId = metricConfig.apiIdentifier!.fred!;
          const rawData = fredRawDataMap[seriesId];

          if (rawData && rawData.value !== null && rawData.value !== undefined) {
            let finalValue = rawData.value;
            let yoYChange: number | undefined = undefined;
            let units = metricConfig.units || extractUnitsFromDescription(metricConfig.description);

            if ((metricConfig.name === 'Core CPI' || metricConfig.name === 'Industrial Production Index') &&
                (metricConfig.description.includes("YoY %") || metricConfig.description.includes("YoY % change")) &&
                !seriesId.endsWith("_PC1") && !seriesId.endsWith("PC1") && !seriesId.endsWith("PSAVG") && !seriesId.includes("ANNRATE")) {
                // This indicates the fetched series is a level, but YoY is desired by description
                // Conceptual: YoY calculation would ideally happen in fredService after fetching historical data
                console.warn(`API Route: Metric ${metricConfig.name} (${seriesId}) is a level. True YoY calculation needs historical data from fredService.`);
                units = `${units} (Level - YoY% calc needed based on description)`;
            }
            if (metricConfig.name === 'Real GDP Growth Rate') units = '% QoQ SAAR';


            transformedData[metricConfig.name] = {
              value: finalValue,
              rawValue: rawData.value,
              formatted: rawData.formatted || finalValue.toString(),
              date: rawData.date || '',
              change: rawData.change,
              yoYChange: yoYChange,
              lastUpdated: currentTimestamp,
              source: 'FRED',
              seriesId: seriesId,
              originalName: metricConfig.name,
              units: units,
            };
            debugInfo.fetchedMetricsCount.fredFetchedSuccessfully++;
          } else {
            debugInfo.errors.push(`FRED series ${seriesId} (${metricConfig.name}): No data or null value returned by service.`);
            transformedData[metricConfig.name] = { value: null, rawValue: null, formatted: 'N/A (Service Error)', date: '', lastUpdated: currentTimestamp, source: 'FRED', seriesId, originalName: metricConfig.name, units: metricConfig.units || 'N/A' };
          }
        }
      } catch (fredError: any) {
        debugInfo.statuses.fred = 'error';
        debugInfo.errors.push(`FRED bulk fetch error in route: ${fredError.message}`);
        fredMetricsConfig.forEach(mc => { // Add placeholders for failed FRED metrics
            if (!transformedData[mc.name]) transformedData[mc.name] = { value: null, rawValue: null, formatted: 'N/A (Fetch Error)', date: '', lastUpdated: currentTimestamp, source: 'FRED', seriesId: mc.apiIdentifier?.fred, originalName: mc.name, units: mc.units || 'N/A' };
        });
      }
    } else {
        debugInfo.statuses.fred = 'not_attempted (no FRED PoC metrics)';
    }

    // 2. Fetch Alpha Vantage Data
    if (alphaVantageMetricsConfig.length > 0) {
      console.log(`⏳ API Route: Fetching ${alphaVantageMetricsConfig.length} metrics from Alpha Vantage.`);
      const alphaStartTime = Date.now();
      try {
        const avRawDataMap = await multiSourceDataService.getAllAdditionalData(alphaVantageMetricsConfig);
        debugInfo.statuses.alphaVantage = 'completed';
        debugInfo.fetchTimes.alphaVantage = Date.now() - alphaStartTime;
        console.log(`✅ API Route: Alpha Vantage data fetch completed in ${debugInfo.fetchTimes.alphaVantage}ms`);

        for (const metricConfig of alphaVantageMetricsConfig) {
          const rawData = avRawDataMap[metricConfig.name]; // Expects getAllAdditionalData to return map keyed by metric name
          if (rawData && rawData.value !== null && rawData.value !== undefined) {
            transformedData[metricConfig.name] = {
              value: rawData.value,
              rawValue: rawData.value,
              formatted: rawData.formatted || rawData.value.toString(),
              date: rawData.date || '',
              change: rawData.change,
              lastUpdated: currentTimestamp,
              source: rawData.source || 'Alpha Vantage',
              originalName: metricConfig.name,
              units: metricConfig.units || extractUnitsFromDescription(metricConfig.description),
            };
            debugInfo.fetchedMetricsCount.alphaVantageFetchedSuccessfully++;
          } else {
            debugInfo.errors.push(`Alpha Vantage metric ${metricConfig.name}: No data or null value returned by service.`);
            transformedData[metricConfig.name] = { value: null, rawValue: null, formatted: 'N/A (Service Error)', date: '', lastUpdated: currentTimestamp, source: 'Alpha Vantage', originalName: metricConfig.name, units: metricConfig.units || 'N/A' };
          }
        }
      } catch (avError: any) {
        debugInfo.statuses.alphaVantage = 'error';
        debugInfo.errors.push(`Alpha Vantage fetch error in route: ${avError.message}`);
        alphaVantageMetricsConfig.forEach(mc => { // Add placeholders for failed AV metrics
             if (!transformedData[mc.name]) transformedData[mc.name] = { value: null, rawValue: null, formatted: 'N/A (Fetch Error)', date: '', lastUpdated: currentTimestamp, source: 'AlphaVantage', originalName: mc.name, units: mc.units || 'N/A' };
        });
      }
    } else {
        debugInfo.statuses.alphaVantage = 'not_attempted (no AV PoC metrics)';
    }
    
    // 3. Handle "Manual" or "Other" source PoC metrics
    manualOrOtherMetricsConfig.forEach(metricConfig => {
        if (!transformedData[metricConfig.name]) { // Only add if not already (e.g. from a failed primary source attempt)
            console.log(`ℹ️ API Route: Metric ${metricConfig.name} is ${metricConfig.apiSource}, using placeholder.`);
            transformedData[metricConfig.name] = {
                value: null, 
                rawValue: null,
                formatted: metricConfig.apiSource === 'Manual' ? 'Manual Input' : 'Proxy/Other',
                date: '',
                lastUpdated: currentTimestamp,
                source: metricConfig.apiSource,
                originalName: metricConfig.name,
                units: metricConfig.units || extractUnitsFromDescription(metricConfig.description),
            };
        }
    });
    debugInfo.statuses.manualOrOther = 'completed'; // Considered completed as placeholders are set


    debugInfo.fetchedMetricsCount.totalSuccessfullyTransformed = 
        Object.values(transformedData).filter(d => d.value !== null).length;

    if (debugInfo.cacheStats) { // Only assign if already initialized by previous logic
        debugInfo.cacheStats.fredCache = fredService.getCacheStats();
        debugInfo.cacheStats.marketCache = multiSourceDataService.getMarketCacheStats();
    } else {
        debugInfo.cacheStats = {
            fredCache: fredService.getCacheStats(),
            marketCache: multiSourceDataService.getMarketCacheStats()
        };
    }
    
    return NextResponse.json({
      success: true,
      data: transformedData,
      debug: debugInfo,
    });

  } catch (error: any) {
    console.error('❌ API Route: Critical unhandled error:', error);
    debugInfo.errors.push(`Critical route error: ${error.message || String(error)}`);
    // Ensure statuses reflect an error if they were pending
    if(debugInfo.statuses.fred === 'pending') debugInfo.statuses.fred = 'error';
    if(debugInfo.statuses.alphaVantage === 'pending') debugInfo.statuses.alphaVantage = 'error';
    
    return NextResponse.json(
      { success: false, error: 'Critical server error in API route.', debug: debugInfo },
      { status: 500 }
    );
  }
}

// --- Your Existing POST function for debugging ---
// This should be exactly as you provided it previously.
interface TestResult {
  success: boolean;
  result?: { value: number | null; formatted?: string; date: string; change?: number; source?: string; };
  error?: string;
  cached?: boolean;
  isFlack?: boolean; // Assuming 'Flack' was a typo for 'Fallback' or similar status
}
interface EnvironmentTest { fredKey: string; alphaKey: string; nodeEnv: string; }
interface TestResults { fredTest: TestResult | null; alphaVantageTest: TestResult | null; environmentTest: EnvironmentTest; }

export async function POST() {
  try {
    console.log('🔍 Debug POST endpoint called');
    const tests: TestResults = {
      fredTest: null,
      alphaVantageTest: null,
      environmentTest: {
        fredKey: process.env.FRED_API_KEY ? `${process.env.FRED_API_KEY.substring(0, 8)}...` : 'MISSING',
        alphaKey: process.env.ALPHA_VANTAGE_API_KEY ? `${process.env.ALPHA_VANTAGE_API_KEY.substring(0, 8)}...` : 'MISSING',
        nodeEnv: process.env.NODE_ENV || 'unknown'
      }
    };

    // Test FRED API directly
    try {
      console.log('🧪 Testing FRED API with UNRATE...');
      const fredTestResult = await fredService.getLatestValue('UNRATE'); // Example: Using a known PoC Series ID
      tests.fredTest = {
        success: true,
        result: {
          value: fredTestResult.value,
          formatted: fredTestResult.formatted || 'N/A',
          date: fredTestResult.date,
          change: fredTestResult.change,
          source: 'FRED' 
        },
        // cached: Determine caching status if possible from service response
      };
      console.log('✅ FRED test result:', fredTestResult);
    } catch (error: any) {
      tests.fredTest = { success: false, error: String(error) };
      console.log('❌ FRED test failed:', error);
    }

    // Test Alpha Vantage API directly
    try {
      console.log('🧪 Testing Alpha Vantage API with VIX Index PoC config...');
      const vixConfig = getPocMetrics().find(m => m.name === 'VIX Index' && m.apiSource === 'AlphaVantage');
      if (vixConfig) {
        const alphaTestResult = await multiSourceDataService.fetchAVDataForMetric(vixConfig);
        tests.alphaVantageTest = {
          success: true,
          result: {
            value: alphaTestResult.value,
            formatted: alphaTestResult.formatted || 'N/A',
            date: alphaTestResult.date,
            change: alphaTestResult.change,
            source: alphaTestResult.source || 'Alpha Vantage'
          },
          isFlack: alphaTestResult.source === 'Fallback Data'
        };
        console.log('✅ Alpha Vantage test result:', alphaTestResult);
      } else {
          tests.alphaVantageTest = { success: false, error: "VIX Index PoC config not found for AlphaVantage test."};
          console.log('❌ Alpha Vantage test: VIX config not found for PoC.');
      }
    } catch (error: any) {
      tests.alphaVantageTest = { success: false, error: String(error) };
      console.log('❌ Alpha Vantage test failed:', error);
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tests,
      cacheStats: {
        fred: fredService.getCacheStats(),
        market: multiSourceDataService.getMarketCacheStats()
      }
    });

  } catch (error:any) {
    console.error('❌ Debug POST endpoint error:', error);
    return NextResponse.json(
      { success: false, error: String(error), timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}