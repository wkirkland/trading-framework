// app/api/fred-data/route.ts (ENHANCED with debugging)

import { NextResponse } from 'next/server';
import { fredService, METRIC_TO_FRED_MAPPING } from '@/lib/services/fredService';
import { multiSourceDataService } from '@/lib/services/multiSourceDataService';

export async function GET() {
  const debugInfo: any = {
    fredStatus: 'unknown',
    alphaVantageStatus: 'unknown',
    errors: [],
    apiKeys: {
      fredPresent: !!process.env.FRED_API_KEY,
      alphaVantagePresent: !!process.env.ALPHA_VANTAGE_API_KEY,
      fredKeyLength: process.env.FRED_API_KEY?.length || 0,
      alphaVantageKeyLength: process.env.ALPHA_VANTAGE_API_KEY?.length || 0
    },
    timestamp: new Date().toISOString()
  };

  try {
    console.log('🚀 Starting API data fetch...');
    console.log('📊 FRED API Key present:', !!process.env.FRED_API_KEY);
    console.log('📈 Alpha Vantage API Key present:', !!process.env.ALPHA_VANTAGE_API_KEY);

    // Get all the FRED series IDs we want to fetch
    const seriesIds = Object.values(METRIC_TO_FRED_MAPPING);
    console.log('📋 Fetching FRED series:', seriesIds.length, 'metrics');
    
    // Fetch FRED data for all series
    console.log('⏳ Fetching FRED data...');
    const fredStartTime = Date.now();
    const fredData = await fredService.getBulkData(seriesIds);
    const fredEndTime = Date.now();
    debugInfo.fredStatus = 'completed';
    debugInfo.fredFetchTime = fredEndTime - fredStartTime;
    console.log('✅ FRED data completed in', fredEndTime - fredStartTime, 'ms');
    
    // Fetch additional data from other sources
    console.log('⏳ Fetching Alpha Vantage data...');
    const alphaStartTime = Date.now();
    const additionalData = await multiSourceDataService.getAllAdditionalData();
    const alphaEndTime = Date.now();
    debugInfo.alphaVantageStatus = 'completed';
    debugInfo.alphaVantageFetchTime = alphaEndTime - alphaStartTime;
    console.log('✅ Alpha Vantage data completed in', alphaEndTime - alphaStartTime, 'ms');

    // Log detailed results
    console.log('📊 FRED Results Summary:');
    Object.entries(fredData).forEach(([seriesId, data]) => {
      if (data.value !== null) {
        console.log(`  ✅ ${seriesId}: ${data.formatted} (${data.date})`);
      } else {
        console.log(`  ❌ ${seriesId}: No data`);
        debugInfo.errors.push(`FRED ${seriesId}: No data`);
      }
    });

    console.log('📈 Alpha Vantage Results Summary:');
    Object.entries(additionalData).forEach(([metricName, data]) => {
      console.log(`  ${data.source === 'Fallback Data' ? '🔄' : '✅'} ${metricName}: ${data.formatted} (${data.source})`);
      if (data.source === 'Fallback Data') {
        debugInfo.errors.push(`Alpha Vantage ${metricName}: Using fallback data`);
      }
    });
    
    // Transform the FRED data to match our metric names
    const transformedData: Record<string, {
      value: number | null;
      formatted: string;
      date: string;
      change?: number;
      lastUpdated: string;
      source?: string;
    }> = {};
    
    Object.entries(METRIC_TO_FRED_MAPPING).forEach(([metricName, seriesId]) => {
      const data = fredData[seriesId];
      transformedData[metricName] = {
        value: data.value,
        formatted: data.formatted || 'N/A',
        date: data.date || '',
        change: data.change,
        lastUpdated: new Date().toISOString(),
        source: 'FRED'
      };
    });

    // Add additional data sources
    Object.entries(additionalData).forEach(([metricName, data]) => {
      transformedData[metricName] = {
        value: data.value,
        formatted: data.formatted || 'N/A',
        date: data.date || '',
        change: data.change,
        lastUpdated: new Date().toISOString(),
        source: data.source || 'Unknown'
      };
    });

    // Get cache statistics
    const fredCacheStats = fredService.getCacheStats();
    const marketCacheStats = multiSourceDataService.getMarketCacheStats();

    debugInfo.cacheStats = {
      fredCache: fredCacheStats,
      marketCache: marketCacheStats
    };

    console.log('📊 Final API Response Summary:');
    console.log(`  Total metrics: ${Object.keys(transformedData).length}`);
    console.log(`  FRED metrics: ${Object.keys(METRIC_TO_FRED_MAPPING).length}`);
    console.log(`  Market metrics: ${Object.keys(additionalData).length}`);
    console.log(`  Errors: ${debugInfo.errors.length}`);

    return NextResponse.json({
      success: true,
      data: transformedData,
      timestamp: new Date().toISOString(),
      sources: {
        fred: Object.keys(METRIC_TO_FRED_MAPPING).length,
        additional: Object.keys(additionalData).length,
        total: Object.keys(transformedData).length
      },
      debug: debugInfo
    });

  } catch (error) {
    console.error('❌ Critical error in API route:', error);
    debugInfo.errors.push(`Critical API error: ${error}`);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch economic data',
        timestamp: new Date().toISOString(),
        debug: debugInfo
      },
      { status: 500 }
    );
  }
}

// Add a separate debug endpoint
export async function POST() {
  try {
    console.log('🔍 Debug endpoint called');
    
    // Test individual API calls
    const tests = {
      fredTest: null as any,
      alphaVantageTest: null as any,
      environmentTest: {
        fredKey: process.env.FRED_API_KEY ? `${process.env.FRED_API_KEY.substring(0, 8)}...` : 'MISSING',
        alphaKey: process.env.ALPHA_VANTAGE_API_KEY ? `${process.env.ALPHA_VANTAGE_API_KEY.substring(0, 8)}...` : 'MISSING',
        nodeEnv: process.env.NODE_ENV
      }
    };

    // Test FRED API directly
    try {
      console.log('🧪 Testing FRED API...');
      const fredTestResult = await fredService.getLatestValue('UNRATE');
      tests.fredTest = {
        success: true,
        result: fredTestResult,
        cached: fredTestResult.formatted === 'N/A' ? false : true
      };
      console.log('✅ FRED test result:', fredTestResult);
    } catch (error) {
      tests.fredTest = {
        success: false,
        error: String(error)
      };
      console.log('❌ FRED test failed:', error);
    }

    // Test Alpha Vantage API directly
    try {
      console.log('🧪 Testing Alpha Vantage API...');
      const alphaTestResult = await multiSourceDataService.getVIX();
      tests.alphaVantageTest = {
        success: true,
        result: alphaTestResult,
        isFlack: alphaTestResult.source === 'Fallback Data'
      };
      console.log('✅ Alpha Vantage test result:', alphaTestResult);
    } catch (error) {
      tests.alphaVantageTest = {
        success: false,
        error: String(error)
      };
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

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}