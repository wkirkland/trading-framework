// lib/monitoring/errorTracker.ts

import { logger } from './logger';
import { getCachedEnv } from '@/lib/config/env';

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: ErrorInfo;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  fingerprint: string;
  metadata?: Record<string, any>;
}

export interface ErrorInfo {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  cause?: Error;
}

export interface ErrorContext {
  component: string;
  operation?: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  ip?: string;
  environment: string;
  version: string;
  timestamp: string;
}

export interface PerformanceMetric {
  id: string;
  timestamp: string;
  operation: string;
  duration: number;
  component: string;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

class ErrorTracker {
  private errorBuffer: ErrorReport[] = [];
  private performanceBuffer: PerformanceMetric[] = [];
  private maxBufferSize = 100;

  constructor() {
    // Flush buffers periodically
    setInterval(() => {
      this.flushBuffers();
    }, 60000); // Every minute

    // Catch unhandled errors
    process.on('unhandledRejection', (reason, promise) => {
      this.captureError(new Error(`Unhandled Promise Rejection: ${reason}`), {
        component: 'UNHANDLED_REJECTION',
        operation: 'promise_rejection',
        metadata: { promise: promise.toString() },
      });
    });

    process.on('uncaughtException', (error) => {
      this.captureError(error, {
        component: 'UNCAUGHT_EXCEPTION',
        operation: 'uncaught_exception',
      });
    });
  }

  captureError(error: Error, context: Partial<ErrorContext> = {}, severity: ErrorReport['severity'] = 'medium'): string {
    const env = getCachedEnv();
    const id = this.generateId();
    const timestamp = new Date().toISOString();

    const errorInfo: ErrorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code,
      cause: (error as any).cause,
    };

    const fullContext: ErrorContext = {
      component: 'UNKNOWN',
      environment: env.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
      timestamp,
      ...context,
    };

    const fingerprint = this.generateFingerprint(errorInfo, fullContext);

    const errorReport: ErrorReport = {
      id,
      timestamp,
      error: errorInfo,
      context: fullContext,
      severity,
      fingerprint,
      metadata: context.metadata,
    };

    this.errorBuffer.push(errorReport);
    
    // Log the error
    logger.error(
      `Error captured: ${error.message}`,
      error,
      {
        errorId: id,
        component: fullContext.component,
        operation: fullContext.operation,
        severity,
        fingerprint,
      },
      'ERROR_TRACKER'
    );

    // Trigger immediate flush for critical errors
    if (severity === 'critical') {
      this.flushBuffers();
    }

    // Trim buffer if it gets too large
    if (this.errorBuffer.length > this.maxBufferSize) {
      this.errorBuffer = this.errorBuffer.slice(-this.maxBufferSize);
    }

    return id;
  }

  capturePerformanceMetric(operation: string, duration: number, component: string, metadata?: Record<string, any>): string {
    const id = this.generateId();
    const timestamp = new Date().toISOString();

    const metric: PerformanceMetric = {
      id,
      timestamp,
      operation,
      duration,
      component,
      metadata,
      tags: {
        environment: getCachedEnv().nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
      },
    };

    this.performanceBuffer.push(metric);

    // Log performance metric
    logger.performanceEvent(operation, duration, metadata, component);

    // Warn on slow operations
    if (duration > 5000) { // 5 seconds
      logger.warn(
        `Slow operation detected: ${operation}`,
        {
          duration,
          component,
          operation,
        },
        'PERFORMANCE'
      );
    }

    // Trim buffer if it gets too large
    if (this.performanceBuffer.length > this.maxBufferSize) {
      this.performanceBuffer = this.performanceBuffer.slice(-this.maxBufferSize);
    }

    return id;
  }

  // Wrapper for timing operations
  async timeOperation<T>(operation: string, component: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - start;
      this.capturePerformanceMetric(operation, duration, component, metadata);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      this.capturePerformanceMetric(operation, duration, component, { ...metadata, error: true });
      
      if (error instanceof Error) {
        this.captureError(error, { component, operation, metadata });
      }
      
      throw error;
    }
  }

  // Get error statistics
  getErrorStats(timeWindow: number = 3600000): { total: number; bySeverity: Record<string, number>; byComponent: Record<string, number> } {
    const cutoff = Date.now() - timeWindow;
    const recentErrors = this.errorBuffer.filter(
      error => new Date(error.timestamp).getTime() > cutoff
    );

    const bySeverity: Record<string, number> = {};
    const byComponent: Record<string, number> = {};

    recentErrors.forEach(error => {
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      byComponent[error.context.component] = (byComponent[error.context.component] || 0) + 1;
    });

    return {
      total: recentErrors.length,
      bySeverity,
      byComponent,
    };
  }

  // Get performance statistics
  getPerformanceStats(timeWindow: number = 3600000): { 
    total: number; 
    avgDuration: number; 
    p95Duration: number; 
    byComponent: Record<string, { count: number; avgDuration: number }> 
  } {
    const cutoff = Date.now() - timeWindow;
    const recentMetrics = this.performanceBuffer.filter(
      metric => new Date(metric.timestamp).getTime() > cutoff
    );

    if (recentMetrics.length === 0) {
      return { total: 0, avgDuration: 0, p95Duration: 0, byComponent: {} };
    }

    const durations = recentMetrics.map(m => m.duration).sort((a, b) => a - b);
    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const p95Index = Math.floor(durations.length * 0.95);
    const p95Duration = durations[p95Index] || 0;

    const byComponent: Record<string, { count: number; avgDuration: number }> = {};
    recentMetrics.forEach(metric => {
      if (!byComponent[metric.component]) {
        byComponent[metric.component] = { count: 0, avgDuration: 0 };
      }
      byComponent[metric.component].count++;
      byComponent[metric.component].avgDuration += metric.duration;
    });

    // Calculate averages
    Object.keys(byComponent).forEach(component => {
      byComponent[component].avgDuration /= byComponent[component].count;
    });

    return {
      total: recentMetrics.length,
      avgDuration,
      p95Duration,
      byComponent,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFingerprint(error: ErrorInfo, context: ErrorContext): string {
    // Create a fingerprint for grouping similar errors
    const key = `${error.name}:${context.component}:${context.operation}:${error.message.substring(0, 100)}`;
    return Buffer.from(key).toString('base64').substring(0, 16);
  }

  private flushBuffers(): void {
    // In a real implementation, this would send data to an external service
    // For now, we'll just log the buffer status
    
    if (this.errorBuffer.length > 0) {
      logger.info(
        `Error buffer contains ${this.errorBuffer.length} errors`,
        { bufferSize: this.errorBuffer.length },
        'ERROR_TRACKER'
      );
    }

    if (this.performanceBuffer.length > 0) {
      logger.info(
        `Performance buffer contains ${this.performanceBuffer.length} metrics`,
        { bufferSize: this.performanceBuffer.length },
        'ERROR_TRACKER'
      );
    }

    // In production, you would send this data to services like:
    // - Sentry for error tracking
    // - DataDog for performance monitoring
    // - Custom analytics endpoints
    // - Application Performance Monitoring (APM) tools
  }

  // Method to integrate with external error tracking services
  async sendToExternalService(errors: ErrorReport[], metrics: PerformanceMetric[]): Promise<void> {
    // This would be implemented based on your chosen error tracking service
    // Examples:
    // - Sentry: Sentry.captureException()
    // - DataDog: dogstatsd.increment()
    // - Custom API: fetch('/api/errors', { method: 'POST', body: JSON.stringify(errors) })
    
    logger.info(
      'Would send to external service',
      { errorCount: errors.length, metricCount: metrics.length },
      'ERROR_TRACKER'
    );
  }

  // Method to clear buffers (useful for testing)
  clearBuffers(): void {
    this.errorBuffer = [];
    this.performanceBuffer = [];
  }

  // Method to get current buffer contents (useful for debugging)
  getBuffers(): { errors: ErrorReport[]; metrics: PerformanceMetric[] } {
    return {
      errors: [...this.errorBuffer],
      metrics: [...this.performanceBuffer],
    };
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker();

// Export utility functions for common error patterns
export function withErrorTracking<T>(
  component: string,
  operation: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  try {
    return fn();
  } catch (error) {
    if (error instanceof Error) {
      errorTracker.captureError(error, { component, operation, metadata });
    }
    throw error;
  }
}

export async function withAsyncErrorTracking<T>(
  component: string,
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      errorTracker.captureError(error, { component, operation, metadata });
    }
    throw error;
  }
}

export default errorTracker;