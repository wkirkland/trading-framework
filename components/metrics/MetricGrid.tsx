// components/metrics/MetricGrid.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { MetricCard, type MetricCardData } from './MetricCard';
import { AnnouncementRegion } from '@/components/ui/LiveRegion';

interface MetricGridProps {
  metrics: MetricCardData[];
  title?: string;
  subtitle?: string;
  layout?: 'compact' | 'normal' | 'large';
  cardSize?: 'sm' | 'md' | 'lg';
  showSparklines?: boolean;
  onCardClick?: (metric: MetricCardData) => void;
  className?: string;
  loading?: boolean;
  error?: string;
}

export function MetricGrid({
  metrics,
  title,
  subtitle,
  layout = 'normal',
  cardSize = 'md',
  showSparklines = true,
  onCardClick,
  className = '',
  loading = false,
  error
}: MetricGridProps) {
  
  // Loading skeleton
  if (loading) {
    const skeletonCards = Array.from({ length: 6 }, (_, i) => (
      <div key={i} className="metric-card metric-card-skeleton">
        <div className="metric-card-header">
          <div className="skeleton-icon"></div>
          <div className="skeleton-live"></div>
        </div>
        <div className="metric-card-content">
          <div className="skeleton-name"></div>
          <div className="skeleton-value"></div>
          <div className="skeleton-sparkline"></div>
          <div className="skeleton-pills">
            <div className="skeleton-pill"></div>
            <div className="skeleton-pill"></div>
          </div>
          <div className="skeleton-reasoning"></div>
        </div>
      </div>
    ));

    return (
      <div className={`metric-grid-container ${className}`}>
        {(title || subtitle) && (
          <div className="metric-grid-header">
            {title && <h2 className="metric-grid-title">{title}</h2>}
            {subtitle && <p className="metric-grid-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className={`metrics-grid ${layout}`}>
          {skeletonCards}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`metric-grid-container ${className}`}>
        {(title || subtitle) && (
          <div className="metric-grid-header">
            {title && <h2 className="metric-grid-title">{title}</h2>}
            {subtitle && <p className="metric-grid-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="metric-grid-error">
          <div className="error-icon">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="error-title">Unable to load metrics</h3>
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!metrics || metrics.length === 0) {
    return (
      <div className={`metric-grid-container ${className}`}>
        {(title || subtitle) && (
          <div className="metric-grid-header">
            {title && <h2 className="metric-grid-title">{title}</h2>}
            {subtitle && <p className="metric-grid-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="metric-grid-empty">
          <div className="empty-icon">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 00-2-2z" />
            </svg>
          </div>
          <h3 className="empty-title">No metrics to display</h3>
          <p className="empty-message">Metrics will appear here when data is available.</p>
        </div>
      </div>
    );
  }

  // Get stats for the header
  const liveCount = metrics.filter(m => m.isLive).length;
  const confirmCount = metrics.filter(m => m.signal === 'confirm').length;
  const contradictCount = metrics.filter(m => m.signal === 'contradict').length;
  const neutralCount = metrics.filter(m => m.signal === 'neutral').length;

  // Track changes for announcements
  const [previousStats, setPreviousStats] = useState({ confirmCount, contradictCount, neutralCount, liveCount });
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    const statsChanged = 
      confirmCount !== previousStats.confirmCount ||
      contradictCount !== previousStats.contradictCount ||
      neutralCount !== previousStats.neutralCount ||
      liveCount !== previousStats.liveCount;

    if (statsChanged) {
      const changes = [];
      
      if (confirmCount !== previousStats.confirmCount) {
        const direction = confirmCount > previousStats.confirmCount ? 'increased' : 'decreased';
        changes.push(`Confirming signals ${direction} to ${confirmCount}`);
      }
      
      if (contradictCount !== previousStats.contradictCount) {
        const direction = contradictCount > previousStats.contradictCount ? 'increased' : 'decreased';
        changes.push(`Contradicting signals ${direction} to ${contradictCount}`);
      }
      
      if (liveCount !== previousStats.liveCount) {
        const direction = liveCount > previousStats.liveCount ? 'increased' : 'decreased';
        changes.push(`Live data sources ${direction} to ${liveCount}`);
      }

      if (changes.length > 0) {
        setAnnouncement(`Economic indicators updated: ${changes.join(', ')}`);
      }

      setPreviousStats({ confirmCount, contradictCount, neutralCount, liveCount });
    }
  }, [confirmCount, contradictCount, neutralCount, liveCount, previousStats]);

  return (
    <div className={`metric-grid-container ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="metric-grid-header">
          {title && <h2 className="metric-grid-title">{title}</h2>}
          {subtitle && <p className="metric-grid-subtitle">{subtitle}</p>}
          
          {/* Stats with live region */}
          <div className="metric-grid-stats">
            <div className="stat-item">
              <span className="stat-value">{metrics.length}</span>
              <span className="stat-label">Total</span>
            </div>
            {liveCount > 0 && (
              <div className="stat-item stat-live">
                <span 
                  className="stat-value"
                  aria-live="polite"
                  aria-atomic="true"
                  id="live-count-display"
                >
                  {liveCount}
                </span>
                <span className="stat-label">Live</span>
              </div>
            )}
            <div className="stat-item stat-confirm">
              <span 
                className="stat-value"
                aria-live="polite"
                aria-atomic="true"
                id="confirm-count-display"
              >
                {confirmCount}
              </span>
              <span className="stat-label">Confirm</span>
            </div>
            <div className="stat-item stat-contradict">
              <span 
                className="stat-value"
                aria-live="polite"
                aria-atomic="true"
                id="contradict-count-display"
              >
                {contradictCount}
              </span>
              <span className="stat-label">Contradict</span>
            </div>
            <div className="stat-item stat-neutral">
              <span 
                className="stat-value"
                aria-live="polite"
                aria-atomic="true"
                id="neutral-count-display"
              >
                {neutralCount}
              </span>
              <span className="stat-label">Neutral</span>
            </div>
          </div>
        </div>
      )}

      {/* Hidden announcement region for detailed updates */}
      {announcement && (
        <AnnouncementRegion
          message={announcement}
          id="metrics-change-announcements"
          politeness="polite"
          clearAfterMs={5000}
        />
      )}

      {/* Grid */}
      <div className={`metrics-grid ${layout}`}>
        {metrics.map((metric, index) => (
          <MetricCard
            key={`${metric.name}-${index}`}
            data={metric}
            size={cardSize}
            showSparkline={showSparklines}
            onClick={onCardClick ? () => onCardClick(metric) : undefined}
          />
        ))}
      </div>
    </div>
  );
}