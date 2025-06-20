// .lighthouserc.js
// Lighthouse CI configuration for performance and accessibility monitoring

module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/module1',
        'http://localhost:3000/signal-dashboard',
        'http://localhost:3000/enhanced-dashboard'
      ],
      startServerCommand: 'npm run build && npm run start',
      startServerReadyPattern: 'Ready on',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --headless',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        },
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false
        },
        formFactor: 'desktop',
        emulatedUserAgent: 'desktop'
      }
    },
    assert: {
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        
        // Accessibility specific
        'color-contrast': 'error',
        'heading-order': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'list': 'error',
        'listitem': 'error',
        'meta-viewport': 'error',
        'button-name': 'error',
        'aria-allowed-attr': 'error',
        'aria-hidden-body': 'error',
        'aria-hidden-focus': 'error',
        'aria-input-field-name': 'error',
        'aria-required-attr': 'error',
        'aria-roles': 'error',
        'aria-valid-attr': 'error',
        'aria-valid-attr-value': 'error',
        'bypass': 'error',
        'focus-traps': 'error',
        'focusable-controls': 'error',
        'interactive-element-affordance': 'error',
        'logical-tab-order': 'error',
        'managed-focus': 'error',
        'offscreen-content-hidden': 'error',
        'use-landmarks': 'error',
        
        // Performance specific
        'unused-css-rules': ['warn', { maxLength: 2 }],
        'unused-javascript': ['warn', { maxLength: 2 }],
        'modern-image-formats': 'warn',
        'efficient-animated-content': 'warn',
        'duplicated-javascript': 'error',
        'legacy-javascript': 'warn',
        'preload-lcp-image': 'warn',
        'total-byte-weight': ['warn', { maxNumericValue: 1600000 }], // 1.6MB
        'dom-size': ['warn', { maxNumericValue: 1500 }],
        
        // Best practices
        'uses-https': 'error',
        'is-on-https': 'error',
        'geolocation-on-start': 'error',
        'notification-on-start': 'error',
        'no-vulnerable-libraries': 'error',
        'js-libraries': 'warn',
        'deprecations': 'error',
        'errors-in-console': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite',
        sqlDatabasePath: './lighthouse-ci.db'
      }
    }
  }
};