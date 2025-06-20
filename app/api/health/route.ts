// app/api/health/route.ts

import { NextResponse } from 'next/server';
import healthCheckService from '@/lib/monitoring/healthCheck';
import { logger } from '@/lib/monitoring/logger';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const healthResult = await healthCheckService.performHealthCheck();
    const duration = Date.now() - startTime;
    
    // Log the health check request
    logger.info('Health check requested', {
      status: healthResult.status,
      duration,
      timestamp: healthResult.timestamp,
    }, 'HEALTH_API');
    
    // Return appropriate HTTP status based on health
    const httpStatus = healthResult.status === 'healthy' ? 200 :
                      healthResult.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(healthResult, { status: httpStatus });
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Health check failed', error, {
      duration,
      endpoint: '/api/health',
    }, 'HEALTH_API');
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check system failure',
      checks: {},
      uptime: 0,
    }, { status: 503 });
  }
}