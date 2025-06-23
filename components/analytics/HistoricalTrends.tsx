// components/analytics/HistoricalTrends.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

import { metricsData } from '@/lib/data/metrics';

interface HistoricalDataPoint {
  date: string;
  value: number | null;
  formattedValue: string;
  change?: number | null;
  source: string;
  isFallback: boolean;
  timestamp: number;
}

interface TrendSummary {
  direction: 'up' | 'down' | 'stable' | 'unknown';
  percentage: number | null;
  description: string;
}

interface HistoricalData {
  metricName: string;
  dataPoints: HistoricalDataPoint[];
  summary: {
    totalPoints: number;
    dateRange: {
      start: string;
      end: string;
    };
    trend: TrendSummary;
    latest: HistoricalDataPoint | null;
  };
}

interface HistoricalTrendsProps {
  metricName?: string;
  timeRange?: number; // days
  height?: number;
  showControls?: boolean;
  className?: string;
}

const TIME_RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: 'All Time', days: 0 }
];

export function HistoricalTrends({
  metricName,
  timeRange = 30,
  height = 300,
  showControls = true,
  className = ''
}: HistoricalTrendsProps) {
  const [selectedMetric, setSelectedMetric] = useState(metricName || metricsData[0]?.name || '');
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [data, setData] = useState<HistoricalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const availableMetrics = metricsData.filter(m => m.isPocMetric);

  useEffect(() => {
    if (!selectedMetric) return;

    const loadHistoricalData = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          metric: selectedMetric,
          days: selectedTimeRange.toString(),
          limit: '100'
        });

        const response = await fetch(`/api/historical?${params}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || 'Failed to load historical data');
          return;
        }

        setData(result.data);
      } catch (err) {
        console.error('Error loading historical data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadHistoricalData();
  }, [selectedMetric, selectedTimeRange]);

  const formatTooltipValue = (value: any, name: string) => {
    if (value === null || value === undefined) return ['N/A', name];
    
    // Find the metric config to get formatting info
    const metricConfig = metricsData.find(m => m.name === selectedMetric);
    if (metricConfig?.units) {
      return [`${value}${metricConfig.units}`, name];
    }
    
    return [value, name];
  };

  const formatXAxisTick = (tickItem: any) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up': return '#10b981'; // Green
      case 'down': return '#ef4444'; // Red
      case 'stable': return '#6b7280'; // Gray
      default: return '#6b7280';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const chartData = data?.dataPoints.map(point => ({
    date: point.date,
    timestamp: point.timestamp,
    value: point.value,
    formattedValue: point.formattedValue,
    isFallback: point.isFallback
  })) || [];

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading historical data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center" style={{ height }}>
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.768 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">Error Loading Data</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!data || data.dataPoints.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center" style={{ height }}>
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 00-2-2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 font-medium">No Historical Data</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            No historical data available for {selectedMetric}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Historical Trends
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {data.summary.totalPoints} data points over {selectedTimeRange || 'all'} days
          </p>
        </div>
        
        {/* Trend Summary */}
        {data.summary.trend && (
          <div className="text-right">
            <div className="flex items-center justify-end space-x-2">
              <span className="text-lg">{getTrendIcon(data.summary.trend.direction)}</span>
              <span 
                className="font-semibold"
                style={{ color: getTrendColor(data.summary.trend.direction) }}
              >
                {data.summary.trend.percentage !== null 
                  ? `${data.summary.trend.percentage >= 0 ? '+' : ''}${data.summary.trend.percentage.toFixed(2)}%`
                  : 'N/A'
                }
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.summary.trend.description}
            </p>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Metric Selector */}
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            {availableMetrics.map((metric) => (
              <option key={metric.name} value={metric.name}>
                {metric.name}
              </option>
            ))}
          </select>

          {/* Time Range Selector */}
          <div className="flex space-x-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.days}
                onClick={() => setSelectedTimeRange(range.days)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeRange === range.days
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="timestamp"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              tickFormatter={formatXAxisTick}
              stroke="#6b7280"
            />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric' 
                });
              }}
              formatter={formatTooltipValue}
              contentStyle={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--on-surface-2)'
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={getTrendColor(data.summary.trend.direction)}
              strokeWidth={2}
              dot={{ fill: getTrendColor(data.summary.trend.direction), strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, stroke: getTrendColor(data.summary.trend.direction), strokeWidth: 2 }}
              connectNulls={false}
            />
            
            {/* Add reference line for zero if values go negative */}
            {chartData.some(d => d.value && d.value < 0) && (
              <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer info */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Latest: {data.summary.latest?.formattedValue || 'N/A'} 
          {data.summary.latest?.date && ` (${data.summary.latest.date})`}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Range: {data.summary.dateRange.start} to {data.summary.dateRange.end}
        </div>
      </div>
    </div>
  );
}

export default HistoricalTrends;