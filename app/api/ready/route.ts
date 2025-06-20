// app/api/ready/route.ts

import { NextResponse } from 'next/server';
import healthCheckService from '@/lib/monitoring/healthCheck';
import { logger } from '@/lib/monitoring/logger';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const isReady = await healthCheckService.isReady();
    const duration = Date.now() - startTime;
    
    logger.debug('Readiness check requested', {
      ready: isReady,
      duration,
    }, 'READINESS_API');
    
    if (isReady) {
      return NextResponse.json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        duration,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        duration,
      }, { status: 503 });
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Readiness check failed', error, {
      duration,
      endpoint: '/api/ready',
    }, 'READINESS_API');
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      duration,
    }, { status: 503 });
  }
}