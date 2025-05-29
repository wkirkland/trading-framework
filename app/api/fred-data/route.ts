// app/api/fred-data/route.ts

import { NextResponse } from 'next/server';
import { fredService, METRIC_TO_FRED_MAPPING } from '@/lib/services/fredService';

export async function GET() {
  try {
    // Get all the FRED series IDs we want to fetch
    const seriesIds = Object.values(METRIC_TO_FRED_MAPPING);
    
    // Fetch data for all series
    const fredData = await fredService.getBulkData(seriesIds);
    
    // Transform the data to match our metric names
    const transformedData: Record<string, any> = {};
    
    Object.entries(METRIC_TO_FRED_MAPPING).forEach(([metricName, seriesId]) => {
      const data = fredData[seriesId];
      transformedData[metricName] = {
        value: data.value,
        formatted: data.formatted,
        date: data.date,
        change: data.change,
        lastUpdated: new Date().toISOString()
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching FRED data:', error);
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