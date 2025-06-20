// app/api/live/route.ts

import { NextResponse } from 'next/server';
import healthCheckService from '@/lib/monitoring/healthCheck';
import { logger } from '@/lib/monitoring/logger';

export async function GET() {
  const startTime = Date.now();
  
  try {
    const isAlive = await healthCheckService.isAlive();
    const duration = Date.now() - startTime;
    
    logger.debug('Liveness check requested', {
      alive: isAlive,
      duration,
    }, 'LIVENESS_API');
    
    if (isAlive) {
      return NextResponse.json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        duration,
      }, { status: 200 });
    } else {
      return NextResponse.json({
        status: 'dead',
        timestamp: new Date().toISOString(),
        duration,
      }, { status: 503 });
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Liveness check failed', error, {
      duration,
      endpoint: '/api/live',
    }, 'LIVENESS_API');
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      duration,
    }, { status: 503 });
  }
}