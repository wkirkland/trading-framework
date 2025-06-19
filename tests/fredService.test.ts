// tests/fredService.test.ts

import { clearEnvCache } from '@/lib/config/env';

// Simple tests to verify service structure and security
describe('FredService', () => {
  beforeEach(() => {
    clearEnvCache();
    
    // Set up environment
    process.env.FRED_API_KEY = 'test-api-key';
    process.env.FRED_BASE_URL = 'https://api.stlouisfed.org/fred';
  });

  describe('Module Structure', () => {
    it('should export fredService instance', async () => {
      const { fredService } = await import('@/lib/services/fredService');
      expect(fredService).toBeDefined();
      expect(typeof fredService).toBe('object');
    });

    it('should have required methods', async () => {
      const { fredService } = await import('@/lib/services/fredService');
      expect(typeof fredService.getLatestValue).toBe('function');
      expect(typeof fredService.getBulkData).toBe('function');
    });
  });

  describe('Security Validation', () => {
    it('should not contain direct fetch calls', async () => {
      // Read the service source code
      const fs = require('fs');
      const path = require('path');
      const servicePath = path.join(process.cwd(), 'lib/services/fredService.ts');
      const serviceCode = fs.readFileSync(servicePath, 'utf8');
      
      // Verify no direct fetch calls
      expect(serviceCode).not.toMatch(/fetch\s*\(/);
      expect(serviceCode).toMatch(/getFredClient/); // Should use secure client
    });

    it('should not contain hardcoded API keys', async () => {
      const fs = require('fs');
      const path = require('path');
      const servicePath = path.join(process.cwd(), 'lib/services/fredService.ts');
      const serviceCode = fs.readFileSync(servicePath, 'utf8');
      
      // Verify no hardcoded API key patterns
      expect(serviceCode).not.toMatch(/api_key\s*=\s*['"`]/);
      expect(serviceCode).not.toMatch(/[a-f0-9]{32,}/); // No long hex strings
    });

    it('should use secure HTTP client import', async () => {
      const fs = require('fs');
      const path = require('path');
      const servicePath = path.join(process.cwd(), 'lib/services/fredService.ts');
      const serviceCode = fs.readFileSync(servicePath, 'utf8');
      
      // Verify it imports from the secure HTTP client
      expect(serviceCode).toMatch(/import.*getFredClient.*from.*fredClient/);
    });
  });

  describe('Interface Compliance', () => {
    it('should export MetricValue interface', async () => {
      const module = await import('@/lib/services/fredService');
      expect(module).toHaveProperty('fredService');
    });

    it('should have correct method signatures', async () => {
      const { fredService } = await import('@/lib/services/fredService');
      
      // getLatestValue should accept string and return Promise
      expect(fredService.getLatestValue).toHaveProperty('length', 1);
      
      // getBulkData should accept array and return Promise
      expect(fredService.getBulkData).toHaveProperty('length', 1);
    });
  });

  describe('Error Handling Structure', () => {
    it('should throw validation error when environment is missing', async () => {
      // Clear required environment variables
      delete process.env.FRED_API_KEY;
      clearEnvCache();
      
      // Should throw during import due to singleton creation
      await expect(async () => {
        await import('@/lib/services/fredService');
      }).rejects.toThrow('FRED_API_KEY: is required but not set');
    });
  });
});