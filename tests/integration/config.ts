// tests/integration/config.ts

import { config } from 'dotenv';
import path from 'path';

// Load integration test environment
const integrationEnvPath = path.join(process.cwd(), '.env.integration.local');
config({ path: integrationEnvPath });

// Fallback to .env.integration template if local doesn't exist
if (!process.env.FRED_API_KEY || process.env.FRED_API_KEY === 'your_real_fred_api_key_here') {
  config({ path: path.join(process.cwd(), '.env.integration') });
}

export interface IntegrationTestConfig {
  fredApiKey: string;
  fredBaseUrl: string;
  alphaVantageApiKey?: string;
  timeout: number;
  retryCount: number;
  testSeries: {
    unemployment: string;
    gdp: string;
    inflation: string;
    invalid: string;
  };
  logging: {
    level: string;
    format: string;
  };
}

export function getIntegrationConfig(): IntegrationTestConfig {
  // Validate required environment variables
  const fredApiKey = process.env.FRED_API_KEY;
  if (!fredApiKey || fredApiKey === 'your_real_fred_api_key_here') {
    throw new Error(
      'FRED_API_KEY is required for integration tests. ' +
      'Please copy .env.integration to .env.integration.local and add your real API key.'
    );
  }

  return {
    fredApiKey,
    fredBaseUrl: process.env.FRED_BASE_URL || 'https://api.stlouisfed.org/fred',
    alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY,
    timeout: parseInt(process.env.INTEGRATION_TEST_TIMEOUT || '30000', 10),
    retryCount: parseInt(process.env.INTEGRATION_TEST_RETRY_COUNT || '3', 10),
    testSeries: {
      unemployment: process.env.TEST_SERIES_UNEMPLOYMENT || 'UNRATE',
      gdp: process.env.TEST_SERIES_GDP || 'GDPC1',
      inflation: process.env.TEST_SERIES_INFLATION || 'CPIAUCSL',
      invalid: process.env.TEST_SERIES_INVALID || 'INVALID_SERIES_FOR_ERROR_TESTING',
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
    },
  };
}

// Test helper to check if integration tests should run
export function shouldRunIntegrationTests(): boolean {
  try {
    getIntegrationConfig();
    return true;
  } catch (error) {
    console.warn('Integration tests skipped:', (error as Error).message);
    return false;
  }
}

// Test helper to retry operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === retries) {
        throw lastError;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}

// Test helper to measure performance
export async function measurePerformance<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<{ result: T; duration: number; timestamp: string }> {
  const start = Date.now();
  const timestamp = new Date().toISOString();
  
  try {
    const result = await operation();
    const duration = Date.now() - start;
    
    console.log(`⏱️  ${operationName}: ${duration}ms`);
    
    return { result, duration, timestamp };
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ ${operationName} failed after ${duration}ms:`, error);
    throw error;
  }
}

export default getIntegrationConfig;