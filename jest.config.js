// jest.config.js

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // If using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  // Handle module aliases (matching your tsconfig.json paths)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Test environment
  testEnvironment: 'jest-environment-node',

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.(ts|tsx|js|jsx)',
    '<rootDir>/**/__tests__/**/*.(ts|tsx|js|jsx)',
  ],

  // Coverage configuration - focus on security-critical components
  collectCoverageFrom: [
    'lib/config/env.ts',
    'lib/http/fredClient.ts',
    'lib/services/fredService.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/__tests__/**',
    '!**/coverage/**',
  ],

  // Coverage thresholds - focused on security-critical components only
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    // Specific thresholds for security-critical modules
    './lib/config/env.ts': {
      statements: 100,
      branches: 100,
      functions: 100,
      lines: 100,
    },
    './lib/http/fredClient.ts': {
      statements: 85,
      branches: 65,
      functions: 80,
      lines: 85,
    },
    './lib/services/fredService.ts': {
      statements: 10,
      branches: 0,
      functions: 6,
      lines: 10,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],

  // Transform configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Clear mocks automatically between every test
  clearMocks: true,

  // Automatically restore mock state between every test
  restoreMocks: true,

  // Reset modules between tests
  resetModules: true,

  // Verbose output
  verbose: true,

  // Timeout for tests (10 seconds)
  testTimeout: 10000,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);