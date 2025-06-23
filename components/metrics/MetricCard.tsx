// components/metrics/MetricCard.tsx
'use client';

import React from 'react';

import { MetricTooltip } from '@/components/ui/Tooltip';
import { DataFreshnessIndicator } from '@/components/monitoring/DataFreshnessIndicator';
import { MetricErrorBoundary } from '@/components/error/MetricErrorBoundary';

export interface MetricCardData {
  name: string;
  value: number | null;
  formattedValue?: string;
  signal: 'confirm' | 'contradict' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  change: string;
  changeValue?: number;
  reasoning: string;
  nextUpdate: string;
  category?: string;
  isLive?: boolean;
  sparklineData?: number[];
  lastUpdated?: Date | null;
  source?: string;
  isFallback?: boolean;
  error?: string;
}

interface MetricCardProps {
  data: MetricCardData;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSparkline?: boolean;
  onClick?: () => void;
}

export function MetricCard({
  data,
  className = '',
  size = 'md',
  showSparkline = true,
  onClick
}: MetricCardProps) {
  const {
    name,
    value,
    formattedValue,
    signal,
    impact,
    change,
    reasoning,
    nextUpdate,
    category,
    isLive = false,
    sparklineData = []
  } = data;

  // Get metric icon based on name/category
  const getMetricIcon = () => {
    if (name.includes('Rate') || name.includes('Yield')) {
      return (
        <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    
    if (name.includes('VIX') || name.includes('Volatility')) {
      return (
        <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    }
    
    if (name.includes('S&P') || name.includes('Index')) {
      return (
        <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 00-2-2z" />
        </svg>
      );
    }
    
    if (name.includes('Employment') || name.includes('Unemployment')) {
      return (
        <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      );
    }
    
    // Default economic indicator icon
    return (
      <svg className="metric-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 00-2-2z" />
      </svg>
    );
  };

  // Simple sparkline component
  const Sparkline = ({ data }: { data: number[] }) => {
    if (!data || data.length < 2) return null;

    const width = 60;
    const height = 20;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="sparkline">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  };

  const sizeClasses = {
    sm: 'metric-card-sm',
    md: 'metric-card-md', 
    lg: 'metric-card-lg'
  };

  return (
    <MetricErrorBoundary
      metricName={name}
      fallbackData={{
        value: data.value,
        change: data.change,
        lastUpdated: data.lastUpdated
      }}
    >
      <div
        className={`metric-card ${sizeClasses[size]} ${signal} ${data.isFallback ? 'fallback' : ''} ${className}`}
        onClick={onClick}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
      {/* Header with icon and live indicator */}
      <div className="metric-card-header">
        <div className="metric-card-icon-container">
          {getMetricIcon()}
          {category && <div className={`metric-category-badge category-${category}`} />}
        </div>
        
        <div className="metric-card-status">
          {isLive && (
            <div className="metric-live-indicator">
              <span className="live-dot"></span>
              <span className="live-text">Live</span>
            </div>
          )}
          
          {data.lastUpdated && (
            <DataFreshnessIndicator
              metricName={name}
              lastUpdated={data.lastUpdated}
              compact={true}
              showTooltip={true}
            />
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="metric-card-content">
        {/* Metric name with tooltip */}
        <MetricTooltip
          metricName={name}
          description={reasoning}
          source="Federal Reserve Economic Data (FRED)"
          frequency="Daily"
        >
          <h3 className="metric-name" title={name}>
            {name}
          </h3>
        </MetricTooltip>

        {/* Value and change */}
        <div className="metric-value-section">
          <div className="metric-value">
            {value !== null && value !== undefined ? (
              <span className="value-number">
                {formattedValue || value.toFixed(2)}
                {name.includes('Rate') || name.includes('Unemployment') ? '%' : ''}
              </span>
            ) : (
              <span className="value-unavailable">N/A</span>
            )}
          </div>
          
          <div className={`metric-change ${
            change.includes('↑') ? 'change-positive' : 
            change.includes('↓') ? 'change-negative' : 'change-neutral'
          }`}>
            {change}
          </div>
        </div>

        {/* Sparkline */}
        {showSparkline && sparklineData.length > 1 && (
          <div className="metric-sparkline-container">
            <Sparkline data={sparklineData} />
          </div>
        )}

        {/* Status pills */}
        <div className="metric-pills">
          <span className={`metric-pill signal-pill ${signal}`}>
            {signal.toUpperCase()}
          </span>
          <span className={`metric-pill impact-pill ${impact}`}>
            {impact.toUpperCase()}
          </span>
        </div>

        {/* Reasoning */}
        <div className="metric-reasoning">
          {reasoning}
        </div>

        {/* Footer with next update */}
        <div className="metric-card-footer">
          <span className="next-update">Next: {nextUpdate}</span>
          {data.isFallback && (
            <span className="fallback-indicator" style={{ 
              fontSize: '0.65rem', 
              color: 'var(--status-warning)', 
              marginLeft: '0.5rem' 
            }}>
              Fallback Data
            </span>
          )}
        </div>
      </div>
      </div>
    </MetricErrorBoundary>
  );
}