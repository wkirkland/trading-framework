// app/api/health/route.ts
// Health check endpoint for monitoring and Lighthouse CI

import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Basic health checks
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024)
      },
      responseTime: Date.now() - startTime,
      checks: {
        server: 'ok',
        memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'ok' : 'warn', // 500MB threshold
        uptime: process.uptime() > 0 ? 'ok' : 'error'
      }
    };

    // Determine overall status
    const hasErrors = Object.values(healthData.checks).includes('error');
    const hasWarnings = Object.values(healthData.checks).includes('warn');
    
    if (hasErrors) {
      healthData.status = 'unhealthy';
    } else if (hasWarnings) {
      healthData.status = 'degraded';
    }

    // Set appropriate status code
    const statusCode = hasErrors ? 503 : hasWarnings ? 200 : 200;
    
    return NextResponse.json(healthData, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: Date.now() - startTime
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

// Support HEAD requests for simple alive checks
export async function HEAD(_request: NextRequest) {
  try {
    return new NextResponse(null, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
  } catch (_error) {
    return new NextResponse(null, { status: 503 });
  }
}