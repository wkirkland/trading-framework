// lib/monitoring/logger.ts

import { getCachedEnv } from '@/lib/config/env';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
  component?: string;
  traceId?: string;
  userId?: string;
  requestId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  format: 'json' | 'pretty';
  redactFields: string[];
  enableConsole: boolean;
  enableFile?: boolean;
  filePath?: string;
}

class Logger {
  private config: LoggerConfig;
  private logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config?: Partial<LoggerConfig>) {
    const env = getCachedEnv();
    
    this.config = {
      level: env.nodeEnv === 'production' ? 'info' : 'debug',
      format: env.nodeEnv === 'production' ? 'json' : 'pretty',
      redactFields: ['password', 'token', 'apiKey', 'api_key', 'secret', 'authorization'],
      enableConsole: true,
      ...config,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return this.logLevels[level] >= this.logLevels[this.config.level];
  }

  private redactSensitiveData(data: any): any {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map(item => this.redactSensitiveData(item));
    }

    const redacted = { ...data };
    
    for (const field of this.config.redactFields) {
      if (field in redacted) {
        redacted[field] = '***REDACTED***';
      }
    }

    // Redact URL parameters that might contain API keys
    if (typeof redacted.url === 'string') {
      redacted.url = redacted.url.replace(/([?&]api_key=)[^&]+/gi, '$1***REDACTED***');
    }

    // Recursively redact nested objects
    for (const key in redacted) {
      if (typeof redacted[key] === 'object' && redacted[key] !== null) {
        redacted[key] = this.redactSensitiveData(redacted[key]);
      }
    }

    return redacted;
  }

  private formatLogEntry(entry: LogEntry): string {
    const redactedEntry = {
      ...entry,
      metadata: entry.metadata ? this.redactSensitiveData(entry.metadata) : undefined,
    };

    if (this.config.format === 'json') {
      return JSON.stringify(redactedEntry);
    } else {
      const { timestamp, level, message, component, metadata } = redactedEntry;
      const componentStr = component ? `[${component}] ` : '';
      const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
      const levelStr = level.toUpperCase().padEnd(5);
      
      return `${timestamp} ${levelStr} ${componentStr}${message}${metadataStr}`;
    }
  }

  private writeLog(entry: LogEntry): void {
    const formattedLog = this.formatLogEntry(entry);

    if (this.config.enableConsole) {
      // Use appropriate console method based on log level
      switch (entry.level) {
        case 'debug':
          console.debug(formattedLog);
          break;
        case 'info':
          console.info(formattedLog);
          break;
        case 'warn':
          console.warn(formattedLog);
          break;
        case 'error':
          console.error(formattedLog);
          break;
      }
    }

    // File logging would be implemented here if needed
    if (this.config.enableFile && this.config.filePath) {
      // File logging implementation would go here
      // For now, we'll skip this as it requires fs operations
    }
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>, component?: string): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      metadata,
      component,
    };

    this.writeLog(entry);
  }

  debug(message: string, metadata?: Record<string, any>, component?: string): void {
    this.log('debug', message, metadata, component);
  }

  info(message: string, metadata?: Record<string, any>, component?: string): void {
    this.log('info', message, metadata, component);
  }

  warn(message: string, metadata?: Record<string, any>, component?: string): void {
    this.log('warn', message, metadata, component);
  }

  error(message: string, error?: Error | any, metadata?: Record<string, any>, component?: string): void {
    const errorMetadata = error instanceof Error
      ? {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          ...metadata,
        }
      : { error, ...metadata };

    this.log('error', message, errorMetadata, component);
  }

  // Structured logging for specific events
  apiRequest(method: string, url: string, statusCode?: number, responseTime?: number, component?: string): void {
    this.info('API Request', {
      method,
      url: this.redactSensitiveData({ url }).url,
      statusCode,
      responseTime,
    }, component || 'HTTP');
  }

  apiError(method: string, url: string, error: Error, statusCode?: number, component?: string): void {
    this.error('API Error', error, {
      method,
      url: this.redactSensitiveData({ url }).url,
      statusCode,
    }, component || 'HTTP');
  }

  securityEvent(event: string, metadata?: Record<string, any>, component?: string): void {
    this.warn(`Security Event: ${event}`, metadata, component || 'SECURITY');
  }

  performanceEvent(operation: string, duration: number, metadata?: Record<string, any>, component?: string): void {
    this.info(`Performance: ${operation}`, {
      duration,
      ...metadata,
    }, component || 'PERFORMANCE');
  }

  businessEvent(event: string, metadata?: Record<string, any>, component?: string): void {
    this.info(`Business Event: ${event}`, metadata, component || 'BUSINESS');
  }

  // Create a child logger with a specific component
  child(component: string): Logger {
    const childLogger = Object.create(this);
    childLogger.defaultComponent = component;
    
    // Override methods to use default component
    childLogger.debug = (message: string, metadata?: Record<string, any>, comp?: string) => 
      this.debug(message, metadata, comp || component);
    childLogger.info = (message: string, metadata?: Record<string, any>, comp?: string) => 
      this.info(message, metadata, comp || component);
    childLogger.warn = (message: string, metadata?: Record<string, any>, comp?: string) => 
      this.warn(message, metadata, comp || component);
    childLogger.error = (message: string, error?: Error | any, metadata?: Record<string, any>, comp?: string) => 
      this.error(message, error, metadata, comp || component);

    return childLogger;
  }
}

// Export singleton instance
export const logger = new Logger();

// Export factory function for custom configurations
export function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

export default logger;