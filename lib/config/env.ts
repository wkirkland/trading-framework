// lib/config/env.ts

/**
 * Typed environment configuration for the trading framework.
 * Provides type-safe access to environment variables with validation.
 */

export interface Env {
  /** FRED API base URL */
  fredBaseUrl: string;
  /** FRED API key for authentication */
  fredApiKey: string;
  /** Alpha Vantage API key */
  alphaVantageApiKey: string;
  /** Node environment */
  nodeEnv: 'development' | 'production' | 'test';
  /** Application port */
  port: number;
}

/**
 * Default environment values for fallback
 */
const DEFAULT_VALUES: Partial<Env> = {
  fredBaseUrl: 'https://api.stlouisfed.org/fred',
  nodeEnv: 'development',
  port: 3000,
};

/**
 * Required environment variables that must be provided
 */
const REQUIRED_VARS = ['FRED_API_KEY'] as const;

/**
 * Environment variable validation error
 */
export class EnvValidationError extends Error {
  constructor(variable: string, reason: string) {
    super(`Environment variable validation failed for ${variable}: ${reason}`);
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates that a string is not empty or just whitespace
 */
function validateRequired(value: string | undefined, name: string): string {
  if (!value || value.trim().length === 0) {
    throw new EnvValidationError(name, 'is required but not provided or empty');
  }
  return value.trim();
}

/**
 * Validates and parses a port number
 */
function validatePort(value: string | undefined, defaultPort: number): number {
  if (!value) return defaultPort;
  
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new EnvValidationError('PORT', 'must be a valid port number (1-65535)');
  }
  return port;
}

/**
 * Validates node environment value
 */
function validateNodeEnv(value: string | undefined): Env['nodeEnv'] {
  const env = value || DEFAULT_VALUES.nodeEnv!;
  if (!['development', 'production', 'test'].includes(env)) {
    throw new EnvValidationError('NODE_ENV', 'must be one of: development, production, test');
  }
  return env as Env['nodeEnv'];
}

/**
 * Gets and validates environment configuration.
 * Throws EnvValidationError if required variables are missing or invalid.
 * 
 * @returns Validated environment configuration
 * @throws {EnvValidationError} When required variables are missing or invalid
 */
export function getEnv(): Env {
  try {
    // Check for required variables first
    for (const requiredVar of REQUIRED_VARS) {
      if (!process.env[requiredVar]) {
        throw new EnvValidationError(requiredVar, 'is required but not set');
      }
    }

    return {
      fredBaseUrl: process.env.FRED_BASE_URL?.trim() || DEFAULT_VALUES.fredBaseUrl!,
      fredApiKey: validateRequired(process.env.FRED_API_KEY, 'FRED_API_KEY'),
      alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY?.trim() || '',
      nodeEnv: validateNodeEnv(process.env.NODE_ENV),
      port: validatePort(process.env.PORT, DEFAULT_VALUES.port!),
    };
  } catch (error) {
    if (error instanceof EnvValidationError) {
      throw error;
    }
    throw new EnvValidationError('UNKNOWN', `Unexpected error during validation: ${error}`);
  }
}

/**
 * Cached environment configuration to avoid repeated validation
 */
let cachedEnv: Env | null = null;

/**
 * Gets the cached environment configuration, validating on first call.
 * Subsequent calls return the cached result for performance.
 * 
 * @returns Validated environment configuration
 * @throws {EnvValidationError} When required variables are missing or invalid (first call only)
 */
export function getCachedEnv(): Env {
  if (!cachedEnv) {
    cachedEnv = getEnv();
  }
  return cachedEnv;
}

/**
 * Clears the cached environment configuration.
 * Useful for testing or when environment variables change at runtime.
 */
export function clearEnvCache(): void {
  cachedEnv = null;
}

/**
 * Checks if the application is running in development mode
 */
export function isDevelopment(): boolean {
  return getCachedEnv().nodeEnv === 'development';
}

/**
 * Checks if the application is running in production mode
 */
export function isProduction(): boolean {
  return getCachedEnv().nodeEnv === 'production';
}

/**
 * Checks if the application is running in test mode
 */
export function isTest(): boolean {
  return getCachedEnv().nodeEnv === 'test';
}