// app/api/correlation/route.ts
// Correlation analysis API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getFileStorage } from '@/lib/storage/fileStorage';
import { calculateCorrelation } from '@/lib/utils/correlationUtils';
import { metricsData } from '@/lib/data/metrics';

interface CorrelationPair {
  metric1: string;
  metric2: string;
  correlation: number;
  dataPoints: number;
  strength: 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak';
  direction: 'positive' | 'negative';
}

interface CorrelationResponse {
  success: boolean;
  data?: {
    correlations: CorrelationPair[];
    timeRange: {
      start: string;
      end: string;
      days: number;
    };
    metadata: {
      totalPairs: number;
      calculatedPairs: number;
      minDataPoints: number;
    };
  };
  error?: string;
}

function getCorrelationStrength(correlation: number): 'very_strong' | 'strong' | 'moderate' | 'weak' | 'very_weak' {
  const abs = Math.abs(correlation);
  if (abs >= 0.8) return 'very_strong';
  if (abs >= 0.6) return 'strong';
  if (abs >= 0.4) return 'moderate';
  if (abs >= 0.2) return 'weak';
  return 'very_weak';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '90');
    const minStrength = searchParams.get('minStrength') || 'weak';
    const limit = parseInt(searchParams.get('limit') || '50');

    const fileStorage = getFileStorage();

    if (!fileStorage.isAvailable()) {
      return NextResponse.json({
        success: false,
        error: 'Storage service is not available'
      } as CorrelationResponse, { status: 503 });
    }

    // Get POC metrics for correlation analysis
    const pocMetrics = metricsData.filter(m => m.isPocMetric);
    
    if (pocMetrics.length < 2) {
      return NextResponse.json({
        success: false,
        error: 'Need at least 2 metrics for correlation analysis'
      } as CorrelationResponse, { status: 400 });
    }

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const correlations: CorrelationPair[] = [];
    let calculatedPairs = 0;
    const totalPairs = (pocMetrics.length * (pocMetrics.length - 1)) / 2;

    // Calculate correlations for all metric pairs
    for (let i = 0; i < pocMetrics.length; i++) {
      for (let j = i + 1; j < pocMetrics.length; j++) {
        const metric1 = pocMetrics[i];
        const metric2 = pocMetrics[j];

        try {
          // Get historical data for both metrics
          const data1 = fileStorage.getHistoricalMetricData(metric1.name, 1000)
            .filter(item => new Date(item.createdAt) >= cutoffDate)
            .map(item => ({
              date: item.date,
              value: item.value
            }))
            .filter(item => item.value !== null);

          const data2 = fileStorage.getHistoricalMetricData(metric2.name, 1000)
            .filter(item => new Date(item.createdAt) >= cutoffDate)
            .map(item => ({
              date: item.date,
              value: item.value
            }))
            .filter(item => item.value !== null);

          if (data1.length < 5 || data2.length < 5) {
            continue; // Need at least 5 data points for meaningful correlation
          }

          const correlationResult = calculateCorrelation(data1, data2);
          const strength = getCorrelationStrength(correlationResult.correlation);

          // Filter by minimum strength
          const strengthOrder = ['very_weak', 'weak', 'moderate', 'strong', 'very_strong'];
          const minStrengthIndex = strengthOrder.indexOf(minStrength);
          const currentStrengthIndex = strengthOrder.indexOf(strength);

          if (currentStrengthIndex >= minStrengthIndex) {
            correlations.push({
              metric1: metric1.name,
              metric2: metric2.name,
              correlation: correlationResult.correlation,
              dataPoints: correlationResult.dataPoints,
              strength,
              direction: correlationResult.correlation >= 0 ? 'positive' : 'negative'
            });
          }

          calculatedPairs++;

        } catch (error) {
          console.error(`Error calculating correlation between ${metric1.name} and ${metric2.name}:`, error);
          // Continue with other pairs
        }
      }
    }

    // Sort by absolute correlation strength (descending)
    correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

    // Apply limit
    const limitedCorrelations = correlations.slice(0, limit);

    // Calculate time range from available data
    const endDate = new Date();
    const startDate = new Date(cutoffDate);

    const response: CorrelationResponse = {
      success: true,
      data: {
        correlations: limitedCorrelations,
        timeRange: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
          days
        },
        metadata: {
          totalPairs,
          calculatedPairs,
          minDataPoints: 5
        }
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Correlation API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    } as CorrelationResponse, { status: 500 });
  }
}