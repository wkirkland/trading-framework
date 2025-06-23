// app/correlation-analysis/page.tsx
'use client';

import React from 'react';

import { CorrelationMatrix } from '@/components/analytics/CorrelationMatrix';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

export default function CorrelationAnalysisPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary fallback={<div className="text-red-500 p-4">Error loading correlation analysis</div>}>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Correlation Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-4xl">
            Analyze relationships between economic indicators and market metrics. 
            Correlation values range from -1 (perfect negative correlation) to +1 (perfect positive correlation).
            Use this analysis to understand how different metrics move together or in opposition.
          </p>
        </div>

        {/* Main Correlation Matrix */}
        <div className="mb-8">
          <CorrelationMatrix 
            timeRange={90}
            minStrength="weak"
            showHeatMap={true}
            showTopCorrelations={true}
            className="shadow-lg"
          />
        </div>

        {/* Understanding Correlations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* How to Read */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              📖 How to Read Correlations
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: '#065f46', minWidth: '24px' }}></div>
                <div>
                  <strong className="text-blue-800 dark:text-blue-200">+0.7 to +1.0:</strong>
                  <span className="text-blue-700 dark:text-blue-300"> Strong positive correlation - metrics move up together</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: '#10b981', minWidth: '24px' }}></div>
                <div>
                  <strong className="text-blue-800 dark:text-blue-200">+0.3 to +0.7:</strong>
                  <span className="text-blue-700 dark:text-blue-300"> Moderate positive correlation</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: '#e5e7eb', minWidth: '24px' }}></div>
                <div>
                  <strong className="text-blue-800 dark:text-blue-200">-0.3 to +0.3:</strong>
                  <span className="text-blue-700 dark:text-blue-300"> Weak or no correlation</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: '#ef4444', minWidth: '24px' }}></div>
                <div>
                  <strong className="text-blue-800 dark:text-blue-200">-0.3 to -0.7:</strong>
                  <span className="text-blue-700 dark:text-blue-300"> Moderate negative correlation</span>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-4 rounded" style={{ backgroundColor: '#7f1d1d', minWidth: '24px' }}></div>
                <div>
                  <strong className="text-blue-800 dark:text-blue-200">-0.7 to -1.0:</strong>
                  <span className="text-blue-700 dark:text-blue-300"> Strong negative correlation - one goes up, other goes down</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expected Economic Relationships */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-4">
              💡 Expected Economic Relationships
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-green-800 dark:text-green-200">VIX vs S&P 500:</strong>
                <span className="text-green-700 dark:text-green-300"> Strong negative (fear vs stocks)</span>
              </div>
              <div>
                <strong className="text-green-800 dark:text-green-200">Unemployment vs GDP:</strong>
                <span className="text-green-700 dark:text-green-300"> Negative (higher unemployment = lower growth)</span>
              </div>
              <div>
                <strong className="text-green-800 dark:text-green-200">Fed Funds vs Unemployment:</strong>
                <span className="text-green-700 dark:text-green-300"> Negative (Fed cuts rates when unemployment rises)</span>
              </div>
              <div>
                <strong className="text-green-800 dark:text-green-200">CPI vs Fed Funds:</strong>
                <span className="text-green-700 dark:text-green-300"> Positive (Fed raises rates when inflation rises)</span>
              </div>
              <div>
                <strong className="text-green-800 dark:text-green-200">Dollar Index vs Commodities:</strong>
                <span className="text-green-700 dark:text-green-300"> Negative (strong dollar = cheaper commodities)</span>
              </div>
              <div>
                <strong className="text-green-800 dark:text-green-200">10Y Treasury vs Stocks:</strong>
                <span className="text-green-700 dark:text-green-300"> Variable (depends on growth vs inflation concerns)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Trading Insights */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800 mb-8">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">
            💼 Trading and Investment Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                Risk Management
              </h4>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>• Strong positive correlations = concentrated risk</li>
                <li>• Negative correlations = natural hedges</li>
                <li>• Look for correlation breakdowns during stress</li>
                <li>• Use uncorrelated assets for diversification</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">
                Market Timing
              </h4>
              <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                <li>• VIX spikes often precede S&P reversals</li>
                <li>• Fed policy changes lead economic data</li>
                <li>• Dollar strength affects international exposure</li>
                <li>• Yield curve shapes predict recession risk</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Technical Notes */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            🔧 Technical Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Calculation Method</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Uses Pearson correlation coefficient with timestamp alignment and 1-day tolerance for data matching.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Data Requirements</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Minimum 5 overlapping data points per metric pair. More data points increase reliability.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Time Sensitivity</h4>
              <p className="text-gray-600 dark:text-gray-400">
                Correlations can change over time. Shorter periods show recent relationships, longer periods show structural patterns.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Next */}
        <div className="mt-8 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border border-amber-200 dark:border-amber-800">
          <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100 mb-3">
            🚀 Next: Pattern Recognition
          </h3>
          <p className="text-amber-700 dark:text-amber-300 text-sm">
            Coming soon: Automated detection of correlation patterns like &quot;risk-off mode&quot; (VIX↑ + Dollar↑ + Stocks↓) 
            and &quot;growth scare&quot; patterns. Real-time alerts when historical correlation patterns activate.
          </p>
        </div>
      </ErrorBoundary>
    </div>
  );
}