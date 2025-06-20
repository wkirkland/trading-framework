// tests/integration/healthEndpoints.integration.test.ts

import { GET as healthHandler } from '@/app/api/health/route';
import { GET as readyHandler } from '@/app/api/ready/route';
import { GET as liveHandler } from '@/app/api/live/route';
import { getIntegrationConfig, measurePerformance } from './config';
import { TEST_DATA } from './setup';

// Mock NextRequest for testing
const createMockRequest = () => ({
  url: 'http://localhost:3000',
  method: 'GET',
  headers: new Headers(),
  body: null,
  json: async () => ({}),
} as any);

describe('Health Check API Endpoints Integration Tests', () => {
  let config: ReturnType<typeof getIntegrationConfig>;

  beforeAll(() => {
    config = getIntegrationConfig();
  });

  describe('/api/health Endpoint', () => {
    it('should return comprehensive health status', async () => {
      const mockRequest = createMockRequest();
      
      const { result: response, duration } = await measurePerformance(
        () => healthHandler(),
        'Health API Endpoint'
      );

      expect(response).toBeDefined();
      expect(response.status).toBeDefined();

      const healthData = await response.json();
      
      // Verify response structure
      expect(healthData).toHaveProperty('status');
      expect(healthData).toHaveProperty('timestamp');
      expect(healthData).toHaveProperty('version');
      expect(healthData).toHaveProperty('checks');
      expect(healthData).toHaveProperty('uptime');

      // Verify status values
      expect(['healthy', 'unhealthy', 'degraded']).toContain(healthData.status);

      // Verify HTTP status code matches health status
      if (healthData.status === 'healthy' || healthData.status === 'degraded') {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(503);
      }

      // Verify performance
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.HEALTH_CHECK);

      console.log(`✅ Health API: ${healthData.status} (HTTP ${response.status}) in ${duration}ms`);
    });

    it('should handle health endpoint errors gracefully', async () => {
      // Test with temporarily broken environment
      const originalApiKey = process.env.FRED_API_KEY;
      process.env.FRED_API_KEY = '';

      try {
        const response = await healthHandler();
        const healthData = await response.json();

        // Should return unhealthy status but not crash
        expect(['unhealthy', 'degraded']).toContain(healthData.status);
        expect(response.status).toBe(503);

        console.log('✅ Health API handled broken environment gracefully');
      } finally {
        process.env.FRED_API_KEY = originalApiKey;
      }
    });

    it('should provide detailed check information', async () => {
      const response = await healthHandler();
      const healthData = await response.json();

      // Verify individual checks are present
      expect(healthData.checks).toHaveProperty('environment');
      expect(healthData.checks).toHaveProperty('fredApi');
      expect(healthData.checks).toHaveProperty('memory');

      // Each check should have required fields
      Object.entries(healthData.checks).forEach(([checkName, check]: [string, any]) => {
        if (check) {
          expect(check).toHaveProperty('status');
          expect(check).toHaveProperty('message');
          expect(['pass', 'fail', 'warn']).toContain(check.status);
          expect(typeof check.message).toBe('string');
          expect(check.message.length).toBeGreaterThan(0);

          console.log(`✅ ${checkName}: ${check.status} - ${check.message}`);
        }
      });
    });
  });

  describe('/api/ready Endpoint', () => {
    it('should return readiness status quickly', async () => {
      const { result: response, duration } = await measurePerformance(
        () => readyHandler(),
        'Ready API Endpoint'
      );

      expect(response).toBeDefined();
      const readyData = await response.json();

      // Verify response structure
      expect(readyData).toHaveProperty('status');
      expect(readyData).toHaveProperty('timestamp');
      expect(readyData).toHaveProperty('duration');

      // Verify status values
      expect(['ready', 'not_ready', 'error']).toContain(readyData.status);

      // Verify HTTP status
      if (readyData.status === 'ready') {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(503);
      }

      // Should be fast (readiness check)
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.HEALTH_CHECK);
      expect(readyData.duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.HEALTH_CHECK);

      console.log(`✅ Ready API: ${readyData.status} (HTTP ${response.status}) in ${duration}ms`);
    });

    it('should handle concurrent readiness checks', async () => {
      const concurrentChecks = Array.from({ length: 10 }, () => readyHandler());
      
      const startTime = Date.now();
      const responses = await Promise.all(concurrentChecks);
      const totalDuration = Date.now() - startTime;

      // All should complete successfully
      expect(responses).toHaveLength(10);
      
      for (const response of responses) {
        const data = await response.json();
        expect(['ready', 'not_ready', 'error']).toContain(data.status);
      }

      // Concurrent execution should be efficient
      const avgDuration = totalDuration / 10;
      expect(avgDuration).toBeLessThan(1000); // Very fast for readiness

      console.log(`✅ 10 concurrent ready checks completed in ${totalDuration}ms (avg: ${avgDuration}ms)`);
    });
  });

  describe('/api/live Endpoint', () => {
    it('should return liveness status immediately', async () => {
      const { result: response, duration } = await measurePerformance(
        () => liveHandler(),
        'Live API Endpoint'
      );

      expect(response).toBeDefined();
      const liveData = await response.json();

      // Verify response structure
      expect(liveData).toHaveProperty('status');
      expect(liveData).toHaveProperty('timestamp');
      expect(liveData).toHaveProperty('duration');

      // Verify status values
      expect(['alive', 'dead', 'error']).toContain(liveData.status);

      // Should include uptime if alive
      if (liveData.status === 'alive') {
        expect(liveData).toHaveProperty('uptime');
        expect(typeof liveData.uptime).toBe('number');
        expect(liveData.uptime).toBeGreaterThanOrEqual(0);
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(503);
      }

      // Should be very fast (liveness check)
      expect(duration).toBeLessThan(100); // Very fast
      expect(liveData.duration).toBeLessThan(100);

      console.log(`✅ Live API: ${liveData.status} (HTTP ${response.status}) in ${duration}ms`);
    });

    it('should be extremely fast under load', async () => {
      const rapidChecks = Array.from({ length: 50 }, () => liveHandler());
      
      const startTime = Date.now();
      const responses = await Promise.all(rapidChecks);
      const totalDuration = Date.now() - startTime;

      // All should complete successfully
      expect(responses).toHaveLength(50);
      
      for (const response of responses) {
        const data = await response.json();
        expect(['alive', 'dead', 'error']).toContain(data.status);
      }

      // Should handle high load efficiently
      const avgDuration = totalDuration / 50;
      expect(avgDuration).toBeLessThan(50); // Very fast even under load

      console.log(`✅ 50 rapid live checks completed in ${totalDuration}ms (avg: ${avgDuration}ms)`);
    });
  });

  describe('Endpoint Consistency and Reliability', () => {
    it('should maintain consistent responses across endpoints', async () => {
      const [healthResponse, readyResponse, liveResponse] = await Promise.all([
        healthHandler(),
        readyHandler(),
        liveHandler(),
      ]);

      const healthData = await healthResponse.json();
      const readyData = await readyResponse.json();
      const liveData = await liveResponse.json();

      // Timestamps should be close (within 5 seconds)
      const healthTime = new Date(healthData.timestamp).getTime();
      const readyTime = new Date(readyData.timestamp).getTime();
      const liveTime = new Date(liveData.timestamp).getTime();

      expect(Math.abs(healthTime - readyTime)).toBeLessThan(5000);
      expect(Math.abs(healthTime - liveTime)).toBeLessThan(5000);

      // If live says alive, ready should generally be ready (unless degraded)
      if (liveData.status === 'alive' && healthData.status === 'healthy') {
        expect(readyData.status).toBe('ready');
      }

      console.log('✅ Endpoint responses are consistent');
    });

    it('should handle error scenarios appropriately', async () => {
      // Simulate system under stress
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test_stress';

      try {
        const responses = await Promise.all([
          healthHandler(),
          readyHandler(),
          liveHandler(),
        ]);

        // All endpoints should respond (not crash)
        expect(responses).toHaveLength(3);
        
        for (const response of responses) {
          expect(response).toBeDefined();
          expect(response.status).toBeDefined();
          
          const data = await response.json();
          expect(data).toHaveProperty('status');
          expect(data).toHaveProperty('timestamp');
        }

        console.log('✅ All endpoints handled stress scenario gracefully');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });
  });

  describe('Production Deployment Validation', () => {
    it('should meet Kubernetes health check requirements', async () => {
      // Test the typical Kubernetes health check pattern
      const livenessCheck = await liveHandler();
      const readinessCheck = await readyHandler();
      const healthCheck = await healthHandler();

      const livenessData = await livenessCheck.json();
      const readinessData = await readinessCheck.json();
      const healthData = await healthCheck.json();

      // Kubernetes requirements
      const requirements = {
        'Liveness responds quickly': livenessData.duration < 1000,
        'Readiness provides clear status': ['ready', 'not_ready'].includes(readinessData.status),
        'Health provides detailed info': Object.keys(healthData.checks || {}).length > 0,
        'HTTP status codes appropriate': livenessCheck.status === 200 || livenessCheck.status === 503,
        'JSON responses valid': typeof livenessData === 'object' && typeof readinessData === 'object',
      };

      let passed = 0;
      Object.entries(requirements).forEach(([requirement, passes]) => {
        if (passes) {
          passed++;
          console.log(`✅ ${requirement}: PASSED`);
        } else {
          console.log(`❌ ${requirement}: FAILED`);
        }
      });

      expect(passed).toBe(Object.keys(requirements).length);
      console.log('✅ All Kubernetes health check requirements met');
    });

    it('should provide monitoring-friendly output', async () => {
      const healthResponse = await healthHandler();
      const healthData = await healthResponse.json();

      // Verify monitoring systems can parse the output
      expect(healthData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(typeof healthData.uptime).toBe('number');
      expect(healthData.version).toBeTruthy();

      // Verify all check statuses are machine-readable
      if (healthData.checks) {
        Object.values(healthData.checks).forEach((check: any) => {
          if (check) {
            expect(['pass', 'fail', 'warn']).toContain(check.status);
            if (check.responseTime) {
              expect(typeof check.responseTime).toBe('number');
            }
          }
        });
      }

      console.log('✅ Health output is monitoring-system friendly');
    });
  });
});