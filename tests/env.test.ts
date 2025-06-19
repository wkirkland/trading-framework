// tests/env.test.ts

import { getEnv, getCachedEnv, clearEnvCache, EnvValidationError, isDevelopment, isProduction, isTest } from '@/lib/config/env';

const originalEnv = { ...process.env };

describe('Environment Configuration', () => {
  beforeEach(() => {
    clearEnvCache();
    // Restore original environment
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  afterAll(() => {
    // Restore original environment
    Object.keys(process.env).forEach(key => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  describe('getEnv', () => {
    it('should return valid configuration with all required variables', () => {
      process.env.FRED_API_KEY = 'test-key-123';
      process.env.FRED_BASE_URL = 'https://api.stlouisfed.org/fred';
      process.env.ALPHA_VANTAGE_API_KEY = 'av-key-456';
      process.env.NODE_ENV = 'development';
      process.env.PORT = '3000';

      const env = getEnv();

      expect(env).toEqual({
        fredApiKey: 'test-key-123',
        fredBaseUrl: 'https://api.stlouisfed.org/fred',
        alphaVantageApiKey: 'av-key-456',
        nodeEnv: 'development',
        port: 3000,
      });
    });

    it('should use default values for optional variables', () => {
      process.env = {
        FRED_API_KEY: 'test-key-123',
      };

      const env = getEnv();

      expect(env.fredBaseUrl).toBe('https://api.stlouisfed.org/fred');
      expect(env.nodeEnv).toBe('development');
      expect(env.port).toBe(3000);
      expect(env.alphaVantageApiKey).toBe('');
    });

    it('should trim whitespace from string values', () => {
      process.env = {
        FRED_API_KEY: '  test-key-123  ',
        FRED_BASE_URL: '  https://api.stlouisfed.org/fred  ',
        ALPHA_VANTAGE_API_KEY: '  av-key-456  ',
      };

      const env = getEnv();

      expect(env.fredApiKey).toBe('test-key-123');
      expect(env.fredBaseUrl).toBe('https://api.stlouisfed.org/fred');
      expect(env.alphaVantageApiKey).toBe('av-key-456');
    });
  });

  describe('Required Variable Validation', () => {
    it('should throw EnvValidationError when FRED_API_KEY is missing', () => {
      delete process.env.FRED_API_KEY;

      expect(() => getEnv()).toThrow(EnvValidationError);
      expect(() => getEnv()).toThrow('FRED_API_KEY: is required but not set');
    });

    it('should throw EnvValidationError when FRED_API_KEY is empty', () => {
      process.env.FRED_API_KEY = '';

      expect(() => getEnv()).toThrow(EnvValidationError);
      expect(() => getEnv()).toThrow('FRED_API_KEY: is required but not set');
    });

    it('should throw EnvValidationError when FRED_API_KEY is only whitespace', () => {
      process.env.FRED_API_KEY = '   ';

      expect(() => getEnv()).toThrow(EnvValidationError);
      expect(() => getEnv()).toThrow('FRED_API_KEY: is required but not provided or empty');
    });
  });

  describe('NODE_ENV Validation', () => {
    it('should accept valid NODE_ENV values', () => {
      process.env.FRED_API_KEY = 'test-key';
      
      process.env.NODE_ENV = 'development';
      expect(getEnv().nodeEnv).toBe('development');

      clearEnvCache();
      process.env.NODE_ENV = 'production';
      expect(getEnv().nodeEnv).toBe('production');

      clearEnvCache();
      process.env.NODE_ENV = 'test';
      expect(getEnv().nodeEnv).toBe('test');
    });

    it('should throw EnvValidationError for invalid NODE_ENV', () => {
      process.env.FRED_API_KEY = 'test-key';
      process.env.NODE_ENV = 'invalid-env';

      expect(() => getEnv()).toThrow(EnvValidationError);
      expect(() => getEnv()).toThrow('NODE_ENV: must be one of: development, production, test');
    });

    it('should use default NODE_ENV when not provided', () => {
      process.env.FRED_API_KEY = 'test-key';
      delete process.env.NODE_ENV;

      const env = getEnv();
      expect(env.nodeEnv).toBe('development');
    });
  });

  describe('PORT Validation', () => {
    beforeEach(() => {
      process.env.FRED_API_KEY = 'test-key';
    });

    it('should accept valid port numbers', () => {
      process.env.PORT = '8080';
      expect(getEnv().port).toBe(8080);

      clearEnvCache();
      process.env.PORT = '443';
      expect(getEnv().port).toBe(443);

      clearEnvCache();
      process.env.PORT = '65535';
      expect(getEnv().port).toBe(65535);
    });

    it('should use default port when not provided', () => {
      delete process.env.PORT;
      expect(getEnv().port).toBe(3000);
    });

    it('should throw EnvValidationError for invalid port numbers', () => {
      process.env.PORT = 'not-a-number';
      expect(() => getEnv()).toThrow(EnvValidationError);
      expect(() => getEnv()).toThrow('PORT: must be a valid port number (1-65535)');

      clearEnvCache();
      process.env.PORT = '0';
      expect(() => getEnv()).toThrow(EnvValidationError);

      clearEnvCache();
      process.env.PORT = '65536';
      expect(() => getEnv()).toThrow(EnvValidationError);

      clearEnvCache();
      process.env.PORT = '-1';
      expect(() => getEnv()).toThrow(EnvValidationError);
    });
  });

  describe('Caching', () => {
    it('should cache environment configuration', () => {
      process.env.FRED_API_KEY = 'test-key';
      
      const env1 = getCachedEnv();
      const env2 = getCachedEnv();

      expect(env1).toBe(env2); // Should be the same object reference
    });

    it('should use cached configuration after environment changes', () => {
      process.env.FRED_API_KEY = 'test-key-1';
      
      const env1 = getCachedEnv();
      
      // Change environment
      process.env.FRED_API_KEY = 'test-key-2';
      
      const env2 = getCachedEnv();
      
      // Should still return cached value
      expect(env2.fredApiKey).toBe('test-key-1');
    });

    it('should re-validate after cache is cleared', () => {
      process.env.FRED_API_KEY = 'test-key-1';
      
      const env1 = getCachedEnv();
      
      // Change environment and clear cache
      process.env.FRED_API_KEY = 'test-key-2';
      clearEnvCache();
      
      const env2 = getCachedEnv();
      
      // Should return new value
      expect(env2.fredApiKey).toBe('test-key-2');
    });
  });

  describe('Environment Helpers', () => {
    beforeEach(() => {
      process.env.FRED_API_KEY = 'test-key';
    });

    it('should correctly identify development environment', () => {
      process.env.NODE_ENV = 'development';
      clearEnvCache();

      expect(isDevelopment()).toBe(true);
      expect(isProduction()).toBe(false);
      expect(isTest()).toBe(false);
    });

    it('should correctly identify production environment', () => {
      process.env.NODE_ENV = 'production';
      clearEnvCache();

      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(true);
      expect(isTest()).toBe(false);
    });

    it('should correctly identify test environment', () => {
      process.env.NODE_ENV = 'test';
      clearEnvCache();

      expect(isDevelopment()).toBe(false);
      expect(isProduction()).toBe(false);
      expect(isTest()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should create proper EnvValidationError instances', () => {
      const error = new EnvValidationError('TEST_VAR', 'is invalid');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EnvValidationError);
      expect(error.name).toBe('EnvValidationError');
      expect(error.message).toBe('Environment variable validation failed for TEST_VAR: is invalid');
    });

    it('should handle unexpected errors during validation', () => {
      // Mock process.env to throw an error
      Object.defineProperty(process, 'env', {
        get: () => {
          throw new Error('Unexpected error');
        },
        configurable: true,
      });

      expect(() => getEnv()).toThrow(EnvValidationError);
      expect(() => getEnv()).toThrow('UNKNOWN: Unexpected error during validation');

      // Restore process.env
      Object.defineProperty(process, 'env', {
        value: originalEnv,
        configurable: true,
      });
    });
  });
});