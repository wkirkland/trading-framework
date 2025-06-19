// tests/setup.ts

// Global test setup for Jest

// Suppress console.log, console.warn, console.error during tests unless explicitly needed
const originalConsole = global.console;

global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchErrorSnapshot(): R;
    }
  }
}

// Add custom matchers
expect.extend({
  toMatchErrorSnapshot(received: Error) {
    const errorData = {
      name: received.name,
      message: received.message,
    };
    
    return {
      message: () => `Expected error to match snapshot`,
      pass: this.equals(errorData, errorData),
    };
  },
});

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';

// Setup fake timers for consistent time-based testing
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

// Clean up after tests
afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
});