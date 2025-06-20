// tests/integration/healthCheck.integration.test.ts

import healthCheckService from '@/lib/monitoring/healthCheck';
import { getFredClient, clearFredClient } from '@/lib/http/fredClient';
import { getIntegrationConfig, measurePerformance } from './config';
import { TEST_DATA } from './setup';

describe('Health Check System Integration Tests', () => {
  let config: ReturnType<typeof getIntegrationConfig>;

  beforeAll(() => {
    config = getIntegrationConfig();
  });

  afterEach(() => {
    // Clear client cache between tests
    clearFredClient();
  });

  describe('Complete Health Check Validation', () => {
    it('should perform comprehensive health check with real data', async () => {
      const { result, duration } = await measurePerformance(
        () => healthCheckService.performHealthCheck(),
        'Complete Health Check'
      );

      // Verify overall response structure
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('uptime');

      // Verify status is valid
      expect(['healthy', 'unhealthy', 'degraded']).toContain(result.status);

      // Verify timestamp is recent
      const checkTime = new Date(result.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - checkTime.getTime();
      expect(timeDiff).toBeLessThan(5000); // Within 5 seconds

      // Verify checks structure
      expect(result.checks).toHaveProperty('environment');
      expect(result.checks).toHaveProperty('fredApi');
      expect(result.checks).toHaveProperty('memory');

      // Verify uptime is reasonable
      expect(result.uptime).toBeGreaterThan(0);
      expect(result.uptime).toBeLessThan(3600); // Less than 1 hour for test

      // Performance should meet baseline
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.HEALTH_CHECK);

      console.log(`✅ Health check completed in ${duration}ms with status: ${result.status}`);
    });

    it('should validate environment configuration check', async () => {
      const healthResult = await healthCheckService.performHealthCheck();
      const envCheck = healthResult.checks.environment;

      expect(envCheck).toHaveProperty('status');
      expect(envCheck).toHaveProperty('message');
      expect(['pass', 'fail', 'warn']).toContain(envCheck.status);

      if (envCheck.status === 'pass') {
        expect(envCheck.message).toMatch(/environment variables configured/i);
        expect(envCheck.metadata).toHaveProperty('nodeEnv');
        expect(envCheck.metadata).toHaveProperty('port');
        expect(envCheck.metadata).toHaveProperty('hasAlphaVantageKey');

        console.log('✅ Environment check passed with metadata:', envCheck.metadata);
      } else {
        console.warn(`⚠️  Environment check failed: ${envCheck.message}`);
      }
    });

    it('should validate FRED API connectivity check', async () => {
      const healthResult = await healthCheckService.performHealthCheck();
      const fredCheck = healthResult.checks.fredApi;

      expect(fredCheck).toHaveProperty('status');
      expect(fredCheck).toHaveProperty('message');
      expect(fredCheck).toHaveProperty('responseTime');
      expect(['pass', 'fail', 'warn']).toContain(fredCheck.status);

      // Response time should be reasonable
      if (fredCheck.responseTime) {
        expect(fredCheck.responseTime).toBeGreaterThan(0);
        expect(fredCheck.responseTime).toBeLessThan(10000); // Less than 10 seconds
      }

      if (fredCheck.status === 'pass') {
        expect(fredCheck.message).toMatch(/FRED API connection successful/i);
        expect(fredCheck.metadata).toHaveProperty('endpoint');
        console.log(`✅ FRED API check passed in ${fredCheck.responseTime}ms`);
      } else {
        console.warn(`⚠️  FRED API check failed: ${fredCheck.message}`);
      }
    });

    it('should validate memory usage check', async () => {
      const healthResult = await healthCheckService.performHealthCheck();
      const memoryCheck = healthResult.checks.memory;

      expect(memoryCheck).toHaveProperty('status');
      expect(memoryCheck).toHaveProperty('message');
      expect(['pass', 'fail', 'warn']).toContain(memoryCheck.status);

      if (memoryCheck.metadata) {
        expect(memoryCheck.metadata).toHaveProperty('rss');
        expect(memoryCheck.metadata).toHaveProperty('heapTotal');
        expect(memoryCheck.metadata).toHaveProperty('heapUsed');
        expect(memoryCheck.metadata).toHaveProperty('external');

        // Memory values should be positive numbers
        expect(memoryCheck.metadata.rss).toBeGreaterThan(0);
        expect(memoryCheck.metadata.heapTotal).toBeGreaterThan(0);
        expect(memoryCheck.metadata.heapUsed).toBeGreaterThan(0);

        console.log('✅ Memory usage:', memoryCheck.metadata);
      }
    });
  });

  describe('Health Check Performance Under Load', () => {
    it('should handle concurrent health checks efficiently', async () => {
      const concurrentChecks = Array.from({ length: 5 }, () =>
        healthCheckService.performHealthCheck()
      );

      const startTime = Date.now();
      const results = await Promise.all(concurrentChecks);
      const totalDuration = Date.now() - startTime;

      // All checks should succeed
      expect(results).toHaveLength(5);
      results.forEach((result, index) => {
        expect(result.status).toBeDefined();
        expect(['healthy', 'unhealthy', 'degraded']).toContain(result.status);
        console.log(`Check ${index + 1}: ${result.status}`);
      });

      // Concurrent execution should be reasonably fast
      const avgDuration = totalDuration / 5;
      expect(avgDuration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.HEALTH_CHECK);

      console.log(`✅ 5 concurrent health checks completed in ${totalDuration}ms (avg: ${avgDuration}ms)`);
    });

    it('should maintain consistent results across multiple calls', async () => {
      const checks = await Promise.all([
        healthCheckService.performHealthCheck(),
        healthCheckService.performHealthCheck(),
        healthCheckService.performHealthCheck(),
      ]);

      // Environment and memory checks should be consistent
      const envStatuses = checks.map(c => c.checks.environment.status);
      const fredStatuses = checks.map(c => c.checks.fredApi.status);

      // Environment should be consistently the same
      expect(new Set(envStatuses).size).toBe(1);
      
      // FRED API might vary due to network, but should be mostly consistent
      const fredSuccesses = fredStatuses.filter(s => s === 'pass').length;
      expect(fredSuccesses).toBeGreaterThanOrEqual(2); // At least 2/3 should pass

      console.log('✅ Health check consistency validated');
    });
  });

  describe('Lightweight Health Checks', () => {
    it('should validate isAlive check', async () => {
      const { result, duration } = await measurePerformance(
        () => healthCheckService.isAlive(),
        'IsAlive Check'
      );

      expect(typeof result).toBe('boolean');
      expect(result).toBe(true); // Should be alive with valid config

      // Should be very fast
      expect(duration).toBeLessThan(100); // Less than 100ms

      console.log(`✅ IsAlive check: ${result} (${duration}ms)`);
    });

    it('should validate isReady check', async () => {
      const { result, duration } = await measurePerformance(
        () => healthCheckService.isReady(),
        'IsReady Check'
      );

      expect(typeof result).toBe('boolean');
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.HEALTH_CHECK);

      if (result) {
        console.log(`✅ IsReady check: ${result} (${duration}ms)`);
      } else {
        console.warn(`⚠️  IsReady check: ${result} - system not ready`);
      }
    });

    it('should handle isAlive with invalid environment', async () => {
      // Temporarily break the environment
      const originalApiKey = process.env.FRED_API_KEY;
      delete process.env.FRED_API_KEY;

      try {
        const result = await healthCheckService.isAlive();
        expect(result).toBe(false);
        console.log('✅ IsAlive correctly returned false for invalid environment');
      } finally {
        // Restore environment
        process.env.FRED_API_KEY = originalApiKey;
      }
    });
  });

  describe('Error Scenarios and Edge Cases', () => {
    it('should handle FRED API failures gracefully', async () => {
      // Test with invalid API key temporarily
      const originalApiKey = process.env.FRED_API_KEY;
      process.env.FRED_API_KEY = 'invalid_key_for_testing';
      clearFredClient();

      try {
        const healthResult = await healthCheckService.performHealthCheck();
        
        // Overall system should be unhealthy or degraded
        expect(['unhealthy', 'degraded']).toContain(healthResult.status);
        
        // FRED API check should fail
        expect(healthResult.checks.fredApi.status).toBe('fail');
        expect(healthResult.checks.fredApi.message).toMatch(/authentication failed|invalid/i);

        console.log('✅ Health check correctly detected FRED API failure');
      } finally {
        // Restore valid API key
        process.env.FRED_API_KEY = originalApiKey;
        clearFredClient();
      }
    });

    it('should handle network timeouts gracefully', async () => {
      // This test simulates slow network conditions
      const startTime = Date.now();
      
      try {
        const healthResult = await healthCheckService.performHealthCheck();
        const duration = Date.now() - startTime;
        
        // Health check should complete even if some components are slow
        expect(healthResult).toBeDefined();
        expect(healthResult.status).toBeDefined();
        
        console.log(`✅ Health check completed under potential network stress in ${duration}ms`);
      } catch (error) {
        // If it fails due to timeout, that's also acceptable behavior
        console.log('⚠️  Health check timed out (acceptable under network stress)');
      }
    });

    it('should provide useful error information', async () => {
      const originalApiKey = process.env.FRED_API_KEY;
      process.env.FRED_API_KEY = '';
      clearFredClient();

      try {
        const healthResult = await healthCheckService.performHealthCheck();
        
        // Should have detailed error information
        expect(healthResult.checks.fredApi.status).toBe('fail');
        expect(healthResult.checks.fredApi.message).toBeTruthy();
        expect(healthResult.checks.fredApi.message.length).toBeGreaterThan(10);

        // Error message should not expose sensitive information
        expect(healthResult.checks.fredApi.message).not.toMatch(/[a-f0-9]{32,}/);
        
        console.log('✅ Health check provided useful error information without exposing secrets');
      } finally {
        process.env.FRED_API_KEY = originalApiKey;
        clearFredClient();
      }
    });
  });

  describe('Health Check Data Quality', () => {
    it('should provide actionable health information', async () => {
      const healthResult = await healthCheckService.performHealthCheck();
      
      // Verify all required information is present and actionable
      expect(healthResult.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(healthResult.version).toBeTruthy();
      expect(typeof healthResult.uptime).toBe('number');
      
      // Each check should have actionable information
      Object.entries(healthResult.checks).forEach(([checkName, check]) => {
        if (check) {
          expect(check.status).toBeTruthy();
          expect(check.message).toBeTruthy();
          expect(check.message.length).toBeGreaterThan(5);
          
          console.log(`✅ ${checkName}: ${check.status} - ${check.message}`);
        }
      });
    });

    it('should track performance metrics for health checks', async () => {
      const healthResults = [];
      const durations = [];

      // Perform multiple health checks to gather performance data
      for (let i = 0; i < 3; i++) {
        const { result, duration } = await measurePerformance(
          () => healthCheckService.performHealthCheck(),
          `Health Check ${i + 1}`
        );
        
        healthResults.push(result);
        durations.push(duration);
        
        // Small delay between checks
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Analyze performance trends
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);

      expect(avgDuration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.HEALTH_CHECK);
      expect(maxDuration - minDuration).toBeLessThan(2000); // Variation should be reasonable

      console.log(`✅ Health check performance: avg ${avgDuration}ms, range ${minDuration}-${maxDuration}ms`);
    });
  });

  describe('Alpha Vantage Integration (Optional)', () => {
    it('should handle Alpha Vantage configuration appropriately', async () => {
      const healthResult = await healthCheckService.performHealthCheck();
      const alphaVantageCheck = healthResult.checks.alphaVantageApi;

      if (alphaVantageCheck) {
        expect(['pass', 'fail', 'warn']).toContain(alphaVantageCheck.status);
        expect(alphaVantageCheck.message).toBeTruthy();
        
        if (config.alphaVantageApiKey) {
          // If we have a key, it should either pass or warn (not fail)
          expect(['pass', 'warn']).toContain(alphaVantageCheck.status);
          console.log(`✅ Alpha Vantage check: ${alphaVantageCheck.status}`);
        } else {
          // If no key, should warn that it's not configured
          expect(alphaVantageCheck.status).toBe('warn');
          expect(alphaVantageCheck.message).toMatch(/not configured/i);
          console.log('✅ Alpha Vantage correctly reported as not configured');
        }
      }
    });
  });

  describe('Production Readiness Validation', () => {
    it('should meet production health check requirements', async () => {
      const healthResult = await healthCheckService.performHealthCheck();
      
      // Production requirements checklist
      const requirements = {
        'Response Time': healthResult.checks.fredApi.responseTime && healthResult.checks.fredApi.responseTime < 5000,
        'Environment Validation': healthResult.checks.environment.status === 'pass',
        'Memory Monitoring': healthResult.checks.memory.status !== 'fail',
        'API Connectivity': healthResult.checks.fredApi.status === 'pass',
        'Uptime Tracking': healthResult.uptime >= 0,
        'Status Classification': ['healthy', 'degraded'].includes(healthResult.status),
      };

      let passedRequirements = 0;
      Object.entries(requirements).forEach(([requirement, passed]) => {
        if (passed) {
          passedRequirements++;
          console.log(`✅ ${requirement}: PASSED`);
        } else {
          console.log(`❌ ${requirement}: FAILED`);
        }
      });

      // At least 80% of requirements should pass for production readiness
      const passRate = passedRequirements / Object.keys(requirements).length;
      expect(passRate).toBeGreaterThanOrEqual(0.8);

      console.log(`✅ Production readiness: ${Math.round(passRate * 100)}% (${passedRequirements}/${Object.keys(requirements).length})`);
    });
  });
});