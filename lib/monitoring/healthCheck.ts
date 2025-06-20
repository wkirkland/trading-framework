// lib/monitoring/healthCheck.ts

import { getCachedEnv } from '@/lib/config/env';
import { getFredClient } from '@/lib/http/fredClient';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  checks: {
    environment: HealthCheck;
    fredApi: HealthCheck;
    alphaVantageApi?: HealthCheck;
    database?: HealthCheck;
    memory: HealthCheck;
  };
  uptime: number;
}

export interface HealthCheck {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

class HealthCheckService {
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const timestamp = new Date().toISOString();
    const uptime = (Date.now() - this.startTime) / 1000;

    const checks = {
      environment: await this.checkEnvironment(),
      fredApi: await this.checkFredApi(),
      alphaVantageApi: await this.checkAlphaVantageApi(),
      memory: this.checkMemory(),
    };

    const overallStatus = this.determineOverallStatus(checks);

    return {
      status: overallStatus,
      timestamp,
      version: process.env.npm_package_version || '1.0.0',
      checks,
      uptime,
    };
  }

  private async checkEnvironment(): Promise<HealthCheck> {
    try {
      const env = getCachedEnv();
      
      const requiredVars = ['fredApiKey'];
      const missingVars = requiredVars.filter(key => !env[key as keyof typeof env]);
      
      if (missingVars.length > 0) {
        return {
          status: 'fail',
          message: `Missing required environment variables: ${missingVars.join(', ')}`,
          metadata: { missingVars }
        };
      }

      return {
        status: 'pass',
        message: 'All required environment variables configured',
        metadata: {
          nodeEnv: env.nodeEnv,
          port: env.port,
          hasAlphaVantageKey: !!env.alphaVantageApiKey
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private async checkFredApi(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const client = getFredClient();
      const isValid = await client.validateApiKey();
      const responseTime = Date.now() - startTime;

      if (isValid) {
        return {
          status: 'pass',
          message: 'FRED API connection successful',
          responseTime,
          metadata: { endpoint: 'FRED API validation' }
        };
      } else {
        return {
          status: 'fail',
          message: 'FRED API authentication failed',
          responseTime,
          metadata: { endpoint: 'FRED API validation' }
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'fail',
        message: `FRED API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
      };
    }
  }

  private async checkAlphaVantageApi(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const env = getCachedEnv();
      
      if (!env.alphaVantageApiKey) {
        return {
          status: 'warn',
          message: 'Alpha Vantage API key not configured (optional)',
          responseTime: Date.now() - startTime,
        };
      }

      // Simple connectivity test - would need actual Alpha Vantage client
      // For now, just validate the key format
      const keyValid = env.alphaVantageApiKey.length >= 10;
      const responseTime = Date.now() - startTime;

      return {
        status: keyValid ? 'pass' : 'warn',
        message: keyValid ? 'Alpha Vantage API key configured' : 'Alpha Vantage API key format suspicious',
        responseTime,
        metadata: { keyLength: env.alphaVantageApiKey.length }
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'warn',
        message: `Alpha Vantage API check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        responseTime,
      };
    }
  }

  private checkMemory(): HealthCheck {
    try {
      const memUsage = process.memoryUsage();
      const memUsageMB = {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
      };

      // Warn if heap usage is > 80% of total heap
      const heapUsagePercent = (memUsageMB.heapUsed / memUsageMB.heapTotal) * 100;
      const status = heapUsagePercent > 80 ? 'warn' : 'pass';
      
      return {
        status,
        message: status === 'warn' 
          ? `High memory usage: ${Math.round(heapUsagePercent)}%`
          : `Memory usage normal: ${Math.round(heapUsagePercent)}%`,
        metadata: memUsageMB
      };
    } catch (error) {
      return {
        status: 'fail',
        message: `Memory check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private determineOverallStatus(checks: HealthCheckResult['checks']): 'healthy' | 'unhealthy' | 'degraded' {
    const checkValues = Object.values(checks).filter(Boolean) as HealthCheck[];
    
    const hasFailures = checkValues.some(check => check.status === 'fail');
    const hasWarnings = checkValues.some(check => check.status === 'warn');
    
    if (hasFailures) {
      return 'unhealthy';
    } else if (hasWarnings) {
      return 'degraded';
    } else {
      return 'healthy';
    }
  }

  // Lightweight health check for load balancer
  async isAlive(): Promise<boolean> {
    try {
      const env = getCachedEnv();
      return !!env.fredApiKey;
    } catch {
      return false;
    }
  }

  // Ready check for Kubernetes readiness probe
  async isReady(): Promise<boolean> {
    try {
      const result = await this.performHealthCheck();
      return result.status !== 'unhealthy';
    } catch {
      return false;
    }
  }
}

// Singleton instance
const healthCheckService = new HealthCheckService();

export { healthCheckService };
export default healthCheckService;