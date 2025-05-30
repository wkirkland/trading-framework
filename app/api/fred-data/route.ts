// app/api/fred-data/route.ts

import { NextResponse } from 'next/server';
import { fredService, METRIC_TO_FRED_MAPPING } from '@/lib/services/fredService';
import { multiSourceDataService } from '@/lib/services/multiSourceDataService';

export async function GET() {
  try {
    // Get all the FRED series IDs we want to fetch
    const seriesIds = Object.values(METRIC_TO_FRED_MAPPING);
    
    // Fetch FRED data for all series
    const fredData = await fredService.getBulkData(seriesIds);
    
    // Fetch additional data from other sources
    const additionalData = await multiSourceDataService.getAllAdditionalData();
    
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

    return NextResponse.json({
      success: true,
      data: transformedData,
      timestamp: new Date().toISOString(),
      sources: {
        fred: Object.keys(METRIC_TO_FRED_MAPPING).length,
        additional: Object.keys(additionalData).length,
        total: Object.keys(transformedData).length
      }
    });

  } catch (error) {
    console.error('Error fetching multi-source data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch economic data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}