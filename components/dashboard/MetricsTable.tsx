// app/components/dashboard/MetricsTable.tsx (Modified for PoC)
'use client';

import React from 'react'; // Import React if using JSX features like fragments

import type { SignalData } from '@/lib/hooks/useSignalAnalysis'; // Import the type for the metrics data
import { DataFreshnessIndicator } from '@/components/monitoring/DataFreshnessIndicator';

// Define props for the component
interface MetricsTableProps {
  metricsForTable: SignalData[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  // Optional: pass loading/error/lastFetched/fetchData from parent if needed here
  // lastDataFetched?: Date | null;
  // onRefreshData?: () => void;
}

export function MetricsTable({ metricsForTable, loading, error, onRetry }: MetricsTableProps) {
  // Filters are removed for PoC simplicity as the parent now controls the metric list (20 PoC metrics)
  // Summary stats are also removed as they were based on all metricsData

  const getSignalClass = (signal: string) => {
    if (signal.includes('confirm')) return 'text-green-600 dark:text-green-400 font-semibold';
    if (signal.includes('contradict')) return 'text-red-600 dark:text-red-400 font-semibold';
    if (signal.includes('neutral')) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400'; // For 'no_data' or 'no_rule_match'
  };

  const getImpactClass = (impact: 'high' | 'medium' | 'low') => {
    if (impact === 'high') return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
    if (impact === 'medium') return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
    if (impact === 'low') return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
  };

  // Error state
  if (error) {
    return (
      <div className="card p-6 bg-surface-2 shadow-lg rounded-lg">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: 'var(--status-negative)', marginBottom: '1rem' }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--on-surface-2)' }}>Unable to Load Metrics</h3>
          <p style={{ margin: '0 0 1rem 0', color: 'var(--on-surface-2-muted)' }}>{error}</p>
          {onRetry && (
            <button 
              onClick={onRetry}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--color-primary-500)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Retry Loading
            </button>
          )}
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="card p-6 bg-surface-2 shadow-lg rounded-lg">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '3px solid var(--border-subtle)',
            borderTop: '3px solid var(--color-primary-500)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: 'var(--on-surface-2-muted)' }}>Loading metrics...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!metricsForTable || metricsForTable.length === 0) {
    return (
      <div className="card p-6 bg-surface-2 shadow-lg rounded-lg">
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ color: 'var(--on-surface-2-muted)', marginBottom: '1rem' }}>
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 00-2-2z" />
            </svg>
          </div>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--on-surface-2)' }}>No Metrics Available</h3>
          <p style={{ color: 'var(--on-surface-2-muted)' }}>No metrics to display for the selected thesis or data is still loading.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-0 md:p-0 lg:p-0 overflow-x-auto bg-surface-2 shadow-lg rounded-lg"> {/* Adjusted padding for table */}
      {/* Header for the table section - can be simplified or removed if parent handles it */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-on-surface-2">Thesis Metric Analysis</h2>
        <p className="text-xs text-on-surface-2-muted">
            Displaying metrics relevant to the selected thesis.
        </p>
      </div>

      <div className="table-container"> {/* Ensure this class provides good table styling */}
        <table>
          <thead>
            <tr>
              <th>Metric Name</th>
              <th>Current Value</th>
              <th>Change</th>
              <th>Data Freshness</th>
              <th>Thesis Signal</th>
              <th>Reasoning / Matched Rule</th>
              <th>Impact (Weight-Based)</th>
              <th>Next Update</th>
            </tr>
          </thead>
          <tbody>
            {metricsForTable.map((metric, index) => (
              <tr key={metric.name + index}> {/* Use a more stable key if possible, e.g., metric.name if unique */}
                <td className="py-3 px-4 font-medium text-on-surface-2 whitespace-nowrap">
                  {metric.name}
                </td>
                <td className="py-3 px-4 text-on-surface-2 whitespace-nowrap">
                  {metric.value !== null ? metric.value.toFixed(2) : 'N/A'}
                </td>
                <td className={`py-3 px-4 whitespace-nowrap ${metric.change.includes('↑') ? 'text-green-500 dark:text-green-400' : metric.change.includes('↓') ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  {metric.change}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <DataFreshnessIndicator
                    metricName={metric.name}
                    lastUpdated={metric.lastUpdated}
                    compact={true}
                    showTooltip={true}
                  />
                </td>
                <td className={`py-3 px-4 whitespace-nowrap ${getSignalClass(metric.currentSignal)}`}>
                  {metric.currentSignal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </td>
                <td className="py-3 px-4 text-xs text-on-surface-2 max-w-xs break-words"> {/* max-w-xs for better layout */}
                  {metric.reasoning}
                  {/* Tooltip could be added here for longer reasoning */}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getImpactClass(metric.impact)}`}>
                    {metric.impact.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-on-surface-2-muted whitespace-nowrap">
                  {metric.nextUpdate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-on-surface-2-muted">
        <p>Showing {metricsForTable.length} metrics for the current thesis.</p>
      </div>
    </div>
  );
}


