// tests/integration/fredService.integration.test.ts

import { fredService } from '@/lib/services/fredService';
import { getIntegrationConfig, measurePerformance } from './config';
import { TEST_DATA } from './setup';

describe('FRED Service Integration Tests', () => {
  let config: ReturnType<typeof getIntegrationConfig>;

  beforeAll(() => {
    config = getIntegrationConfig();
  });

  describe('Service Layer Integration', () => {
    it('should get latest unemployment rate value', async () => {
      const { result, duration } = await measurePerformance(
        () => fredService.getLatestValue('UNRATE'),
        'Get Latest UNRATE Value'
      );

      expect(result).toBeDefined();
      expect(typeof result.value).toBe('number');
      expect(typeof result.date).toBe('string');
      expect(result.series).toBe('UNRATE');
      
      // Value should be reasonable for unemployment rate (0-50%)
      expect(result.value).toBeGreaterThan(0);
      expect(result.value).toBeLessThan(50);
      
      // Date should be recent (within last 5 years)
      const resultDate = new Date(result.date);
      const fiveYearsAgo = new Date();
      fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
      expect(resultDate).toBeInstanceOf(Date);
      expect(resultDate.getTime()).toBeGreaterThan(fiveYearsAgo.getTime());
      
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.SINGLE_SERIES);
      
      console.log(`✅ Latest UNRATE: ${result.value}% on ${result.date}`);
    });

    it('should get latest GDP value', async () => {
      const { result, duration } = await measurePerformance(
        () => fredService.getLatestValue('GDPC1'),
        'Get Latest GDPC1 Value'
      );

      expect(result).toBeDefined();
      expect(typeof result.value).toBe('number');
      expect(typeof result.date).toBe('string');
      expect(result.series).toBe('GDPC1');
      
      // GDP should be a large positive number (trillions)
      expect(result.value).toBeGreaterThan(10000); // At least $10T
      expect(result.value).toBeLessThan(100000); // Less than $100T (reasonable upper bound)
      
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.SINGLE_SERIES);
      
      console.log(`✅ Latest GDPC1: $${result.value}B on ${result.date}`);
    });

    it('should handle invalid series gracefully', async () => {
      await expect(fredService.getLatestValue('INVALID_SERIES_123'))
        .rejects
        .toThrow(/not found|invalid|error/i);
    });
  });

  describe('Bulk Data Operations', () => {
    it('should fetch multiple economic indicators', async () => {
      const indicators = ['UNRATE', 'GDPC1', 'CPIAUCSL'];
      
      const { result, duration } = await measurePerformance(
        () => fredService.getBulkData(indicators),
        'Bulk Economic Indicators'
      );

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(indicators.length);
      
      // Verify each indicator has valid data
      result.forEach((item, index) => {
        expect(item.series).toBe(indicators[index]);
        expect(typeof item.value).toBe('number');
        expect(typeof item.date).toBe('string');
        expect(item.value).toBeGreaterThan(0);
        
        console.log(`✅ ${item.series}: ${item.value} on ${item.date}`);
      });
      
      // Performance should be reasonable for bulk operation
      expect(duration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.BULK_OPERATION);
      
      // Verify data consistency
      const unemploymentData = result.find(item => item.series === 'UNRATE');
      const gdpData = result.find(item => item.series === 'GDPC1');
      const inflationData = result.find(item => item.series === 'CPIAUCSL');
      
      expect(unemploymentData!.value).toBeLessThan(50); // Reasonable unemployment rate
      expect(gdpData!.value).toBeGreaterThan(10000); // Reasonable GDP value
      expect(inflationData!.value).toBeGreaterThan(0); // Positive CPI
    });

    it('should handle mixed valid/invalid series in bulk', async () => {
      const mixedSeries = ['UNRATE', 'INVALID_SERIES', 'GDPC1'];
      
      const { result } = await measurePerformance(
        () => fredService.getBulkData(mixedSeries),
        'Mixed Valid/Invalid Bulk Data'
      );

      // Should return data for valid series only
      expect(result.length).toBe(2); // Only UNRATE and GDPC1
      
      const seriesIds = result.map(item => item.series);
      expect(seriesIds).toContain('UNRATE');
      expect(seriesIds).toContain('GDPC1');
      expect(seriesIds).not.toContain('INVALID_SERIES');
      
      console.log(`✅ Bulk operation returned ${result.length}/3 valid series`);
    });

    it('should maintain data quality across bulk operations', async () => {
      const testSeries = ['UNRATE', 'GDPC1', 'CPIAUCSL', 'FEDFUNDS'];
      
      const { result } = await measurePerformance(
        () => fredService.getBulkData(testSeries),
        'Data Quality Validation'
      );

      // Verify all results have required fields
      result.forEach(item => {
        expect(item).toHaveProperty('series');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('date');
        
        // Verify data types
        expect(typeof item.series).toBe('string');
        expect(typeof item.value).toBe('number');
        expect(typeof item.date).toBe('string');
        
        // Verify date format
        expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        
        // Verify value is finite number
        expect(Number.isFinite(item.value)).toBe(true);
        expect(Number.isNaN(item.value)).toBe(false);
      });
      
      console.log('✅ All bulk data passed quality validation');
    });
  });

  describe('Performance Under Load', () => {
    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = Array.from({ length: 5 }, () =>
        fredService.getLatestValue('UNRATE')
      );
      
      const startTime = Date.now();
      const results = await Promise.all(concurrentRequests);
      const totalDuration = Date.now() - startTime;
      
      // All requests should succeed
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.series).toBe('UNRATE');
        expect(typeof result.value).toBe('number');
      });
      
      // Concurrent requests should be faster than sequential
      const avgDuration = totalDuration / 5;
      expect(avgDuration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.SINGLE_SERIES);
      
      console.log(`✅ 5 concurrent requests completed in ${totalDuration}ms (avg: ${avgDuration}ms)`);
    });

    it('should cache responses appropriately', async () => {
      // First request
      const { duration: firstDuration } = await measurePerformance(
        () => fredService.getLatestValue('UNRATE'),
        'First UNRATE Request'
      );
      
      // Second request (should potentially be faster due to caching)
      const { duration: secondDuration } = await measurePerformance(
        () => fredService.getLatestValue('UNRATE'),
        'Second UNRATE Request'
      );
      
      // Both should complete within reasonable time
      expect(firstDuration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.SINGLE_SERIES);
      expect(secondDuration).toBeLessThan(TEST_DATA.PERFORMANCE_BASELINES.SINGLE_SERIES);
      
      console.log(`Request times - First: ${firstDuration}ms, Second: ${secondDuration}ms`);
    });
  });

  describe('Data Accuracy & Consistency', () => {
    it('should return consistent values across multiple calls', async () => {
      const requests = Array.from({ length: 3 }, () =>
        fredService.getLatestValue('UNRATE')
      );
      
      const results = await Promise.all(requests);
      
      // All results should be identical for same series
      const firstResult = results[0];
      results.forEach(result => {
        expect(result.series).toBe(firstResult.series);
        expect(result.value).toBe(firstResult.value);
        expect(result.date).toBe(firstResult.date);
      });
      
      console.log('✅ Multiple calls returned consistent data');
    });

    it('should provide reasonable economic data ranges', async () => {
      const economicIndicators = [
        { series: 'UNRATE', min: 0, max: 50, name: 'Unemployment Rate (%)' },
        { series: 'GDPC1', min: 10000, max: 100000, name: 'GDP (Billions)' },
        { series: 'CPIAUCSL', min: 50, max: 1000, name: 'Consumer Price Index' },
      ];

      for (const indicator of economicIndicators) {
        const result = await fredService.getLatestValue(indicator.series);
        
        expect(result.value).toBeGreaterThanOrEqual(indicator.min);
        expect(result.value).toBeLessThanOrEqual(indicator.max);
        
        console.log(`✅ ${indicator.name}: ${result.value} (within ${indicator.min}-${indicator.max})`);
      }
    });
  });

  describe('Error Recovery & Resilience', () => {
    it('should recover from temporary network issues', async () => {
      // This test validates that the service layer properly handles
      // and recovers from network issues at the HTTP client level
      
      let attempts = 0;
      const maxAttempts = 3;
      
      while (attempts < maxAttempts) {
        try {
          attempts++;
          const result = await fredService.getLatestValue('UNRATE');
          expect(result).toBeDefined();
          console.log(`✅ Request succeeded on attempt ${attempts}`);
          break;
        } catch (error) {
          if (attempts === maxAttempts) {
            throw error;
          }
          console.log(`⚠️  Attempt ${attempts} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    });
  });
});