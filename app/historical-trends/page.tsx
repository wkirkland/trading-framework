// app/historical-trends/page.tsx
'use client';

import React from 'react';
import { HistoricalTrends } from '@/components/analytics/HistoricalTrends';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { metricsData } from '@/lib/data/metrics';

const FEATURED_METRICS = [
  'Fed Funds Rate',
  'Unemployment Rate (U-3)', 
  'VIX Index',
  'S&P 500'
];

export default function HistoricalTrendsPage() {
  const featuredMetrics = metricsData.filter(m => 
    FEATURED_METRICS.includes(m.name) && m.isPocMetric
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary fallback={<div className="text-red-500 p-4">Error loading historical trends</div>}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Historical Trends Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl">
            Analyze historical performance and identify patterns in economic indicators and market metrics over time.
            Use the controls to explore different time ranges and compare trends across metrics.
          </p>
        </div>

        {/* Interactive Chart */}
        <div className="mb-8">
          <HistoricalTrends 
            height={400}
            showControls={true}
            className="shadow-lg"
          />
        </div>

        {/* Featured Metrics Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Key Economic Indicators
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredMetrics.map((metric) => (
              <HistoricalTrends
                key={metric.name}
                metricName={metric.name}
                timeRange={90} // 3 months
                height={250}
                showControls={false}
                className="shadow-md"
              />
            ))}
          </div>
        </div>

        {/* Analysis Summary */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            📊 Analysis Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                📈 Trend Detection
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Automatic calculation of trend direction and percentage change over selected time periods.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                🎯 Interactive Controls
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Switch between metrics and time ranges (7 days to all-time) for flexible analysis.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                💾 Cached Data
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Uses locally stored historical data for fast loading and offline availability.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                📅 Date Range Info
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Clear display of data coverage periods and latest available values.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                🎨 Visual Indicators
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Color-coded trends (green=up, red=down, gray=stable) with emoji indicators.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                📱 Responsive Design
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Charts adapt to screen size and support both light and dark themes.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            🔮 Coming Soon
          </h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>• <strong>Correlation Analysis:</strong> Compare how metrics move together</p>
            <p>• <strong>Pattern Recognition:</strong> Identify recurring economic cycles</p>
            <p>• <strong>Multi-metric Overlays:</strong> Chart multiple indicators on one graph</p>
            <p>• <strong>Predictive Indicators:</strong> Early warning signals and forecasting</p>
            <p>• <strong>Export Capabilities:</strong> Download charts and data for external use</p>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}