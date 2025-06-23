// components/analytics/CorrelationMatrix.tsx
'use client';

import React, { useState, useEffect } from 'react';

import { 
  getCorrelationColor, 
  formatCorrelation, 
  getCorrelationDescription,
  type CorrelationData,
  type CorrelationMatrix as CorrelationMatrixType
} from '@/lib/utils/correlationUtils';

interface CorrelationMatrixProps {
  timeRange?: number; // days
  minStrength?: CorrelationData['strength'];
  showHeatMap?: boolean;
  showTopCorrelations?: boolean;
  className?: string;
}

interface CorrelationResponse {
  matrix: CorrelationMatrixType;
  filteredCorrelations: CorrelationData[];
  summary: {
    totalMetrics: number;
    totalPairs: number;
    significantPairs: number;
    timeRange: {
      days: number;
      startDate: string | null;
      endDate: string;
    };
    dataPoints: {
      min: number;
      max: number;
      average: number;
    };
  };
}

const STRENGTH_OPTIONS = [
  { value: 'very-weak', label: 'All Correlations' },
  { value: 'weak', label: 'Weak+' },
  { value: 'moderate', label: 'Moderate+' },
  { value: 'strong', label: 'Strong+' },
  { value: 'very-strong', label: 'Very Strong Only' }
] as const;

const TIME_RANGES = [
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
  { label: '180 Days', days: 180 },
  { label: 'All Time', days: 0 }
];

export function CorrelationMatrix({
  timeRange = 90,
  minStrength = 'weak',
  showHeatMap = true,
  showTopCorrelations = true,
  className = ''
}: CorrelationMatrixProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedMinStrength, setSelectedMinStrength] = useState(minStrength);
  const [data, setData] = useState<CorrelationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ i: number; j: number } | null>(null);

  useEffect(() => {
    const loadCorrelations = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          days: selectedTimeRange.toString(),
          minStrength: selectedMinStrength
        });

        const response = await fetch(`/api/correlations?${params}`);
        const result = await response.json();

        if (!result.success) {
          setError(result.error || 'Failed to load correlation data');
          return;
        }

        setData(result.data);
      } catch (err) {
        console.error('Error loading correlation data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadCorrelations();
  }, [selectedTimeRange, selectedMinStrength]);

  const getStrengthBadgeColor = (strength: CorrelationData['strength']) => {
    switch (strength) {
      case 'very-strong': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'strong': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'moderate': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'weak': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Calculating correlations...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center min-h-96 flex items-center justify-center">
          <div>
            <div className="text-red-500 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.768 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 font-medium">Error Loading Correlations</p>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
        <div className="text-center min-h-96 flex items-center justify-center">
          <p className="text-gray-600 dark:text-gray-400">No correlation data available</p>
        </div>
      </div>
    );
  }

  const { matrix, filteredCorrelations, summary } = data;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Correlation Matrix
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {summary.totalMetrics} metrics • {summary.significantPairs} significant pairs
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="text-right text-sm">
          <div className="text-gray-600 dark:text-gray-400">
            Data Points: {summary.dataPoints.min}-{summary.dataPoints.max} (avg: {summary.dataPoints.average})
          </div>
          <div className="text-gray-500 dark:text-gray-500">
            {summary.timeRange.days > 0 ? `Last ${summary.timeRange.days} days` : 'All available data'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-6">
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

        {/* Strength Filter */}
        <select
          value={selectedMinStrength}
          onChange={(e) => setSelectedMinStrength(e.target.value as CorrelationData['strength'])}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
        >
          {STRENGTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-6">
        {/* Heat Map */}
        {showHeatMap && (
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
              Correlation Heat Map
            </h4>
            <div className="overflow-auto">
              <div className="inline-block min-w-full">
                <table className="border-collapse">
                  <thead>
                    <tr>
                      <th className="w-32"></th>
                      {matrix.metrics.map((metric, _index) => (
                        <th 
                          key={metric} 
                          className="p-1 text-xs font-medium text-gray-700 dark:text-gray-300 transform -rotate-45 origin-bottom-left"
                          style={{ 
                            height: '100px',
                            minWidth: '60px',
                            maxWidth: '60px'
                          }}
                        >
                          <div className="truncate w-16" title={metric}>
                            {metric}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.metrics.map((rowMetric, i) => (
                      <tr key={rowMetric}>
                        <td className="p-2 text-xs font-medium text-gray-700 dark:text-gray-300 text-right w-32">
                          <div className="truncate" title={rowMetric}>
                            {rowMetric}
                          </div>
                        </td>
                        {matrix.metrics.map((colMetric, j) => {
                          const correlation = matrix.matrix[i][j];
                          const isHovered = hoveredCell?.i === i && hoveredCell?.j === j;
                          
                          return (
                            <td
                              key={`${i}-${j}`}
                              className={`w-12 h-12 text-center border border-gray-200 dark:border-gray-600 cursor-pointer relative ${
                                isHovered ? 'ring-2 ring-blue-500' : ''
                              }`}
                              style={{ 
                                backgroundColor: getCorrelationColor(correlation),
                                minWidth: '48px',
                                maxWidth: '48px'
                              }}
                              onMouseEnter={() => setHoveredCell({ i, j })}
                              onMouseLeave={() => setHoveredCell(null)}
                              title={`${rowMetric} vs ${colMetric}: ${formatCorrelation(correlation)}`}
                            >
                              <span className={`text-xs font-medium ${
                                Math.abs(correlation) > 0.5 ? 'text-white' : 'text-gray-800'
                              }`}>
                                {formatCorrelation(correlation)}
                              </span>
                              
                              {/* Hover tooltip */}
                              {isHovered && (
                                <div className="absolute z-10 bg-gray-900 text-white text-xs rounded p-2 -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                                  {rowMetric} vs {colMetric}
                                  <br />
                                  {formatCorrelation(correlation)}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getCorrelationColor(-1) }}></div>
                <span className="text-gray-600 dark:text-gray-400">Strong Negative (-1)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getCorrelationColor(0) }}></div>
                <span className="text-gray-600 dark:text-gray-400">No Correlation (0)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: getCorrelationColor(1) }}></div>
                <span className="text-gray-600 dark:text-gray-400">Strong Positive (+1)</span>
              </div>
            </div>
          </div>
        )}

        {/* Top Correlations List */}
        {showTopCorrelations && (
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
              Significant Correlations ({filteredCorrelations.length})
            </h4>
            {filteredCorrelations.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredCorrelations.slice(0, 20).map((corr, _index) => (
                  <div 
                    key={`${corr.metric1}-${corr.metric2}`}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {corr.metric1} ↔ {corr.metric2}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {getCorrelationDescription(corr)} • {corr.dataPoints} data points
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span 
                        className="text-lg font-bold"
                        style={{ color: getCorrelationColor(corr.correlation) }}
                      >
                        {formatCorrelation(corr.correlation)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrengthBadgeColor(corr.strength)}`}>
                        {corr.strength.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
                
                {filteredCorrelations.length > 20 && (
                  <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                    ... and {filteredCorrelations.length - 20} more correlations
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No correlations found with the selected minimum strength.
                <br />
                Try lowering the strength filter or increasing the time range.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CorrelationMatrix;