// components/loading/Suspense.tsx
'use client';

import React, { Suspense as ReactSuspense } from 'react';

import { Skeleton } from './Skeleton';

export interface SuspenseWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  type?: 'card' | 'table' | 'chart' | 'grid' | 'custom';
  count?: number;
  className?: string;
  ariaLabel?: string;
}

export function SuspenseWrapper({
  children,
  fallback,
  type = 'card',
  count = 1,
  className = '',
  ariaLabel
}: SuspenseWrapperProps) {
  // Default fallback based on type
  const getDefaultFallback = () => {
    switch (type) {
      case 'card':
        return <Skeleton.Card count={count} className={className} />;
      case 'table':
        return <Skeleton.Table rows={count} className={className} />;
      case 'chart':
        return <Skeleton.Chart className={className} />;
      case 'grid':
        return <Skeleton.Grid count={count} className={className} />;
      default:
        return <Skeleton.Card count={count} className={className} />;
    }
  };

  const suspenseFallback = fallback || getDefaultFallback();

  return (
    <ReactSuspense fallback={suspenseFallback}>
      <div aria-label={ariaLabel} role={ariaLabel ? 'region' : undefined}>
        {children}
      </div>
    </ReactSuspense>
  );
}

// Specialized Suspense wrappers for common use cases
export interface MetricCardSuspenseProps {
  children: React.ReactNode;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function MetricCardSuspense({ 
  children, 
  count = 6, 
  size = 'md',
  className = '' 
}: MetricCardSuspenseProps) {
  return (
    <SuspenseWrapper
      fallback={<Skeleton.MetricCard count={count} size={size} className={className} />}
      ariaLabel="Loading metric cards"
    >
      {children}
    </SuspenseWrapper>
  );
}

export interface MetricTableSuspenseProps {
  children: React.ReactNode;
  rows?: number;
  className?: string;
}

export function MetricTableSuspense({ 
  children, 
  rows = 10,
  className = '' 
}: MetricTableSuspenseProps) {
  return (
    <SuspenseWrapper
      fallback={<Skeleton.MetricTable rows={rows} className={className} />}
      ariaLabel="Loading metric table"
    >
      {children}
    </SuspenseWrapper>
  );
}

export interface DashboardSuspenseProps {
  children: React.ReactNode;
  className?: string;
}

export function DashboardSuspense({ 
  children,
  className = '' 
}: DashboardSuspenseProps) {
  return (
    <SuspenseWrapper
      fallback={<Skeleton.Dashboard className={className} />}
      ariaLabel="Loading dashboard"
    >
      {children}
    </SuspenseWrapper>
  );
}

export interface ChartSuspenseProps {
  children: React.ReactNode;
  type?: 'gauge' | 'line' | 'bar' | 'area';
  className?: string;
}

export function ChartSuspense({ 
  children, 
  type = 'gauge',
  className = '' 
}: ChartSuspenseProps) {
  return (
    <SuspenseWrapper
      fallback={<Skeleton.Chart type={type} className={className} />}
      ariaLabel={`Loading ${type} chart`}
    >
      {children}
    </SuspenseWrapper>
  );
}

// Error boundary wrapper for Suspense
export interface SuspenseErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetOnPropsChange?: any[];
}

interface SuspenseErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class SuspenseErrorBoundary extends React.Component<
  SuspenseErrorBoundaryProps,
  SuspenseErrorBoundaryState
> {
  constructor(props: SuspenseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): SuspenseErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: SuspenseErrorBoundaryProps) {
    const { resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange && prevProps.resetOnPropsChange) {
      const hasResetDeps = resetOnPropsChange.some(
        (dep, index) => dep !== prevProps.resetOnPropsChange![index]
      );

      if (hasResetDeps) {
        this.setState({ hasError: false, error: undefined });
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="suspense-error-boundary">
          <div className="error-content">
            <div className="error-icon">
              <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="error-title">Failed to load component</h3>
            <p className="error-message">
              {this.state.error?.message || 'An unexpected error occurred while loading this component.'}
            </p>
            <button 
              className="error-retry-button"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}