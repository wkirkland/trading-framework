// tests/fredClient.test.ts

import { getFredClient, clearFredClient, FredAuthError, FredRequestError } from '@/lib/http/fredClient';
import { clearEnvCache } from '@/lib/config/env';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock environment variables
const originalEnv = { ...process.env };

describe('FredClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearFredClient();
    clearEnvCache();
    
    // Set up default environment
    process.env.FRED_API_KEY = 'test-api-key-12345';
    process.env.FRED_BASE_URL = 'https://api.stlouisfed.org/fred';
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

  describe('Authentication', () => {
    it('should throw EnvValidationError when API key is missing', () => {
      delete process.env.FRED_API_KEY;
      
      expect(() => {
        getFredClient();
      }).toThrow('FRED_API_KEY: is required but not set');
    });

    it('should throw EnvValidationError when API key is empty string', () => {
      process.env.FRED_API_KEY = '';
      
      expect(() => {
        getFredClient();
      }).toThrow('FRED_API_KEY: is required but not set');
    });

    it('should successfully create client with valid API key', () => {
      expect(() => {
        getFredClient();
      }).not.toThrow();
    });
  });

  describe('URL Security', () => {
    it('should include API key in request URL', async () => {
      const client = getFredClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ observations: [] }),
      });

      await client.getSeriesObservations('UNRATE');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api_key=test-api-key-12345'),
        expect.any(Object)
      );
    });

    it('should not allow api_key in params to override secure key', async () => {
      const client = getFredClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ observations: [] }),
      });

      // Try to inject a different API key via params
      const response = await client.getSeriesObservations('UNRATE');

      // Should still use the configured key, not any injected one
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api_key=test-api-key-12345'),
        expect.any(Object)
      );
      
      // Should not contain any duplicate api_key parameters
      const calledUrl = mockFetch.mock.calls[0][0];
      const apiKeyMatches = calledUrl.match(/api_key=/g);
      expect(apiKeyMatches).toHaveLength(1);
    });

    it('should build URLs with correct parameter format', async () => {
      const client = getFredClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ observations: [] }),
      });

      await client.getSeriesObservations('UNRATE', {
        limit: 5,
        sortOrder: 'asc',
        observationStart: '2020-01-01',
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      
      expect(calledUrl).toContain('series_id=UNRATE');
      expect(calledUrl).toContain('limit=5');
      expect(calledUrl).toContain('sort_order=asc');
      expect(calledUrl).toContain('observation_start=2020-01-01');
      expect(calledUrl).toContain('api_key=test-api-key-12345');
    });
  });

  describe('Request Headers', () => {
    it('should set correct default headers', async () => {
      const client = getFredClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ observations: [] }),
      });

      await client.getSeriesObservations('UNRATE');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'Trading-Framework/1.0',
            'Accept': 'application/json',
          }),
        })
      );
    });

    it('should merge custom headers with defaults', async () => {
      const client = getFredClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ observations: [] }),
      });

      // Test with custom headers through the series info method
      await client.getSeriesInfo('UNRATE');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'Trading-Framework/1.0',
            'Accept': 'application/json',
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should throw FredRequestError for HTTP error responses', async () => {
      const client = getFredClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error_message: 'Series not found' }),
      });

      const response = await client.getSeriesObservations('INVALID');
      
      await expect(response.fredJson()).rejects.toThrow(FredRequestError);
    });

    it('should handle network errors', async () => {
      const client = getFredClient();
      
      mockFetch.mockRejectedValueOnce(new Error('Network failure'));

      await expect(client.getSeriesObservations('UNRATE')).rejects.toThrow(FredRequestError);
    });

    it('should handle timeout errors', async () => {
      const client = getFredClient();
      
      // Mock AbortError (timeout)
      const abortError = new DOMException('Request aborted', 'AbortError');
      mockFetch.mockRejectedValueOnce(abortError);

      await expect(client.getSeriesObservations('UNRATE')).rejects.toThrow(FredRequestError);
    });

    it('should handle invalid JSON responses', async () => {
      const client = getFredClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const response = await client.getSeriesObservations('UNRATE');
      
      await expect(response.fredJson()).rejects.toThrow(FredRequestError);
    });
  });

  describe('API Methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ observations: [{ date: '2024-01-01', value: '3.9' }] }),
      });
    });

    it('should call getSeriesObservations with correct parameters', async () => {
      const client = getFredClient();
      
      await client.getSeriesObservations('UNRATE', {
        limit: 20,
        sortOrder: 'desc',
        observationStart: '2023-01-01',
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('series_id=UNRATE');
      expect(calledUrl).toContain('limit=20');
      expect(calledUrl).toContain('sort_order=desc');
      expect(calledUrl).toContain('observation_start=2023-01-01');
    });

    it('should call getSeriesInfo with correct parameters', async () => {
      const client = getFredClient();
      
      await client.getSeriesInfo('UNRATE');

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('/series?');
      expect(calledUrl).toContain('series_id=UNRATE');
      expect(calledUrl).toContain('file_type=json');
    });

    it('should handle getBulkSeriesObservations', async () => {
      const client = getFredClient();
      
      const results = await client.getBulkSeriesObservations(['UNRATE', 'GDPC1']);

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(results).toHaveProperty('UNRATE');
      expect(results).toHaveProperty('GDPC1');
    });

    it('should continue bulk processing when one series fails', async () => {
      const client = getFredClient();
      
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ observations: [{ date: '2024-01-01', value: '3.9' }] }),
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const results = await client.getBulkSeriesObservations(['UNRATE', 'INVALID']);

      expect(results).toHaveProperty('UNRATE');
      expect(results).not.toHaveProperty('INVALID');
    });
  });

  describe('API Key Validation', () => {
    it('should validate API key successfully', async () => {
      const client = getFredClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ observations: [] }),
      });

      const isValid = await client.validateApiKey();
      expect(isValid).toBe(true);
    });

    it('should return false for invalid API key', async () => {
      const client = getFredClient();
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ error_message: 'Invalid API key' }),
      });

      const isValid = await client.validateApiKey();
      expect(isValid).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const client1 = getFredClient();
      const client2 = getFredClient();
      
      expect(client1).toBe(client2);
    });

    it('should create new instance after clearing', () => {
      const client1 = getFredClient();
      clearFredClient();
      const client2 = getFredClient();
      
      expect(client1).not.toBe(client2);
    });
  });
});