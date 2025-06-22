// app/components/dashboard/MetricsTable.tsx (Modified for PoC)
'use client';

import React from 'react'; // Import React if using JSX features like fragments

import type { SignalData } from '@/lib/hooks/useSignalAnalysis'; // Import the type for the metrics data

// Define props for the component
interface MetricsTableProps {
  metricsForTable: SignalData[];
  // Optional: pass loading/error/lastFetched/fetchData from parent if needed here
  // isLoading?: boolean;
  // dataError?: any;
  // lastDataFetched?: Date | null;
  // onRefreshData?: () => void;
}

export function MetricsTable({ metricsForTable }: MetricsTableProps) {
  // Filters are removed for PoC simplicity as the parent now controls the metric list (20 PoC metrics)
  // Summary stats are also removed as they were based on all metricsData

  const getSignalClass = (signal: string) => {
    if (signal.includes('confirm')) return 'text-green-600 font-semibold';
    if (signal.includes('contradict')) return 'text-red-600 font-semibold';
    if (signal.includes('neutral')) return 'text-gray-800';
    return 'text-gray-700'; // For 'no_data' or 'no_rule_match'
  };

  const getImpactClass = (impact: 'high' | 'medium' | 'low') => {
    if (impact === 'high') return 'bg-red-100 text-red-700';
    if (impact === 'medium') return 'bg-yellow-100 text-yellow-700';
    if (impact === 'low') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (!metricsForTable || metricsForTable.length === 0) {
    return (
      <div className="card p-6 bg-surface-2 shadow-lg rounded-lg">
        <p className="text-on-surface-2-muted italic">No metrics to display for the selected thesis or data is still loading.</p>
      </div>
    );
  }

  return (
    <div className="card p-0 md:p-0 lg:p-0 overflow-x-auto bg-surface-2 shadow-lg rounded-lg"> {/* Adjusted padding for table */}
      {/* Header for the table section - can be simplified or removed if parent handles it */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Thesis Metric Analysis</h2>
        <p className="text-xs text-gray-700">
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
              <th>Thesis Signal</th>
              <th>Reasoning / Matched Rule</th>
              <th>Impact (Weight-Based)</th>
              <th>Next Update</th>
            </tr>
          </thead>
          <tbody>
            {metricsForTable.map((metric, index) => (
              <tr key={metric.name + index}> {/* Use a more stable key if possible, e.g., metric.name if unique */}
                <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">
                  {metric.name}
                </td>
                <td className="py-3 px-4 text-gray-900 whitespace-nowrap">
                  {metric.value !== null ? metric.value.toFixed(2) : 'N/A'}
                </td>
                <td className={`py-3 px-4 whitespace-nowrap ${metric.change.includes('↑') ? 'text-green-500' : metric.change.includes('↓') ? 'text-red-500' : 'text-gray-700'}`}>
                  {metric.change}
                </td>
                <td className={`py-3 px-4 whitespace-nowrap ${getSignalClass(metric.currentSignal)}`}>
                  {metric.currentSignal.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </td>
                <td className="py-3 px-4 text-xs text-gray-800 max-w-xs break-words"> {/* max-w-xs for better layout */}
                  {metric.reasoning}
                  {/* Tooltip could be added here for longer reasoning */}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getImpactClass(metric.impact)}`}>
                    {metric.impact.toUpperCase()}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                  {metric.nextUpdate}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-700">
        <p>Showing {metricsForTable.length} metrics for the current thesis.</p>
      </div>
    </div>
  );
}


