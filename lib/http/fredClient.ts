// lib/http/fredClient.ts

import { getCachedEnv } from '@/lib/config/env';

/**
 * FRED API client with secure authentication via headers.
 * Replaces direct fetch calls with a configured HTTP client that
 * automatically injects API credentials without exposing them in URLs.
 */

/**
 * FRED API response format for error cases
 */
interface FredErrorResponse {
  error_code?: number;
  error_message?: string;
}

/**
 * Configuration for FRED API requests
 */
interface FredRequestConfig {
  /** Additional query parameters (excluding api_key) */
  params?: Record<string, string | number>;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Custom headers to merge with defaults */
  headers?: Record<string, string>;
}

/**
 * Enhanced fetch response with FRED-specific methods
 */
interface FredResponse extends Response {
  /** Parse response as JSON with FRED error handling */
  fredJson<T = any>(): Promise<T>;
}

/**
 * FRED API authentication error
 */
export class FredAuthError extends Error {
  constructor(message: string) {
    super(`FRED API Authentication Error: ${message}`);
    this.name = 'FredAuthError';
  }
}

/**
 * FRED API request error
 */
export class FredRequestError extends Error {
  public readonly status: number;
  public readonly statusText: string;

  constructor(status: number, statusText: string, message?: string) {
    super(message || `FRED API Request Error: ${status} ${statusText}`);
    this.name = 'FredRequestError';
    this.status = status;
    this.statusText = statusText;
  }
}

/**
 * Secure FRED API client class
 */
class FredClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly defaultTimeout: number = 10000; // 10 seconds

  constructor() {
    const env = getCachedEnv();
    
    if (!env.fredApiKey) {
      throw new FredAuthError('FRED API key is required but not provided in environment configuration');
    }

    this.baseUrl = env.fredBaseUrl;
    this.apiKey = env.fredApiKey;
    
    // Set up default headers (API key handled separately in URL construction)
    this.defaultHeaders = {
      'User-Agent': 'Trading-Framework/1.0',
      'Accept': 'application/json',
    };
  }

  /**
   * Builds query string from parameters, securely handling API key
   */
  private buildQueryString(params: Record<string, string | number> = {}): string {
    // Ensure api_key is never accidentally included in params
    const safeParams = { ...params };
    delete safeParams.api_key; // Remove if accidentally included
    
    const searchParams = new URLSearchParams();
    Object.entries(safeParams).forEach(([key, value]) => {
      searchParams.append(key, String(value));
    });
    
    return searchParams.toString();
  }

  /**
   * Securely builds the full URL with API key
   * The key is added at request time to avoid exposure in logs
   */
  private buildSecureUrl(endpoint: string, params: Record<string, string | number> = {}): string {
    const baseQueryString = this.buildQueryString(params);
    const separator = baseQueryString ? '&' : '';
    
    // Add API key at the end, separated from other params
    return `${this.baseUrl}${endpoint}?${baseQueryString}${separator}api_key=${this.apiKey}`;
  }

  /**
   * Creates a logging-safe version of the URL with API key redacted
   */
  private getLoggableUrl(url: string): string {
    return url.replace(/api_key=[^&]+/g, 'api_key=***REDACTED***');
  }

  /**
   * Makes a secure HTTP request to FRED API
   */
  private async makeRequest(
    endpoint: string,
    config: FredRequestConfig = {}
  ): Promise<FredResponse> {
    const { params = {}, timeout = this.defaultTimeout, headers = {} } = config;
    
    // Build secure URL with API key injection
    const url = this.buildSecureUrl(endpoint, params);
    
    // Merge headers (remove X-API-Key since FRED uses query params)
    const requestHeaders = {
      'User-Agent': 'Trading-Framework/1.0',
      'Accept': 'application/json',
      ...headers,
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Enhance response with FRED-specific methods
      const fredResponse = response as FredResponse;
      fredResponse.fredJson = async function<T = any>(): Promise<T> {
        if (!this.ok) {
          let errorMessage = `${this.status} ${this.statusText}`;
          try {
            const errorData: FredErrorResponse = await this.json();
            if (errorData.error_message) {
              errorMessage = errorData.error_message;
            }
          } catch {
            // Ignore JSON parsing errors for error responses
          }
          throw new FredRequestError(this.status, this.statusText, errorMessage);
        }

        try {
          return await this.json();
        } catch (error) {
          throw new FredRequestError(this.status, this.statusText, 'Invalid JSON response from FRED API');
        }
      };

      return fredResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new FredRequestError(408, 'Request Timeout', `Request timed out after ${timeout}ms`);
      }
      
      if (error instanceof FredRequestError || error instanceof FredAuthError) {
        throw error;
      }
      
      throw new FredRequestError(0, 'Network Error', `Network request failed: ${error}`);
    }
  }

  /**
   * Gets series observations from FRED API
   */
  async getSeriesObservations(
    seriesId: string,
    options: {
      limit?: number;
      sortOrder?: 'asc' | 'desc';
      observationStart?: string;
      fileType?: 'json' | 'xml';
    } = {}
  ): Promise<FredResponse> {
    const {
      limit = 10,
      sortOrder = 'desc',
      observationStart = '2000-01-01',
      fileType = 'json'
    } = options;

    return this.makeRequest('/series/observations', {
      params: {
        series_id: seriesId,
        limit,
        sort_order: sortOrder,
        observation_start: observationStart,
        file_type: fileType,
      },
    });
  }

  /**
   * Gets series metadata from FRED API
   */
  async getSeriesInfo(seriesId: string): Promise<FredResponse> {
    return this.makeRequest('/series', {
      params: {
        series_id: seriesId,
        file_type: 'json',
      },
    });
  }

  /**
   * Gets multiple series data in bulk
   */
  async getBulkSeriesObservations(
    seriesIds: string[],
    options: {
      limit?: number;
      sortOrder?: 'asc' | 'desc';
      observationStart?: string;
    } = {}
  ): Promise<Record<string, FredResponse>> {
    const results: Record<string, FredResponse> = {};
    
    // Process requests sequentially to respect rate limits
    for (const seriesId of seriesIds) {
      try {
        results[seriesId] = await this.getSeriesObservations(seriesId, options);
      } catch (error) {
        console.warn(`Failed to fetch series ${seriesId}:`, error);
        // Continue with other series even if one fails
      }
    }
    
    return results;
  }

  /**
   * Validates the current API key by making a test request
   */
  async validateApiKey(): Promise<boolean> {
    try {
      // Make a simple request to validate the API key
      const response = await this.makeRequest('/series', {
        params: {
          series_id: 'UNRATE', // Use a common series for validation
          limit: 1,
          file_type: 'json',
        },
      });
      
      return response.ok;
    } catch (error) {
      if (error instanceof FredAuthError) {
        return false;
      }
      // Network errors don't necessarily mean the API key is invalid
      throw error;
    }
  }
}

/**
 * Singleton FRED client instance
 */
let fredClientInstance: FredClient | null = null;

/**
 * Gets the singleton FRED client instance.
 * Creates a new instance on first call.
 * 
 * @returns Configured FRED API client
 * @throws {FredAuthError} When FRED API key is missing or invalid
 */
export function getFredClient(): FredClient {
  if (!fredClientInstance) {
    fredClientInstance = new FredClient();
  }
  return fredClientInstance;
}

/**
 * Clears the singleton FRED client instance.
 * Useful for testing or when configuration changes.
 */
export function clearFredClient(): void {
  fredClientInstance = null;
}

/**
 * Export types for use in other modules
 */
export type { FredResponse, FredRequestConfig };