// tests/integration/setup.ts

import { getIntegrationConfig, shouldRunIntegrationTests } from './config';
import { clearEnvCache } from '@/lib/config/env';
import { clearFredClient } from '@/lib/http/fredClient';

// Global setup for integration tests
beforeAll(async () => {
  if (!shouldRunIntegrationTests()) {
    console.warn('⚠️  Integration tests skipped - no valid API configuration');
    return;
  }

  console.log('🚀 Setting up integration test environment...');
  
  // Clear any cached configurations
  clearEnvCache();
  clearFredClient();
  
  // Set up integration test environment
  const config = getIntegrationConfig();
  
  // Override environment variables for testing
  (process.env as any).NODE_ENV = 'integration';
  (process.env as any).FRED_API_KEY = config.fredApiKey;
  (process.env as any).FRED_BASE_URL = config.fredBaseUrl;
  
  if (config.alphaVantageApiKey) {
    (process.env as any).ALPHA_VANTAGE_API_KEY = config.alphaVantageApiKey;
  }
  
  console.log('✅ Integration test environment configured');
  console.log(`   - FRED Base URL: ${config.fredBaseUrl}`);
  console.log(`   - API Key: ${config.fredApiKey.substring(0, 8)}...`);
  console.log(`   - Timeout: ${config.timeout}ms`);
  console.log(`   - Retry Count: ${config.retryCount}`);
});

// Global teardown for integration tests
afterAll(async () => {
  if (!shouldRunIntegrationTests()) {
    return;
  }

  console.log('🧹 Cleaning up integration test environment...');
  
  // Clear caches
  clearEnvCache();
  clearFredClient();
  
  console.log('✅ Integration test cleanup complete');
});

// Before each test
beforeEach(() => {
  if (!shouldRunIntegrationTests()) {
    // Skip individual tests if integration tests shouldn't run
    jest.skip();
  }
});

// Custom matchers for integration tests
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidFredResponse(): R;
      toHaveSecureLogging(): R;
      toMeetPerformanceBaseline(maxDuration: number): R;
    }
  }
}

expect.extend({
  toBeValidFredResponse(received: any) {
    // Validate FRED API response structure
    const isValid = (
      received &&
      typeof received === 'object' &&
      'observations' in received &&
      Array.isArray(received.observations)
    );
    
    if (isValid) {
      return {
        message: () => `Expected response not to be a valid FRED response`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected response to be a valid FRED response with 'observations' array`,
        pass: false,
      };
    }
  },

  toHaveSecureLogging(received: string) {
    // Check that logs don't contain API keys or sensitive data
    const hasApiKey = /api_key[=:]\s*[^*\s&]+(?!\*)/i.test(received);
    const hasRedacted = /\*+REDACTED\*+/.test(received);
    
    if (!hasApiKey || hasRedacted) {
      return {
        message: () => `Expected logs to contain exposed API keys`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected logs not to contain exposed API keys. Found: ${received}`,
        pass: false,
      };
    }
  },

  toMeetPerformanceBaseline(received: number, maxDuration: number) {
    if (received <= maxDuration) {
      return {
        message: () => `Expected duration ${received}ms to exceed ${maxDuration}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected duration ${received}ms to be within ${maxDuration}ms baseline`,
        pass: false,
      };
    }
  },
});

// Test data helpers
export const TEST_DATA = {
  SERIES: {
    VALID: ['UNRATE', 'GDPC1', 'CPIAUCSL'],
    INVALID: ['INVALID_SERIES', 'NONEXISTENT'],
  },
  
  EXPECTED_RESPONSES: {
    UNRATE: {
      hasObservations: true,
      minObservations: 1,
      expectedFields: ['date', 'value'],
    },
    GDPC1: {
      hasObservations: true,
      minObservations: 1,
      expectedFields: ['date', 'value'],
    },
  },
  
  PERFORMANCE_BASELINES: {
    SINGLE_SERIES: 5000, // 5 seconds max
    BULK_OPERATION: 15000, // 15 seconds max
    HEALTH_CHECK: 2000, // 2 seconds max
  },
};

export default TEST_DATA;