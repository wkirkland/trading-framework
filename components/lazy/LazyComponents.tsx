// components/lazy/LazyComponents.tsx
'use client';

import React, { lazy } from 'react';

import { 
  SuspenseWrapper, 
  MetricCardSuspense,
  MetricTableSuspense,
  DashboardSuspense,
  ChartSuspense,
  SuspenseErrorBoundary
} from '@/components/loading/Suspense';

// Lazy load main dashboard components
export const LazySignalDashboard = lazy(() => 
  import('@/components/dashboard/SignalDashboard').then(module => ({
    default: module.default
  }))
);

export const LazyMetricGrid = lazy(() => 
  import('@/components/metrics/MetricGrid').then(module => ({
    default: module.MetricGrid
  }))
);

export const LazyMetricTable = lazy(() => 
  import('@/components/metrics/MetricTable').then(module => ({
    default: module.MetricTable
  }))
);

export const LazyGaugeChart = lazy(() => 
  import('@/components/charts/GaugeChart').then(module => ({
    default: module.GaugeChart
  }))
);

export const LazyDataTable = lazy(() => 
  import('@/components/table/DataTable').then(module => ({
    default: module.DataTable
  }))
);

// Lazy wrapper components with built-in Suspense
export interface LazySignalDashboardProps {
  className?: string;
}

export function LazySignalDashboardWrapper({ className = '' }: LazySignalDashboardProps) {
  return (
    <SuspenseErrorBoundary>
      <DashboardSuspense className={className}>
        <LazySignalDashboard />
      </DashboardSuspense>
    </SuspenseErrorBoundary>
  );
}

export interface LazyMetricGridProps {
  metrics: any[];
  title?: string;
  subtitle?: string;
  layout?: 'compact' | 'normal' | 'large';
  cardSize?: 'sm' | 'md' | 'lg';
  showSparklines?: boolean;
  onCardClick?: (metric: any) => void;
  className?: string;
  loading?: boolean;
  error?: string;
}

export function LazyMetricGridWrapper(props: LazyMetricGridProps) {
  const { cardSize = 'md', className = '' } = props;
  
  return (
    <SuspenseErrorBoundary>
      <MetricCardSuspense count={6} size={cardSize} className={className}>
        <LazyMetricGrid {...props} />
      </MetricCardSuspense>
    </SuspenseErrorBoundary>
  );
}

export interface LazyMetricTableProps {
  metrics: any[];
  loading?: boolean;
  error?: string;
  onRowClick?: (metric: any) => void;
  className?: string;
  title?: string;
  subtitle?: string;
}

export function LazyMetricTableWrapper(props: LazyMetricTableProps) {
  const { className = '' } = props;
  
  return (
    <SuspenseErrorBoundary>
      <MetricTableSuspense rows={15} className={className}>
        <LazyMetricTable {...props} />
      </MetricTableSuspense>
    </SuspenseErrorBoundary>
  );
}

export interface LazyGaugeChartProps {
  value: number;
  size?: number;
  title?: string;
  subtitle?: string;
  showValue?: boolean;
  showLabels?: boolean;
  colorScheme?: 'trading' | 'default';
  className?: string;
}

export function LazyGaugeChartWrapper(props: LazyGaugeChartProps) {
  const { className = '' } = props;
  
  return (
    <SuspenseErrorBoundary>
      <ChartSuspense type="gauge" className={className}>
        <LazyGaugeChart {...props} />
      </ChartSuspense>
    </SuspenseErrorBoundary>
  );
}

export interface LazyDataTableProps {
  data: any[];
  columns: any[];
  loading?: boolean;
  error?: string;
  stickyHeader?: boolean;
  sortable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: any) => void;
  rowClassName?: (row: any) => string;
  emptyMessage?: string;
  className?: string;
}

export function LazyDataTableWrapper(props: LazyDataTableProps) {
  const { className = '', pageSize = 20 } = props;
  
  return (
    <SuspenseErrorBoundary>
      <MetricTableSuspense rows={pageSize} className={className}>
        <LazyDataTable {...props} />
      </MetricTableSuspense>
    </SuspenseErrorBoundary>
  );
}

// Higher-order component for lazy loading any component
export interface LazyWrapperProps {
  children: React.ReactNode;
  fallbackType?: 'card' | 'table' | 'chart' | 'grid' | 'custom';
  fallbackCount?: number;
  className?: string;
  ariaLabel?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export function LazyWrapper({
  children,
  fallbackType = 'card',
  fallbackCount = 1,
  className = '',
  ariaLabel,
  onError
}: LazyWrapperProps) {
  return (
    <SuspenseErrorBoundary onError={onError}>
      <SuspenseWrapper
        type={fallbackType}
        count={fallbackCount}
        className={className}
        ariaLabel={ariaLabel}
      >
        {children}
      </SuspenseWrapper>
    </SuspenseErrorBoundary>
  );
}

// Utility function to create lazy components with custom loading states
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallbackType: 'card' | 'table' | 'chart' | 'grid' = 'card',
  fallbackCount: number = 1
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyComponentWrapper(props: React.ComponentProps<T>) {
    return (
      <SuspenseErrorBoundary>
        <SuspenseWrapper type={fallbackType} count={fallbackCount}>
          <LazyComponent {...props} />
        </SuspenseWrapper>
      </SuspenseErrorBoundary>
    );
  };
}

// Preload functions for better performance
export const preloadComponents = {
  signalDashboard: () => import('@/components/dashboard/SignalDashboard'),
  metricGrid: () => import('@/components/metrics/MetricGrid'),
  metricTable: () => import('@/components/metrics/MetricTable'),
  gaugeChart: () => import('@/components/charts/GaugeChart'),
  dataTable: () => import('@/components/table/DataTable')
};

// Preload all components
export function preloadAllComponents() {
  Object.values(preloadComponents).forEach(preload => preload());
}

// Selective preloading based on route
export function preloadForRoute(route: string) {
  switch (route) {
    case '/':
    case '/module1':
      preloadComponents.signalDashboard();
      preloadComponents.metricGrid();
      preloadComponents.gaugeChart();
      break;
    case '/signal-dashboard':
      preloadComponents.signalDashboard();
      preloadComponents.metricTable();
      break;
    case '/enhanced-dashboard':
      preloadComponents.metricGrid();
      preloadComponents.dataTable();
      break;
    default:
      // Preload common components
      preloadComponents.metricGrid();
      break;
  }
}