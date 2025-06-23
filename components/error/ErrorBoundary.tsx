// components/error/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

import { errorTracker } from '@/lib/monitoring/errorTracker';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  lastRetryTime: number | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void, hasRetried: boolean) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
  component?: string; // Component name for error tracking
  resetOnPropsChange?: boolean;
  resetKeys?: string[]; // Keys to watch for automatic reset
}

interface ErrorFallbackProps {
  error: Error;
  retry: () => void;
  hasRetried: boolean;
  component?: string;
}

// Default error fallback component
function DefaultErrorFallback({ error, retry, hasRetried, component }: ErrorFallbackProps) {
  const isNetworkError = error.message.toLowerCase().includes('network') || 
                         error.message.toLowerCase().includes('fetch');
  const isApiError = error.message.toLowerCase().includes('api') ||
                     error.message.toLowerCase().includes('unauthorized') ||
                     error.message.toLowerCase().includes('rate limit');

  return (
    <div
      style={{
        padding: '1.5rem',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        backgroundColor: 'var(--surface-2)',
        textAlign: 'center' as const,
        color: 'var(--on-surface-2)',
      }}
    >
      <div style={{ marginBottom: '1rem' }}>
        <svg
          width="48"
          height="48"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: 'var(--status-negative)', margin: '0 auto' }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <h3 style={{ 
        margin: '0 0 0.5rem 0', 
        fontSize: '1.1rem', 
        fontWeight: '600',
        color: 'var(--on-surface-2)'
      }}>
        {isNetworkError ? 'Connection Issue' : 
         isApiError ? 'Data Service Unavailable' : 
         `${component || 'Component'} Error`}
      </h3>

      <p style={{ 
        margin: '0 0 1rem 0', 
        fontSize: '0.9rem', 
        color: 'var(--on-surface-2-muted)' 
      }}>
        {isNetworkError ? 'Unable to connect to data services. Please check your internet connection.' :
         isApiError ? 'The data service is temporarily unavailable. This may be due to rate limits or maintenance.' :
         'Something went wrong while loading this component.'}
      </p>

      {!hasRetried && (
        <button
          onClick={retry}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: 'var(--color-primary-500)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            marginRight: '0.5rem'
          }}
        >
          Try Again
        </button>
      )}

      <details style={{ marginTop: '1rem', textAlign: 'left' as const }}>
        <summary style={{ 
          cursor: 'pointer', 
          fontSize: '0.8rem', 
          color: 'var(--on-surface-2-muted)',
          marginBottom: '0.5rem'
        }}>
          Technical Details
        </summary>
        <div style={{ 
          fontSize: '0.75rem', 
          fontFamily: 'monospace', 
          color: 'var(--on-surface-2-muted)',
          backgroundColor: 'var(--surface-3)',
          padding: '0.5rem',
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '150px'
        }}>
          {error.message}
        </div>
      </details>
    </div>
  );
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastRetryTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Track error
    errorTracker.captureError(error, {
      component: this.props.component || 'ErrorBoundary',
      operation: 'componentDidCatch',
      ...errorInfo,
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && resetOnPropsChange) {
      // Reset on any prop change
      if (prevProps.children !== this.props.children) {
        this.resetErrorBoundary();
      }
    }

    if (hasError && resetKeys && resetKeys.length > 0) {
      // Reset on specific key changes
      const hasKeyChanged = resetKeys.some(key => {
        const prevValue = (prevProps as any)[key];
        const currentValue = (this.props as any)[key];
        return prevValue !== currentValue;
      });

      if (hasKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  resetErrorBoundary = () => {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      lastRetryTime: null,
    });
  };

  retry = () => {
    const { maxRetries = 3, retryDelay = 1000 } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    const now = Date.now();
    const timeSinceLastRetry = this.state.lastRetryTime ? now - this.state.lastRetryTime : Infinity;

    if (timeSinceLastRetry < retryDelay) {
      // Still in retry delay period
      console.log('Retry attempted too soon, ignoring');
      return;
    }

    this.setState(prevState => ({
      retryCount: prevState.retryCount + 1,
      lastRetryTime: now,
    }));

    // Delay the actual reset to allow for user feedback
    this.retryTimeoutId = setTimeout(() => {
      this.resetErrorBoundary();
    }, 500);
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError && error) {
      const hasRetried = retryCount >= maxRetries;

      if (fallback) {
        return fallback(error, this.retry, hasRetried);
      }

      return (
        <DefaultErrorFallback
          error={error}
          retry={this.retry}
          hasRetried={hasRetried}
          component={this.props.component}
        />
      );
    }

    return children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

export default ErrorBoundary;