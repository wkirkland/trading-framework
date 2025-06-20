// jest.integration.config.js
// Jest configuration specifically for integration tests

const path = require('path');

module.exports = {
  displayName: 'Integration Tests',
  testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
  
  // Use the same setup as main Jest config but with integration-specific settings
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Module resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/integration/setup.ts',
  ],
  
  // Transform settings
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage settings (less strict for integration tests)
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/**/*.test.{ts,tsx}',
    '!lib/**/__tests__/**',
  ],
  
  // Coverage thresholds (more relaxed for integration tests)
  coverageThreshold: {
    global: {
      statements: 50,
      branches: 40,
      functions: 50,
      lines: 50,
    },
    // Higher coverage requirements for security-critical components
    './lib/http/fredClient.ts': {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
    './lib/config/env.ts': {
      statements: 90,
      branches: 85,
      functions: 90,
      lines: 90,
    },
  },
  
  // Test timeout for integration tests (longer than unit tests)
  testTimeout: 30000,
  
  // Retry failed tests (network issues, etc.)
  retry: 2,
  
  // Verbose output for integration tests
  verbose: true,
  
  // Fail fast on first test failure
  bail: false,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Global variables for integration tests
  globals: {
    'ts-jest': {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          allowJs: true,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: 'node',
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'preserve',
          incremental: true,
          baseUrl: '.',
          paths: {
            '@/*': ['./*'],
          },
        },
      },
    },
  },
  
  // Test result processors
  testResultsProcessor: undefined,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test sequence
  testSequencer: '@jest/test-sequencer',
  
  // Maximum workers (limit for integration tests to avoid rate limiting)
  maxWorkers: 2,
  
  // Test name pattern (can be overridden by CLI)
  testNamePattern: undefined,
  
  // Watch mode settings
  watchman: false,
  
  // Environment variables
  testEnvironmentOptions: {
    NODE_ENV: 'integration',
  },
  
  // Reporter configuration
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage/integration',
        filename: 'integration-test-report.html',
        expand: true,
      },
    ],
  ],
};