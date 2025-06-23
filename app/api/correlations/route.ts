// app/api/correlations/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { getFileStorage } from '@/lib/storage/fileStorage';
import { 
  buildCorrelationMatrix, 
  filterCorrelationsByStrength,
  type CorrelationData,
  type MetricDataPoint
} from '@/lib/utils/correlationUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get('days') || '90');
    const minStrength = searchParams.get('minStrength') as CorrelationData['strength'] || 'weak';
    const metricsParam = searchParams.get('metrics');
    
    const fileStorage = getFileStorage();

    if (!fileStorage.isAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Storage service is not available',
        data: null
      }, { status: 503 });
    }

    // Get all historical data
    const allHistoricalData = fileStorage.getAllHistoricalData();
    
    if (allHistoricalData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No historical data available for correlation analysis',
        data: null
      }, { status: 404 });
    }

    // Apply date filtering
    let filteredData = allHistoricalData;
    if (daysBack > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      
      filteredData = allHistoricalData.filter(item => 
        new Date(item.createdAt) >= cutoffDate
      );
    }

    // Group data by metric
    const metricDataMap = new Map<string, MetricDataPoint[]>();
    
    for (const item of filteredData) {
      if (item.value === null || item.value === undefined) continue;
      
      if (!metricDataMap.has(item.metricName)) {
        metricDataMap.set(item.metricName, []);
      }
      
      metricDataMap.get(item.metricName)!.push({
        date: item.date,
        value: item.value,
        timestamp: new Date(item.createdAt).getTime()
      });
    }

    // Filter metrics if specified
    let metricsToAnalyze: string[];
    if (metricsParam) {
      metricsToAnalyze = metricsParam.split(',').map(m => m.trim());
      // Only keep metrics that exist in our data
      metricsToAnalyze = metricsToAnalyze.filter(m => metricDataMap.has(m));
    } else {
      metricsToAnalyze = Array.from(metricDataMap.keys());
    }

    // Filter out metrics with insufficient data (need at least 5 data points)
    const MIN_DATA_POINTS = 5;
    metricsToAnalyze = metricsToAnalyze.filter(metric => {
      const dataPoints = metricDataMap.get(metric)?.length || 0;
      return dataPoints >= MIN_DATA_POINTS;
    });

    if (metricsToAnalyze.length < 2) {
      return NextResponse.json({
        success: false,
        error: `Insufficient metrics for correlation analysis. Need at least 2 metrics with ${MIN_DATA_POINTS}+ data points each.`,
        data: null
      }, { status: 400 });
    }

    // Prepare data for correlation calculation
    const metricData: Record<string, MetricDataPoint[]> = {};
    for (const metric of metricsToAnalyze) {
      const data = metricDataMap.get(metric) || [];
      // Sort by timestamp and remove duplicates
      const sortedData = data
        .sort((a, b) => a.timestamp - b.timestamp)
        .filter((item, index, array) => 
          index === 0 || item.timestamp !== array[index - 1].timestamp
        );
      metricData[metric] = sortedData;
    }

    // Build correlation matrix
    const correlationMatrix = buildCorrelationMatrix(metricData);
    
    // Filter by minimum strength
    const filteredCorrelations = filterCorrelationsByStrength(
      correlationMatrix.correlations,
      minStrength
    );

    // Prepare response
    const response = {
      matrix: correlationMatrix,
      filteredCorrelations,
      summary: {
        totalMetrics: correlationMatrix.metrics.length,
        totalPairs: correlationMatrix.correlations.length,
        significantPairs: filteredCorrelations.length,
        timeRange: {
          days: daysBack,
          startDate: daysBack > 0 ? new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString() : null,
          endDate: new Date().toISOString()
        },
        dataPoints: {
          min: Math.min(...correlationMatrix.correlations.map(c => c.dataPoints)),
          max: Math.max(...correlationMatrix.correlations.map(c => c.dataPoints)),
          average: Math.round(
            correlationMatrix.correlations.reduce((sum, c) => sum + c.dataPoints, 0) / 
            correlationMatrix.correlations.length
          )
        }
      }
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Correlation analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
}

// POST endpoint for analyzing specific metric pairs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metricPairs, days = 90 } = body;

    if (!metricPairs || !Array.isArray(metricPairs) || metricPairs.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid metricPairs array',
        data: null
      }, { status: 400 });
    }

    const fileStorage = getFileStorage();

    if (!fileStorage.isAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Storage service is not available',
        data: null
      }, { status: 503 });
    }

    // Get historical data
    const allHistoricalData = fileStorage.getAllHistoricalData();
    
    // Apply date filtering
    let filteredData = allHistoricalData;
    if (days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      filteredData = allHistoricalData.filter(item => 
        new Date(item.createdAt) >= cutoffDate
      );
    }

    // Group data by metric
    const metricDataMap = new Map<string, MetricDataPoint[]>();
    
    for (const item of filteredData) {
      if (item.value === null || item.value === undefined) continue;
      
      if (!metricDataMap.has(item.metricName)) {
        metricDataMap.set(item.metricName, []);
      }
      
      metricDataMap.get(item.metricName)!.push({
        date: item.date,
        value: item.value,
        timestamp: new Date(item.createdAt).getTime()
      });
    }

    const results: CorrelationData[] = [];

    // Analyze each requested pair
    for (const pair of metricPairs) {
      const { metric1, metric2 } = pair;
      
      const data1 = metricDataMap.get(metric1);
      const data2 = metricDataMap.get(metric2);
      
      if (!data1 || !data2 || data1.length < 3 || data2.length < 3) {
        continue; // Skip pairs with insufficient data
      }

      // Sort data
      const sortedData1 = data1.sort((a, b) => a.timestamp - b.timestamp);
      const sortedData2 = data2.sort((a, b) => a.timestamp - b.timestamp);

      // Calculate correlation using existing utility
      const metricData = {
        [metric1]: sortedData1,
        [metric2]: sortedData2
      };
      
      const matrix = buildCorrelationMatrix(metricData);
      const correlation = matrix.correlations.find(c => 
        (c.metric1 === metric1 && c.metric2 === metric2) ||
        (c.metric1 === metric2 && c.metric2 === metric1)
      );
      
      if (correlation) {
        results.push(correlation);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        correlations: results,
        timeRange: {
          days,
          startDate: days > 0 ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString() : null,
          endDate: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Correlation pair analysis error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
}