#!/usr/bin/env node

// scripts/lighthouse-audit.js
// Automated Lighthouse auditing script for CI/CD integration

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  urls: [
    'http://localhost:3000',
    'http://localhost:3000/module1', 
    'http://localhost:3000/signal-dashboard',
    'http://localhost:3000/enhanced-dashboard'
  ],
  thresholds: {
    performance: 90,
    accessibility: 90,
    bestPractices: 85,
    seo: 85
  },
  chromeFlags: ['--no-sandbox', '--headless', '--disable-gpu'],
  output: './lighthouse-results',
  formats: ['json', 'html']
};

// Ensure output directory exists
if (!fs.existsSync(CONFIG.output)) {
  fs.mkdirSync(CONFIG.output, { recursive: true });
}

/**
 * Launch Chrome and run Lighthouse audit
 */
async function runLighthouse(url, options = {}) {
  const chrome = await chromeLauncher.launch({
    chromeFlags: CONFIG.chromeFlags
  });

  const opts = {
    logLevel: 'info',
    output: CONFIG.formats,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    ...options
  };

  const runnerResult = await lighthouse(url, opts);

  await chrome.kill();

  return runnerResult;
}

/**
 * Analyze results and check thresholds
 */
function analyzeResults(lhr, url) {
  const categories = lhr.categories;
  const results = {
    url,
    scores: {
      performance: Math.round(categories.performance.score * 100),
      accessibility: Math.round(categories.accessibility.score * 100),
      bestPractices: Math.round(categories['best-practices'].score * 100),
      seo: Math.round(categories.seo.score * 100)
    },
    passed: true,
    failures: []
  };

  // Check thresholds
  Object.entries(CONFIG.thresholds).forEach(([category, threshold]) => {
    const score = results.scores[category];
    if (score < threshold) {
      results.passed = false;
      results.failures.push({
        category,
        score,
        threshold,
        difference: threshold - score
      });
    }
  });

  // Extract key metrics
  const audits = lhr.audits;
  results.metrics = {
    firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
    largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
    cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
    totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
    speedIndex: audits['speed-index']?.numericValue || 0,
    totalByteWeight: audits['total-byte-weight']?.numericValue || 0,
    domSize: audits['dom-size']?.numericValue || 0
  };

  // Extract accessibility issues
  results.accessibilityIssues = [];
  Object.entries(audits).forEach(([auditId, audit]) => {
    if (audit.scoreDisplayMode === 'binary' && audit.score === 0) {
      if (auditId.includes('aria') || auditId.includes('color-contrast') || 
          auditId.includes('heading') || auditId.includes('label') ||
          auditId.includes('link') || auditId.includes('button')) {
        results.accessibilityIssues.push({
          id: auditId,
          title: audit.title,
          description: audit.description,
          details: audit.details
        });
      }
    }
  });

  // Extract performance opportunities
  results.performanceOpportunities = [];
  Object.entries(audits).forEach(([auditId, audit]) => {
    if (audit.details && audit.details.type === 'opportunity' && audit.numericValue > 100) {
      results.performanceOpportunities.push({
        id: auditId,
        title: audit.title,
        description: audit.description,
        savings: audit.numericValue,
        displayValue: audit.displayValue
      });
    }
  });

  return results;
}

/**
 * Save results to files
 */
function saveResults(results, reports, url) {
  const urlSlug = url.replace('http://localhost:3000', '').replace(/\//g, '-') || 'home';
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Save JSON report
  const jsonPath = path.join(CONFIG.output, `${urlSlug}-${timestamp}.json`);
  fs.writeFileSync(jsonPath, reports.report[0]);
  
  // Save HTML report
  const htmlPath = path.join(CONFIG.output, `${urlSlug}-${timestamp}.html`);
  fs.writeFileSync(htmlPath, reports.report[1]);
  
  // Save analysis summary
  const analysisPath = path.join(CONFIG.output, `${urlSlug}-analysis-${timestamp}.json`);
  fs.writeFileSync(analysisPath, JSON.stringify(results, null, 2));

  console.log(`📊 Reports saved:`);
  console.log(`   JSON: ${jsonPath}`);
  console.log(`   HTML: ${htmlPath}`);
  console.log(`   Analysis: ${analysisPath}`);
}

/**
 * Generate summary report
 */
function generateSummary(allResults) {
  const summary = {
    timestamp: new Date().toISOString(),
    totalUrls: allResults.length,
    passedUrls: allResults.filter(r => r.passed).length,
    failedUrls: allResults.filter(r => !r.passed).length,
    overallPassed: allResults.every(r => r.passed),
    results: allResults,
    aggregatedScores: {
      performance: Math.round(allResults.reduce((sum, r) => sum + r.scores.performance, 0) / allResults.length),
      accessibility: Math.round(allResults.reduce((sum, r) => sum + r.scores.accessibility, 0) / allResults.length),
      bestPractices: Math.round(allResults.reduce((sum, r) => sum + r.scores.bestPractices, 0) / allResults.length),
      seo: Math.round(allResults.reduce((sum, r) => sum + r.scores.seo, 0) / allResults.length)
    },
    recommendations: []
  };

  // Generate recommendations
  const allIssues = allResults.flatMap(r => r.accessibilityIssues);
  const issueFrequency = {};
  allIssues.forEach(issue => {
    issueFrequency[issue.id] = (issueFrequency[issue.id] || 0) + 1;
  });

  Object.entries(issueFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([issueId, count]) => {
      const issue = allIssues.find(i => i.id === issueId);
      summary.recommendations.push({
        type: 'accessibility',
        priority: count > allResults.length / 2 ? 'high' : 'medium',
        issue: issueId,
        title: issue.title,
        affectedUrls: count,
        description: issue.description
      });
    });

  // Performance recommendations
  const allOpportunities = allResults.flatMap(r => r.performanceOpportunities);
  const opportunityFrequency = {};
  allOpportunities.forEach(opp => {
    opportunityFrequency[opp.id] = (opportunityFrequency[opp.id] || 0) + opp.savings;
  });

  Object.entries(opportunityFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .forEach(([oppId, totalSavings]) => {
      const opp = allOpportunities.find(o => o.id === oppId);
      summary.recommendations.push({
        type: 'performance',
        priority: totalSavings > 1000 ? 'high' : 'medium',
        issue: oppId,
        title: opp.title,
        totalSavings: Math.round(totalSavings),
        description: opp.description
      });
    });

  return summary;
}

/**
 * Print results to console
 */
function printResults(results) {
  console.log(`\n🚀 Lighthouse Audit Results for ${results.url}`);
  console.log('=' * 50);
  
  // Scores
  Object.entries(results.scores).forEach(([category, score]) => {
    const threshold = CONFIG.thresholds[category];
    const status = score >= threshold ? '✅' : '❌';
    const categoryName = category.replace(/([A-Z])/g, ' $1').trim();
    console.log(`${status} ${categoryName}: ${score}/100 (threshold: ${threshold})`);
  });

  // Key metrics
  console.log('\n📊 Key Metrics:');
  console.log(`   FCP: ${Math.round(results.metrics.firstContentfulPaint)}ms`);
  console.log(`   LCP: ${Math.round(results.metrics.largestContentfulPaint)}ms`);
  console.log(`   CLS: ${results.metrics.cumulativeLayoutShift.toFixed(3)}`);
  console.log(`   TBT: ${Math.round(results.metrics.totalBlockingTime)}ms`);
  console.log(`   SI: ${Math.round(results.metrics.speedIndex)}`);

  // Failures
  if (results.failures.length > 0) {
    console.log('\n❌ Failed Categories:');
    results.failures.forEach(failure => {
      console.log(`   ${failure.category}: ${failure.score} (need ${failure.difference} more points)`);
    });
  }

  // Top accessibility issues
  if (results.accessibilityIssues.length > 0) {
    console.log('\n♿ Top Accessibility Issues:');
    results.accessibilityIssues.slice(0, 3).forEach(issue => {
      console.log(`   - ${issue.title}`);
    });
  }

  // Top performance opportunities
  if (results.performanceOpportunities.length > 0) {
    console.log('\n⚡ Top Performance Opportunities:');
    results.performanceOpportunities.slice(0, 3).forEach(opp => {
      console.log(`   - ${opp.title}: ${opp.displayValue || Math.round(opp.savings) + 'ms'}`);
    });
  }

  console.log('');
}

/**
 * Main execution function
 */
async function main() {
  console.log('🔍 Starting Lighthouse audit...\n');
  
  const allResults = [];

  for (const url of CONFIG.urls) {
    try {
      console.log(`📄 Auditing: ${url}`);
      
      const runnerResult = await runLighthouse(url);
      const analysis = analyzeResults(runnerResult.lhr, url);
      
      printResults(analysis);
      saveResults(analysis, runnerResult, url);
      
      allResults.push(analysis);
      
    } catch (error) {
      console.error(`❌ Error auditing ${url}:`, error.message);
      allResults.push({
        url,
        passed: false,
        error: error.message,
        scores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 }
      });
    }
  }

  // Generate and save summary
  const summary = generateSummary(allResults);
  const summaryPath = path.join(CONFIG.output, `summary-${Date.now()}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  // Print summary
  console.log('\n📋 AUDIT SUMMARY');
  console.log('=' * 50);
  console.log(`Total URLs: ${summary.totalUrls}`);
  console.log(`Passed: ${summary.passedUrls}`);
  console.log(`Failed: ${summary.failedUrls}`);
  console.log(`Overall Status: ${summary.overallPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  console.log('\n📊 Average Scores:');
  Object.entries(summary.aggregatedScores).forEach(([category, score]) => {
    const threshold = CONFIG.thresholds[category];
    const status = score >= threshold ? '✅' : '❌';
    console.log(`${status} ${category}: ${score}/100`);
  });

  if (summary.recommendations.length > 0) {
    console.log('\n💡 Top Recommendations:');
    summary.recommendations.slice(0, 5).forEach((rec, i) => {
      console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.title}`);
    });
  }

  console.log(`\n📊 Full summary saved to: ${summaryPath}`);

  // Exit with appropriate code
  process.exit(summary.overallPassed ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Audit failed:', error);
    process.exit(1);
  });
}

module.exports = { runLighthouse, analyzeResults, generateSummary };