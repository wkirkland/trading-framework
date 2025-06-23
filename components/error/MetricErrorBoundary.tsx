// components/error/MetricErrorBoundary.tsx
'use client';

import React from 'react';

import { ErrorBoundary } from './ErrorBoundary';

interface MetricErrorBoundaryProps {
  children: React.ReactNode;
  metricName: string;
  fallbackData?: {
    value: number | null;
    change: string;
    lastUpdated: Date | null;
  };
  onError?: (error: Error) => void;
}

function MetricErrorFallback({ 
  error, 
  retry, 
  hasRetried, 
  metricName,
  fallbackData 
}: {
  error: Error;
  retry: () => void;
  hasRetried: boolean;
  metricName: string;
  fallbackData?: MetricErrorBoundaryProps['fallbackData'];
}) {
  const isApiError = error.message.toLowerCase().includes('api') ||
                     error.message.toLowerCase().includes('fetch') ||
                     error.message.toLowerCase().includes('network');

  return (
    <div
      style={{
        padding: '1rem',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        backgroundColor: 'var(--surface-2)',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative'
      }}
    >
      {/* Error indicator */}
      <div 
        title="Data unavailable"
        style={{
          position: 'absolute',
          top: '0.5rem',
          right: '0.5rem',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: 'var(--status-negative)'
        }} 
      />

      <div style={{ textAlign: 'center' as const }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ color: 'var(--status-negative)', opacity: 0.6 }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h4 style={{
          margin: '0 0 0.25rem 0',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'var(--on-surface-2)'
        }}>
          {metricName}
        </h4>

        {fallbackData ? (
          <div style={{ marginBottom: '0.5rem' }}>
            <div style={{
              fontSize: '1.2rem',
              fontWeight: '700',
              color: 'var(--on-surface-2-muted)',
              marginBottom: '0.25rem'
            }}>
              {fallbackData.value !== null ? fallbackData.value.toFixed(2) : 'N/A'}
              <span style={{ fontSize: '0.7rem', marginLeft: '0.25rem' }}>(cached)</span>
            </div>
            <div style={{
              fontSize: '0.8rem',
              color: 'var(--on-surface-2-muted)'
            }}>
              {fallbackData.change} • {fallbackData.lastUpdated ? 
                new Intl.RelativeTimeFormat().format(-Math.floor((Date.now() - fallbackData.lastUpdated.getTime()) / (1000 * 60 * 60)), 'hour') :
                'No recent data'
              }
            </div>
          </div>
        ) : (
          <div style={{
            fontSize: '0.8rem',
            color: 'var(--on-surface-2-muted)',
            marginBottom: '0.5rem'
          }}>
            {isApiError ? 'Data source unavailable' : 'Display error'}
          </div>
        )}

        {!hasRetried && (
          <button
            onClick={retry}
            style={{
              padding: '0.25rem 0.5rem',
              fontSize: '0.75rem',
              backgroundColor: 'transparent',
              color: 'var(--color-primary-500)',
              border: '1px solid var(--color-primary-500)',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '0.25rem'
            }}
            title="Retry loading metric data"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

export function MetricErrorBoundary({
  children,
  metricName,
  fallbackData,
  onError
}: MetricErrorBoundaryProps) {
  return (
    <ErrorBoundary
      component={`Metric-${metricName}`}
      maxRetries={2}
      retryDelay={2000}
      onError={onError}
      fallback={(error, retry, hasRetried) => (
        <MetricErrorFallback
          error={error}
          retry={retry}
          hasRetried={hasRetried}
          metricName={metricName}
          fallbackData={fallbackData}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export default MetricErrorBoundary;