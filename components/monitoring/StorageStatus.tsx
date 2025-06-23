// components/monitoring/StorageStatus.tsx
'use client';

import React, { useState, useEffect } from 'react';

import { getStorageService, type StorageMetrics } from '@/lib/services/storageService';

interface StorageStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function StorageStatus({ 
  showDetails = false, 
  compact = false, 
  className = '' 
}: StorageStatusProps) {
  const [metrics, setMetrics] = useState<StorageMetrics | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      try {
        const storageService = getStorageService();
        setIsAvailable(storageService.isAvailable());
        
        if (storageService.isAvailable()) {
          const storageMetrics = storageService.getMetrics();
          setMetrics(storageMetrics);
        }
      } catch (error) {
        console.error('Error getting storage metrics:', error);
        setIsAvailable(false);
        setMetrics(null);
      }
    };

    // Initial load
    updateMetrics();

    // Update every 30 seconds
    const interval = setInterval(updateMetrics, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Never';
    return new Intl.RelativeTimeFormat().format(
      -Math.floor((Date.now() - date.getTime()) / (1000 * 60)),
      'minute'
    );
  };

  if (compact) {
    return (
      <div className={`storage-status-compact ${className}`}>
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem'
          }}
          title={isAvailable ? 
            `Local storage active - ${metrics?.totalDataPoints || 0} data points` : 
            'Local storage unavailable'
          }
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isAvailable ? '#10b981' : '#6b7280'
            }}
          />
          <span style={{ color: 'var(--on-surface-2-muted)' }}>
            {isAvailable ? 'Local' : 'No Cache'}
          </span>
          {metrics && (
            <span style={{ color: 'var(--on-surface-2-muted)' }}>
              ({metrics.totalDataPoints})
            </span>
          )}
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <div className={`storage-status ${className}`}>
        <div style={{
          padding: '1rem',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          backgroundColor: 'var(--surface-2)',
          textAlign: 'center'
        }}>
          <div style={{ color: 'var(--on-surface-2-muted)', marginBottom: '0.5rem' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--on-surface-2)' }}>
            Local Storage Unavailable
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-2-muted)', marginTop: '0.25rem' }}>
            Data will be fetched from APIs only
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`storage-status ${className}`}>
      <div style={{
        padding: '1rem',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        backgroundColor: 'var(--surface-2)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: showDetails ? '1rem' : '0',
          gap: '8px'
        }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#10b981'
            }}
          />
          <span style={{ 
            fontWeight: '600', 
            color: 'var(--on-surface-2)',
            fontSize: '0.9rem'
          }}>
            Local Storage Active
          </span>
        </div>

        {showDetails && metrics && (
          <div style={{ fontSize: '0.8rem' }}>
            {/* Storage Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.5rem',
              marginBottom: '0.75rem'
            }}>
              <div>
                <div style={{ color: 'var(--on-surface-2-muted)', fontSize: '0.7rem' }}>
                  Data Points
                </div>
                <div style={{ color: 'var(--on-surface-2)', fontWeight: '600' }}>
                  {metrics.totalDataPoints.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--on-surface-2-muted)', fontSize: '0.7rem' }}>
                  Storage Size
                </div>
                <div style={{ color: 'var(--on-surface-2)', fontWeight: '600' }}>
                  {formatBytes(metrics.storageSize)}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--on-surface-2-muted)', fontSize: '0.7rem' }}>
                  Cache Hit Rate
                </div>
                <div style={{ color: 'var(--on-surface-2)', fontWeight: '600' }}>
                  {metrics.cacheHitRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--on-surface-2-muted)', fontSize: '0.7rem' }}>
                  Last Cleanup
                </div>
                <div style={{ color: 'var(--on-surface-2)', fontWeight: '600' }}>
                  {formatDate(metrics.lastCleanup)}
                </div>
              </div>
            </div>

            {/* Storage Benefits */}
            <div style={{
              padding: '0.5rem',
              backgroundColor: 'var(--surface-3)',
              borderRadius: '4px',
              borderLeft: '3px solid #10b981'
            }}>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--on-surface-2)',
                marginBottom: '0.25rem',
                fontWeight: '500'
              }}>
                Benefits Active:
              </div>
              <ul style={{
                margin: 0,
                paddingLeft: '1rem',
                fontSize: '0.7rem',
                color: 'var(--on-surface-2-muted)'
              }}>
                <li>Faster load times with cached data</li>
                <li>Offline availability for recent metrics</li>
                <li>Reduced API calls and rate limits</li>
                <li>Intelligent frequency-based storage</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StorageStatus;