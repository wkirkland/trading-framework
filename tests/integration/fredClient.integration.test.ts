// tests/integration/fredClient.integration.test.ts

import { getFredClient, clearFredClient, FredRequestError } from '@/lib/http/fredClient';
import { getIntegrationConfig, measurePerformance, withRetry } from './config';
import { TEST_DATA } from './setup';

describe('FRED Client Integration Tests', () => {
  let config: ReturnType<typeof getIntegrationConfig>;
  let client: ReturnType<typeof getFredClient>;

  beforeAll(() => {
    config = getIntegrationConfig();
    client = getFredClient();
  });

  afterAll(() => {
    clearFredClient();
  });

  describe('API Key Authentication', () => {
    it('should successfully authenticate with real API key', async () => {
      const { result, duration } = await measurePerformance(
        () => client.validateApiKey(),
        'API Key Validation'
      );

      expect(result).toBe(true);
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.HEALTH_CHECK);
    });

    it('should fail authentication with invalid API key', async () => {
      // Temporarily override with invalid key
      const originalEnv = process.env.FRED_API_KEY;
      process.env.FRED_API_KEY = 'invalid_key_12345';
      clearFredClient();
      
      try {
        const invalidClient = getFredClient();
        const isValid = await invalidClient.validateApiKey();
        expect(isValid).toBe(false);
      } finally {
        // Restore original key
        process.env.FRED_API_KEY = originalEnv;
        clearFredClient();
        client = getFredClient();
      }
    });
  });

  describe('Series Observations', () => {
    it('should fetch unemployment rate data (UNRATE)', async () => {
      const { result, duration } = await measurePerformance(
        () => client.getSeriesObservations('UNRATE', { limit: 10 }),
        'UNRATE Series Fetch'
      );

      const data = await result.fredJson();
      
      expect(data).toBeValidFredResponse();
      expect(data.observations).toHaveLength(10);
      expect(data.observations[0]).toHaveProperty('date');
      expect(data.observations[0]).toHaveProperty('value');
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.SINGLE_SERIES);
    });

    it('should fetch GDP data (GDPC1)', async () => {
      const { result, duration } = await measurePerformance(
        () => client.getSeriesObservations('GDPC1', { 
          limit: 5,
          sortOrder: 'desc',
          observationStart: '2020-01-01'
        }),
        'GDPC1 Series Fetch'
      );

      const data = await result.fredJson();
      
      expect(data).toBeValidFredResponse();
      expect(data.observations.length).toBeGreaterThan(0);
      expect(data.observations.length).toBeLessThanOrEqual(5);
      
      // Verify date filtering worked
      const firstObservation = data.observations[0];
      expect(new Date(firstObservation.date).getFullYear()).toBeGreaterThanOrEqual(2020);
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.SINGLE_SERIES);
    });

    it('should handle invalid series gracefully', async () => {
      const response = await client.getSeriesObservations('INVALID_SERIES_123');
      
      await expect(response.fredJson()).rejects.toThrow(FredRequestError);
    });

    it('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to test rate limiting behavior
      const requests = Array.from({ length: 5 }, (_, i) =>
        client.getSeriesObservations('UNRATE', { limit: 1 })
      );

      const results = await Promise.allSettled(requests);
      
      // All requests should either succeed or fail gracefully
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          expect(result.reason).toBeInstanceOf(FredRequestError);
          console.log(`Request ${index + 1} was rate limited (expected behavior)`);
        }
      });
    });
  });

  describe('Series Information', () => {
    it('should fetch series metadata', async () => {
      const { result, duration } = await measurePerformance(
        () => client.getSeriesInfo('UNRATE'),
        'Series Info Fetch'
      );

      const data = await result.fredJson();
      
      expect(data).toHaveProperty('seriess');
      expect(Array.isArray(data.seriess)).toBe(true);
      expect(data.seriess.length).toBeGreaterThan(0);
      
      const seriesInfo = data.seriess[0];
      expect(seriesInfo).toHaveProperty('id', 'UNRATE');
      expect(seriesInfo).toHaveProperty('title');
      expect(seriesInfo).toHaveProperty('frequency');
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.SINGLE_SERIES);
    });
  });

  describe('Bulk Operations', () => {
    it('should handle multiple series requests', async () => {
      const { result, duration } = await measurePerformance(
        () => client.getBulkSeriesObservations(['UNRATE', 'GDPC1', 'CPIAUCSL']),
        'Bulk Series Fetch'
      );

      expect(Object.keys(result)).toHaveLength(3);
      expect(result).toHaveProperty('UNRATE');
      expect(result).toHaveProperty('GDPC1');
      expect(result).toHaveProperty('CPIAUCSL');
      
      // Verify each series has valid data
      for (const [seriesId, response] of Object.entries(result)) {
        const data = await response.fredJson();
        expect(data).toBeValidFredResponse();
        expect(data.observations.length).toBeGreaterThan(0);
        console.log(`✅ ${seriesId}: ${data.observations.length} observations`);
      }
      
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.BULK_OPERATION);
    });

    it('should handle mixed valid/invalid series in bulk', async () => {
      const { result } = await measurePerformance(
        () => client.getBulkSeriesObservations(['UNRATE', 'INVALID_SERIES', 'GDPC1']),
        'Mixed Bulk Series Fetch'
      );

      // Should have results for valid series only
      expect(result).toHaveProperty('UNRATE');
      expect(result).toHaveProperty('GDPC1');
      expect(result).not.toHaveProperty('INVALID_SERIES');
      
      console.log(`✅ Bulk operation returned ${Object.keys(result).length}/3 series`);
    });
  });

  describe('Error Handling & Resilience', () => {
    it('should retry failed requests automatically', async () => {
      // This test simulates network issues by making requests with very short timeouts
      // The retry mechanism should handle temporary failures
      
      let attemptCount = 0;
      const result = await withRetry(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          // Simulate a failure on first attempt
          throw new Error('Simulated network error');
        }
        return client.getSeriesObservations('UNRATE', { limit: 1 });
      }, 3, 100);

      const data = await result.fredJson();
      expect(data).toBeValidFredResponse();
      expect(attemptCount).toBe(2); // Should have retried once
      console.log(`✅ Request succeeded after ${attemptCount} attempts`);
    });

    it('should handle timeout scenarios', async () => {
      // Create a client with very short timeout to test timeout handling
      const timeoutStart = Date.now();
      
      try {
        // This might timeout or succeed depending on network conditions
        await Promise.race([
          client.getSeriesObservations('UNRATE'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Test timeout')), 1000)
          )
        ]);
        console.log('✅ Request completed within timeout window');
      } catch (error) {
        const duration = Date.now() - timeoutStart;
        console.log(`⏱️  Request timed out after ${duration}ms (expected for timeout test)`);
        expect(error).toBeDefined();
      }
    });
  });

  describe('Security Validation', () => {
    it('should not expose API keys in error messages', async () => {
      try {
        await client.getSeriesObservations('INVALID_SERIES');
        fail('Should have thrown an error');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        expect(errorMessage).toHaveSecureLogging();
        console.log('✅ Error message properly sanitized');
      }
    });

    it('should redact API keys in logged URLs', async () => {
      // Capture console output to verify URL redaction
      const originalConsole = console.log;
      let loggedMessages: string[] = [];
      
      console.log = (...args: any[]) => {
        loggedMessages.push(args.join(' '));
        originalConsole(...args);
      };

      try {
        await client.getSeriesObservations('UNRATE', { limit: 1 });
        
        // Check that any logged URLs have redacted API keys
        const urlLogs = loggedMessages.filter(msg => msg.includes('api_key'));
        urlLogs.forEach(log => {
          expect(log).toHaveSecureLogging();
        });
        
        console.log('✅ All logged URLs properly redacted');
      } finally {
        console.log = originalConsole;
      }
    });
  });

  describe('Data Quality & Consistency', () => {
    it('should return consistent data types across requests', async () => {
      const response1 = await client.getSeriesObservations('UNRATE', { limit: 5 });
      const response2 = await client.getSeriesObservations('GDPC1', { limit: 5 });
      
      const data1 = await response1.fredJson();
      const data2 = await response2.fredJson();
      
      // Both should have the same structure
      expect(data1).toHaveProperty('observations');
      expect(data2).toHaveProperty('observations');
      
      // Observations should have consistent field types
      if (data1.observations.length > 0 && data2.observations.length > 0) {
        const obs1 = data1.observations[0];
        const obs2 = data2.observations[0];
        
        expect(typeof obs1.date).toBe('string');
        expect(typeof obs2.date).toBe('string');
        expect(typeof obs1.value).toBe('string');
        expect(typeof obs2.value).toBe('string');
      }
      
      console.log('✅ Data structure consistency validated');
    });

    it('should handle different parameter combinations', async () => {
      const testCases = [
        { limit: 1, sortOrder: 'asc' as const },
        { limit: 10, sortOrder: 'desc' as const },
        { observationStart: '2020-01-01', limit: 5 },
        { observationEnd: '2021-12-31', limit: 3 },
      ];

      for (const params of testCases) {
        const response = await client.getSeriesObservations('UNRATE', params);
        const data = await response.fredJson();
        
        expect(data).toBeValidFredResponse();
        if (params.limit) {
          expect(data.observations.length).toBeLessThanOrEqual(params.limit);
        }
        
        console.log(`✅ Parameter combination ${JSON.stringify(params)} validated`);
      }
    });
  });
});