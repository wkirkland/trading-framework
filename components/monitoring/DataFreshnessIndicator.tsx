// components/monitoring/DataFreshnessIndicator.tsx
'use client';

import React, { useMemo } from 'react';

import { dataFreshnessService, type DataFreshnessStatus } from '@/lib/services/dataFreshnessService';
import { metricsData } from '@/lib/data/metrics';

interface DataFreshnessIndicatorProps {
  metricName: string;
  lastUpdated: Date | null;
  compact?: boolean;
  showTooltip?: boolean;
  className?: string;
}

export function DataFreshnessIndicator({
  metricName,
  lastUpdated,
  compact = false,
  showTooltip = true,
  className = ''
}: DataFreshnessIndicatorProps) {
  const freshnessStatus = useMemo((): DataFreshnessStatus => {
    // Find the metric configuration to get its expected frequency
    const metricConfig = metricsData.find(m => m.name === metricName);
    const frequency = metricConfig?.frequency || 'daily';
    const isMarketDependent = dataFreshnessService.isMarketDependentMetric(metricName);

    return dataFreshnessService.calculateFreshness(
      metricName,
      lastUpdated,
      frequency,
      isMarketDependent
    );
  }, [metricName, lastUpdated]);

  if (compact) {
    return (
      <div
        className={`data-freshness-compact ${className}`}
        title={showTooltip ? `${freshnessStatus.status.toUpperCase()}: ${dataFreshnessService.formatTimeSince(lastUpdated)}` : undefined}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px'
        }}
      >
        <span
          style={{
            color: dataFreshnessService.getStatusColor(freshnessStatus.status),
            fontSize: '0.7rem',
            lineHeight: 1
          }}
        >
          {dataFreshnessService.getStatusIcon(freshnessStatus.status)}
        </span>
        {!compact && (
          <span style={{ 
            fontSize: '0.65rem', 
            color: 'var(--on-surface-2-muted)',
            textTransform: 'capitalize'
          }}>
            {dataFreshnessService.getStatusDescription(freshnessStatus.status)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`data-freshness-indicator ${className}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem'
        }}
      >
        <span
          style={{
            color: dataFreshnessService.getStatusColor(freshnessStatus.status),
            fontSize: '0.8rem'
          }}
        >
          {dataFreshnessService.getStatusIcon(freshnessStatus.status)}
        </span>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px'
          }}>
            <span style={{ 
              color: 'var(--on-surface-2)',
              fontWeight: '500',
              textTransform: 'capitalize'
            }}>
              {dataFreshnessService.getStatusDescription(freshnessStatus.status)}
            </span>
            <span style={{ color: 'var(--on-surface-2-muted)' }}>
              {dataFreshnessService.formatTimeSince(lastUpdated)}
            </span>
          </div>
          
          {freshnessStatus.nextExpectedUpdate && (
            <div style={{ 
              fontSize: '0.65rem', 
              color: 'var(--on-surface-2-muted)'
            }}>
              Next: {dataFreshnessService.formatNextUpdate(freshnessStatus.nextExpectedUpdate)}
            </div>
          )}
          
          {freshnessStatus.isMarketHours !== undefined && (
            <div style={{ 
              fontSize: '0.65rem', 
              color: freshnessStatus.isMarketHours ? '#10b981' : '#6b7280'
            }}>
              {freshnessStatus.isMarketHours ? '📈 Market Open' : '📉 Market Closed'}
            </div>
          )}
        </div>
      </div>

      {showTooltip && (
        <div
          style={{
            marginTop: '4px',
            fontSize: '0.65rem',
            color: 'var(--on-surface-2-muted)',
            fontStyle: 'italic'
          }}
        >
          Expected: {freshnessStatus.expectedFrequency} updates
          {freshnessStatus.staleness > 0 && (
            <span> • {Math.round(freshnessStatus.staleness)}h old</span>
          )}
        </div>
      )}
    </div>
  );
}

export default DataFreshnessIndicator;