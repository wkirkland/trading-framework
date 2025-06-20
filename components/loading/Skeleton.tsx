// components/loading/Skeleton.tsx
'use client';

import React from 'react';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'rounded' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

function BaseSkeleton({
  className = '',
  width,
  height,
  variant = 'rectangular',
  animation = 'pulse'
}: SkeletonProps) {
  const style: React.CSSProperties = {};
  
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      className={`skeleton skeleton-${variant} skeleton-${animation} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// Card skeleton components
interface CardSkeletonProps {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function CardSkeleton({ count = 1, size = 'md', className = '' }: CardSkeletonProps) {
  const cards = Array.from({ length: count }, (_, i) => (
    <div key={i} className={`skeleton-card skeleton-card-${size} ${className}`}>
      {/* Header */}
      <div className="skeleton-card-header">
        <BaseSkeleton variant="circular" width={24} height={24} />
        <BaseSkeleton variant="rounded" width={40} height={16} />
      </div>
      
      {/* Content */}
      <div className="skeleton-card-content">
        <BaseSkeleton variant="text" width="80%" height={20} className="skeleton-title" />
        <BaseSkeleton variant="text" width="60%" height={32} className="skeleton-value" />
        <BaseSkeleton variant="rectangular" width="100%" height={20} className="skeleton-sparkline" />
        
        {/* Pills */}
        <div className="skeleton-pills">
          <BaseSkeleton variant="rounded" width={60} height={20} />
          <BaseSkeleton variant="rounded" width={50} height={20} />
        </div>
        
        <BaseSkeleton variant="text" width="90%" height={14} className="skeleton-reasoning" />
        <BaseSkeleton variant="text" width="40%" height={12} className="skeleton-footer" />
      </div>
    </div>
  ));

  return count > 1 ? <div className="skeleton-grid">{cards}</div> : cards[0];
}

// Metric card skeleton
interface MetricCardSkeletonProps {
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function MetricCardSkeleton({ count = 6, size = 'md', className = '' }: MetricCardSkeletonProps) {
  const cards = Array.from({ length: count }, (_, i) => (
    <div key={i} className={`skeleton-metric-card metric-card-${size} ${className}`}>
      {/* Header with icon and live indicator */}
      <div className="skeleton-metric-header">
        <div className="skeleton-icon-container">
          <BaseSkeleton variant="rectangular" width={20} height={20} className="skeleton-icon" />
        </div>
        <BaseSkeleton variant="rounded" width={30} height={12} className="skeleton-live" />
      </div>
      
      {/* Content */}
      <div className="skeleton-metric-content">
        <BaseSkeleton variant="text" width="85%" height={18} className="skeleton-metric-name" />
        
        {/* Value section */}
        <div className="skeleton-value-section">
          <BaseSkeleton variant="text" width="70%" height={28} className="skeleton-metric-value" />
          <BaseSkeleton variant="text" width="50%" height={16} className="skeleton-change" />
        </div>
        
        {/* Sparkline */}
        <BaseSkeleton variant="rectangular" width="100%" height={20} className="skeleton-sparkline" />
        
        {/* Pills */}
        <div className="skeleton-metric-pills">
          <BaseSkeleton variant="rounded" width={70} height={18} />
          <BaseSkeleton variant="rounded" width={55} height={18} />
        </div>
        
        {/* Reasoning */}
        <BaseSkeleton variant="text" width="100%" height={14} />
        <BaseSkeleton variant="text" width="75%" height={14} />
        
        {/* Footer */}
        <BaseSkeleton variant="text" width="45%" height={12} className="skeleton-next-update" />
      </div>
    </div>
  ));

  return <div className="skeleton-metrics-grid">{cards}</div>;
}

// Table skeleton
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

function TableSkeleton({ rows = 10, columns = 6, className = '' }: TableSkeletonProps) {
  return (
    <div className={`skeleton-table-container ${className}`}>
      {/* Table header */}
      <div className="skeleton-table-header">
        <BaseSkeleton variant="text" width="200px" height={24} className="skeleton-table-title" />
        <BaseSkeleton variant="text" width="300px" height={16} className="skeleton-table-subtitle" />
        
        {/* Summary stats */}
        <div className="skeleton-summary-stats">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton-stat">
              <BaseSkeleton variant="text" width={30} height={20} />
              <BaseSkeleton variant="text" width={50} height={12} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Table */}
      <div className="skeleton-table">
        {/* Header row */}
        <div className="skeleton-table-row skeleton-header-row">
          {Array.from({ length: columns }, (_, i) => (
            <BaseSkeleton key={i} variant="text" width="80%" height={16} />
          ))}
        </div>
        
        {/* Data rows */}
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="skeleton-table-row">
            {Array.from({ length: columns }, (_, colIndex) => (
              <div key={colIndex} className="skeleton-table-cell">
                {colIndex === 0 ? (
                  <div className="skeleton-name-cell">
                    <BaseSkeleton variant="text" width="90%" height={16} />
                    <BaseSkeleton variant="text" width="50%" height={12} />
                  </div>
                ) : colIndex === 1 ? (
                  <BaseSkeleton variant="text" width="60%" height={16} />
                ) : colIndex === 2 || colIndex === 3 || colIndex === 4 ? (
                  <BaseSkeleton variant="rounded" width={60} height={20} />
                ) : colIndex === 5 ? (
                  <div className="skeleton-reasoning-cell">
                    <BaseSkeleton variant="text" width="100%" height={14} />
                    <BaseSkeleton variant="text" width="80%" height={14} />
                  </div>
                ) : (
                  <BaseSkeleton variant="text" width="40%" height={12} />
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Metric table skeleton
interface MetricTableSkeletonProps {
  rows?: number;
  className?: string;
}

function MetricTableSkeleton({ rows = 15, className = '' }: MetricTableSkeletonProps) {
  return <TableSkeleton rows={rows} columns={7} className={`skeleton-metric-table ${className}`} />;
}

// Chart skeleton
interface ChartSkeletonProps {
  type?: 'gauge' | 'line' | 'bar' | 'area';
  className?: string;
}

function ChartSkeleton({ type = 'gauge', className = '' }: ChartSkeletonProps) {
  return (
    <div className={`skeleton-chart skeleton-chart-${type} ${className}`}>
      <div className="skeleton-chart-header">
        <BaseSkeleton variant="text" width="150px" height={20} className="skeleton-chart-title" />
        <BaseSkeleton variant="text" width="200px" height={14} className="skeleton-chart-subtitle" />
      </div>
      
      <div className="skeleton-chart-content">
        {type === 'gauge' ? (
          <BaseSkeleton variant="circular" width={200} height={200} className="skeleton-gauge" />
        ) : (
          <BaseSkeleton variant="rectangular" width="100%" height={200} className="skeleton-chart-area" />
        )}
      </div>
      
      {type === 'gauge' && (
        <div className="skeleton-gauge-breakdown">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="skeleton-breakdown-item">
              <BaseSkeleton variant="text" width={80} height={12} />
              <BaseSkeleton variant="text" width={30} height={16} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Dashboard skeleton
interface DashboardSkeletonProps {
  className?: string;
}

function DashboardSkeleton({ className = '' }: DashboardSkeletonProps) {
  return (
    <div className={`skeleton-dashboard ${className}`}>
      {/* Header */}
      <div className="skeleton-dashboard-header">
        <BaseSkeleton variant="text" width="300px" height={32} className="skeleton-dashboard-title" />
        <BaseSkeleton variant="text" width="400px" height={16} className="skeleton-dashboard-subtitle" />
        
        {/* Status */}
        <div className="skeleton-status">
          <BaseSkeleton variant="circular" width={8} height={8} />
          <BaseSkeleton variant="text" width="120px" height={14} />
          <BaseSkeleton variant="text" width="100px" height={14} />
          <BaseSkeleton variant="rounded" width={80} height={24} />
        </div>
      </div>
      
      {/* Thesis selector */}
      <div className="skeleton-thesis-selector">
        <BaseSkeleton variant="text" width="180px" height={20} />
        <BaseSkeleton variant="rounded" width="300px" height={40} />
      </div>
      
      {/* View toggle */}
      <div className="skeleton-view-toggle">
        <BaseSkeleton variant="rounded" width={200} height={36} />
      </div>
      
      {/* Main content grid */}
      <div className="skeleton-main-grid">
        {/* Gauge */}
        <div className="skeleton-gauge-section">
          <ChartSkeleton type="gauge" />
        </div>
        
        {/* Conflicts */}
        <div className="skeleton-conflicts-section">
          <BaseSkeleton variant="text" width="150px" height={20} />
          {Array.from({ length: 2 }, (_, i) => (
            <div key={i} className="skeleton-conflict-alert">
              <BaseSkeleton variant="text" width="90%" height={16} />
              <BaseSkeleton variant="text" width="100%" height={14} />
            </div>
          ))}
        </div>
      </div>
      
      {/* Metrics grid */}
      <MetricCardSkeleton count={6} />
    </div>
  );
}

// Grid skeleton
interface GridSkeletonProps {
  count?: number;
  columns?: number;
  className?: string;
}

function GridSkeleton({ count = 6, columns = 3, className = '' }: GridSkeletonProps) {
  const items = Array.from({ length: count }, (_, i) => (
    <div key={i} className="skeleton-grid-item">
      <BaseSkeleton variant="rectangular" width="100%" height={120} />
      <BaseSkeleton variant="text" width="80%" height={16} />
      <BaseSkeleton variant="text" width="60%" height={14} />
    </div>
  ));

  return (
    <div 
      className={`skeleton-grid skeleton-grid-${columns}col ${className}`}
      style={{ '--columns': columns } as React.CSSProperties}
    >
      {items}
    </div>
  );
}

// Export all skeleton components
export const Skeleton = {
  Base: BaseSkeleton,
  Card: CardSkeleton,
  MetricCard: MetricCardSkeleton,
  Table: TableSkeleton,
  MetricTable: MetricTableSkeleton,
  Chart: ChartSkeleton,
  Dashboard: DashboardSkeleton,
  Grid: GridSkeleton
};