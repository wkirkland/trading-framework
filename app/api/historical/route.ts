// app/api/historical/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFileStorage } from '@/lib/storage/fileStorage';

interface HistoricalDataPoint {
  date: string;
  value: number | null;
  formattedValue: string;
  change?: number | null;
  source: string;
  isFallback: boolean;
  timestamp: number;
}

interface HistoricalResponse {
  metricName: string;
  dataPoints: HistoricalDataPoint[];
  summary: {
    totalPoints: number;
    dateRange: {
      start: string;
      end: string;
    };
    trend: {
      direction: 'up' | 'down' | 'stable' | 'unknown';
      percentage: number | null;
      description: string;
    };
    latest: HistoricalDataPoint | null;
  };
}

function calculateTrend(dataPoints: HistoricalDataPoint[]): {
  direction: 'up' | 'down' | 'stable' | 'unknown';
  percentage: number | null;
  description: string;
} {
  if (dataPoints.length < 2) {
    return {
      direction: 'unknown',
      percentage: null,
      description: 'Insufficient data for trend analysis'
    };
  }

  // Get first and last valid data points
  const validPoints = dataPoints.filter(p => p.value !== null && !isNaN(p.value as number));
  
  if (validPoints.length < 2) {
    return {
      direction: 'unknown',
      percentage: null,
      description: 'No valid numeric data for trend analysis'
    };
  }

  const firstPoint = validPoints[0];
  const lastPoint = validPoints[validPoints.length - 1];
  
  if (!firstPoint.value || !lastPoint.value) {
    return {
      direction: 'unknown',
      percentage: null,
      description: 'Missing values for trend calculation'
    };
  }

  const percentageChange = ((lastPoint.value - firstPoint.value) / Math.abs(firstPoint.value)) * 100;
  
  let direction: 'up' | 'down' | 'stable' = 'stable';
  let description = '';

  if (Math.abs(percentageChange) < 1) {
    direction = 'stable';
    description = `Relatively stable (${percentageChange >= 0 ? '+' : ''}${percentageChange.toFixed(2)}%)`;
  } else if (percentageChange > 0) {
    direction = 'up';
    description = `Trending upward (+${percentageChange.toFixed(2)}%)`;
  } else {
    direction = 'down';
    description = `Trending downward (${percentageChange.toFixed(2)}%)`;
  }

  return {
    direction,
    percentage: percentageChange,
    description
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricName = searchParams.get('metric');
    const daysBack = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!metricName) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameter: metric',
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

    // Get historical data for the specific metric
    const metricData = fileStorage.getHistoricalMetricData(metricName, limit * 2); // Get more data for filtering

    if (metricData.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No historical data found for metric: ${metricName}`,
        data: null
      }, { status: 404 });
    }

    // Apply date filtering if specified
    let filteredData = metricData;
    if (daysBack > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      
      filteredData = metricData.filter(item => 
        new Date(item.createdAt) >= cutoffDate
      );
    }

    // Apply limit
    if (limit > 0) {
      filteredData = filteredData.slice(0, limit);
    }

    // Transform data for response
    const dataPoints: HistoricalDataPoint[] = filteredData
      .reverse() // Oldest first for charts
      .map(item => ({
        date: item.date,
        value: item.value,
        formattedValue: item.formattedValue,
        change: item.changeValue,
        source: item.source,
        isFallback: item.isFallback,
        timestamp: new Date(item.createdAt).getTime()
      }));

    // Calculate summary information
    const trend = calculateTrend(dataPoints);
    
    const summary = {
      totalPoints: dataPoints.length,
      dateRange: {
        start: dataPoints.length > 0 ? dataPoints[0].date : '',
        end: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].date : ''
      },
      trend,
      latest: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1] : null
    };

    const response: HistoricalResponse = {
      metricName,
      dataPoints,
      summary
    };

    return NextResponse.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Historical API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
}

// Also support getting multiple metrics at once
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, days = 30, limit = 100 } = body;

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing or invalid metrics array',
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

    const results: HistoricalResponse[] = [];

    for (const metricName of metrics) {
      try {
        // Get historical data for this metric
        const metricData = fileStorage.getHistoricalMetricData(metricName, limit * 2);

        if (metricData.length === 0) {
          continue; // Skip metrics with no data
        }

        let filteredData = metricData;
        if (days > 0) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - days);
          
          filteredData = metricData.filter(item => 
            new Date(item.createdAt) >= cutoffDate
          );
        }

        if (limit > 0) {
          filteredData = filteredData.slice(0, limit);
        }

        const dataPoints: HistoricalDataPoint[] = filteredData
          .reverse()
          .map(item => ({
            date: item.date,
            value: item.value,
            formattedValue: item.formattedValue,
            change: item.changeValue,
            source: item.source,
            isFallback: item.isFallback,
            timestamp: new Date(item.createdAt).getTime()
          }));

        const trend = calculateTrend(dataPoints);
        
        const summary = {
          totalPoints: dataPoints.length,
          dateRange: {
            start: dataPoints.length > 0 ? dataPoints[0].date : '',
            end: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].date : ''
          },
          trend,
          latest: dataPoints.length > 0 ? dataPoints[dataPoints.length - 1] : null
        };

        results.push({
          metricName,
          dataPoints,
          summary
        });

      } catch (error) {
        console.error(`Error processing metric ${metricName}:`, error);
        // Continue with other metrics
      }
    }

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Historical multi-metric API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
}