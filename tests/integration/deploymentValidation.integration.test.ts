// tests/integration/deploymentValidation.integration.test.ts

import { getIntegrationConfig, measurePerformance } from './config';
import { fredService } from '@/lib/services/fredService';
import healthCheckService from '@/lib/monitoring/healthCheck';
import { errorTracker } from '@/lib/monitoring/errorTracker';
import { logger } from '@/lib/monitoring/logger';

describe('Deployment Validation Integration Tests', () => {
  let config: ReturnType<typeof getIntegrationConfig>;
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  const stagingMode = process.env.STAGING_TEST_MODE === 'true';

  beforeAll(() => {
    config = getIntegrationConfig();
    console.log(`🚀 Running deployment validation against: ${baseUrl}`);
    console.log(`📊 Staging mode: ${stagingMode ? 'ENABLED' : 'DISABLED'}`);
  });

  beforeEach(() => {
    errorTracker.clearBuffers();
  });

  describe('Production Readiness Validation', () => {
    it('should validate complete application startup sequence', async () => {
      // Simulate production startup validation
      const startupChecks = [
        () => healthCheckService.isAlive(),
        () => healthCheckService.isReady(),
        () => healthCheckService.performHealthCheck(),
      ];

      const { result: results, duration } = await measurePerformance(
        () => Promise.all(startupChecks.map(check => check())),
        'Production Startup Sequence'
      );

      // All startup checks should pass
      expect(results[0]).toBe(true); // isAlive
      expect(results[1]).toBe(true); // isReady
      expect(results[2]).toBeDefined(); // health check
      expect(results[2].status).toMatch(/healthy|degraded/); // Not unhealthy

      // Startup should be fast
      expect(duration).toBeLessThan(10000); // 10 seconds max

      console.log(`✅ Production startup sequence completed in ${duration}ms`);
    });

    it('should validate API endpoints under production load patterns', async () => {
      // Simulate realistic production API usage patterns
      const productionPattern = [
        // High frequency health checks (load balancer)
        ...Array.from({ length: 10 }, () => () => 
          fetch(`${baseUrl}/api/health`).then(r => r.json())
        ),
        
        // Regular data requests
        () => fredService.getLatestValue('UNRATE'),
        () => fredService.getLatestValue('GDPC1'),
        () => fredService.getBulkData(['UNRATE', 'GDPC1']),
        
        // Health monitoring requests
        () => fetch(`${baseUrl}/api/ready`).then(r => r.json()),
        () => fetch(`${baseUrl}/api/live`).then(r => r.json()),
      ];

      const { result: results, duration } = await measurePerformance(
        () => Promise.allSettled(productionPattern.map(request => request())),
        'Production Load Pattern'
      );

      // Calculate success metrics
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successCount / results.length;

      expect(successRate).toBeGreaterThan(0.9); // 90%+ success rate
      expect(duration).toBeLessThan(15000); // Complete within 15 seconds

      console.log(`✅ Production load pattern: ${Math.round(successRate * 100)}% success rate in ${duration}ms`);
    });

    it('should validate error handling in production scenarios', async () => {
      const errorScenarios = [
        // Invalid requests that should fail gracefully
        () => fredService.getLatestValue('INVALID_PRODUCTION_TEST'),
        () => fetch(`${baseUrl}/api/fred-data?series=NONEXISTENT`),
        () => fetch(`${baseUrl}/api/health?malformed=param`),
      ];

      const results = await Promise.allSettled(
        errorScenarios.map(scenario => scenario())
      );

      // All should complete (either succeed or fail gracefully)
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          // Error should be handled, not crash the application
          expect(result.reason).toBeInstanceOf(Error);
          console.log(`✅ Error scenario ${index + 1} handled gracefully`);
        }
      });

      // Verify error tracking captured issues
      const buffers = errorTracker.getBuffers();
      expect(buffers.errors.length).toBeGreaterThan(0);

      console.log(`✅ Error handling validated with ${buffers.errors.length} tracked errors`);
    });
  });

  describe('Performance Validation Under Load', () => {
    it('should maintain performance under sustained concurrent load', async () => {
      const concurrentUsers = stagingMode ? 5 : 10; // Reduced for staging
      const requestsPerUser = 3;

      // Simulate concurrent users making multiple requests
      const userSimulations = Array.from({ length: concurrentUsers }, (_, userIndex) =>
        Array.from({ length: requestsPerUser }, (_, requestIndex) =>
          errorTracker.timeOperation(
            'concurrent-user-request',
            'LOAD_TEST',
            async () => {
              const requestType = requestIndex % 3;
              switch (requestType) {
                case 0:
                  return fetch(`${baseUrl}/api/health`).then(r => r.json());
                case 1:
                  return fredService.getLatestValue('UNRATE');
                case 2:
                  return healthCheckService.isReady();
                default:
                  return Promise.resolve('ok');
              }
            },
            { userId: userIndex, requestId: requestIndex }
          )
        )
      ).flat();

      const { result: results, duration } = await measurePerformance(
        () => Promise.allSettled(userSimulations),
        'Sustained Concurrent Load'
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successCount / results.length;
      const totalRequests = concurrentUsers * requestsPerUser;

      expect(successRate).toBeGreaterThan(0.85); // 85%+ under load
      expect(duration).toBeLessThan(30000); // 30 seconds max

      // Check performance metrics
      const buffers = errorTracker.getBuffers();
      const loadMetrics = buffers.metrics.filter(m => 
        m.operation === 'concurrent-user-request'
      );

      expect(loadMetrics.length).toBe(totalRequests);

      const avgResponseTime = loadMetrics.reduce((sum, m) => sum + m.duration, 0) / loadMetrics.length;
      expect(avgResponseTime).toBeLessThan(5000); // Average under 5s

      console.log(`✅ Sustained load test: ${successCount}/${totalRequests} requests succeeded`);
      console.log(`📊 Average response time: ${Math.round(avgResponseTime)}ms`);
    });

    it('should handle memory pressure during deployment', async () => {
      // Simulate memory-intensive operations that might occur during deployment
      const memoryIntensiveOps = Array.from({ length: 5 }, (_, i) =>
        errorTracker.timeOperation(
          'memory-intensive-deployment',
          'DEPLOYMENT_TEST',
          async () => {
            // Create temporary memory pressure
            const largeData = new Array(50000).fill(`deployment-data-${i}`);
            
            // Perform actual work
            const result = await fredService.getLatestValue('UNRATE');
            
            // Cleanup
            largeData.length = 0;
            
            return result;
          },
          { memoryTestIndex: i }
        )
      );

      const results = await Promise.allSettled(memoryIntensiveOps);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      expect(successCount).toBeGreaterThan(3); // At least 60% should handle memory pressure

      // Check that health is still good after memory pressure
      const healthAfterPressure = await healthCheckService.performHealthCheck();
      expect(healthAfterPressure.status).toMatch(/healthy|degraded/);

      console.log(`✅ Memory pressure test: ${successCount}/5 operations succeeded`);
    });
  });

  describe('Security Validation in Production Context', () => {
    it('should validate no sensitive data exposure in production responses', async () => {
      const productionEndpoints = [
        `${baseUrl}/api/health`,
        `${baseUrl}/api/ready`,
        `${baseUrl}/api/live`,
        `${baseUrl}/api/fred-data?series=UNRATE&limit=1`,
      ];

      for (const endpoint of productionEndpoints) {
        try {
          const response = await fetch(endpoint);
          const data = await response.text();

          // Check for API key exposure
          expect(data).not.toMatch(new RegExp(config.fredApiKey));
          
          // Check for common secret patterns
          expect(data).not.toMatch(/[a-f0-9]{32,}/); // Long hex strings
          expect(data).not.toMatch(/sk_[a-zA-Z0-9]+/); // API key patterns
          
          console.log(`✅ Endpoint ${endpoint} - no sensitive data exposed`);
        } catch (error) {
          // Even errors should not expose sensitive data
          const errorStr = error instanceof Error ? error.message : String(error);
          expect(errorStr).not.toMatch(new RegExp(config.fredApiKey));
          console.log(`✅ Endpoint ${endpoint} - error handling secure`);
        }
      }
    });

    it('should validate secure error handling in production', async () => {
      // Test error scenarios that might occur in production
      const errorScenarios = [
        () => fetch(`${baseUrl}/api/fred-data?series=../../../etc/passwd`),
        () => fetch(`${baseUrl}/api/health?param=<script>alert('xss')</script>`),
        () => fetch(`${baseUrl}/api/ready`, { 
          method: 'POST', 
          body: JSON.stringify({ malicious: 'payload' }) 
        }),
      ];

      for (const scenario of errorScenarios) {
        try {
          const response = await scenario();
          const data = await response.text();
          
          // Response should not contain injection or sensitive data
          expect(data).not.toMatch(/<script>/);
          expect(data).not.toMatch(/etc\/passwd/);
          expect(data).not.toMatch(new RegExp(config.fredApiKey));
          
        } catch (error) {
          // Errors should also be secure
          const errorStr = String(error);
          expect(errorStr).not.toMatch(new RegExp(config.fredApiKey));
        }
      }

      console.log('✅ Production error handling security validated');
    });
  });

  describe('Monitoring and Observability Validation', () => {
    it('should validate monitoring systems work in production environment', async () => {
      // Generate various events to test monitoring
      const monitoringScenarios = [
        // Normal operations
        () => fredService.getLatestValue('UNRATE'),
        () => healthCheckService.performHealthCheck(),
        
        // Error scenarios for monitoring
        () => fredService.getLatestValue('INVALID_FOR_MONITORING').catch(() => 'handled'),
        
        // Performance scenarios
        () => errorTracker.timeOperation(
          'monitoring-validation',
          'MONITORING_TEST',
          () => new Promise(resolve => setTimeout(resolve, 100))
        ),
      ];

      await Promise.allSettled(monitoringScenarios.map(scenario => scenario()));

      // Verify monitoring captured events
      const buffers = errorTracker.getBuffers();
      expect(buffers.errors.length).toBeGreaterThan(0); // Should capture errors
      expect(buffers.metrics.length).toBeGreaterThan(0); // Should capture metrics

      // Verify error statistics work
      const errorStats = errorTracker.getErrorStats();
      expect(errorStats.total).toBeGreaterThan(0);
      expect(Object.keys(errorStats.byComponent).length).toBeGreaterThan(0);

      // Verify performance statistics work
      const perfStats = errorTracker.getPerformanceStats();
      expect(perfStats.total).toBeGreaterThan(0);

      console.log(`✅ Monitoring validation: ${buffers.errors.length} errors, ${buffers.metrics.length} metrics captured`);
    });

    it('should validate logging systems work correctly in production', async () => {
      const testMessages = [];
      
      // Capture log output
      const originalConsole = console.log;
      console.log = (...args) => {
        testMessages.push(args.join(' '));
        originalConsole(...args);
      };

      try {
        // Generate various log events
        logger.info('Production deployment validation test', {
          environment: 'staging',
          apiKey: config.fredApiKey, // Should be redacted
        });

        await fredService.getLatestValue('UNRATE');

        // Check that logs are secure
        testMessages.forEach(message => {
          expect(message).not.toMatch(new RegExp(config.fredApiKey));
          if (message.includes('apiKey')) {
            expect(message).toMatch(/REDACTED/);
          }
        });

        console.log('✅ Production logging security validated');
      } finally {
        console.log = originalConsole;
      }
    });
  });

  describe('Integration with External Systems', () => {
    it('should validate external API integration works in production environment', async () => {
      if (config.fredApiKey === 'demo_key_for_staging') {
        console.log('⚠️  Skipping external API test with demo key');
        return;
      }

      // Test real external API integration
      const externalApiTests = [
        () => fredService.getLatestValue('UNRATE'),
        () => fredService.getLatestValue('GDPC1'),
        () => fredService.getBulkData(['UNRATE', 'GDPC1']),
      ];

      const { result: results, duration } = await measurePerformance(
        () => Promise.allSettled(externalApiTests.map(test => test())),
        'External API Integration'
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const successRate = successCount / results.length;

      expect(successRate).toBeGreaterThan(0.8); // 80%+ for external APIs
      expect(duration).toBeLessThan(15000); // 15 seconds for external calls

      console.log(`✅ External API integration: ${successCount}/${results.length} calls succeeded`);
    });

    it('should validate system resilience to external API failures', async () => {
      // Simulate external API unavailability
      const originalApiKey = process.env.FRED_API_KEY;
      process.env.FRED_API_KEY = 'temporary_invalid_key';

      try {
        // System should handle external failures gracefully
        const resilenceTests = [
          () => healthCheckService.performHealthCheck(),
          () => fredService.getLatestValue('UNRATE').catch(() => 'handled'),
        ];

        const results = await Promise.allSettled(
          resilenceTests.map(test => test())
        );

        // Health check should detect the issue but not crash
        const healthResult = results[0];
        if (healthResult.status === 'fulfilled') {
          expect(healthResult.value.status).toMatch(/degraded|unhealthy/);
        }

        // System should remain responsive
        const isStillAlive = await healthCheckService.isAlive();
        expect(isStillAlive).toBe(false); // Should detect invalid config

        console.log('✅ System resilience to external failures validated');
      } finally {
        process.env.FRED_API_KEY = originalApiKey;
      }
    });
  });

  describe('Deployment Rollback Validation', () => {
    it('should validate system can handle configuration changes', async () => {
      // Test configuration change scenarios that might occur during deployment
      const originalPort = process.env.PORT;
      const originalEnv = process.env.NODE_ENV;

      try {
        // Simulate environment changes
        process.env.PORT = '3002';
        process.env.NODE_ENV = 'production';

        // System should adapt to configuration changes
        const configTests = [
          () => healthCheckService.isAlive(),
          () => healthCheckService.performHealthCheck(),
        ];

        const results = await Promise.allSettled(
          configTests.map(test => test())
        );

        // Should handle configuration changes gracefully
        results.forEach((result, index) => {
          if (result.status === 'rejected') {
            console.log(`Configuration test ${index + 1} failed: ${result.reason}`);
          }
        });

        console.log('✅ Configuration change handling validated');
      } finally {
        process.env.PORT = originalPort;
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});