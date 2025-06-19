module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/developer'
      ],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'Local:.*:3000',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', {minScore: 0.85}],
        'categories:accessibility': ['error', {minScore: 0.9}],
        'categories:best-practices': ['warn', {minScore: 0.85}],
        'categories:seo': ['warn', {minScore: 0.8}],
        'categories:pwa': ['warn', {minScore: 0.7}],
        
        // Core Web Vitals
        'largest-contentful-paint': ['warn', {maxNumericValue: 2500}],
        'first-contentful-paint': ['warn', {maxNumericValue: 1800}],
        'cumulative-layout-shift': ['warn', {maxNumericValue: 0.1}],
        'total-blocking-time': ['warn', {maxNumericValue: 300}],
        'speed-index': ['warn', {maxNumericValue: 3400}],
        
        // Resource optimization
        'unused-javascript': ['warn', {maxNumericValue: 30000}],
        'unused-css-rules': ['warn', {maxNumericValue: 20000}],
        'render-blocking-resources': ['warn', {maxNumericValue: 500}],
        
        // Image optimization
        'modern-image-formats': 'warn',
        'offscreen-images': 'warn',
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        
        // Network
        'uses-http2': 'warn',
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'warn',
        
        // JavaScript
        'bootup-time': ['warn', {maxNumericValue: 3500}],
        'mainthread-work-breakdown': ['warn', {maxNumericValue: 4000}],
        
        // Accessibility
        'color-contrast': 'error',
        'image-alt': 'error',
        'label': 'error',
        'link-name': 'error',
        'button-name': 'error',
        'document-title': 'error',
        'html-has-lang': 'error',
        'html-lang-valid': 'error',
        'meta-viewport': 'error',
        
        // Best practices
        'is-on-https': 'error',
        'uses-https': 'error',
        'no-vulnerable-libraries': 'error',
        'csp-xss': 'warn',
        
        // SEO
        'meta-description': 'warn',
        'http-status-code': 'error',
        'crawlable-anchors': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    },
    server: {
      port: 9001,
      storage: './lighthouse-reports'
    }
  }
};
