// app/api/storage/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getStorageService } from '@/lib/services/storageService';
import { getFileStorage } from '@/lib/storage/fileStorage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section') || 'stats';

    const storageService = getStorageService();
    const fileStorage = getFileStorage();

    if (!storageService.isAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Storage service is not available',
        data: null
      });
    }

    switch (section) {
      case 'stats':
        const metrics = storageService.getMetrics();
        const allCachedData = await storageService.getAllCachedMetricsData();
        
        return NextResponse.json({
          success: true,
          data: {
            ...metrics,
            cachedMetrics: Object.keys(allCachedData).length,
            sampleMetricData: Object.entries(allCachedData)
              .slice(0, 5)
              .reduce((acc, [key, value]) => {
                acc[key] = value;
                return acc;
              }, {} as Record<string, any>),
            isAvailable: storageService.isAvailable()
          }
        });

      case 'metricData':
        const allLatestData = fileStorage.getAllLatestMetricsData();
        const metricDataArray = Object.entries(allLatestData).map(([name, data]) => ({
          metricName: name,
          ...data
        }));
        
        return NextResponse.json({
          success: true,
          data: metricDataArray
        });

      case 'metrics':
        // Return metrics configuration - this would need to be exposed from fileStorage
        return NextResponse.json({
          success: true,
          data: [] // Placeholder - would need to expose metrics config
        });

      case 'freshness':
        // Return freshness data - this would need to be exposed from fileStorage
        return NextResponse.json({
          success: true,
          data: [] // Placeholder - would need to expose freshness data
        });

      case 'apiHealth':
        // Return API health data - this would need to be exposed from fileStorage
        return NextResponse.json({
          success: true,
          data: [] // Placeholder - would need to expose API health data
        });

      case 'cache':
        // Return cache data - this would need to be exposed from fileStorage
        return NextResponse.json({
          success: true,
          data: [] // Placeholder - would need to expose cache data
        });

      case 'all':
        const allStats = storageService.getMetrics();
        const allCached = await storageService.getAllCachedMetricsData();
        const allLatest = fileStorage.getAllLatestMetricsData();
        
        return NextResponse.json({
          success: true,
          data: {
            stats: {
              ...allStats,
              cachedMetrics: Object.keys(allCached).length,
              isAvailable: storageService.isAvailable()
            },
            metricData: Object.entries(allLatest).map(([name, data]) => ({
              metricName: name,
              ...data
            })),
            metrics: [],
            freshness: [],
            apiHealth: [],
            cache: []
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown section: ${section}`,
          data: null
        });
    }

  } catch (error) {
    console.error('Storage API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
}