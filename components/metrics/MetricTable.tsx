// components/metrics/MetricTable.tsx
'use client';

import React from 'react';

import { DataTable, type TableColumn } from '@/components/table/DataTable';
import { MetricTooltip } from '@/components/ui/Tooltip';
import type { SignalData } from '@/lib/hooks/useSignalAnalysis';

interface MetricTableProps {
  metrics: SignalData[];
  loading?: boolean;
  error?: string;
  onRowClick?: (metric: SignalData) => void;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function MetricTable({
  metrics,
  loading = false,
  error,
  onRowClick,
  className = '',
  title = 'Economic Indicators Analysis',
  subtitle = 'Detailed view of all metrics with sortable columns'
}: MetricTableProps) {

  // Define table columns
  const columns: TableColumn<SignalData>[] = [
    {
      id: 'name',
      header: 'Metric Name',
      accessorKey: 'name',
      sortable: true,
      sticky: true,
      width: '200px',
      cell: ({ row }) => (
        <MetricTooltip
          metricName={row.original.name}
          description={row.original.reasoning}
          source="Federal Reserve Economic Data (FRED)"
          frequency="Daily"
        >
          <div className="metric-name-cell">
            <div className="metric-name-primary">{row.original.name}</div>
            {row.original.value !== null && row.original.value !== undefined && (
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span className="live-text">Live Data</span>
              </div>
            )}
          </div>
        </MetricTooltip>
      )
    },
    {
      id: 'value',
      header: 'Current Value',
      accessorKey: 'value',
      sortable: true,
      align: 'right',
      width: '120px',
      cell: ({ row }) => {
        const { value, name } = row.original;
        if (value === null || value === undefined) {
          return <span className="no-data">No data</span>;
        }
        
        const formattedValue = typeof value === 'number' ? value.toFixed(2) : String(value);
        const unit = name.includes('Rate') || name.includes('Unemployment') ? '%' : '';
        
        return (
          <div className="value-cell">
            <span className="value-number">{formattedValue}{unit}</span>
          </div>
        );
      }
    },
    {
      id: 'signal',
      header: 'Signal',
      accessorKey: 'currentSignal',
      sortable: true,
      align: 'center',
      width: '100px',
      cell: ({ row }) => (
        <span className={`signal-badge ${row.original.currentSignal}`}>
          {row.original.currentSignal.toUpperCase()}
        </span>
      )
    },
    {
      id: 'alignment',
      header: 'Thesis Alignment',
      accessorFn: (row) => row.currentSignal,
      sortable: true,
      align: 'center',
      width: '140px',
      cell: ({ row }) => {
        const signal = row.original.currentSignal;
        const alignment = signal === 'confirm' ? 'SUPPORTS' :
                         signal === 'contradict' ? 'CONTRADICTS' : 'NEUTRAL';
        const colorClass = signal === 'confirm' ? 'supports' :
                          signal === 'contradict' ? 'contradicts' : 'neutral';
        
        return (
          <span className={`alignment-badge ${colorClass}`}>
            {alignment}
          </span>
        );
      }
    },
    {
      id: 'impact',
      header: 'Impact Weight',
      accessorKey: 'impact',
      sortable: true,
      align: 'center',
      width: '120px',
      cell: ({ row }) => (
        <span className={`impact-badge ${row.original.impact}`}>
          {row.original.impact.toUpperCase()}
        </span>
      )
    },
    {
      id: 'change',
      header: 'Recent Change',
      accessorKey: 'change',
      sortable: true,
      align: 'center',
      width: '120px',
      cell: ({ row }) => {
        const change = row.original.change;
        const changeClass = change.includes('↑') ? 'positive' :
                           change.includes('↓') ? 'negative' : 'neutral';
        
        return (
          <span className={`change-indicator ${changeClass}`}>
            {change}
          </span>
        );
      }
    },
    {
      id: 'reasoning',
      header: 'Analysis Reasoning',
      accessorKey: 'reasoning',
      sortable: false,
      width: '300px',
      cell: ({ row }) => (
        <div className="reasoning-cell">
          <div className="reasoning-text" title={row.original.reasoning}>
            {row.original.reasoning}
          </div>
        </div>
      )
    },
    {
      id: 'nextUpdate',
      header: 'Next Update',
      accessorKey: 'nextUpdate',
      sortable: true,
      align: 'center',
      width: '100px',
      cell: ({ row }) => (
        <span className="next-update">{row.original.nextUpdate}</span>
      )
    }
  ];

  return (
    <div className={`metric-table-container ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="metric-table-header">
          {title && <h2 className="metric-table-title">{title}</h2>}
          {subtitle && <p className="metric-table-subtitle">{subtitle}</p>}
          
          {/* Summary stats */}
          <div className="table-summary-stats">
            <div className="summary-stat">
              <span className="stat-value">{metrics.length}</span>
              <span className="stat-label">Total Metrics</span>
            </div>
            <div className="summary-stat confirm">
              <span className="stat-value">{metrics.filter(m => m.currentSignal === 'confirm').length}</span>
              <span className="stat-label">Confirm</span>
            </div>
            <div className="summary-stat contradict">
              <span className="stat-value">{metrics.filter(m => m.currentSignal === 'contradict').length}</span>
              <span className="stat-label">Contradict</span>
            </div>
            <div className="summary-stat neutral">
              <span className="stat-value">{metrics.filter(m => m.currentSignal === 'neutral').length}</span>
              <span className="stat-label">Neutral</span>
            </div>
            <div className="summary-stat live">
              <span className="stat-value">{metrics.filter(m => m.value !== null).length}</span>
              <span className="stat-label">Live Data</span>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={metrics}
        columns={columns}
        loading={loading}
        error={error}
        stickyHeader={true}
        sortable={true}
        pagination={true}
        pageSize={20}
        onRowClick={onRowClick}
        rowClassName={(row) => `metric-row signal-${row.currentSignal}`}
        emptyMessage="No economic indicators available"
      />
    </div>
  );
}